# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status, permissions
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

from apps.profiles.models import VendorProfile, RiderProfile

User = get_user_model()


class AdminVendorListView(APIView):
    """
    Admin Endpoint to list all registered vendor profiles with status filters and search.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = VendorProfile.objects.select_related('user', 'address').order_by('-created_at')

        ver_status = request.query_params.get('verification_status')
        if ver_status:
            queryset = queryset.filter(verification_status=ver_status)

        acc_status = request.query_params.get('status')
        if acc_status:
            queryset = queryset.filter(status=acc_status)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                trade_license_no__icontains=search
            ) | queryset.filter(
                user__username__icontains=search
            ) | queryset.filter(
                user__phone_number__icontains=search
            )

        data = []
        for vendor in queryset:
            data.append({
                "id": vendor.id,
                "name": vendor.name,
                "slug": vendor.slug,
                "type": vendor.type,
                "phone": vendor.phone or getattr(vendor.user, 'phone_number', ''),
                "email": vendor.email or getattr(vendor.user, 'email', ''),
                "logo": str(vendor.logo) if vendor.logo else '',
                "cover_image": str(vendor.cover_image) if vendor.cover_image else '',
                "status": vendor.status,  # 'active', 'inactive', 'paused', 'blocked'
                "verification_status": vendor.verification_status,  # 'pending', 'verified', 'rejected'
                "commission_rate": float(vendor.commission_rate),
                "trade_license_no": vendor.trade_license_no,
                "tax_number": vendor.tax_number or '',
                "owner_username": vendor.user.username,
                "address": {
                    "city": vendor.address.city if vendor.address else 'Dhaka',
                    "area": vendor.address.area if vendor.address else '',
                    "full_address": vendor.address.full_address if vendor.address else '',
                } if vendor.address else None,
                "is_profile_complete": bool(vendor.name and vendor.phone and vendor.trade_license_no and vendor.address),
                "created_at": vendor.created_at.isoformat() if vendor.created_at else None,
                "updated_at": vendor.updated_at.isoformat() if vendor.updated_at else None,
            })

        return Response(data, status=status.HTTP_200_OK)


class AdminVendorDetailView(APIView):
    """
    Admin Endpoint to update a vendor's verification_status, status, or commission_rate.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            vendor = VendorProfile.objects.select_related('user', 'address').get(id=pk)
        except VendorProfile.DoesNotExist:
            return Response({"error": "Vendor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        if 'verification_status' in data:
            new_ver = data['verification_status']
            if new_ver in ['pending', 'verified', 'rejected']:
                vendor.verification_status = new_ver
                if new_ver == 'verified' and vendor.status == 'inactive':
                    vendor.status = 'active'

        if 'status' in data:
            new_status = data['status']
            if new_status in ['active', 'inactive', 'paused', 'blocked']:
                vendor.status = new_status

        if 'commission_rate' in data:
            vendor.commission_rate = data['commission_rate']

        vendor.save()

        return Response({
            "message": f"Vendor '{vendor.name}' verification and status updated successfully.",
            "vendor": {
                "id": vendor.id,
                "name": vendor.name,
                "status": vendor.status,
                "verification_status": vendor.verification_status,
                "commission_rate": float(vendor.commission_rate),
                "updated_at": vendor.updated_at.isoformat() if vendor.updated_at else None,
            }
        }, status=status.HTTP_200_OK)


class AdminRiderListView(APIView):
    """
    Admin Endpoint to list all registered rider profiles with status filters and search.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = RiderProfile.objects.select_related('user').order_by('-created_at')

        ver_status = request.query_params.get('verification_status')
        if ver_status:
            queryset = queryset.filter(verification_status=ver_status)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                user__first_name__icontains=search
            ) | queryset.filter(
                user__last_name__icontains=search
            ) | queryset.filter(
                user__username__icontains=search
            ) | queryset.filter(
                user__phone_number__icontains=search
            ) | queryset.filter(
                nid_no__icontains=search
            ) | queryset.filter(
                license_no__icontains=search
            )

        data = []
        for r in queryset:
            data.append({
                "id": r.id,
                "rider_name": f"{r.user.first_name} {r.user.last_name}".strip() or r.user.username if r.user else f"Rider #{r.id}",
                "phone_number": r.user.phone_number if r.user else "",
                "email": r.user.email if r.user else "",
                "vehicle_type": r.vehicle_type,
                "vehicle_number": r.vehicle_number or "",
                "nid_no": r.nid_no or "",
                "license_no": r.license_no or "",
                "availability_status": r.availability_status,
                "verification_status": r.verification_status,  # 'pending', 'verified', 'rejected'
                "joined_date": r.created_at.isoformat() if r.created_at else "",
            })

        return Response(data, status=status.HTTP_200_OK)


class AdminRiderDetailView(APIView):
    """
    Admin Endpoint to update a rider's verification_status or availability_status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            rider = RiderProfile.objects.select_related('user').get(id=pk)
        except RiderProfile.DoesNotExist:
            return Response({"error": "Rider profile not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # Check all possible verification key names: verification_status, verified_status, status
        ver_val = data.get('verification_status') or data.get('verified_status')
        if not ver_val and 'status' in data and data['status'] in ['pending', 'verified', 'rejected']:
            ver_val = data['status']

        if isinstance(ver_val, str):
            ver_val = ver_val.lower().strip()

        if ver_val in ['pending', 'verified', 'rejected']:
            rider.verification_status = ver_val
            if ver_val == 'verified' and rider.availability_status == 'offline':
                rider.availability_status = 'online'

        if 'availability_status' in data:
            new_status = data['availability_status']
            if new_status in ['online', 'offline', 'busy']:
                rider.availability_status = new_status

        rider.save()

        return Response({
            "message": f"Rider '{rider.user.username}' verification status updated to '{rider.verification_status}' successfully.",
            "rider": {
                "id": rider.id,
                "verification_status": rider.verification_status,
                "availability_status": rider.availability_status,
                "updated_at": rider.updated_at.isoformat() if rider.updated_at else None,
            }
        }, status=status.HTTP_200_OK)
