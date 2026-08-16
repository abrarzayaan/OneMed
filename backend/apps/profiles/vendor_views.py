# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status, permissions
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.utils.text import slugify
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db.models import Sum, F, Count, Q
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.tokens import RefreshToken

from apps.profiles.models import VendorProfile, Address
from apps.profiles.serializers import VendorProfileSerializer
from apps.products.models.inventories import Inventory, InventoryStatusChoices
from apps.products.models.variants_images import ProductVariant
from apps.orders.models import OrderItem

User = get_user_model()


def get_or_create_vendor_profile(user):
    base_slug = slugify(user.username or user.first_name or "vendor")
    slug = base_slug
    counter = 1
    while VendorProfile.objects.filter(slug=slug).exclude(user=user).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    profile, _ = VendorProfile.objects.get_or_create(
        user=user,
        defaults={
            'name': f"{user.first_name} {user.last_name}".strip() or f"{user.username} Store",
            'slug': slug,
            'phone': getattr(user, 'phone_number', ''),
            'email': user.email,
        }
    )
    return profile


class VendorRegisterView(APIView):
    """
    Public Endpoint for Vendor Partner Registration.
    Creates User + Address + VendorProfile (status: inactive, verification: pending).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        pharmacy_name = data.get('pharmacy_name')
        phone = data.get('phone', '')
        trade_license_no = data.get('trade_license_no', '')
        vendor_type = data.get('type', 'pharmacy')
        city = data.get('city', 'Dhaka')
        area = data.get('area', '')
        full_address = data.get('full_address', '')

        if not username or not password or not pharmacy_name:
            return Response(
                {"error": "Username, password and pharmacy_name are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username is already taken."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if email and User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email is already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. Create User
            user = User.objects.create_user(
                username=username,
                email=email or f"{username}@onemed.com",
                password=password,
                phone_number=phone,
                role='VENDOR',
            )

            # 2. Create Address
            address_obj = Address.objects.create(
                user=user,
                label='pharmacy',
                full_address=full_address or f"{area}, {city}",
                area=area or 'General Zone',
                city=city or 'Dhaka',
            )

            # 3. Create Vendor Profile
            base_slug = slugify(pharmacy_name) or username
            slug = base_slug
            counter = 1
            while VendorProfile.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            vendor_profile = VendorProfile.objects.create(
                user=user,
                name=pharmacy_name,
                slug=slug,
                type=vendor_type,
                phone=phone,
                email=email,
                address=address_obj,
                trade_license_no=trade_license_no,
                status='inactive',
                verification_status='pending',
            )

            # 4. Generate JWT Tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Vendor registration successful. Pending verification by admin.",
                "user_id": user.id,
                "vendor_id": vendor_profile.id,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Failed to complete vendor registration: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VendorProfileMeView(APIView):
    """
    Get & Update Logged-in Vendor's Store Profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = get_or_create_vendor_profile(request.user)
        serializer = VendorProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        profile = get_or_create_vendor_profile(request.user)
        serializer = VendorProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendorAnalyticsSummaryView(APIView):
    """
    Dashboard metrics for logged-in vendor.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vendor = get_or_create_vendor_profile(request.user)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Assigned Order Items for this vendor
        vendor_items = OrderItem.objects.filter(vendor=vendor).distinct()

        today_items = vendor_items.filter(order__created_at__gte=today_start)

        items_dispatched_today = today_items.aggregate(total=Sum('quantity'))['total'] or 0
        total_items_dispatched = vendor_items.aggregate(total=Sum('quantity'))['total'] or 0

        todays_sales_bdt = float(today_items.aggregate(total=Sum('total_price'))['total'] or 0.0)
        total_sales_bdt = float(vendor_items.aggregate(total=Sum('total_price'))['total'] or 0.0)

        # Inventory Metrics
        inventories = Inventory.objects.filter(vendor=vendor)
        low_stock_alerts_count = inventories.filter(
            status__in=[InventoryStatusChoices.LOW_STOCK, InventoryStatusChoices.OUT_OF_STOCK]
        ).count()
        total_inventory_items = inventories.count()

        return Response({
            "items_dispatched_today": items_dispatched_today,
            "total_items_dispatched": total_items_dispatched,
            "todays_sales_bdt": todays_sales_bdt,
            "total_sales_bdt": total_sales_bdt,
            "low_stock_alerts_count": low_stock_alerts_count,
            "total_inventory_items": total_inventory_items,
        }, status=status.HTTP_200_OK)


class VendorDispatchedItemsView(APIView):
    """
    List of order items allocated/dispatched from this vendor's inventory.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vendor = get_or_create_vendor_profile(request.user)

        items_qs = OrderItem.objects.filter(
            vendor=vendor
        ).select_related(
            'order', 'product_variant', 'product_variant__product'
        ).distinct().order_by('-order__created_at')

        # Optional date filter (today)
        if request.query_params.get('filter') == 'today':
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            items_qs = items_qs.filter(order__created_at__gte=today_start)

        dispatched_list = []
        for item in items_qs:
            variant = item.product_variant
            product = variant.product if variant else None
            order = item.order
            shipping = getattr(order, 'shipping_address', None)
            customer_area = shipping.area if shipping else 'Dhaka'

            dispatched_list.append({
                "order_item_id": item.id,
                "order_id": order.id,
                "order_number": order.order_number,
                "product_name": product.name if product else "Product Item",
                "variant_name": variant.variant_name if variant else "Default",
                "variant_sku": variant.sku if variant else "N/A",
                "product_image": getattr(product, 'primary_image', '') if product else '',
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price),
                "order_status": order.order_status,
                "assigned_at": order.created_at.isoformat(),
                "customer_area": customer_area,
            })

        return Response(dispatched_list, status=status.HTTP_200_OK)


