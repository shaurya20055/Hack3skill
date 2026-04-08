from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Property, Alert, ChatMessage


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'


class AlertSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='hotel_property', read_only=True)
    assigned_staff_details = StaffSerializer(source='assigned_staff', read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)
    response_time = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = '__all__'

    def get_response_time(self, obj):
        rt = obj.response_time_seconds
        if rt is not None:
            return round(rt, 1)
        return None
