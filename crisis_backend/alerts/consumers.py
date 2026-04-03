import json
import random
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Alert

def simulate_ml_threat_score(sensor_data):
    # Mock ML scoring logic based on sensor data
    # Assign higher score if impact detected
    if sensor_data.get("impact_detected", False):
        return random.randint(80, 100)
    return random.randint(30, 79)

class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'responder_dashboard'
        
        # Join dashboard group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Guest App)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        event_type = text_data_json.get('type')

        if event_type == 'sos_trigger':
            coordinates = text_data_json.get('coordinates', {})
            sensor_data = text_data_json.get('sensor_data', {})
            
            # Predict Threat Score dynamically
            threat_score = simulate_ml_threat_score(sensor_data)

            # Persist alert in DB
            alert_data = await self.create_alert(coordinates, threat_score)

            # Broadcast to responders
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'new_alert',
                    'alert': alert_data
                }
            )

    # Receive message from group
    async def new_alert(self, event):
        alert = event['alert']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'new_alert',
            'alert': alert
        }))

    @database_sync_to_async
    def create_alert(self, coordinates, threat_score):
        alert = Alert.objects.create(
            lat=coordinates.get('lat'),
            lng=coordinates.get('lng'),
            threat_score=threat_score,
            trigger_type='sos_button'
        )
        return {
            'id': alert.id,
            'lat': alert.lat,
            'lng': alert.lng,
            'threat_score': alert.threat_score,
            'status': alert.status,
            'timestamp': alert.timestamp.isoformat(),
        }
