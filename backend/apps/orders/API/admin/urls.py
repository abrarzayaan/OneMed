from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.API.admin.views import AdminOrderViewSet, AdminVendorListView, AdminRiderListView
from apps.orders.API.admin.analytics_views import AdminAnalyticsOverviewView
from apps.orders.API.admin.explorer_views import AdminModelExplorerMetadataView, AdminModelExplorerDataView
from apps.orders.API.admin.rx_views import AdminPrescriptionQueueView, AdminPrescriptionVerifyView
from apps.orders.API.admin.settlement_views import (
    AdminVendorSettlementsListView,
    AdminPayoutRequestsListCreateView,
    AdminPayoutApproveView,
    AdminPayoutRejectView,
)
from apps.orders.API.admin.logistics_views import AdminRiderFleetListCreateView, AdminRiderFleetDetailView

router = DefaultRouter()
router.register(r"", AdminOrderViewSet, basename="admin-orders")

urlpatterns = [
    # General Vendor & Rider lists
    path("vendors/", AdminVendorListView.as_view(), name="admin-vendors"),
    path("riders/", AdminRiderListView.as_view(), name="admin-riders"),

    # Analytics Overview (Section 04)
    path("analytics/overview/", AdminAnalyticsOverviewView.as_view(), name="admin-analytics-overview"),

    # Generic Model Explorer (Section 07)
    path("explorer/models/", AdminModelExplorerMetadataView.as_view(), name="admin-explorer-metadata"),
    path("explorer/<str:app_label>/<str:model_name>/", AdminModelExplorerDataView.as_view(), name="admin-explorer-data"),

    # Prescription Queue (Section 08)
    path("prescriptions/", AdminPrescriptionQueueView.as_view(), name="admin-prescriptions-queue"),
    path("prescriptions/<int:pk>/verify/", AdminPrescriptionVerifyView.as_view(), name="admin-prescriptions-verify"),

    # Vendor Settlement & Payouts (Section 10)
    path("vendor-settlements/", AdminVendorSettlementsListView.as_view(), name="admin-vendor-settlements"),
    path("payout-requests/", AdminPayoutRequestsListCreateView.as_view(), name="admin-payout-requests"),
    path("payout-requests/<int:pk>/approve/", AdminPayoutApproveView.as_view(), name="admin-payout-requests-approve"),
    path("payout-requests/<int:pk>/reject/", AdminPayoutRejectView.as_view(), name="admin-payout-requests-reject"),

    # Logistics Fleet (Section 11)
    path("riders/fleet/", AdminRiderFleetListCreateView.as_view(), name="admin-riders-fleet"),
    path("riders/fleet/<int:pk>/", AdminRiderFleetDetailView.as_view(), name="admin-riders-fleet-detail"),

    path("", include(router.urls)),
]
