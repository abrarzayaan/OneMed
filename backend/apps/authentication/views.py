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
from drf_spectacular.utils import extend_schema
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, CustomTokenSerializer
from .models import Users, UserRole

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