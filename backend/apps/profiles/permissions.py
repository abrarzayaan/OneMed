# pyrefly: ignore [missing-import]
from rest_framework.permissions import BasePermission
from apps.authentication.models import UserRole

class IsRoleUser(BasePermission):
    """
    টোকেন এবং ডাটাবেজ থেকে ইউজারের রোল চেক করার গ্লোবাল পারমিশন ক্লাস।
    """
    def __init__(self, allowed_role):
        self.allowed_role = allowed_role

    def has_permission(self, request, view):
        # ইউজার লগইন করা আছে কিনা চেক
        if not request.user or not request.user.is_authenticated:
            return False

        # ১. প্রোফাইল রিলেশনশিপ চেক
        if self.allowed_role == 'rider' and hasattr(request.user, 'rider_profile'):
            return True
        if self.allowed_role == 'vendor' and hasattr(request.user, 'vendor_profile'):
            return True
        if self.allowed_role == 'consumer' and hasattr(request.user, 'customer_profile'):
            return True
        
        # ২. ডাটাবেজ থেকে রোল ভেরিফাই করা
        try:
            user_role = UserRole.objects.get(user=request.user).role.name
            if user_role == self.allowed_role:
                return True
        except UserRole.DoesNotExist:
            pass

        # ৩. User.role অ্যাট্রিবিউট চেক
        role_attr = getattr(request.user, 'role', None)
        return bool(role_attr and str(role_attr).lower() == self.allowed_role.lower())

# নির্দিষ্ট রোল ভিত্তিক পারমিশন ক্লাস
class IsConsumer(IsRoleUser):
    def __init__(self):
        super().__init__('consumer')

class IsVendor(IsRoleUser):
    def __init__(self):
        super().__init__('vendor')

class IsRider(IsRoleUser):
    def __init__(self):
        super().__init__('rider')