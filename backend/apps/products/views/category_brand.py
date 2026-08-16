# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions
# pyrefly: ignore [missing-import]
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from apps.products.models import Category, Brand
from apps.products.serializers import CategorySerializer, BrandSerializer
# pyrefly: ignore [missing-import]
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000


class BrandViewSet(viewsets.ModelViewSet):
    """
    Brand CRUD Endpoint.
    - Anyone can Read (GET) brands.
    - Authenticated users/admins can Create, Update, Delete (Write ops).
    """
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Category CRUD Endpoint.
    - Multi-level hierarchy support.
    - Public read, Authenticated write.
    """
    queryset = Category.objects.all().prefetch_related('children')
    serializer_class = CategorySerializer
    pagination_class = StandardResultsSetPagination
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'sort_order', 'parent']
    search_fields = ['name']
    ordering_fields = ['sort_order', 'name']

    def get_queryset(self):
        qs = Category.objects.all().prefetch_related('children')
        top_level = self.request.query_params.get('top_level')
        if top_level and top_level.lower() == 'true':
            qs = qs.filter(parent__isnull=True)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]