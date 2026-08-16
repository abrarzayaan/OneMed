# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.permissions import AllowAny
from apps.authentication.models import Users, StaffRole, SecurityAuditLog

class StaffRoleListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        roles = StaffRole.objects.all()
        data = [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "permissions": r.permissions,
                "is_system": r.is_system,
                "member_count": Users.objects.filter(staff_role=r).count() if not r.is_system else Users.objects.filter(is_superuser=True).count(),
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in roles
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        name = data.get("name", "").strip()
        if not name:
            return Response({"error": "Role name is required"}, status=status.HTTP_400_BAD_REQUEST)

        role = StaffRole.objects.create(
            name=name,
            description=data.get("description", ""),
            permissions=data.get("permissions", {}),
            is_system=data.get("is_system", False),
        )

        # Log action
        SecurityAuditLog.objects.create(
            actor_name="Super Admin",
            action_type="CREATE",
            module="RBAC",
            description=f"Created staff role: {name}",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions,
            "is_system": role.is_system,
            "member_count": 0,
        }, status=status.HTTP_201_CREATED)


class StaffRoleDetailView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            role = StaffRole.objects.get(pk=pk)
        except StaffRole.DoesNotExist:
            return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)

        for key, val in request.data.items():
            if hasattr(role, key):
                setattr(role, key, val)
        role.save()

        # Log action
        SecurityAuditLog.objects.create(
            actor_name="Super Admin",
            action_type="UPDATE",
            module="RBAC",
            description=f"Updated permissions for role: {role.name}",
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        return Response({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions,
            "is_system": role.is_system,
        })

    def delete(self, request, pk):
        try:
            role = StaffRole.objects.get(pk=pk)
            if role.is_system:
                return Response({"error": "Cannot delete system protected role"}, status=status.HTTP_400_BAD_REQUEST)
            name = role.name
            role.delete()

            SecurityAuditLog.objects.create(
                actor_name="Super Admin",
                action_type="DELETE",
                module="RBAC",
                description=f"Deleted staff role: {name}",
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            return Response({"success": True}, status=status.HTTP_204_NO_CONTENT)
        except StaffRole.DoesNotExist:
            return Response({"error": "Role not found"}, status=status.HTTP_404_NOT_FOUND)

# pyrefly: ignore [missing-import]
from django.db.models import Q

class StaffUserListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('search') or request.query_params.get('q')
        
        if query:
            query = query.strip()
            users = Users.objects.filter(
                Q(username__icontains=query) |
                Q(phone_number__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )
        else:
            users = Users.objects.filter(Q(is_staff=True) | Q(is_superuser=True))

        data = [
            {
                "id": u.id,
                "full_name": f"{u.first_name} {u.last_name}".strip() or u.username,
                "username": u.username,
                "email": u.email,
                "phone_number": u.phone_number or "N/A",
                "role_id": u.staff_role_id or (1 if u.is_superuser else 2),
                "role_name": u.staff_role.name if u.staff_role else ("Super Admin" if u.is_superuser else "Staff Member"),
                "is_superuser": u.is_superuser,
                "is_staff": u.is_staff,
                "permissions": u.get_permissions_dict(),
                "status": "ACTIVE" if u.is_active else "SUSPENDED",
                "joined_date": u.date_joined.isoformat() if u.date_joined else "",
            }
            for u in users
        ]
        return Response(data)

    def post(self, request):
        data = request.data
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        phone_number = (data.get("phone_number") or data.get("phone") or "").strip()
        email = data.get("email", "").strip()
        username = (data.get("username") or phone_number or f"{first_name}_{last_name}".lower()).strip()
        password = data.get("password") or "Pass12345!"
        role_id = data.get("role_id")

        if not phone_number:
            return Response({"error": "Phone Number is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or find default "Admin" StaffRole
        staff_role_obj = None
        if role_id:
            try:
                staff_role_obj = StaffRole.objects.get(pk=role_id)
            except StaffRole.DoesNotExist:
                pass

        if not staff_role_obj:
            staff_role_obj = StaffRole.objects.filter(name__iexact="Admin").first() or StaffRole.objects.filter(is_system=False).first()

        # Check if user already exists
        user = Users.objects.filter(Q(phone_number=phone_number) | Q(username=username)).first()

        try:
            if user:
                user.is_staff = True
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                if email:
                    user.email = email
                if password and password != "Pass12345!":
                    user.set_password(password)
                if staff_role_obj:
                    user.staff_role = staff_role_obj
                user.save()
            else:
                user = Users.objects.create_user(
                    phone_number=phone_number,
                    email=email or f"{phone_number}@onemed.com",
                    username=username or phone_number,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_staff=True,
                    is_superuser=False,
                    is_active=True,
                    staff_role=staff_role_obj,
                )

            from apps.authentication.models import Role, UserRole
            admin_role_model, _ = Role.objects.get_or_create(name="ADMIN")
            UserRole.objects.get_or_create(user=user, role=admin_role_model)

            SecurityAuditLog.objects.create(
                actor_name="Super Admin",
                action_type="CREATE",
                module="STAFF_MANAGEMENT",
                description=f"Created staff admin user: {user.username} ({user.phone_number})",
                ip_address=request.META.get('REMOTE_ADDR'),
            )

            return Response({
                "id": user.id,
                "full_name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "role_id": user.staff_role_id or 1,
                "role_name": user.staff_role.name if user.staff_role else "Admin",
                "is_superuser": user.is_superuser,
                "is_staff": user.is_staff,
                "permissions": user.get_permissions_dict(),
                "status": "ACTIVE" if user.is_active else "SUSPENDED",
                "joined_date": user.date_joined.isoformat() if user.date_joined else "",
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Failed to create admin user: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class StaffUserDetailView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        try:
            user = Users.objects.get(pk=pk)
        except Users.DoesNotExist:
            return Response({"error": "Staff member not found"}, status=status.HTTP_404_NOT_FOUND)

        if "status" in request.data:
            new_status = request.data["status"]
            user.is_active = (new_status == "ACTIVE")
            user.save()

            SecurityAuditLog.objects.create(
                actor_name="Super Admin",
                action_type="STATUS_CHANGE",
                module="STAFF_MANAGEMENT",
                description=f"Toggled staff user {user.username} status to {new_status}",
                ip_address=request.META.get('REMOTE_ADDR'),
            )

        if "role_id" in request.data:
            role_id = request.data["role_id"]
            try:
                s_role = StaffRole.objects.get(pk=role_id)
                user.staff_role = s_role
                user.is_staff = True
                user.save()
            except StaffRole.DoesNotExist:
                pass

        return Response({
            "id": user.id,
            "full_name": user.username,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "role_id": user.staff_role_id or 1,
            "role_name": user.staff_role.name if user.staff_role else ("Super Admin" if user.is_superuser else "Staff Member"),
            "is_superuser": user.is_superuser,
            "is_staff": user.is_staff,
            "permissions": user.get_permissions_dict(),
            "status": "ACTIVE" if user.is_active else "SUSPENDED",
        })


class SecurityAuditLogListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logs = SecurityAuditLog.objects.all()[:100]
        data = [
            {
                "id": log.id,
                "actor_name": log.actor_name,
                "action_type": log.action_type,
                "module": log.module,
                "description": log.description,
                "ip_address": log.ip_address or "127.0.0.1",
                "timestamp": log.timestamp.isoformat() if log.timestamp else "",
            }
            for log in logs
        ]
        return Response(data)
