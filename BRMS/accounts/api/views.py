from rest_framework.viewsets import ModelViewSet
from rest_framework import permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status, filters
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .serializers import (
    UserSerializer, ProfileSerializer, LandlordSerializer, TenantSerializer,
    ApartmentTypeSerializer, HouseTypeSerializer, ApartmentSerializer,
    HouseSerializer, HouseBookingSerializer, InvoiceSerializer
)
from ..models import (
    Profile, Landlord, Tenant, ApartmentType, Apartment,
    HouseType, House, HouseBooking, Invoice
)


# User ViewSet
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined']

    def create(self, request, *args, **kwargs):
        """Custom create method to handle password properly"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data.get('email', ''),
            first_name=serializer.validated_data.get('first_name', ''),
            last_name=serializer.validated_data.get('last_name', ''),
            password=request.data.get('password', '')
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


# Profile ViewSet
class ProfileViewSet(ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__email', 'location', 'occupation']
    ordering_fields = ['user__username', 'location']
    
    def get_queryset(self):
        """
        Optionally restricts the returned profiles to a given user,
        by filtering against a 'username' query parameter in the URL.
        """
        queryset = Profile.objects.all()
        username = self.request.query_params.get('username', None)
        if username is not None:
            queryset = queryset.filter(user__username=username)
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a profile linked to an existing user"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = get_object_or_404(User, id=user_id)
        
        # Check if profile already exists
        if hasattr(user, 'profile'):
            return Response({"error": "Profile already exists for this user"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create modified data with objects instead of IDs
        modified_data = request.data.copy()
        modified_data.pop('user_id', None)
        
        # Create the profile
        serializer = self.get_serializer(data=modified_data)
        serializer.is_valid(raise_exception=True)
        
        profile = Profile.objects.create(
            user=user,
            **serializer.validated_data
        )
        
        return Response(
            ProfileSerializer(profile).data, 
            status=status.HTTP_201_CREATED
        )


# Landlord ViewSet


class LandlordViewSet(ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__email']
    ordering_fields = ['date_added']

    def create(self, request, *args, **kwargs):
        """Create a landlord profile linked to an existing user"""
        user_id = request.data.get('user_id')  # Changed from 'user' to 'user_id'
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = get_object_or_404(User, id=user_id)
        
        # Check if landlord profile already exists
        if Landlord.objects.filter(user=user).exists():
            return Response(
                {"error": "Landlord profile already exists for this user"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        landlord = Landlord.objects.create(user=user)
        serializer = self.get_serializer(landlord)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def dashboard_stats(self, request):
        """
        Custom endpoint to get dashboard statistics for a logged-in landlord
        """
        try:
            # Get the landlord associated with the current user
            landlord = Landlord.objects.get(user=request.user)
            
            # Calculate statistics
            total_apartments = Apartment.objects.filter(owner=landlord).count()
            total_houses = House.objects.filter(apartment__owner=landlord).count()
            occupied_houses = House.objects.filter(
                apartment__owner=landlord, 
                occupied=True
            ).count()
            total_tenants = Tenant.objects.filter(
                rented_house__apartment__owner=landlord
            ).count()
            
            # Calculate total income from paid invoices
            total_income = Invoice.objects.filter(
                house__apartment__owner=landlord, 
                paid=True
            ).aggregate(total=Sum('total_payable'))['total'] or 0
            
            # Pending maintenance (placeholder)
            pending_maintenance = 0
            
            return Response({
                'total_apartments': total_apartments,
                'total_houses': total_houses,
                'occupied_houses': occupied_houses,
                'total_tenants': total_tenants,
                'total_income': total_income,
                'pending_maintenance': pending_maintenance
            })
        
        except Landlord.DoesNotExist:
            return Response(
                {"error": "Landlord profile not found for the current user"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Tenant ViewSet
class TenantViewSet(ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'user__username', 'user__email', 'tenant_full_name',
        'id_Number_or_passport', 'email', 'phone_number',
        'physical_address', 'occupation'
    ]
    ordering_fields = ['date_added', 'tenant_full_name', 'occupation']
    
    def create(self, request, *args, **kwargs):
        """Create a tenant profile linked to an existing user with extended information"""
        user_id = request.data.get('user')
        
        if not user_id:
            return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = get_object_or_404(User, id=user_id)
        
        # Check if tenant profile already exists
        if hasattr(user, 'tenant_profile'):
            return Response({"error": "Tenant profile already exists for this user"}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Extract required fields with validation
        required_fields = ['tenant_full_name', 'id_Number_or_passport', 'email', 'phone_number', 'physical_address']
        for field in required_fields:
            if not request.data.get(field):
                return Response(
                    {"error": f"{field.replace('_', ' ').title()} is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create tenant with all provided fields
        tenant_data = {
            'user': user,
            'tenant_full_name': request.data.get('tenant_full_name'),
            'id_Number_or_passport': request.data.get('id_Number_or_passport'),
            'email': request.data.get('email'),
            'phone_number': request.data.get('phone_number'),
            'physical_address': request.data.get('physical_address'),
            'occupation': request.data.get('occupation'),
            'at': request.data.get('at'),
            'contact_phone': request.data.get('contact_phone'),
            'name': request.data.get('name', request.data.get('tenant_full_name'))  # Default to tenant_full_name if not provided
        }
        
        try:
            tenant = Tenant.objects.create(**tenant_data)
            serializer = self.get_serializer(tenant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ApartmentType ViewSet
class ApartmentTypeViewSet(ModelViewSet):
    queryset = ApartmentType.objects.all()
    serializer_class = ApartmentTypeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'date_added']


# HouseType ViewSet
class HouseTypeViewSet(ModelViewSet):
    queryset = HouseType.objects.all()
    serializer_class = HouseTypeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'date_added']


# Apartment ViewSet
class ApartmentViewSet(ModelViewSet):
    queryset = Apartment.objects.all()
    serializer_class = ApartmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'location', 'owner__user__username']
    ordering_fields = ['name', 'date_added', 'location']

    def get_queryset(self):
        """
        Optionally filter apartments by owner's username or apartment type
        """
        queryset = Apartment.objects.all()
        owner_id = self.request.query_params.get('owner_id', None)
        apartment_type_id = self.request.query_params.get('apartment_type_id', None)
        
        if owner_id is not None:
            queryset = queryset.filter(owner_id=owner_id)
        if apartment_type_id is not None:
            queryset = queryset.filter(apartment_type_id=apartment_type_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
        owner_id = request.data.get('owner_id')
        apartment_type_id = request.data.get('apartment_type_id')
        
        if not owner_id or not apartment_type_id:
            return Response(
                {"error": "Both owner_id and apartment_type_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
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


# House ViewSet
class HouseViewSet(ModelViewSet):
    queryset = House.objects.all()
    serializer_class = HouseSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['number', 'apartment__name', 'house_type__name']
    ordering_fields = ['number', 'monthly_rent', 'date_added', 'occupied']

    def get_queryset(self):
        """
        Optionally filter houses by apartment, occupancy status, or house type
        """
        queryset = House.objects.all()
        apartment_id = self.request.query_params.get('apartment_id', None)
        occupied = self.request.query_params.get('occupied', None)
        house_type_id = self.request.query_params.get('house_type_id', None)
        tenant_id = self.request.query_params.get('tenant_id', None)
        
        if apartment_id is not None:
            queryset = queryset.filter(apartment_id=apartment_id)
        if occupied is not None:
            queryset = queryset.filter(occupied=(occupied.lower() == 'true'))
        if house_type_id is not None:
            queryset = queryset.filter(house_type_id=house_type_id)
        if tenant_id is not None:
            queryset = queryset.filter(tenant_id=tenant_id)
        
        return queryset
    
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
        
        # Create modified data with objects instead of IDs
        modified_data = request.data.copy()
        modified_data.pop('apartment_id', None)
        modified_data.pop('house_type_id', None)
        modified_data.pop('tenant_id', None)
        
        # Set occupied status based on tenant
        if tenant_id:
            modified_data['occupied'] = True
        
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


# HouseBooking ViewSet
class HouseBookingViewSet(ModelViewSet):
    queryset = HouseBooking.objects.all()
    serializer_class = HouseBookingSerializer
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
    
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
        tenant_id = request.data.get('tenant_id')
        house_id = request.data.get('house_id')
        
        if not tenant_id or not house_id:
            return Response(
                {"error": "Both tenant_id and house_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get house to check if it's available
        house = get_object_or_404(House, id=house_id)
        if house.occupied:
            return Response(
                {"error": "This house is already occupied"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create modified data with objects instead of IDs
        modified_data = request.data.copy()
        modified_data.pop('tenant_id', None)
        modified_data.pop('house_id', None)
        
        # Create the booking
        serializer = self.get_serializer(data=modified_data)
        serializer.is_valid(raise_exception=True)
        
        booking = HouseBooking.objects.create(
            **serializer.validated_data,
            tenant_id=tenant_id,
            house_id=house_id
        )
        
        # Update house status and assign tenant
        house.occupied = True
        house.tenant_id = tenant_id
        house.save()
        
        return Response(
            HouseBookingSerializer(booking).data, 
            status=status.HTTP_201_CREATED
        )


# Invoice ViewSet
class InvoiceViewSet(ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
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
    
    def create(self, request, *args, **kwargs):
        """Custom create method to handle nested objects"""
        tenant_id = request.data.get('tenant_id')
        house_id = request.data.get('house_id')
        
        if not tenant_id or not house_id:
            return Response(
                {"error": "Both tenant_id and house_id are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get house to get rent amount
        house = get_object_or_404(House, id=house_id)
        
        # Verify tenant is assigned to this house
        if house.tenant_id != int(tenant_id):
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
            modified_data['total_payable'] = modified_data['rent']
        
        # Create the invoice
        serializer = self.get_serializer(data=modified_data)
        serializer.is_valid(raise_exception=True)
        
        invoice = Invoice.objects.create(
            **serializer.validated_data,
            tenant_id=tenant_id,
            house_id=house_id
        )
        
        return Response(
            InvoiceSerializer(invoice).data, 
            status=status.HTTP_201_CREATED
        )