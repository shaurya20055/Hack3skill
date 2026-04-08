import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Alert, ChatMessage, AuditLog
from .ai_service import classify_threat


class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'responder_dashboard'

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')

        if event_type == 'sos_trigger':
            coordinates = data.get('coordinates', {})
            sensor_data = data.get('sensor_data', {})
            emergency_type = data.get('emergency_type', 'other')
            details = data.get('details', '')
            room_number = data.get('room_number', '')

            # AI-powered threat classification
            ai_result = await database_sync_to_async(classify_threat)(
                emergency_type, details, sensor_data
            )

            # Persist alert in DB
            alert_data = await self.create_alert(
                coordinates, ai_result, emergency_type, details, room_number
            )

            # Broadcast to responder dashboard
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'new_alert',
                    'alert': alert_data
                }
            )

            # Auto-escalation check — schedule check for unresolved alerts
            # (In production, use Celery; here we log intent)
            if ai_result.get('severity') == 'critical':
                await self.check_auto_escalation(alert_data['id'])

        elif event_type == 'chat_message':
            alert_id = data.get('alert_id')
            message = data.get('message', '')
            sender_role = data.get('sender_role', 'guest')
            sender_name = data.get('sender_name', 'Anonymous')

            msg_data = await self.save_chat_message(
                alert_id, sender_role, sender_name, message
            )

            # Broadcast chat to the same group
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'chat_message_broadcast',
                    'message': msg_data
                }
            )

        elif event_type == 'broadcast_alert':
            # System-wide broadcast (e.g., evacuation notice)
            broadcast_text = data.get('message', '')

            # Log broadcast in audit
            await self.log_audit(None, 'broadcast', None, {'message': broadcast_text})

            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'system_broadcast',
                    'message': broadcast_text,
                    'severity': data.get('severity', 'critical'),
                }
            )

        elif event_type == 'status_update':
            alert_id = data.get('alert_id')
            new_status = data.get('status')
            if alert_id and new_status:
                alert_data = await self.update_alert_status(alert_id, new_status)
                if alert_data:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'alert_status_changed',
                            'alert': alert_data
                        }
                    )

        elif event_type == 'typing_indicator':
            # Broadcast typing indicator to other users
            alert_id = data.get('alert_id')
            sender_name = data.get('sender_name', 'Someone')
            is_typing = data.get('is_typing', False)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'typing_broadcast',
                    'alert_id': alert_id,
                    'sender_name': sender_name,
                    'is_typing': is_typing,
                }
            )

        elif event_type == 'delivery_ack':
            # Acknowledge message delivery
            message_id = data.get('message_id')
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'delivery_acknowledgment',
                    'message_id': message_id,
                    'acknowledged_by': data.get('acknowledged_by', 'Unknown'),
                }
            )

    # --- Group message handlers ---
    async def new_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_alert',
            'alert': event['alert']
        }))

    async def chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def system_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'system_broadcast',
            'message': event['message'],
            'severity': event.get('severity', 'critical'),
        }))

    async def alert_status_changed(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'alert': event['alert']
        }))

    async def typing_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'alert_id': event['alert_id'],
            'sender_name': event['sender_name'],
            'is_typing': event['is_typing'],
        }))

    async def delivery_acknowledgment(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delivery_ack',
            'message_id': event['message_id'],
            'acknowledged_by': event['acknowledged_by'],
        }))

    # --- DB operations ---
    @database_sync_to_async
    def create_alert(self, coordinates, ai_result, emergency_type, details, room_number):
        alert = Alert.objects.create(
            lat=coordinates.get('lat'),
            lng=coordinates.get('lng'),
            emergency_type=emergency_type,
            details=details,
            room_number=room_number,
            threat_score=ai_result['threat_score'],
            severity=ai_result['severity'],
            priority_score=ai_result['threat_score'],
            ai_suggestion=ai_result.get('ai_suggestion', ''),
            ai_summary=ai_result.get('ai_summary', ''),
            trigger_type='sos_button',
        )
        return {
            'id': alert.id,
            'lat': alert.lat,
            'lng': alert.lng,
            'emergency_type': alert.emergency_type,
            'severity': alert.severity,
            'details': alert.details,
            'room_number': alert.room_number,
            'threat_score': alert.threat_score,
            'status': alert.status,
            'ai_suggestion': alert.ai_suggestion,
            'ai_summary': alert.ai_summary,
            'timestamp': alert.timestamp.isoformat(),
        }

    @database_sync_to_async
    def save_chat_message(self, alert_id, sender_role, sender_name, message):
        msg = ChatMessage.objects.create(
            alert_id=alert_id,
            sender_role=sender_role,
            sender_name=sender_name,
            message=message,
        )
        return {
            'id': msg.id,
            'alert_id': alert_id,
            'sender_role': msg.sender_role,
            'sender_name': msg.sender_name,
            'message': msg.message,
            'timestamp': msg.timestamp.isoformat(),
        }

    @database_sync_to_async
    def update_alert_status(self, alert_id, new_status):
        from django.utils import timezone
        try:
            alert = Alert.objects.get(id=alert_id)
            alert.status = new_status
            if new_status == 'resolved':
                alert.resolved_at = timezone.now()
            alert.save()
            return {
                'id': alert.id,
                'status': alert.status,
                'severity': alert.severity,
                'emergency_type': alert.emergency_type,
                'threat_score': alert.threat_score,
                'timestamp': alert.timestamp.isoformat(),
            }
        except Alert.DoesNotExist:
            return None

    @database_sync_to_async
    def log_audit(self, alert_id, action, user_id, details):
        AuditLog.objects.create(
            alert_id=alert_id,
            action=action,
            performed_by_id=user_id,
            details=details or {},
        )

    @database_sync_to_async
    def check_auto_escalation(self, alert_id):
        """Mark critical alerts for escalation tracking."""
        try:
            alert = Alert.objects.get(id=alert_id)
            if alert.severity == 'critical' and not alert.escalated:
                alert.escalated = True
                alert.save(update_fields=['escalated'])
        except Alert.DoesNotExist:
            pass
