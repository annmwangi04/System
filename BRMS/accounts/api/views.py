from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from rest_framework.authentication import (
    SessionAuthentication, 
    TokenAuthentication, 
    BasicAuthentication
)
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth.hashers import make_password

from .serializers import (
    UserSerializer, ProfileSerializer, LandlordSerializer, TenantSerializer,
    ApartmentTypeSerializer, HouseTypeSerializer, ApartmentSerializer,
    HouseSerializer, HouseBookingSerializer, InvoiceSerializer
)
from ..models import (
    Profile, Landlord, Tenant, ApartmentType, Apartment,
    HouseType, House, HouseBooking, Invoice
)

class FlexiblePermission(BasePermission):
    """
    Custom permission class with role-based access controls
    """
    def has_permission(self, request, view):
        # Allow any method for staff users (admins)
        if request.user and request.user.is_staff:
            return True
        
        # Allow these actions without authentication
        if view.action in ['create', 'assign_role']:
            return True
        
        # Allow authenticated users to access safe methods
        if request.user and request.user.is_authenticated:
            return True if request.method in SAFE_METHODS else self.check_role_permission(request, view)
        
        return False
    
    def check_role_permission(self, request, view):
        """Check permissions based on user role"""
        try:
            # Check if user is landlord
            if hasattr(request.user, 'landlord'):
                # Landlords can only modify their own properties
                if view.__class__.__name__ in ['ApartmentViewSet', 'HouseViewSet']:
                    return True
                # Landlords can generate invoices for their properties
                if view.__class__.__name__ == 'InvoiceViewSet':
                    return True
                return False
            
            # Check if user is tenant
            if hasattr(request.user, 'tenant'):
                # Tenants can only book houses and manage their own bookings
                if view.__class__.__name__ == 'HouseBookingViewSet':
                    return True
                return False
                
            return False
        except:
            return False

    def has_object_permission(self, request, view, obj):
        # Staff always has full access
        if request.user and request.user.is_staff:
            return True
        
        # Allow these actions without authentication
        if view.action in ['assign_role']:
            return True
        
        # Allow safe methods for authenticated users
        if request.method in SAFE_METHODS and request.user and request.user.is_authenticated:
            return True
        
        # For write operations, check role-specific permissions
        try:
            # Landlord permissions
            if hasattr(request.user, 'landlord'):
                landlord = request.user.landlord
                
                # Allow landlords to manage their own profile
                if isinstance(obj, Landlord) and obj.user == request.user:
                    return True
                
                # Allow landlords to manage their own apartments
                if isinstance(obj, Apartment) and obj.owner == landlord:
                    return True
                
                # Allow landlords to manage houses in their apartments
                if isinstance(obj, House) and obj.apartment.owner == landlord:
                    return True
                
                # Allow landlords to manage invoices for their houses
                if isinstance(obj, Invoice) and obj.house.apartment.owner == landlord:
                    return True
                
                return False
            
            # Tenant permissions
            if hasattr(request.user, 'tenant'):
                tenant = request.user.tenant
                
                # Allow tenants to manage their own profile
                if isinstance(obj, Tenant) and obj.user == request.user:
                    return True
                
                # Allow tenants to manage their own bookings
                if isinstance(obj, HouseBooking) and obj.tenant == tenant:
                    return True
                
                # Allow tenants to view their own invoices (but not edit)
                if isinstance(obj, Invoice) and obj.tenant == tenant and request.method in SAFE_METHODS:
                    return True
                
                return False
            
            # User managing their own user object
            if isinstance(obj, User) and obj == request.user:
                return True
            
            return False
        except:
            return False

