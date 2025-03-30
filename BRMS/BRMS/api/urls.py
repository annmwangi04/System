# File: BRMS/api/urls.py (main app)
from rest_framework.routers import DefaultRouter
from accounts.api.views import (
    LandlordViewSet, ApartmentTypeViewSet, HouseTypeViewSet,
    ApartmentViewSet, HouseViewSet, HouseBookingViewSet, InvoiceViewSet,TenantViewSet,ProfileViewSet,UserViewSet
)

# Create BRMS app-specific router
brms_router = DefaultRouter()

# Register BRMS viewsets
brms_router.register(r'users', UserViewSet)
brms_router.register(r'profiles', ProfileViewSet)
brms_router.register(r'tenants',TenantViewSet)
brms_router.register(r'landlords', LandlordViewSet)
brms_router.register(r'apartment-types', ApartmentTypeViewSet)
brms_router.register(r'house-types', HouseTypeViewSet)
brms_router.register(r'apartments', ApartmentViewSet)
brms_router.register(r'houses', HouseViewSet)
brms_router.register(r'bookings', HouseBookingViewSet)
brms_router.register(r'invoices', InvoiceViewSet)

urlpatterns = brms_router.urls