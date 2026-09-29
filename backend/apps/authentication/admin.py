# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import Role, UserRole, Users, SystemSetting, SecurityAuditLog



@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    search_fields = ('user__username', 'role__name')
    list_filter = ('role',)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Users)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'first_name', 'last_name', 'email', 'phone_number', 'is_active', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone_number')
    list_filter = ('is_active', 'is_staff')


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ('whatsapp_support_number', 'is_whatsapp_enabled', 'updated_at')
    search_fields = ('whatsapp_support_number',)


@admin.register(SecurityAuditLog)
class SecurityAuditLogAdmin(admin.ModelAdmin):
    list_display = ('actor_name', 'action_type', 'module', 'timestamp')
    search_fields = ('actor_name', 'module', 'description')
    list_filter = ('action_type', 'module', 'timestamp')


