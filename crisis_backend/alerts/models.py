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
        ('flood', 'Flood'),
        ('medical', 'Medical Emergency'),
        ('routine', 'Routine'),
        ('security', 'Security Threat'),
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
        max_length=30, choices=EMERGENCY_TYPES, default='routine'
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
    reported_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reported_alerts',
        help_text='The user who created this alert'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    # New fields for enhanced functionality
    priority_score = models.IntegerField(default=0, help_text='AI-computed priority score')
    escalated = models.BooleanField(default=False, help_text='Whether this alert has been auto-escalated')
    group_id = models.CharField(max_length=50, blank=True, default='', help_text='Group ID for related incidents')
    model_confidence = models.FloatField(default=0.0, help_text='ML model prediction confidence (0.0-1.0)')

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['status'], name='idx_alert_status'),
            models.Index(fields=['severity'], name='idx_alert_severity'),
            models.Index(fields=['timestamp'], name='idx_alert_timestamp'),
            models.Index(fields=['emergency_type'], name='idx_alert_type'),
            models.Index(fields=['status', 'severity'], name='idx_alert_status_sev'),
        ]

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
        indexes = [
            models.Index(fields=['alert', 'timestamp'], name='idx_chat_alert_ts'),
        ]

    def __str__(self):
        return f"[{self.sender_role}] {self.message[:50]}"


class AuditLog(models.Model):
    """Track who changed what and when for compliance."""
    ACTION_TYPES = [
        ('status_change', 'Status Change'),
        ('staff_assign', 'Staff Assignment'),
        ('escalation', 'Auto-Escalation'),
        ('broadcast', 'System Broadcast'),
        ('resolve', 'Resolved'),
    ]

    alert = models.ForeignKey(
        Alert, on_delete=models.CASCADE, related_name='audit_logs',
        null=True, blank=True
    )
    action = models.CharField(max_length=30, choices=ACTION_TYPES)
    performed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='audit_actions'
    )
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['alert', 'timestamp'], name='idx_audit_alert_ts'),
        ]

    def __str__(self):
        return f"Audit: {self.action} on Alert #{self.alert_id} at {self.timestamp}"
