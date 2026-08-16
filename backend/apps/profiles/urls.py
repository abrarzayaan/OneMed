# pyrefly: ignore [missing-import]
from django.urls import path
from apps.profiles.views import (
    ConsumerProfileUpdateView,
    VendorProfileUpdateView,
    RiderProfileUpdateView,
    RiderAvailabilityView,
    UserAddressListCreateView,
    UserAddressDetailView,
)
from apps.profiles.vendor_views import (
    VendorRegisterView,
    VendorProfileMeView,
    VendorAnalyticsSummaryView,
    VendorDispatchedItemsView,
    VendorProductVariantsView,
    VendorInventoryView,
)
from apps.profiles.admin_views import (
    AdminVendorListView,
    AdminVendorDetailView,
    AdminRiderListView,
    AdminRiderDetailView,
)

urlpatterns = [
    # Consumer & Rider Profile updates
    path('consumer/update/', ConsumerProfileUpdateView.as_view(), name='consumer_profile_update'),
    path('vendor/update/', VendorProfileUpdateView.as_view(), name='vendor_profile_update'),
    path('rider/update/', RiderProfileUpdateView.as_view(), name='rider_profile_update'),
    path('rider/profile/', RiderProfileUpdateView.as_view(), name='rider_profile_me'),
    path('rider/me/', RiderProfileUpdateView.as_view(), name='rider_me'),
    path('rider/availability/', RiderAvailabilityView.as_view(), name='rider_availability'),

    # Vendor Portal Dedicated API Endpoints (For /api/profiles/vendor/...)
    path('vendor/register/', VendorRegisterView.as_view(), name='vendor_register'),
    path('vendor/me/', VendorProfileMeView.as_view(), name='vendor_me'),
    path('vendor/profile/', VendorProfileMeView.as_view(), name='vendor_profile_me'),
    path('vendor/analytics/summary/', VendorAnalyticsSummaryView.as_view(), name='vendor_analytics_summary'),
    path('vendor/dispatches/', VendorDispatchedItemsView.as_view(), name='vendor_dispatches'),
    path('vendor/variants/', VendorProductVariantsView.as_view(), name='vendor_variants'),
    path('vendor/inventory/', VendorInventoryView.as_view(), name='vendor_inventory_list'),
    path('vendor/inventory/<int:pk>/', VendorInventoryView.as_view(), name='vendor_inventory_detail'),

    # Vendor Direct API Endpoints (For /api/vendor/...)
    path('register/', VendorRegisterView.as_view(), name='vendor_direct_register'),
    path('me/', VendorProfileMeView.as_view(), name='vendor_direct_me'),
    path('profile/', VendorProfileMeView.as_view(), name='vendor_direct_profile'),
    path('analytics/summary/', VendorAnalyticsSummaryView.as_view(), name='vendor_direct_analytics_summary'),
    path('dispatches/', VendorDispatchedItemsView.as_view(), name='vendor_direct_dispatches'),
    path('variants/', VendorProductVariantsView.as_view(), name='vendor_direct_variants'),
    path('inventory/', VendorInventoryView.as_view(), name='vendor_direct_inventory_list'),
    path('inventory/<int:pk>/', VendorInventoryView.as_view(), name='vendor_direct_inventory_detail'),

    # Admin Vendor Verification & Management Endpoints (Supports all path prefixes)
    path('admin/vendors/', AdminVendorListView.as_view(), name='admin_vendor_list'),
    path('admin/vendors/<int:pk>/', AdminVendorDetailView.as_view(), name='admin_vendor_detail'),
    path('admin-vendors/', AdminVendorListView.as_view(), name='admin_vendors_alias'),
    path('admin-vendors/<int:pk>/', AdminVendorDetailView.as_view(), name='admin_vendors_alias_detail'),

    # Admin Rider Verification & Management Endpoints
    path('admin/riders/', AdminRiderListView.as_view(), name='admin_rider_list'),
    path('admin/riders/<int:pk>/', AdminRiderDetailView.as_view(), name='admin_rider_detail'),
    path('admin-riders/', AdminRiderListView.as_view(), name='admin_riders_alias'),
    path('admin-riders/<int:pk>/', AdminRiderDetailView.as_view(), name='admin_riders_alias_detail'),

    # Address Management
    path('addresses/', UserAddressListCreateView.as_view(), name='user_address_list_create'),
    path('addresses/<int:id>/', UserAddressDetailView.as_view(), name='user_address_detail'),
]