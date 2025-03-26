from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ProfileViewSet, LandlordViewSet, TenantViewSet,
    ApartmentTypeViewSet, HouseTypeViewSet, ApartmentViewSet,
    HouseViewSet, HouseBookingViewSet, InvoiceViewSet
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'landlords', LandlordViewSet)
router.register(r'tenants', TenantViewSet)
router.register(r'apartment-types', ApartmentTypeViewSet)
router.register(r'house-types', HouseTypeViewSet)
router.register(r'apartments', ApartmentViewSet)
router.register(r'houses', HouseViewSet)
router.register(r'bookings', HouseBookingViewSet)
router.register(r'invoices', InvoiceViewSet)

# The API URLs are determined automatically by the router
urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
    
    # Include login URLs for browsable API
    path('api-auth/', include('rest_framework.urls')),
]