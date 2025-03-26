# File: accounts/api/urls.py
from rest_framework.routers import DefaultRouter
from accounts.views import (
    UserViewSet, ProfileViewSet, TenantViewSet
)

# Create accounts app-specific router
accounts_router = DefaultRouter()

# Register accounts viewsets
accounts_router.register(r'users', UserViewSet)
accounts_router.register(r'profiles', ProfileViewSet)
accounts_router.register(r'tenants', TenantViewSet)

# ------------------------------------------------------

# File: BRMS/api/urls.py (main app)
from rest_framework.routers import DefaultRouter
from ..views import (
    LandlordViewSet, ApartmentTypeViewSet, HouseTypeViewSet, 
    ApartmentViewSet, HouseViewSet, HouseBookingViewSet, InvoiceViewSet
)

# Create BRMS app-specific router
brms_router = DefaultRouter()

# Register BRMS viewsets
brms_router.register(r'landlords', LandlordViewSet)
brms_router.register(r'apartment-types', ApartmentTypeViewSet)
brms_router.register(r'house-types', HouseTypeViewSet)
brms_router.register(r'apartments', ApartmentViewSet)
brms_router.register(r'houses', HouseViewSet)
brms_router.register(r'bookings', HouseBookingViewSet)
brms_router.register(r'invoices', InvoiceViewSet)

# ------------------------------------------------------

# File: BRMS/urls.py (main project URLs file)
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from accounts.api.urls import accounts_router
from BRMS.api.urls import brms_router

# Create main router that combines all app routers
router = DefaultRouter()

# Extend the main router with app-specific routers
router.registry.extend(accounts_router.registry)
router.registry.extend(brms_router.registry)

urlpatterns = [
    path('admin/', admin.site.urls),
    # API endpoints
    path('api/', include(router.urls)),
    # DRF auth
    path('api/auth/', include('rest_framework.urls')),
    # Other URL patterns...
]