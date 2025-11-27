"""
Views for authentication and merchant management.
"""
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .models import Merchant
from .serializers import (
    RegisterSerializer, LoginSerializer, MerchantSerializer,
    MerchantUpdateSerializer, PasswordResetRequestSerializer
)
from .tasks import send_password_reset_email

User = get_user_model()


class RegisterView(APIView):
    """
    POST /api/auth/register
    Register a new merchant.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            merchant = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(merchant.user)
            
            return Response({
                'message': 'تم إنشاء الحساب بنجاح',
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'username': merchant.username,
                'merchant': MerchantSerializer(merchant).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/auth/login
    Login merchant and return JWT tokens.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            
            if user is None:
                return Response({
                    'error': 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active:
                return Response({
                    'error': 'الحساب معطل'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get merchant profile
            try:
                merchant = user.merchant_profile
            except Merchant.DoesNotExist:
                return Response({
                    'error': 'ملف التاجر غير موجود'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'تم تسجيل الدخول بنجاح',
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'username': merchant.username,
                'merchant': MerchantSerializer(merchant).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MerchantProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PUT /api/merchant/me
    Get or update merchant profile.
    """
    serializer_class = MerchantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.merchant_profile
    
    def get_serializer_class(self):
        if self.request.method == 'PUT':
            return MerchantUpdateSerializer
        return MerchantSerializer


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset
    Request password reset email.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Send password reset email (async via Celery)
            send_password_reset_email.delay(email)
            
            return Response({
                'message': 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
