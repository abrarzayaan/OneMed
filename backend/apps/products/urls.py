from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.products import views

# DRF Router ইনিশিয়ালাইজেশন
router = DefaultRouter()

# সব ভিউসেটকে রাউটারে রেজিস্টার করা হচ্ছে
router.register(r'brands', views.BrandViewSet, basename='brand')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'variants', views.ProductVariantViewSet, basename='variant')
router.register(r'images', views.ProductImageViewSet, basename='image')
router.register(r'attributes', views.ProductAttributeViewSet, basename='attribute')
router.register(r'attribute-values', views.ProductAttributeValueViewSet, basename='attribute-value')
router.register(r'inventories', views.InventoryViewSet, basename='inventory')

from apps.products.views.category_product_varient import (
    ProductVariantListAPIView,
    SubCategoryListAPIView,
)
from apps.products.views.cms_views import (
    CmsHeroSlideListCreateView,
    CmsHeroSlideDetailView,
    CmsAnnouncementBarView,
)

# ইউআরএল প্যাটার্নস
urlpatterns = [
    path('cms/hero-slides/', CmsHeroSlideListCreateView.as_view(), name='cms-hero-slides-list'),
    path('cms/hero-slides/<int:pk>/', CmsHeroSlideDetailView.as_view(), name='cms-hero-slide-detail'),
    path('cms/announcement-bar/', CmsAnnouncementBarView.as_view(), name='cms-announcement-bar'),
    path('', include(router.urls)),
    path(
        "categories/<int:category_id>/subcategories/",
        SubCategoryListAPIView.as_view(),
        name="category-subcategories",
    ),

    path(
        "subcategories/<int:subcategory_id>/variants/",
        ProductVariantListAPIView.as_view(),
        name="subcategory-product-variants",
    ),
]