from django.contrib import admin
from .models import Property, Alert, ChatMessage


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'lat', 'lng', 'access_code')
    search_fields = ('name',)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'emergency_type', 'severity', 'status', 'threat_score',
                    'room_number', 'assigned_staff', 'timestamp')
    list_filter = ('emergency_type', 'severity', 'status')
    search_fields = ('details', 'room_number')
    readonly_fields = ('timestamp', 'resolved_at')


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'alert', 'sender_role', 'sender_name', 'timestamp')
    list_filter = ('sender_role',)
