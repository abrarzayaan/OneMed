# pyrefly: ignore [missing-import]
from django.db import models
from rest_framework import generics, permissions
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.products.models import Category, ProductVariant
from apps.products.serializers.category_product_varient import (
    SubCategorySerializer,
    ProductVariantListSerializer,
)
# pyrefly: ignore [missing-import]
from rest_framework.pagination import PageNumberPagination
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10                  # ডিফল্ট প্রোডাক্ট সংখ্যা
    page_size_query_param = 'page_size' # ফ্রন্টএন্ড চাইলে ?page_size=20 দিয়ে কাস্টমাইজ করতে পারবে
    max_page_size = 100



class SubCategoryListAPIView(generics.ListAPIView):
    """
    List all active sub-categories under a main category.
    """

    serializer_class = SubCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        category_id = self.kwargs.get("category_id")

        return (
            Category.objects.filter(
                parent_id=category_id,
                status="active",
            )
            .order_by("sort_order", "name")
        )


class ProductVariantListAPIView(generics.ListAPIView):
    """
    List all active product variants under a specific category or sub-category branch.
    """

    serializer_class = ProductVariantListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        subcategory_id = self.kwargs.get("subcategory_id")

        # Category standard matching: matches current category OR any sub-categories under it
        cat_ids = list(
            Category.objects.filter(
                models.Q(id=subcategory_id) | models.Q(parent_id=subcategory_id)
            ).values_list("id", flat=True)
        )

        return (
            ProductVariant.objects.select_related(
                "product",
                "product__category",
                "product__brand",
            )
            .prefetch_related("images")
            .filter(
                product__category_id__in=cat_ids,
                product__deleted_at__isnull=True,
                status="active",
            )
            .exclude(product__status="inactive")
            .order_by("price")
        )