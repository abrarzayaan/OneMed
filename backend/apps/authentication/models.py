# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number, email, username, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('The Phone Number field must be set')
        email = self.normalize_email(email)
        user = self.model(phone_number=phone_number, email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, email, username, password, **extra_fields)


class Users(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    staff_role = models.ForeignKey('StaffRole', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_users')

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['email', 'username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['phone_number']),
        ]

    def __str__(self):
        return self.username

    def get_role_name(self):
        if self.is_superuser:
            return "SUPERADMIN"
        if self.is_staff:
            return "ADMIN"
        user_role = UserRole.objects.filter(user=self).select_related('role').first()
        if user_role and user_role.role:
            return user_role.role.name.upper()
        return "CONSUMER"

    def get_permissions_dict(self):
        all_modules = [
            "dashboard", "orders", "prescriptions", "creation",
            "catalog", "inventory", "cms", "promotions",
            "vendor-verification", "vendors", "logistics",
            "rbac", "explorer", "audit-logs"
        ]
        if self.is_superuser:
            return {m: 'FULL' for m in all_modules}
        if self.is_staff and self.staff_role and self.staff_role.permissions:
            perms = self.staff_role.permissions
            result = {}
            for m in all_modules:
                val = perms.get(m, 'NONE')
                if val in ['FULL', True, 'write', 'FULL_ACCESS']:
                    result[m] = 'FULL'
                elif val in ['READ', 'read', 'VIEW_ONLY']:
                    result[m] = 'READ'
                else:
                    result[m] = 'NONE'
            return result
        if self.is_staff:
            return {m: 'FULL' if m in ["dashboard", "orders"] else 'NONE' for m in all_modules}
        return {m: 'NONE' for m in all_modules}


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name


class UserRole(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

    class Meta:
        db_table = 'user_roles'
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"


class StaffRole(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    permissions = models.JSONField(default=dict)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'staff_roles'

    def __str__(self):
        return self.name


class SecurityAuditLog(models.Model):
    actor_name = models.CharField(max_length=150)
    action_type = models.CharField(max_length=50)  # CREATE, UPDATE, DELETE, AUTH, STATUS_CHANGE
    module = models.CharField(max_length=100)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'security_audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor_name} - {self.action_type} - {self.timestamp}"