from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncDate, TruncHour
from .models import Property, Alert, ChatMessage
from .serializers import (
    PropertySerializer, AlertSerializer, UserSerializer,
    ChatMessageSerializer, StaffSerializer
)
from .ai_service import chat_with_gemini, generate_analytics_insights
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

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = 'resolved'
        alert.resolved_at = timezone.now()
        alert.save()
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
        alert.status = new_status
        if new_status == 'resolved':
            alert.resolved_at = timezone.now()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_staff(self, request, pk=None):
        alert = self.get_object()
        staff_id = request.data.get('staff_id')
        try:
            staff = User.objects.get(id=staff_id)
            alert.assigned_staff = staff
            if alert.status == 'reported':
                alert.status = 'acknowledged'
            alert.save()
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


class StaffListView(generics.ListAPIView):
    queryset = User.objects.filter(is_staff=True)
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]


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


class AnalyticsView(APIView):
    """Analytics and reporting endpoint."""
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

        # Average response time (for resolved alerts)
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
        # Convert dates to strings
        for item in by_date:
            item['date'] = item['date'].isoformat() if item['date'] else ''

        # Incidents by status
        by_status = list(
            all_alerts.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Top threat scores
        critical_count = all_alerts.filter(severity='critical').count()
        medium_count = all_alerts.filter(severity='medium').count()
        low_count = all_alerts.filter(severity='low').count()

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
            'ai_insights': ai_insights,
        })


class SeedDataView(APIView):
    """Seed sample test data for demonstrations."""
    permission_classes = [AllowAny]

    def post(self, request):
        import random
        from datetime import timedelta as td

        emergency_types = ['fire', 'medical', 'security', 'natural_disaster', 'other']
        severities = ['low', 'medium', 'critical']
        statuses = ['reported', 'acknowledged', 'responding', 'resolved']
        rooms = ['101', '205', '312', '401', '502', '603', 'Lobby', 'Pool', 'Restaurant', 'Gym']
        details_map = {
            'fire': ['Smoke detected near elevator', 'Small fire in kitchen', 'Fire alarm triggered on floor 3'],
            'medical': ['Guest collapsed in lobby', 'Allergic reaction reported', 'Guest requesting first aid'],
            'security': ['Suspicious person near pool', 'Unauthorized entry attempt', 'Noise complaint escalated'],
            'natural_disaster': ['Tremor felt on upper floors', 'Flooding in basement', 'High wind warning'],
            'other': ['Power outage in wing B', 'Water leak in room', 'Elevator malfunction'],
        }

        created = []
        for i in range(15):
            etype = random.choice(emergency_types)
            sev = random.choice(severities)
            stat = random.choice(statuses)
            score = {'low': random.randint(10, 40), 'medium': random.randint(41, 74), 'critical': random.randint(75, 100)}[sev]

            ts = timezone.now() - td(
                days=random.randint(0, 25),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )
            resolved_at = ts + td(minutes=random.randint(5, 120)) if stat == 'resolved' else None

            alert = Alert.objects.create(
                emergency_type=etype,
                severity=sev,
                status=stat,
                threat_score=score,
                lat=28.6139 + random.uniform(-0.01, 0.01),
                lng=77.2090 + random.uniform(-0.01, 0.01),
                room_number=random.choice(rooms),
                details=random.choice(details_map[etype]),
                timestamp=ts,
                resolved_at=resolved_at,
                ai_suggestion=f'AI: Handle {etype} emergency with standard protocol.',
                ai_summary=f'{etype.title()} incident — severity {sev}.',
            )
            created.append(alert.id)

        return Response({
            'message': f'Created {len(created)} sample incidents.',
            'ids': created,
        })
