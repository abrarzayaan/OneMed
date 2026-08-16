# pyrefly: ignore [missing-import]
from rest_framework.permissions import BasePermission
from apps.authentication.models import UserRole

class IsAdminUser(BasePermission):
    """
    Allows access only to admin users (staff, superuser, or role='admin').
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        try:
            return UserRole.objects.get(user=request.user).role.name == "admin"
        except UserRole.DoesNotExist:
            return False


class IsConsumerUser(BasePermission):
    """
    Allows access only to consumers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return UserRole.objects.get(user=request.user).role.name == "consumer"
        except UserRole.DoesNotExist:
            return False


class IsRiderUser(BasePermission):
    """
    Allows access only to riders.
    Checks rider_profile existence, UserRole model, or user.role attribute.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'rider_profile'):
            return True
        try:
            if UserRole.objects.get(user=request.user).role.name == "rider":
                return True
        except UserRole.DoesNotExist:
            pass
        role_attr = getattr(request.user, 'role', None)
        return bool(role_attr and str(role_attr).lower() == 'rider')
