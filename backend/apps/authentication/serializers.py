# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.db import transaction
# pyrefly: ignore [missing-import]
from django.db.models import Q
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Role, UserRole, Users
from apps.profiles.models import ConsumerProfile, VendorProfile, RiderProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(max_length=20, default='consumer', required=False)

    def validate_phone(self, value):
        cleaned = value.strip()
        if Users.objects.filter(Q(phone_number=cleaned) | Q(username=cleaned)).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return cleaned

    def validate_email(self, value):
        cleaned = value.strip().lower()
        if Users.objects.filter(email=cleaned).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return cleaned

    def validate_role(self, value):
        if not value:
            return 'consumer'
        cleaned_role = value.strip().lower()
        valid_roles = ['consumer', 'vendor', 'rider']
        if cleaned_role not in valid_roles:
            raise serializers.ValidationError(f"Role must be one of {valid_roles}")
        return cleaned_role

    def create(self, validated_data):
        role_name = validated_data.get("role", "consumer") or "consumer"
        phone = validated_data["phone"].strip()

        with transaction.atomic():
            user = Users.objects.create_user(
                first_name=validated_data["first_name"].strip(),
                last_name=validated_data["last_name"].strip(),
                username=phone,
                phone_number=phone,
                email=validated_data["email"].strip().lower(),
                password=validated_data["password"]
            )

            role, _ = Role.objects.get_or_create(name=role_name)
            UserRole.objects.get_or_create(user=user, role=role)

            if role_name == "consumer":
                ConsumerProfile.objects.get_or_create(user=user)
            elif role_name == "vendor":
                # pyrefly: ignore [missing-import]
                from django.utils.text import slugify
                base_slug = slugify(user.username or user.first_name or "vendor")
                slug = base_slug
                counter = 1
                while VendorProfile.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                VendorProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'name': f"{user.first_name} {user.last_name}".strip() or f"{user.username} Store",
                        'slug': slug,
                        'phone': user.phone_number,
                        'email': user.email,
                    }
                )
            elif role_name == "rider":
                RiderProfile.objects.get_or_create(user=user)

            return user



class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField()


class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user: Users):
        token = super().get_token(user)
        user_role = UserRole.objects.filter(user=user).select_related('role').first()
        role = user_role.role.name if user_role and user_role.role else "consumer"

        token["role"] = role
        token["phone"] = getattr(user, 'phone_number', '') or user.username
        return token