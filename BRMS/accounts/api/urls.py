# File: accounts/api/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path
from ..api.views import UserViewSet,ProfileViewSet,TenantViewSet,RoleViewSet,LandlordViewSet

# Create accounts app-specific router
accounts_router = DefaultRouter()

# Register accounts viewsets
accounts_router.register(r'users', UserViewSet)
accounts_router.register(r'profiles', ProfileViewSet)
accounts_router.register(r'tenants', TenantViewSet)
accounts_router.register(r'roles', RoleViewSet)  # Add this line
accounts_router.register(r'landlords', LandlordViewSet)  #

# No authentication endpoints here - we'll centralize in the main urls.py
urlpatterns = accounts_router.urls