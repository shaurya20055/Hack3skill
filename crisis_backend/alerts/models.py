from django.db import models
from django.utils import timezone

class Property(models.Model):
    name = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    access_code = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name

class Alert(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('resolved', 'Resolved'),
    ]

    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    trigger_type = models.CharField(max_length=50, default='sos_button')
    timestamp = models.DateTimeField(default=timezone.now)
    threat_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return f"Alert {self.id} - {self.threat_score}% - {self.status}"
