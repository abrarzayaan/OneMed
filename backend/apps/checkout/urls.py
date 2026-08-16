from django.urls import path

from apps.checkout.views import CheckoutAPIView, DirectCheckoutAPIView

urlpatterns = [
    path(
        "",
        CheckoutAPIView.as_view(),
        name="checkout",
    ),
    path(
        "variants/<int:variant_id>/",
        DirectCheckoutAPIView.as_view(),
        name="direct-checkout",
    ),
]
