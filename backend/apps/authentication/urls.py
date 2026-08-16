# pyrefly: ignore [missing-import]
from django.urls import path
from .views import RegisterView, LoginView, CustomTokenView, MeView
from .views_rbac import (
    StaffRoleListCreateView,
    StaffRoleDetailView,
    StaffUserListCreateView,
    StaffUserDetailView,
    SecurityAuditLogListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('token/', CustomTokenView.as_view(), name='token_obtain_pair'),
    path('rbac/roles/', StaffRoleListCreateView.as_view(), name='rbac_roles'),
    path('rbac/roles/<int:pk>/', StaffRoleDetailView.as_view(), name='rbac_role_detail'),
    path('rbac/staff/', StaffUserListCreateView.as_view(), name='rbac_staff'),
    path('rbac/staff/<int:pk>/', StaffUserDetailView.as_view(), name='rbac_staff_detail'),
    path('rbac/audit-logs/', SecurityAuditLogListView.as_view(), name='rbac_audit_logs'),
]