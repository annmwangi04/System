# File: BRMS/urls.py
from django.contrib import admin
from django.urls import path, include
from .api.urls import brms_router
from accounts.api.urls import accounts_router
from rest_framework.authtoken.views import obtain_auth_token
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/brms/', include(brms_router.urls)),
    path('api/accounts/', include(accounts_router.urls)),
    # Add more URL patterns as needed

    # Add these to your urlpatterns
   path('api/auth/token/', obtain_auth_token, name='api_token_auth'),
   path('api-auth/', include('rest_framework.urls')),  # For browsable API
]

# Add this after urlpatterns
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
