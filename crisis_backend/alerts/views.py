from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Avg, Q, F
from django.db.models.functions import TruncDate, TruncHour
from .models import Property, Alert, ChatMessage, AuditLog
from .serializers import (
    PropertySerializer, AlertSerializer, UserSerializer,
    ChatMessageSerializer, StaffSerializer
)
from .ai_service import chat_with_gemini, generate_analytics_insights
from .model_service import classify_crisis
import json
from datetime import timedelta


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    serializer_class = PropertySerializer


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Run ML classification on every alert created via REST API."""
        alert = serializer.save()

        # Classify using the ML model
        classify_text = alert.details.strip() if alert.details else alert.emergency_type
        if classify_text:
            from .ai_service import classify_threat
            result = classify_threat(alert.emergency_type, classify_text)
            alert.emergency_type = result.get('predicted_type', alert.emergency_type)
            alert.threat_score = result.get('threat_score', 0)
            alert.severity = result.get('severity', 'medium')
            alert.ai_suggestion = result.get('ai_suggestion', '')
            alert.ai_summary = result.get('ai_summary', '')
            alert.model_confidence = result.get('model_confidence', 0.0)
            alert.priority_score = result.get('threat_score', 0)
            alert.save()

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        old_status = alert.status
        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()

        # Audit log
        AuditLog.objects.create(
            alert=alert, action='resolve',
            performed_by=request.user,
            details={'old_status': old_status}
        )

        return Response({
            'status': 'Alert resolved',
            'alert_id': alert.id,
            'resolved_at': alert.resolved_at.isoformat(),
        })

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        alert = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Alert.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        old_status = alert.status
        alert.status = new_status
        if new_status == 'resolved':
            alert.resolved_at = timezone.now()
        alert.save()

        # Audit log
        AuditLog.objects.create(
            alert=alert, action='status_change',
            performed_by=request.user,
            details={'old_status': old_status, 'new_status': new_status}
        )

        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_staff(self, request, pk=None):
        alert = self.get_object()
        staff_id = request.data.get('staff_id')
        try:
            staff = User.objects.get(id=staff_id)
            old_staff = alert.assigned_staff_id
            alert.assigned_staff = staff
            if alert.status == 'reported':
                alert.status = 'acknowledged'
            alert.save()

            # Audit log
            AuditLog.objects.create(
                alert=alert, action='staff_assign',
                performed_by=request.user,
                details={'old_staff_id': old_staff, 'new_staff_id': staff_id}
            )

            serializer = self.get_serializer(alert)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {'error': 'Staff member not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def chat_history(self, request, pk=None):
        alert = self.get_object()
        messages = alert.messages.all()
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def audit_trail(self, request, pk=None):
        """Get the audit trail for a specific alert."""
        alert = self.get_object()
        logs = alert.audit_logs.all()
        data = [{
            'action': log.action,
            'performed_by': log.performed_by.username if log.performed_by else 'System',
            'details': log.details,
            'timestamp': log.timestamp.isoformat(),
        } for log in logs]
        return Response(data)


class StaffManageView(APIView):
    """Manage staff members — list, add, remove."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = User.objects.filter(is_staff=True)
        serializer = StaffSerializer(staff, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Add a new staff member."""
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': f'Username "{username}" already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True,
        )
        return Response(StaffSerializer(user).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Remove a staff member."""
        staff_id = request.data.get('staff_id')
        if not staff_id:
            return Response(
                {'error': 'staff_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(id=staff_id, is_staff=True)
            # Don't allow deleting superusers
            if user.is_superuser:
                return Response(
                    {'error': 'Cannot remove superuser accounts'},
                    status=status.HTTP_403_FORBIDDEN
                )
            user.delete()
            return Response({'status': 'Staff member removed', 'id': staff_id})
        except User.DoesNotExist:
            return Response(
                {'error': 'Staff member not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AIChatView(APIView):
    """AI Assistant chat endpoint powered by Gemini."""
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '')
        context = request.data.get('context', '')

        if not user_message.strip():
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = chat_with_gemini(user_message, context)
        return Response({
            'response': response,
            'timestamp': timezone.now().isoformat(),
        })


class ClassifyTextView(APIView):
    """
    Classify crisis text using the local dual-head BERT model.
    Returns the predicted emergency type, confidence, and severity score.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get('text', '')
        if not text.strip():
            return Response(
                {'error': 'Text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = classify_crisis(text)
        return Response({
            'predicted_type': result['predicted_type'],
            'confidence': result['confidence'],
            'severity_score': result['severity_score'],
            'all_scores': result['all_scores'],
        })


class AnalyticsView(APIView):
    """Expanded analytics and reporting endpoint."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Time range
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        all_alerts = Alert.objects.filter(timestamp__gte=since)
        resolved = all_alerts.filter(status='resolved')

        # Basic stats
        total_incidents = all_alerts.count()
        active_incidents = all_alerts.exclude(status='resolved').count()
        resolved_incidents = resolved.count()

        # Average response time
        avg_response = None
        response_times = []
        for a in resolved.filter(resolved_at__isnull=False):
            rt = a.response_time_seconds
            if rt is not None:
                response_times.append(rt)
        if response_times:
            avg_response = round(sum(response_times) / len(response_times), 1)

        # Incidents by type
        by_type = list(
            all_alerts.values('emergency_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Incidents by severity
        by_severity = list(
            all_alerts.values('severity')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Incidents over time (daily)
        by_date = list(
            all_alerts.annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        for item in by_date:
            item['date'] = item['date'].isoformat() if item['date'] else ''

        # Incidents by status
        by_status = list(
            all_alerts.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Severity breakdown
        critical_count = all_alerts.filter(severity='critical').count()
        medium_count = all_alerts.filter(severity='medium').count()
        low_count = all_alerts.filter(severity='low').count()

        # ═══ Peak hours analysis ═══
        peak_hours = list(
            all_alerts.annotate(hour=TruncHour('timestamp'))
            .values('hour')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )
        for item in peak_hours:
            item['hour'] = item['hour'].strftime('%Y-%m-%d %H:00') if item['hour'] else ''

        # ═══ Heatmap data (lat/lng density) ═══
        heatmap_data = list(
            all_alerts.filter(lat__isnull=False, lng__isnull=False)
            .values('lat', 'lng', 'severity', 'threat_score')
        )

        # ═══ Staff performance ═══
        staff_performance = []
        staff_with_alerts = User.objects.filter(
            assigned_alerts__timestamp__gte=since
        ).distinct()
        for staff in staff_with_alerts:
            staff_alerts = staff.assigned_alerts.filter(timestamp__gte=since)
            staff_resolved = staff_alerts.filter(status='resolved', resolved_at__isnull=False)
            staff_rts = [a.response_time_seconds for a in staff_resolved if a.response_time_seconds]
            staff_performance.append({
                'id': staff.id,
                'name': f"{staff.first_name or staff.username} {staff.last_name or ''}".strip(),
                'total_assigned': staff_alerts.count(),
                'resolved': staff_resolved.count(),
                'avg_response_time': round(sum(staff_rts) / len(staff_rts), 1) if staff_rts else None,
            })

        # AI insights
        incident_data = list(all_alerts.values(
            'emergency_type', 'severity', 'threat_score', 'room_number', 'status'
        )[:50])
        ai_insights = generate_analytics_insights(incident_data)

        return Response({
            'total_incidents': total_incidents,
            'active_incidents': active_incidents,
            'resolved_incidents': resolved_incidents,
            'avg_response_time': avg_response,
            'by_type': by_type,
            'by_severity': by_severity,
            'by_date': by_date,
            'by_status': by_status,
            'severity_breakdown': {
                'critical': critical_count,
                'medium': medium_count,
                'low': low_count,
            },
            'peak_hours': peak_hours,
            'heatmap_data': heatmap_data,
            'staff_performance': staff_performance,
            'ai_insights': ai_insights,
        })
