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
    Custom permission class with more flexible access controls
    """
    def has_permission(self, request, view):
        # Allow any method for staff users
        if request.user and request.user.is_staff:
            return True
        
        # Allow create method for anyone
        if view.action == 'create':
            return True
        
        return request.method in SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        # Staff always has full access
        if request.user and request.user.is_staff:
            return True
        
        # Allow users to access their own objects
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        return request.method in SAFE_METHODS

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

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def get_current_user(self, request):
        """Get details of the currently logged-in user"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def set_password(self, request, pk=None):
        """Allow users to change their password"""
        user = self.get_object()
        
        # Ensure user is changing their own password or is an admin
        if user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Unauthorized password change'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        new_password = request.data.get('new_password')
        if not new_password:
            return Response(
                {'error': 'New password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {'message': 'Password updated successfully'}, 
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def assign_role(self, request, pk=None):
        """
        Assign a role (landlord or tenant) to a user
        """
        user = self.get_object()
        role = request.data.get('role')
        
        if role not in ['landlord', 'tenant']:
            return Response(
                {"error": "Invalid role. Must be 'landlord' or 'tenant'"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
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
                })
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
                })
        
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def get_user_roles(self, request):
        """
        Get roles for the current user
        """
        user = request.user
        roles = {
            'is_landlord': Landlord.objects.filter(user=user).exists(),
            'is_tenant': Tenant.objects.filter(user=user).exists(),
            'is_admin': user.is_staff
        }
        return Response(roles)

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
        """Flexible querying with optional username filter"""
        queryset = Profile.objects.all()
        username = self.request.query_params.get('username')
        if username:
            queryset = queryset.filter(user__username=username)
        return queryset

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
        Optionally filter apartments by owner or apartment type
        """
        queryset = Apartment.objects.all()
        owner_id = self.request.query_params.get('owner_id', None)
        apartment_type_id = self.request.query_params.get('apartment_type_id', None)
        
        if owner_id is not None:
            queryset = queryset.filter(owner_id=owner_id)
        if apartment_type_id is not None:
            queryset = queryset.filter(apartment_type_id=apartment_type_id)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
        owner_id = request.data.get('owner_id')
        apartment_type_id = request.data.get('apartment_type_id')
        
        if not owner_id or not apartment_type_id:
            return Response(
                {"error": "Both owner_id and apartment_type_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify owner and apartment type exist
            get_object_or_404(Landlord, id=owner_id)
            get_object_or_404(ApartmentType, id=apartment_type_id)
            
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
        Optionally filter houses by apartment, house type, or tenant
        """
        queryset = House.objects.all()
        apartment_id = self.request.query_params.get('apartment_id', None)
        house_type_id = self.request.query_params.get('house_type_id', None)
        tenant_id = self.request.query_params.get('tenant_id', None)
        status = self.request.query_params.get('status', None)
        
        if apartment_id is not None:
            queryset = queryset.filter(apartment_id=apartment_id)
        if house_type_id is not None:
            queryset = queryset.filter(house_type_id=house_type_id)
        if tenant_id is not None:
            queryset = queryset.filter(tenant_id=tenant_id)
        if status is not None:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
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
            get_object_or_404(Apartment, id=apartment_id)
            get_object_or_404(HouseType, id=house_type_id)
            
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
        Optionally filter bookings by tenant or house
        """
        queryset = HouseBooking.objects.all()
        tenant_id = self.request.query_params.get('tenant_id', None)
        house_id = self.request.query_params.get('house_id', None)
        
        if tenant_id is not None:
            queryset = queryset.filter(tenant_id=tenant_id)
        if house_id is not None:
            queryset = queryset.filter(house_id=house_id)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
        tenant_id = request.data.get('tenant_id')
        house_id = request.data.get('house_id')
        
        if not tenant_id or not house_id:
            return Response(
                {"error": "Both tenant_id and house_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get tenant and house, verify they exist
            tenant = get_object_or_404(Tenant, id=tenant_id)
            house = get_object_or_404(House, id=house_id)
            
            # Check if house is available
            if house.status != 'vacant':
                return Response(
                    {"error": "This house is not available for booking"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
            # Create modified data with objects instead of IDs
            modified_data = request.data.copy()
            modified_data.pop('tenant_id', None)
            modified_data.pop('house_id', None)
            
            # Validate deposit and rent amounts
            modified_data['deposit_amount'] = modified_data.get('deposit_amount', house.deposit_amount or 0)
            modified_data['rent_amount_paid'] = modified_data.get('rent_amount_paid', house.monthly_rent)
            
            # Create the booking
            serializer = self.get_serializer(data=modified_data)
            serializer.is_valid(raise_exception=True)
            
            booking = HouseBooking.objects.create(
                **serializer.validated_data,
                tenant=tenant,
                house=house
            )
            
            # Update house status
            house.status = 'occupied'
            house.tenant = tenant
            house.save()
            
            return Response(
                HouseBookingSerializer(booking).data, 
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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
        Optionally filter invoices by tenant, house, month, year, or payment status
        """
        queryset = Invoice.objects.all()
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
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
        tenant_id = request.data.get('tenant_id')
        house_id = request.data.get('house_id')
        
        if not tenant_id or not house_id:
            return Response(
                {"error": "Both tenant_id and house_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get tenant and house, verify they exist
            tenant = get_object_or_404(Tenant, id=tenant_id)
            house = get_object_or_404(House, id=house_id)
            
            # Verify tenant is assigned to this house
            if house.tenant != tenant:
                return Response(
                    {"error": "This tenant is not assigned to this house"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create modified data with objects instead of IDs
            modified_data = request.data.copy()
            modified_data.pop('tenant_id', None)
            modified_data.pop('house_id', None)
            
            # Set rent amount if not provided
            if 'rent' not in modified_data:
                modified_data['rent'] = house.monthly_rent
            
            # Set total_payable to rent if not provided
            if 'total_payable' not in modified_data:
                modified_data['total_payable'] = modified_data.get('rent', house.monthly_rent)
            
            # Create the invoice
            serializer = self.get_serializer(data=modified_data)
            serializer.is_valid(raise_exception=True)
            
            invoice = Invoice.objects.create(
                **serializer.validated_data,
                tenant=tenant,
                house=house
            )
            
            return Response(
                InvoiceSerializer(invoice).data, 
                status=status.HTTP_201_CREATED
            )
        
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )