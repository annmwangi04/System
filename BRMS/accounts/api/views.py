from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.viewsets import ModelViewSet
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser

from ..models import (
    Profile, Landlord, Tenant, ApartmentType, Apartment,
    HouseType, House, HouseBooking, Invoice, Payment, Role
)
from .serializers import (
    UserSerializer, ProfileSerializer, RoleSerializer, LandlordSerializer, TenantSerializer,
    ApartmentTypeSerializer, HouseTypeSerializer, ApartmentSerializer,
    HouseSerializer, HouseBookingSerializer, InvoiceSerializer, PaymentSerializer,CustomAuthTokenSerializer
)

# Custom Permissions
class IsAdminUser(BasePermission):
    """
    Permission to only allow admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff

class IsOwnerOrAdmin(BasePermission):
    """
    Permission to only allow owners of an object or admin users
    """
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff:
            return True
            
        # Check if the object has a user field directly
        if hasattr(obj, 'user'):
            return obj.user == request.user
            
        # For Profile objects
        if isinstance(obj, Profile):
            return obj.user == request.user
            
        return False

class IsLandlordOrAdmin(BasePermission):
    """
    Permission to only allow landlords or admin users
    """
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        try:
            return request.user.role.role_type == 'landlord'
        except:
            return False

class IsTenantOrAdmin(BasePermission):
    """
    Permission to only allow tenants or admin users
    """
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        try:
            return request.user.role.role_type == 'tenant'
        except:
            return False

# Error response helper
def error_response(message, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({"error": message}, status=status_code)

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Register a new user with basic information
    """
    serializer = UserSerializer(data=request.data)
    
    try:
        if serializer.is_valid():
            user = serializer.save()
            
            # Create token for the new user
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                "user": UserSerializer(user).data,
                "token": token.key
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return error_response(f"Registration failed: {str(e)}")

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    Login a user and return auth token
    """
    username = request.data.get('username', '')
    password = request.data.get('password', '')
    
    if not username or not password:
        return error_response("Username and password are required", status.HTTP_400_BAD_REQUEST)
    
    try:
        user = authenticate(username=username, password=password)
        
        if not user:
            return error_response("Invalid credentials", status.HTTP_401_UNAUTHORIZED)
        
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user's role
        try:
            role = user.role.role_type
        except:
            role = 'unknown'
            
        # Get user's profile data
        try:
            profile = ProfileSerializer(user.profile).data
        except:
            profile = None
            
        return Response({
            "token": token.key,
            "user": UserSerializer(user).data,
            "role": role,
            "profile": profile
        })
    except Exception as e:
        return error_response(f"Login failed: {str(e)}")

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """
    Logout a user by deleting their token
    """
    try:
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception as e:
        return error_response(f"Logout failed: {str(e)}")

# User and Profile ViewSets
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsOwnerOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Admin can see all users, other users only see themselves
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def perform_update(self, serializer):
        # Handle password changes
        password = self.request.data.get('password')
        if password:
            instance = serializer.save()
            instance.set_password(password)
            instance.save()
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the currently authenticated user
        """
        try:
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving user data: {str(e)}")

