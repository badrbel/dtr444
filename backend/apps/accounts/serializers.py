"""
Serializers for authentication and user management.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Merchant

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'phone', 'user_type', 'is_verified', 'created_at')
        read_only_fields = ('id', 'is_verified', 'created_at')


class MerchantSerializer(serializers.ModelSerializer):
    """Serializer for Merchant model."""
    
    user = UserSerializer(read_only=True)
    contact_links = serializers.SerializerMethodField()
    
    class Meta:
        model = Merchant
        fields = (
            'id', 'user', 'name', 'username', 'logo', 'kyc_status',
            'payment_preference', 'confirmation_method', 'contact_links',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'kyc_status', 'created_at', 'updated_at')
    
    def get_contact_links(self, obj):
        return obj.contact_links


class RegisterSerializer(serializers.Serializer):
    """Serializer for merchant registration."""
    
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    username = serializers.SlugField(max_length=100)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("البريد الإلكتروني مستخدم بالفعل")
        return value
    
    def validate_username(self, value):
        if Merchant.objects.filter(username=value).exists():
            raise serializers.ValidationError("اسم المستخدم مستخدم بالفعل")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("اسم المستخدم مستخدم بالفعل")
        return value
    
    def create(self, validated_data):
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data['phone'],
            user_type='merchant'
        )
        
        # Create merchant profile
        merchant = Merchant.objects.create(
            user=user,
            name=validated_data['name'],
            username=validated_data['username']
        )
        
        return merchant


class LoginSerializer(serializers.Serializer):
    """Serializer for login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class MerchantUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating merchant profile."""
    
    name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False, source='user.phone')
    
    class Meta:
        model = Merchant
        fields = (
            'name', 'phone', 'logo', 'payment_preference', 
            'confirmation_method', 'whatsapp_link', 'instagram_link', 'facebook_link'
        )
    
    def update(self, instance, validated_data):
        # Update user phone if provided
        user_data = validated_data.pop('user', {})
        if 'phone' in user_data:
            instance.user.phone = user_data['phone']
            instance.user.save()
        
        # Update merchant fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("البريد الإلكتروني غير موجود")
        return value
