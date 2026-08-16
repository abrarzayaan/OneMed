from django.urls import path

from apps.cart.views import (
    CartView,
    AddToCartView,
    CartItemView,
    ClearCartView,
)

urlpatterns = [
    path(
        "",
        CartView.as_view(),
        name="cart",
    ),

    path(
        "items/",
        AddToCartView.as_view(),
        name="add-to-cart",
    ),

    path(
        "items/<int:variant_id>/",
        CartItemView.as_view(),
        name="cart-item",
    ),

    path(
        "clear/",
        ClearCartView.as_view(),
        name="clear-cart",
    ),
]