class ProfileViewSet(ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        # Admin can see all profiles, other users only see their own
        if self.request.user.is_staff:
            return Profile.objects.all()
        return Profile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # This method automatically associates the new profile with the current user
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """
        Get the authenticated user's profile
        """
        try:
            profile = get_object_or_404(Profile, user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving profile: {str(e)}")
    
    @action(detail=False, methods=['put', 'patch'], parser_classes=[MultiPartParser, FormParser])
    def update_my_profile(self, request):
        """
        Update authenticated user's profile
        """
        try:
            profile = get_object_or_404(Profile, user=request.user)
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return error_response(f"Profile update failed: {str(e)}")

class RoleViewSet(ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]  # Only admins can modify roles
    
    def get_queryset(self):
        # Admin can see all roles, other users only see their own
        if self.request.user.is_staff:
            return Role.objects.all()
        return Role.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_role(self, request):
        """
        Get the authenticated user's role
        """
        try:
            role = get_object_or_404(Role, user=request.user)
            serializer = self.get_serializer(role)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving role: {str(e)}")

# Landlord ViewSet
class LandlordViewSet(ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'middle_name', 'email', 'phone_number']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Admin can see all landlords, landlords see themselves, tenants see connected landlords
        if self.request.user.is_staff:
            return Landlord.objects.all()
            
        try:
            if hasattr(self.request.user, 'landlord_profile'):
                return Landlord.objects.filter(id=self.request.user.landlord_profile.id)
            elif hasattr(self.request.user, 'tenant_profile'):
                # Get landlords connected to tenant's apartments
                tenant_houses = House.objects.filter(tenant=self.request.user.tenant_profile)
                landlord_ids = set()
                for house in tenant_houses:
                    landlord_ids.add(house.apartment.owner.id)
                return Landlord.objects.filter(id__in=landlord_ids)
        except:
            pass
            
        return Landlord.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_landlord_profile(self, request):
        """
        Get the authenticated user's landlord profile if exists
        """
        try:
            if hasattr(request.user, 'landlord_profile'):
                serializer = self.get_serializer(request.user.landlord_profile)
                return Response(serializer.data)
            return error_response("No landlord profile found", status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return error_response(f"Error retrieving landlord profile: {str(e)}")

# Tenant ViewSet
class TenantViewSet(ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]  # Anyone authenticated can create a tenant profile
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsTenantOrAdmin()]  # Only tenants or admins can modify
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Admin can see all tenants, tenants see themselves, landlords see connected tenants
        if self.request.user.is_staff:
            return Tenant.objects.all()
            
        try:
            if hasattr(self.request.user, 'tenant_profile'):
                return Tenant.objects.filter(id=self.request.user.tenant_profile.id)
            elif hasattr(self.request.user, 'landlord_profile'):
                # Get tenants connected to landlord's apartments
                landlord_apts = Apartment.objects.filter(owner=self.request.user.landlord_profile)
                tenant_ids = set()
                for apt in landlord_apts:
                    for house in apt.houses.all():
                        if house.tenant:
                            tenant_ids.add(house.tenant.id)
                return Tenant.objects.filter(id__in=tenant_ids)
        except:
            pass
            
        return Tenant.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a tenant profile, associating with current user if not specified
        """
        try:
            serializer = self.get_serializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                tenant = serializer.save()
                
                # Update user role if this is a new tenant profile
                if tenant.user and tenant.user == request.user:
                    try:
                        role = Role.objects.get(user=request.user)
                        role.role_type = 'tenant'
                        role.save()
                    except Role.DoesNotExist:
                        Role.objects.create(user=request.user, role_type='tenant')
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return error_response(f"Error creating tenant profile: {str(e)}")
    
    @action(detail=False, methods=['get'])
    def my_tenant_profile(self, request):
        """
        Get the authenticated user's tenant profile if exists
        """
        try:
            if hasattr(request.user, 'tenant_profile'):
                serializer = self.get_serializer(request.user.tenant_profile)
                return Response(serializer.data)
            return error_response("No tenant profile found", status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return error_response(f"Error retrieving tenant profile: {str(e)}")

# ApartmentType ViewSet
class ApartmentTypeViewSet(ModelViewSet):
    queryset = ApartmentType.objects.all()
    serializer_class = ApartmentTypeSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]
        return [IsAuthenticated()]

# HouseType ViewSet
class HouseTypeViewSet(ModelViewSet):
    queryset = HouseType.objects.all()
    serializer_class = HouseTypeSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]
        return [IsAuthenticated()]

# Apartment ViewSet
class ApartmentViewSet(ModelViewSet):
    queryset = Apartment.objects.all()
    serializer_class = ApartmentSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location', 'description']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Filter apartments based on user role
        queryset = Apartment.objects.all()
        
        # Admin sees all apartments
        if self.request.user.is_staff:
            return queryset
        
        # Landlord sees only their apartments
        try:
            if hasattr(self.request.user, 'landlord_profile'):
                return queryset.filter(owner=self.request.user.landlord_profile)
        except:
            pass
        
        # Everyone else sees all apartments (for browsing)
        return queryset
    
    @action(detail=True, methods=['get'])
    def houses(self, request, pk=None):
        """
        Get all houses for a specific apartment
        """
        try:
            apartment = self.get_object()
            houses = House.objects.filter(apartment=apartment)
            
            # For tenants, only show vacant houses or their own
            if hasattr(request.user, 'tenant_profile') and not request.user.is_staff:
                tenant = request.user.tenant_profile
                houses = houses.filter(status='vacant') | houses.filter(tenant=tenant)
            
            serializer = HouseSerializer(houses, many=True)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving houses: {str(e)}")

# House ViewSet
class HouseViewSet(ModelViewSet):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['number', 'description', 'apartment__name', 'apartment__location']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Filter houses based on user role
        queryset = House.objects.all()
        
        # Admin sees all houses
        if self.request.user.is_staff:
            return queryset
        
        # Landlord sees houses in their apartments
        try:
            if hasattr(self.request.user, 'landlord_profile'):
                landlord_apartments = Apartment.objects.filter(owner=self.request.user.landlord_profile)
                return queryset.filter(apartment__in=landlord_apartments)
            # Tenant sees vacant houses and their own
            elif hasattr(self.request.user, 'tenant_profile'):
                tenant = self.request.user.tenant_profile
                return queryset.filter(status='vacant') | queryset.filter(tenant=tenant)
        except:
            pass
        
        # Default to showing only vacant houses
        return queryset.filter(status='vacant')
    
    @action(detail=False, methods=['get'])
    def vacant(self, request):
        """
        Get all vacant houses
        """
        try:
            houses = House.objects.filter(status='vacant')
            serializer = self.get_serializer(houses, many=True)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving vacant houses: {str(e)}")
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def assign_tenant(self, request, pk=None):
        """
        Assign a tenant to a house
        """
        try:
            house = self.get_object()
            tenant_id = request.data.get('tenant_id')
            
            if not tenant_id:
                return error_response("Tenant ID is required")
            
            tenant = get_object_or_404(Tenant, id=tenant_id)
            
            # Validate house is vacant
            if house.status != 'vacant':
                return error_response("House is not vacant")
            
            # Assign tenant and update status
            house.tenant = tenant
            house.status = 'occupied'
            house.save()
            
            serializer = self.get_serializer(house)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error assigning tenant: {str(e)}")
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def vacate_house(self, request, pk=None):
        """
        Remove tenant from a house
        """
        try:
            house = self.get_object()
            
            # Only allow if house is occupied
            if house.status != 'occupied':
                return error_response("House is not currently occupied")
            
            # Permission check
            if not request.user.is_staff and not (
                hasattr(request.user, 'landlord_profile') and 
                house.apartment.owner == request.user.landlord_profile
            ):
                return error_response("Permission denied", status.HTTP_403_FORBIDDEN)
            
            # Clear tenant and update status
            house.tenant = None
            house.status = 'vacant'
            house.save()
            
            serializer = self.get_serializer(house)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error vacating house: {str(e)}")

# HouseBooking ViewSet
class HouseBookingViewSet(ModelViewSet):
    queryset = HouseBooking.objects.all()
    serializer_class = HouseBookingSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsTenantOrAdmin()]  # Only tenants or admins can create bookings
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]  # Only landlords or admins can update/delete
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Filter bookings based on user role
        queryset = HouseBooking.objects.all()
        
        # Admin sees all bookings
        if self.request.user.is_staff:
            return queryset
        
        try:
            # Landlord sees bookings for their apartments
            if hasattr(self.request.user, 'landlord_profile'):
                landlord_apartments = Apartment.objects.filter(owner=self.request.user.landlord_profile)
                landlord_houses = House.objects.filter(apartment__in=landlord_apartments)
                return queryset.filter(house__in=landlord_houses)
            # Tenant sees only their bookings
            elif hasattr(self.request.user, 'tenant_profile'):
                return queryset.filter(tenant=self.request.user.tenant_profile)
        except:
            pass
            
        return HouseBooking.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new house booking
        """
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                # Check if house is available
                house = serializer.validated_data['house']
                if house.status != 'vacant':
                    return error_response("House is not available for booking")
                
                # Automatically set tenant to current user's tenant profile if not specified
                if 'tenant' not in serializer.validated_data and hasattr(request.user, 'tenant_profile'):
                    serializer.validated_data['tenant'] = request.user.tenant_profile
                
                booking = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return error_response(f"Error creating booking: {str(e)}")
    
    @action(detail=True, methods=['patch'])
    @transaction.atomic
    def update_status(self, request, pk=None):
        """
        Update the status of a booking
        """
        try:
            booking = self.get_object()
            status_value = request.data.get('status')
            
            if not status_value:
                return error_response("Status is required")
                
            if status_value not in dict(HouseBooking.STATUS_CHOICES):
                return error_response("Invalid status value")
            
            # If approving booking, check if house is still available
            if status_value == 'approved' and booking.house.status != 'vacant':
                return error_response("House is no longer available")
            
            # Update booking status
            booking.status = status_value
            booking.save()
            
            # If approved, update the house
            if status_value == 'approved':
                house = booking.house
                house.tenant = booking.tenant
                house.save()
            
            serializer = self.get_serializer(booking)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error updating booking status: {str(e)}")

# Invoice ViewSet
class InvoiceViewSet(ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['tenant__user__username', 'tenant__first_name', 'tenant__last_name', 'house__number']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Filter invoices based on user role
        queryset = Invoice.objects.all()
        
        # Admin sees all invoices
        if self.request.user.is_staff:
            return queryset
        
        try:
            # Landlord sees invoices for their apartments
            if hasattr(self.request.user, 'landlord_profile'):
                landlord_apartments = Apartment.objects.filter(owner=self.request.user.landlord_profile)
                landlord_houses = House.objects.filter(apartment__in=landlord_apartments)
                return queryset.filter(house__in=landlord_houses)
            # Tenant sees only their invoices
            elif hasattr(self.request.user, 'tenant_profile'):
                return queryset.filter(tenant=self.request.user.tenant_profile)
        except:
            pass
            
        return Invoice.objects.none()
    
    @action(detail=False, methods=['get'])
    def my_invoices(self, request):
        """
        Get invoices for the authenticated tenant
        """
        try:
            if not hasattr(request.user, 'tenant_profile'):
                return error_response("No tenant profile found", status.HTTP_404_NOT_FOUND)
                
            invoices = Invoice.objects.filter(tenant=request.user.tenant_profile)
            serializer = self.get_serializer(invoices, many=True)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving invoices: {str(e)}")
    
    @action(detail=False, methods=['get'])
    def unpaid(self, request):
        """
        Get unpaid invoices
        """
        try:
            # Filter for unpaid and overdue invoices
            invoices = self.get_queryset().filter(payment_status__in=['unpaid', 'overdue'])
            serializer = self.get_serializer(invoices, many=True)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving unpaid invoices: {str(e)}")

# Payment ViewSet
class PaymentViewSet(ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]  # Allow tenant to create payments
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsLandlordOrAdmin()]  # Only landlords or admins can modify
        return [IsAuthenticated()]
    
    def get_queryset(self):
        # Filter payments based on user role
        queryset = Payment.objects.all()
        
        # Admin sees all payments
        if self.request.user.is_staff:
            return queryset
        
        try:
            # Landlord sees payments for their apartments
            if hasattr(self.request.user, 'landlord_profile'):
                landlord_apartments = Apartment.objects.filter(owner=self.request.user.landlord_profile)
                landlord_houses = House.objects.filter(apartment__in=landlord_apartments)
                return queryset.filter(invoice__house__in=landlord_houses)
            # Tenant sees only their payments
            elif hasattr(self.request.user, 'tenant_profile'):
                return queryset.filter(invoice__tenant=self.request.user.tenant_profile)
        except:
            pass
            
        return Payment.objects.none()
    
    def create(self, request, *args, **kwargs):
        """
        Create a new payment
        """
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                # Validate invoice exists and belongs to tenant
                invoice = serializer.validated_data['invoice']
                
                # If tenant, ensure invoice belongs to them
                if hasattr(request.user, 'tenant_profile') and invoice.tenant != request.user.tenant_profile:
                    return error_response("Invalid invoice", status.HTTP_403_FORBIDDEN)
                
                # Create payment
                payment = serializer.save()
                
                # Payment creation also updates invoice amounts
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return error_response(f"Error creating payment: {str(e)}")
    
    @action(detail=False, methods=['get'])
    def my_payments(self, request):
        """
        Get payments for the authenticated tenant
        """
        try:
            if not hasattr(request.user, 'tenant_profile'):
                return error_response("No tenant profile found", status.HTTP_404_NOT_FOUND)
                
            payments = Payment.objects.filter(invoice__tenant=request.user.tenant_profile)
            serializer = self.get_serializer(payments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return error_response(f"Error retrieving payments: {str(e)}")
        

class CustomAuthToken(ObtainAuthToken):
    serializer_class = CustomAuthTokenSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Get user role
        try:
            role_obj = Role.objects.get(user=user)
            role = role_obj.role_type
        except Role.DoesNotExist:
            role = 'tenant'  # Default role if not found
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.pk,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role
            }
        })        

