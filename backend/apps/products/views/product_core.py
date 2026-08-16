# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions
# pyrefly: ignore [missing-import]
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
# pyrefly: ignore [missing-import]
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

class ProductViewSet(viewsets.ModelViewSet):
    """
    Product CRUD Endpoint.
    - Anyone can see Active/Approved products.
    - Vendors can only manage (Update/Delete) their OWN products.
    """
    serializer_class = ProductSerializer
    pagination_class = StandardResultsSetPagination # <--- এই লাইনটি যুক্ত করে দিতে পারেন
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'brand', 'product_type', 'status', 'approval_status']
    search_fields = ['name', 'sku', 'barcode']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.is_superuser):
            return Product.objects.all()
        elif user.is_authenticated and hasattr(user, 'vendor_profile'): 
            return Product.objects.filter(vendor__user=user, deleted_at__isnull=True)
        return Product.objects.all()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_destroy(self, instance):
        # ডাটাবেস থেকে পার্মানেন্টলি ডিলিট না করে সফট ডিলিট করা
        instance.soft_delete()