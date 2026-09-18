# pyrefly: ignore [missing-import]
from django.contrib.auth.backends import ModelBackend
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.db.models import Q

User = get_user_model()

class PhoneEmailUsernameAuthenticationBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in using:
    - Phone number
    - Username
    - Email address
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        phone_or_user = username or kwargs.get('phone') or kwargs.get('email')
        if not phone_or_user or not password:
            return None

        phone_or_user = str(phone_or_user).strip()

        user = User.objects.filter(
            Q(phone_number=phone_or_user) |
            Q(username=phone_or_user) |
            Q(email=phone_or_user.lower())
        ).first()

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
