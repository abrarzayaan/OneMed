# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from django.contrib.auth import authenticate, get_user_model
# pyrefly: ignore [missing-import]
from django.db.models import Q
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
# pyrefly: ignore [missing-import]
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    CustomTokenSerializer,
    WhatsAppSettingSerializer,
)
from .models import Users, UserRole, SystemSetting, SecurityAuditLog

User = get_user_model()



def get_tokens_for_user(user: Users) -> dict:
    refresh = RefreshToken.for_user(user)
    role = user.get_role_name()
    refresh["role"] = role

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token)
    }


class RegisterView(APIView):
    @extend_schema(request=RegisterSerializer)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            "message": "Registration Successful and Profile Created!"
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    @extend_schema(request=LoginSerializer)
    def post(self, request):
        phone_or_user = request.data.get("phone") or request.data.get("username") or request.data.get("email")
        password = request.data.get("password")

        if not phone_or_user or not password:
            return Response({
                "error": "Phone number, Username, or Email and password are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        phone_or_user = str(phone_or_user).strip()

        # 1. Try standard Django authenticate (using username parameter which matches phone_number as USERNAME_FIELD)
        user = authenticate(username=phone_or_user, password=password)

        # 2. Fallback direct lookup by phone_number, username, or email
        if user is None:
            matched_user = Users.objects.filter(
                Q(phone_number=phone_or_user) | Q(username=phone_or_user) | Q(email=phone_or_user.lower())
            ).first()
            if matched_user and matched_user.check_password(password):
                user = matched_user

        if user is not None:
            if not user.is_active:
                return Response({
                    "error": "This account is inactive. Please contact support."
                }, status=status.HTTP_401_UNAUTHORIZED)

            tokens = get_tokens_for_user(user)
            staff_role_name = user.staff_role.name if user.staff_role else ("Super Admin" if user.is_superuser else ("Staff Member" if user.is_staff else None))
            tokens["user"] = {
                "id": user.id,
                "phone": user.phone_number or user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "username": user.username,
                "role": user.get_role_name(),
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "staff_role": staff_role_name,
                "permissions": user.get_permissions_dict(),
            }
            return Response(tokens, status=status.HTTP_200_OK)

        return Response({
            "error": "Invalid phone number/username or password"
        }, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Unauthenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        staff_role_name = user.staff_role.name if user.staff_role else ("Super Admin" if user.is_superuser else ("Staff Member" if user.is_staff else None))
        return Response({
            "id": user.id,
            "phone": user.phone_number or user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "role": user.get_role_name(),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "staff_role": staff_role_name,
            "permissions": user.get_permissions_dict(),
        })


class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer


class WhatsAppSettingView(APIView):
    """
    Public GET endpoint to fetch dynamic WhatsApp support details.
    Restricted PUT/PATCH endpoint requiring Super Admin privileges.
    """
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAuthenticated()]
        return [AllowAny()]

    @extend_schema(responses={200: WhatsAppSettingSerializer})
    def get(self, request):
        setting = SystemSetting.get_settings()
        serializer = WhatsAppSettingSerializer(setting)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(request=WhatsAppSettingSerializer, responses={200: WhatsAppSettingSerializer})
    def put(self, request):
        return self._update_settings(request, partial=False)

    @extend_schema(request=WhatsAppSettingSerializer, responses={200: WhatsAppSettingSerializer})
    def patch(self, request):
        return self._update_settings(request, partial=True)

    def _update_settings(self, request, partial=False):
        user = request.user
        is_super = bool(
            user.is_superuser or (hasattr(user, 'get_role_name') and user.get_role_name() == 'SUPERADMIN')
        )
        if not is_super:
            return Response(
                {"error": "Forbidden: Super Admin access required to update system settings."},
                status=status.HTTP_403_FORBIDDEN
            )

        setting = SystemSetting.get_settings()
        serializer = WhatsAppSettingSerializer(setting, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Log security audit trail
        try:
            SecurityAuditLog.objects.create(
                actor_name=getattr(user, 'username', 'SuperAdmin'),
                action_type="UPDATE",
                module="SYSTEM_SETTINGS",
                description=f"Updated WhatsApp support number to: {setting.whatsapp_support_number} (Enabled: {setting.is_whatsapp_enabled})",
                ip_address=request.META.get('REMOTE_ADDR')
            )
        except Exception:
            pass

        return Response(serializer.data, status=status.HTTP_200_OK)