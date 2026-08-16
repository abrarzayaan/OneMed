from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.API.consumer.views import CustomerOrderViewSet

router = DefaultRouter()
router.register(r"", CustomerOrderViewSet, basename="customer-orders")

urlpatterns = [
    path("", include(router.urls)),
]
