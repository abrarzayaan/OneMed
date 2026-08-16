# pyrefly: ignore [missing-import]
from django.urls import path, include

urlpatterns = [
    path("orders/rider/", include("apps.orders.API.rider.urls")),
    path("rider/orders/", include("apps.orders.API.rider.urls")),
    path("orders/", include("apps.orders.API.consumer.urls")),
    path("admin/orders/", include("apps.orders.API.admin.urls")),
]