class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined']

    def get_queryset(self):
        """
        Filter users based on role:
        - Admins can see all users
        - Regular users can only see themselves
        """
        if self.request.user.is_staff:
            return User.objects.all()
        elif self.request.user.is_authenticated:
            return User.objects.filter(id=self.request.user.id)
        return User.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Secure user creation with comprehensive validation"""
        try:
            # Extract and validate input data
            username = request.data.get('username')
            email = request.data.get('email', '')
            password = request.data.get('password')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            is_staff = request.data.get('is_staff', False)

            # Only staff can create staff users
            if is_staff and not request.user.is_staff:
                return Response(
                    {'error': 'Only administrators can create staff accounts'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Comprehensive validation
            if not username:
                return Response(
                    {'error': 'Username is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not password:
                return Response(
                    {'error': 'Password is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check username uniqueness
            if User.objects.filter(username=username).exists():
                return Response(
                    {'error': 'Username already exists'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Optional email uniqueness check
            if email and User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'Email already in use'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Securely create user
            user = User.objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_staff=is_staff,
                password=make_password(password)  # Properly hash password
            )

            # Serialize and return
            serializer = self.get_serializer(user)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['POST'])
    def assign_role(self, request, pk=None):
        """
        Assign a role (landlord or tenant) to a user.
        """
        try:
            # Get the user object or return 404
            user = get_object_or_404(User, pk=pk)
            role = request.data.get('role')
            
            # Allow role self-assignment during registration process
            # This allows a new user to become a landlord or tenant
            # Log debug information
            print(f"Attempting to assign role {role} to user {user.id}")
            
            # Validate role
            if role not in ['landlord', 'tenant']:
                return Response(
                    {"error": "Invalid role. Must be 'landlord' or 'tenant'"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create role-specific profile
            if role == 'landlord':
                # Check if landlord profile already exists
                if not Landlord.objects.filter(user=user).exists():
                    Landlord.objects.create(
                        user=user,
                        first_name=user.first_name,
                        middle_name='',
                        other_names='',
                        id_number=user.username,  # Placeholder
                        email=user.email,
                        phone_number='',  # Placeholder
                        physical_address=''  # Placeholder
                    )
                return Response({
                    "message": "Landlord role assigned successfully",
                    "role": "landlord"
                }, status=status.HTTP_200_OK)
            else:  # tenant
                # Check if tenant profile already exists
                if not Tenant.objects.filter(user=user).exists():
                    Tenant.objects.create(
                        user=user,
                        id_number_or_passport=user.username,  # Placeholder
                        phone_number='',  # Placeholder
                        physical_address='',  # Placeholder
                        occupation='other',  # Default occupation
                        workplace=None,
                        emergency_contact_phone=None
                    )
                return Response({
                    "message": "Tenant role assigned successfully",
                    "role": "tenant"
                }, status=status.HTTP_200_OK)
        
        except Exception as e:
            print(f"Role assignment error: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

   
class ProfileViewSet(ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__email', 'location', 'occupation']
    ordering_fields = ['user__username', 'location']

    def get_queryset(self):
        """Role-based filtering of profiles"""
        queryset = Profile.objects.all()
        username = self.request.query_params.get('username')
        
        # Apply username filter if provided
        if username:
            queryset = queryset.filter(user__username=username)
        
        # Staff can see all profiles
        if self.request.user.is_staff:
            return queryset
        
        # Regular users can only see their own profile
        if self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        
        return Profile.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Secure profile creation with comprehensive validation"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = get_object_or_404(User, id=user_id)
            
            # Only staff or the user themselves can create their profile
            if not request.user.is_staff and request.user.id != user.id:
                return Response(
                    {"error": "You don't have permission to create a profile for this user"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Check if profile already exists
            if hasattr(user, 'profile'):
                return Response(
                    {"error": "Profile already exists for this user"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate serializer
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Create profile
            profile = Profile.objects.create(
                user=user,
                **serializer.validated_data
            )

            return Response(
                ProfileSerializer(profile).data, 
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class LandlordViewSet(ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__email']
    ordering_fields = ['date_added']

    def get_queryset(self):
        """Role-based filtering of landlords"""
        queryset = Landlord.objects.all()
        
        # Staff can see all landlords
        if self.request.user.is_staff:
            return queryset
            
        # Regular users can only see their own landlord profile
        if self.request.user.is_authenticated and hasattr(self.request.user, 'landlord'):
            return queryset.filter(user=self.request.user)
            
        # Tenants can see all landlords (to browse properties)
        if self.request.user.is_authenticated:
            return queryset
            
        return Landlord.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a landlord profile linked to an existing user"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {"error": "User ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = get_object_or_404(User, id=user_id)
            
            # Only staff or the user themselves can create their landlord profile
            if not request.user.is_staff and request.user.id != user.id:
                return Response(
                    {"error": "You don't have permission to create a landlord profile for this user"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if landlord profile already exists
            if Landlord.objects.filter(user_id=user_id).exists():
                return Response(
                    {"error": "Landlord profile already exists for this user"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the landlord profile
            landlord = Landlord.objects.create(
                user=user,
                first_name=user.first_name,
                middle_name='',
                other_names='',
                id_number=user.username,  # Placeholder
                email=user.email,
                phone_number='',  # Placeholder
                physical_address=''  # Placeholder
            )
            
            serializer = self.get_serializer(landlord)
            
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class TenantViewSet(ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'id_number_or_passport']
    ordering_fields = ['date_added']

    def get_queryset(self):
        """Role-based filtering of tenants"""
        queryset = Tenant.objects.all()
        
        # Staff can see all tenants
        if self.request.user.is_staff:
            return queryset
            
        # Landlords can see tenants in their properties
        if hasattr(self.request.user, 'landlord'):
            # Get houses owned by this landlord
            landlord_house_ids = House.objects.filter(
                apartment__owner=self.request.user.landlord
            ).values_list('id', flat=True)
            
            # Get tenants in these houses
            tenant_ids = House.objects.filter(
                id__in=landlord_house_ids
            ).exclude(tenant=None).values_list('tenant_id', flat=True)
            
            return queryset.filter(id__in=tenant_ids)
            
        # Tenants can only see their own profile
        if self.request.user.is_authenticated and hasattr(self.request.user, 'tenant'):
            return queryset.filter(user=self.request.user)
            
        return Tenant.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a tenant profile linked to the logged-in user"""
        # If not staff, force the user to be the logged-in user
        if not request.user.is_staff:
            user = request.user
        else:
            # For staff, allow specifying a user
            user_id = request.data.get('user_id')
            if not user_id:
                return Response(
                    {"error": "User ID is required for staff"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Check if tenant profile already exists
        if Tenant.objects.filter(user=user).exists():
            return Response(
                {"error": "Tenant profile already exists for this user"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create the tenant profile
            tenant = Tenant.objects.create(
                user=user,
                id_number_or_passport=request.data.get('id_number_or_passport', user.username),
                phone_number=request.data.get('phone_number', ''),
                physical_address=request.data.get('physical_address', ''),
                occupation=request.data.get('occupation', 'other'),
                workplace=request.data.get('workplace', ''),
                emergency_contact_phone=request.data.get('emergency_contact_phone', '')
            )

            serializer = self.get_serializer(tenant)
            
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ApartmentTypeViewSet(ModelViewSet):
    queryset = ApartmentType.objects.all()
    serializer_class = ApartmentTypeSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'date_added']
    
    def get_queryset(self):
        # Everyone can see apartment types
        return ApartmentType.objects.all()
    
    def create(self, request, *args, **kwargs):
        # Only staff can create apartment types
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can create apartment types"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

class HouseTypeViewSet(ModelViewSet):
    queryset = HouseType.objects.all()
    serializer_class = HouseTypeSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'date_added']
    
    def get_queryset(self):
        # Everyone can see house types
        return HouseType.objects.all()
    
    def create(self, request, *args, **kwargs):
        # Only staff can create house types
        if not request.user.is_staff:
            return Response(
                {"error": "Only administrators can create house types"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

class ApartmentViewSet(ModelViewSet):
    queryset = Apartment.objects.all()
    serializer_class = ApartmentSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'location', 'owner__user__username']
    ordering_fields = ['name', 'date_added', 'location']

    def get_queryset(self):
        """
        Role-based filtering of apartments
        """
        queryset = Apartment.objects.all()
        owner_id = self.request.query_params.get('owner_id', None)
        apartment_type_id = self.request.query_params.get('apartment_type_id', None)
        
        # Apply filters if provided
        if owner_id is not None:
            queryset = queryset.filter(owner_id=owner_id)
        if apartment_type_id is not None:
            queryset = queryset.filter(apartment_type_id=apartment_type_id)
        
        # Staff can see all apartments
        if self.request.user.is_staff:
            return queryset
            
        # Landlords can only see their own apartments
        if hasattr(self.request.user, 'landlord'):
            return queryset.filter(owner=self.request.user.landlord)
            
        # Tenants and others can see all apartments (for browsing)
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects with role checking"""
        # Only staff and landlords can create apartments
        if not request.user.is_staff and not hasattr(request.user, 'landlord'):
            return Response(
                {"error": "You don't have permission to create apartments"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        owner_id = request.data.get('owner_id')
        apartment_type_id = request.data.get('apartment_type_id')
        
        if not owner_id or not apartment_type_id:
            return Response(
                {"error": "Both owner_id and apartment_type_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify owner and apartment type exist
            landlord = get_object_or_404(Landlord, id=owner_id)
            get_object_or_404(ApartmentType, id=apartment_type_id)
            
            # If user is landlord (not staff), verify they are creating their own apartment
            if not request.user.is_staff and hasattr(request.user, 'landlord'):
                if landlord.id != request.user.landlord.id:
                    return Response(
                        {"error": "You can only create apartments for yourself"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Create modified data with objects instead of IDs
            modified_data = request.data.copy()
            modified_data.pop('owner_id', None)
            modified_data.pop('apartment_type_id', None)
            
            # Create the apartment
            serializer = self.get_serializer(data=modified_data)
            serializer.is_valid(raise_exception=True)
            
            apartment = Apartment.objects.create(
                **serializer.validated_data,
                owner_id=owner_id,
                apartment_type_id=apartment_type_id
            )
            
            return Response(
                ApartmentSerializer(apartment).data, 
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class HouseViewSet(ModelViewSet):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['number', 'apartment__name', 'house_type__name']
    ordering_fields = ['number', 'monthly_rent', 'date_added']

    def get_queryset(self):
        """
        Role-based filtering of houses
        """
        queryset = House.objects.all()
        apartment_id = self.request.query_params.get('apartment_id', None)
        house_type_id = self.request.query_params.get('house_type_id', None)
        tenant_id = self.request.query_params.get('tenant_id', None)
        status = self.request.query_params.get('status', None)
        
        # Apply filters if provided
        if apartment_id is not None:
            queryset = queryset.filter(apartment_id=apartment_id)
        if house_type_id is not None:
            queryset = queryset.filter(house_type_id=house_type_id)
        if tenant_id is not None:
            queryset = queryset.filter(tenant_id=tenant_id)
        if status is not None:
            queryset = queryset.filter(status=status)
        
        # Staff can see all houses
        if self.request.user.is_staff:
            return queryset
            
        # Landlords can only see houses in their apartments
        if hasattr(self.request.user, 'landlord'):
            return queryset.filter(apartment__owner=self.request.user.landlord)
            
        # Tenants can see their own houses and available houses
        if hasattr(self.request.user, 'tenant'):
            return queryset.filter(
                # Either houses assigned to this tenant
                tenant=self.request.user.tenant
            ) | queryset.filter(
                # Or available houses
                status='vacant'
            )
            
        # Others can see available houses
        return queryset.filter(status='vacant')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects with role checking"""
        # Only staff and landlords can create houses
        if not request.user.is_staff and not hasattr(request.user, 'landlord'):
            return Response(
                {"error": "You don't have permission to create houses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        apartment_id = request.data.get('apartment_id')
        house_type_id = request.data.get('house_type_id')
        tenant_id = request.data.get('tenant_id', None)
        
        if not apartment_id or not house_type_id:
            return Response(
                {"error": "Both apartment_id and house_type_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify apartment and house type exist
            apartment = get_object_or_404(Apartment, id=apartment_id)
            get_object_or_404(HouseType, id=house_type_id)
            
            # If user is landlord (not staff), verify they own this apartment
            if not request.user.is_staff and hasattr(request.user, 'landlord'):
                if apartment.owner != request.user.landlord:
                    return Response(
                        {"error": "You can only create houses in your own apartments"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Create modified data with objects instead of IDs
            modified_data = request.data.copy()
            modified_data.pop('apartment_id', None)
            modified_data.pop('house_type_id', None)
            modified_data.pop('tenant_id', None)
            
            # Handle tenant optional assignment
            if tenant_id:
                tenant = get_object_or_404(Tenant, id=tenant_id)
                modified_data['tenant'] = tenant
                modified_data['status'] = 'occupied'
            
            # Create the house
            serializer = self.get_serializer(data=modified_data)
            serializer.is_valid(raise_exception=True)
            
            house = House.objects.create(
                **serializer.validated_data,
                apartment_id=apartment_id,
                house_type_id=house_type_id,
                tenant_id=tenant_id
            )
            
            return Response(
                HouseSerializer(house).data, 
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class HouseBookingViewSet(ModelViewSet):
    queryset = HouseBooking.objects.all()
    serializer_class = HouseBookingSerializer
    authentication_classes = [
        SessionAuthentication, 
        TokenAuthentication, 
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tenant__user__username', 'house__number']
    ordering_fields = ['date_added']

    def get_queryset(self):
        """
        Role-based filtering of bookings
        """
        queryset = HouseBooking.objects.all()
        tenant_id = self.request.query_params.get('tenant_id', None)
        house_id = self.request.query_params.get('house_id', None)
        
        # Apply filters if provided
        if tenant_id is not None:
            queryset = queryset.filter(tenant_id=tenant_id)
        if house_id is not None:
            queryset = queryset.filter(house_id=house_id)
        
        # Staff can see all bookings
        if self.request.user.is_staff:
            return queryset
        

class InvoiceViewSet(ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    authentication_classes = [
        SessionAuthentication,
        TokenAuthentication,
        BasicAuthentication
    ]
    permission_classes = [FlexiblePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tenant__user__username', 'house__number', 'month', 'year']
    ordering_fields = ['date_added', 'month', 'year', 'paid']
    
    def get_queryset(self):
        """
        Filter invoices based on user role
        """
        queryset = super().get_queryset()
        
        # Apply any existing filters
        tenant_id = self.request.query_params.get('tenant_id', None)
        house_id = self.request.query_params.get('house_id', None)
        month = self.request.query_params.get('month', None)
        year = self.request.query_params.get('year', None)
        paid = self.request.query_params.get('paid', None)
        
        if tenant_id is not None:
            queryset = queryset.filter(tenant_id=tenant_id)
        if house_id is not None:
            queryset = queryset.filter(house_id=house_id)
        if month is not None:
            queryset = queryset.filter(month=month)
        if year is not None:
            queryset = queryset.filter(year=year)
        if paid is not None:
            queryset = queryset.filter(paid=(paid.lower() == 'true'))
        
        # If user is staff, return all
        if self.request.user.is_staff:
            return queryset
        
        # If user is landlord, return only invoices for their houses
        if hasattr(self.request.user, 'landlord'):
            return queryset.filter(house__apartment__owner=self.request.user.landlord)
        
        # If user is tenant, return only their invoices
        if hasattr(self.request.user, 'tenant'):
            return queryset.filter(tenant=self.request.user.tenant)
        
        # Return empty queryset if user doesn't match any role
        return Invoice.objects.none()