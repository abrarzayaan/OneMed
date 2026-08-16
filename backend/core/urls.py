# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.conf.urls.static import static
# pyrefly: ignore [missing-import]
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Apps URLs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/profiles/', include('apps.profiles.urls')),
    path('api/vendor/', include('apps.profiles.urls')), # Direct vendor alias path
    path('api/admin-vendors/', include('apps.profiles.urls')), # Direct admin vendor alias path
    path('api/products/', include('apps.products.urls')),
    path('api/cart/', include('apps.cart.urls')),
    path("api/coupons/", include("apps.coupons.urls")),
    path("api/checkout/", include("apps.checkout.urls")),
    path("api/", include("apps.orders.urls")),
    
    # Swagger API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)