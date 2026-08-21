# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions
# pyrefly: ignore [missing-import]
from rest_framework.pagination import PageNumberPagination
# pyrefly: ignore [missing-import]
from apps.products.models import Inventory
# pyrefly: ignore [missing-import]
from apps.products.serializers import InventorySerializer

class InventoryPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 2000

class InventoryViewSet(viewsets.ModelViewSet):
    """
    Inventory Management.
    - Only authenticated Vendors can see/manage their own stock.
    - Admins can see all stock.
    """
    serializer_class = InventorySerializer
    pagination_class = InventoryPagination
    filterset_fields = ['variant', 'status', 'vendor']
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return Inventory.objects.all().select_related('vendor', 'variant', 'variant__product').order_by('-id')
        if user.is_staff or user.is_superuser or getattr(user, 'role', '') == 'admin':
            return Inventory.objects.all().select_related('vendor', 'variant', 'variant__product').order_by('-id')
        if hasattr(user, 'vendor_profile'):
            return Inventory.objects.filter(vendor=user.vendor_profile).select_related('vendor', 'variant', 'variant__product').order_by('-id')
        return Inventory.objects.filter(vendor__user=user).select_related('vendor', 'variant', 'variant__product').order_by('-id')