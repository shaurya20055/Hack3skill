from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Property, Alert

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    class Meta:
        model = Alert
        fields = '__all__'