class VendorProductVariantsView(APIView):
    """
    Endpoint to list all active Product Variants in the catalog for Vendor Stock Addition.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        variants = ProductVariant.objects.select_related('product').order_by('product__name')
        data = []
        for v in variants:
            data.append({
                "id": v.id,
                "product_name": v.product.name if v.product else "Product",
                "variant_name": v.variant_name,
                "sku": v.sku,
                "price": float(v.price),
                "sale_price": float(v.sale_price) if v.sale_price else None,
            })
        return Response(data, status=status.HTTP_200_OK)


class VendorInventoryView(APIView):
    """
    Get, Create & Update Vendor's Stock Inventory.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vendor = get_or_create_vendor_profile(request.user)

        inventories = Inventory.objects.filter(vendor=vendor).select_related(
            'variant', 'variant__product'
        ).order_by('-updated_at')

        res = []
        for inv in inventories:
            variant = inv.variant
            product = variant.product if variant else None
            res.append({
                "id": inv.id,
                "vendor_id": vendor.id,
                "variant_id": variant.id if variant else None,
                "product_name": product.name if product else "Product",
                "variant_sku": variant.sku if variant else "N/A",
                "variant_name": variant.variant_name if variant else "Default",
                "product_image": getattr(product, 'primary_image', '') if product else '',
                "unit_price": float(variant.price) if variant else 0.0,
                "stock_qty": inv.stock_qty,
                "reserved_qty": inv.reserved_qty,
                "damaged_qty": inv.damaged_qty,
                "available_stock": inv.available_stock,
                "reorder_level": inv.reorder_level,
                "batch_number": getattr(inv, 'batch_number', ''),
                "expiry_date": inv.expiry_date.isoformat() if getattr(inv, 'expiry_date', None) else None,
                "status": inv.status,
                "updated_at": inv.updated_at.isoformat(),
            })

        return Response(res, status=status.HTTP_200_OK)

    def post(self, request):
        vendor = get_or_create_vendor_profile(request.user)

        if not (vendor.name and vendor.phone and vendor.trade_license_no and vendor.address):
            return Response(
                {
                    "error": "Profile Incomplete! You must complete your Store Profile (trade license, contact info, physical address) in Store Profile Settings before adding or updating stock inventory.",
                    "code": "PROFILE_INCOMPLETE"
                },
                status=status.HTTP_403_FORBIDDEN
            )

        variant_id = request.data.get('variant_id')
        stock_qty = request.data.get('stock_qty', 0)
        reorder_level = request.data.get('reorder_level', 10)

        if not variant_id:
            return Response({"error": "variant_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            variant = ProductVariant.objects.get(id=variant_id)
        except ProductVariant.DoesNotExist:
            return Response({"error": "Product variant not found."}, status=status.HTTP_404_NOT_FOUND)

        inv, created = Inventory.objects.get_or_create(
            vendor=vendor,
            variant=variant,
            defaults={'stock_qty': int(stock_qty), 'reorder_level': int(reorder_level)}
        )

        if not created:
            inv.stock_qty = int(stock_qty)
            inv.reorder_level = int(reorder_level)

        # Update Inventory status based on available stock
        available = inv.available_stock
        if available <= 0:
            inv.status = InventoryStatusChoices.OUT_OF_STOCK
        elif available <= inv.reorder_level:
            inv.status = InventoryStatusChoices.LOW_STOCK
        else:
            inv.status = InventoryStatusChoices.IN_STOCK

        inv.save()

        product = variant.product if variant else None

        return Response({
            "message": f"Stock inventory for '{variant.variant_name}' updated successfully.",
            "inventory": {
                "id": inv.id,
                "vendor_id": vendor.id,
                "variant_id": variant.id,
                "product_name": product.name if product else "Product",
                "variant_sku": variant.sku,
                "variant_name": variant.variant_name,
                "unit_price": float(variant.price),
                "stock_qty": inv.stock_qty,
                "reserved_qty": inv.reserved_qty,
                "damaged_qty": inv.damaged_qty,
                "available_stock": inv.available_stock,
                "reorder_level": inv.reorder_level,
                "batch_number": getattr(inv, 'batch_number', ''),
                "expiry_date": inv.expiry_date.isoformat() if getattr(inv, 'expiry_date', None) else None,
                "status": inv.status,
                "updated_at": inv.updated_at.isoformat(),
            }
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    def patch(self, request, pk=None):
        vendor = get_or_create_vendor_profile(request.user)

        if not (vendor.name and vendor.phone and vendor.trade_license_no and vendor.address):
            return Response(
                {
                    "error": "Profile Incomplete! You must complete your Store Profile (trade license, contact info, physical address) in Store Profile Settings before updating stock inventory.",
                    "code": "PROFILE_INCOMPLETE"
                },
                status=status.HTTP_403_FORBIDDEN
            )

        inv_id = pk or request.data.get('inventory_id')
        if not inv_id:
            return Response({"error": "Inventory ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inv = Inventory.objects.get(id=inv_id, vendor=vendor)
        except Inventory.DoesNotExist:
            return Response({"error": "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'stock_qty' in data:
            inv.stock_qty = int(data['stock_qty'])
        if 'reorder_level' in data:
            inv.reorder_level = int(data['reorder_level'])

        available = inv.available_stock
        if available <= 0:
            inv.status = InventoryStatusChoices.OUT_OF_STOCK
        elif available <= inv.reorder_level:
            inv.status = InventoryStatusChoices.LOW_STOCK
        else:
            inv.status = InventoryStatusChoices.IN_STOCK

        inv.save()

        variant = inv.variant
        product = variant.product if variant else None

        return Response({
            "message": "Inventory stock updated successfully.",
            "inventory": {
                "id": inv.id,
                "vendor_id": vendor.id,
                "variant_id": variant.id if variant else None,
                "product_name": product.name if product else "Product",
                "variant_sku": variant.sku if variant else "N/A",
                "variant_name": variant.variant_name if variant else "Default",
                "unit_price": float(variant.price) if variant else 0.0,
                "stock_qty": inv.stock_qty,
                "reserved_qty": inv.reserved_qty,
                "damaged_qty": inv.damaged_qty,
                "available_stock": inv.available_stock,
                "reorder_level": inv.reorder_level,
                "batch_number": getattr(inv, 'batch_number', ''),
                "expiry_date": inv.expiry_date.isoformat() if getattr(inv, 'expiry_date', None) else None,
                "status": inv.status,
                "updated_at": inv.updated_at.isoformat(),
            }
        }, status=status.HTTP_200_OK)
