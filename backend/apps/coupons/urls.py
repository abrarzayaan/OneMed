from django.urls import path

from apps.coupons.views import (
    CouponListCreateAPIView,
    CouponRetrieveUpdateDeleteAPIView,
)

urlpatterns = [
    path(
        "",
        CouponListCreateAPIView.as_view(),
        name="coupon-list-create",
    ),
    path(
        "<int:pk>/",
        CouponRetrieveUpdateDeleteAPIView.as_view(),
        name="coupon-detail",
    ),
]