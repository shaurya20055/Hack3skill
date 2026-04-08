from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class Property(models.Model):
    name = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    address = models.CharField(max_length=500, blank=True, default='')
    access_code = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name_plural = 'Properties'

    def __str__(self):
        return self.name


class Alert(models.Model):
    EMERGENCY_TYPES = [
        ('fire', 'Fire'),
        ('medical', 'Medical Emergency'),
        ('security', 'Security Threat'),
        ('natural_disaster', 'Natural Disaster'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('acknowledged', 'Acknowledged'),
        ('responding', 'Responding'),
        ('resolved', 'Resolved'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('critical', 'Critical'),
    ]

    hotel_property = models.ForeignKey(
        Property, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='alerts'
    )
    emergency_type = models.CharField(
        max_length=30, choices=EMERGENCY_TYPES, default='other'
    )
    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, default='medium'
    )
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    room_number = models.CharField(max_length=20, blank=True, default='')
    details = models.TextField(blank=True, default='')
    trigger_type = models.CharField(max_length=50, default='sos_button')
    timestamp = models.DateTimeField(default=timezone.now)
    threat_score = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='reported'
    )
    assigned_staff = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_alerts'
    )
    ai_suggestion = models.TextField(blank=True, default='')
    ai_summary = models.TextField(blank=True, default='')
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Alert #{self.id} [{self.get_emergency_type_display()}] - {self.severity} - {self.status}"

    @property
    def response_time_seconds(self):
        if self.resolved_at and self.timestamp:
            return (self.resolved_at - self.timestamp).total_seconds()
        return None


class ChatMessage(models.Model):
    SENDER_ROLES = [
        ('guest', 'Guest'),
        ('staff', 'Staff'),
        ('system', 'System'),
    ]

    alert = models.ForeignKey(
        Alert, on_delete=models.CASCADE, related_name='messages',
        null=True, blank=True
    )
    sender_role = models.CharField(max_length=10, choices=SENDER_ROLES, default='guest')
    sender_name = models.CharField(max_length=100, default='Anonymous')
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"[{self.sender_role}] {self.message[:50]}"
