"""
Custom User model for the platform.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    """
    USER_TYPE_CHOICES = (
        ('merchant', 'Merchant'),
        ('admin', 'Admin'),
        ('customer', 'Customer'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='merchant')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email


class Merchant(models.Model):
    """
    Merchant profile extending User model.
    """
    KYC_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('COD', 'Cash on Delivery'),
        ('CONTACT', 'Contact via Social Media'),
    )
    
    CONFIRMATION_METHOD_CHOICES = (
        ('call', 'Phone Call'),
        ('whatsapp', 'WhatsApp'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='merchant_profile')
    name = models.CharField(max_length=255)
    username = models.SlugField(max_length=100, unique=True, db_index=True)
    logo = models.ImageField(upload_to='merchants/logos/', blank=True, null=True)
    
    # KYC and Status
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='approved')
    
    # Payment Settings
    payment_preference = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='COD')
    confirmation_method = models.CharField(max_length=20, choices=CONFIRMATION_METHOD_CHOICES, blank=True)
    
    # Contact Links
    whatsapp_link = models.URLField(blank=True)
    instagram_link = models.URLField(blank=True)
    facebook_link = models.URLField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('merchant')
        verbose_name_plural = _('merchants')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} (@{self.username})"
    
    @property
    def contact_links(self):
        return {
            'whatsapp': self.whatsapp_link,
            'instagram': self.instagram_link,
            'facebook': self.facebook_link,
        }
