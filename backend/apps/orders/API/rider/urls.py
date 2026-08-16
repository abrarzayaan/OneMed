from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.orders.API.rider.views import RiderOrderViewSet

router = DefaultRouter()
router.register(r"", RiderOrderViewSet, basename="rider-orders")

urlpatterns = [
    path("", include(router.urls)),
]
