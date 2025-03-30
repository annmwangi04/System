from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from ..models import (
    Profile, Role, Landlord, ApartmentType, Apartment,
    HouseType, Tenant, House, HouseBooking, Invoice, Payment
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'date_joined']
        read_only_fields = ['date_joined']
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        """
        Validate that passwords match and meet requirements
        """
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        return attrs

    def create(self, validated_data):
        try:
            # Ensure all required fields are present
            if not all(key in validated_data for key in ['username', 'email']):
                raise serializers.ValidationError("Username and email are required")

            # Check if username already exists
            if User.objects.filter(username=validated_data['username']).exists():
                raise serializers.ValidationError({"username": "A user with this username already exists."})

            # Check if email already exists
            if User.objects.filter(email=validated_data['email']).exists():
                raise serializers.ValidationError({"email": "A user with this email already exists."})

            # Create user with hashed password
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
                password=validated_data['password']
            )
            return user
        except Exception as e:
            # Log the full error for server-side debugging
            print(f"User creation error: {str(e)}")
            raise serializers.ValidationError(str(e))

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    country_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'picture', 'phone', 'studied_at', 'county',
                 'location', 'my_profile', 'occupation', 'education',
                 'skills', 'country_name']  # Remove 'country' from here
    
    def get_country_name(self, obj):
        return str(obj.country) if hasattr(obj, 'country') and obj.country else None

class RoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'user', 'role_type', 'role_type_display', 'date_assigned']
        read_only_fields = ['date_assigned']

class LandlordSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=False
    )

    class Meta:
        model = Landlord
        fields = [
            'id', 'user', 'user_id', 'first_name', 'middle_name', 'other_names',
            'id_number', 'email', 'phone_number', 'physical_address', 
            'aob', 'date_added'
        ]
        read_only_fields = ['date_added']

class ApartmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApartmentType
        fields = ['id', 'name', 'description', 'date_added']
        read_only_fields = ['date_added']

class HouseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseType
        fields = ['id', 'name', 'description', 'date_added']
        read_only_fields = ['date_added']

class TenantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True,
        required=False
    )
    occupation_display = serializers.CharField(source='get_occupation_display', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id', 'user', 'user_id', 'user_first_name', 'user_last_name',
            'first_name', 'last_name', 'id_number_or_passport', 
            'email', 'phone_number', 'physical_address', 'occupation', 
            'occupation_display', 'workplace', 'emergency_contact_phone', 'date_added'
        ]
        read_only_fields = ['date_added']
        extra_kwargs = {
            'user': {'required': False},
            'id_number_or_passport': {'required': False},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        
        if not request:
            return Tenant.objects.create(**validated_data)
        
        if 'user' not in validated_data and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        return Tenant.objects.create(**validated_data)

# Serializers with nested relationships

class HouseSerializer(serializers.ModelSerializer):
    apartment = serializers.PrimaryKeyRelatedField(queryset=Apartment.objects.all())
    apartment_detail = serializers.SerializerMethodField(read_only=True)
    house_type = serializers.PrimaryKeyRelatedField(queryset=HouseType.objects.all())
    house_type_detail = serializers.SerializerMethodField(read_only=True)
    tenant = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.all(),
        required=False,
        allow_null=True
    )
    tenant_detail = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = House
        fields = [
            'id', 'apartment', 'apartment_detail', 'number', 'monthly_rent', 
            'deposit_amount', 'house_type', 'house_type_detail', 'description', 
            'status', 'status_display', 'tenant', 'tenant_detail', 'date_added', 'image'
        ]
        read_only_fields = ['date_added', 'status_display']
    
    def get_apartment_detail(self, obj):
        return {
            'id': obj.apartment.id,
            'name': obj.apartment.name,
            'location': obj.apartment.location
        }
    
    def get_house_type_detail(self, obj):
        return {
            'id': obj.house_type.id,
            'name': obj.house_type.name,
        }
    
    def get_tenant_detail(self, obj):
        if obj.tenant:
            return {
                'id': obj.tenant.id,
                'name': str(obj.tenant),
                'phone_number': obj.tenant.phone_number
            }
        return None

class ApartmentSerializer(serializers.ModelSerializer):
    apartment_type = serializers.PrimaryKeyRelatedField(queryset=ApartmentType.objects.all())
    apartment_type_detail = serializers.SerializerMethodField(read_only=True)
    owner = serializers.PrimaryKeyRelatedField(queryset=Landlord.objects.all())
    owner_detail = serializers.SerializerMethodField(read_only=True)
    houses_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Apartment
        fields = [
            'id', 'name', 'apartment_type', 'apartment_type_detail', 'location', 
            'description', 'owner', 'owner_detail', 'management_fee_percentage', 
            'total_houses', 'houses_count', 'date_added', 'image'
        ]
        read_only_fields = ['date_added', 'total_houses']
    
    def get_apartment_type_detail(self, obj):
        return {
            'id': obj.apartment_type.id,
            'name': obj.apartment_type.name
        }
    
    def get_owner_detail(self, obj):
        return {
            'id': obj.owner.id,
            'name': f"{obj.owner.first_name} {obj.owner.middle_name or ''}".strip()
        }
    
    def get_houses_count(self, obj):
        return obj.houses.count()

class HouseBookingSerializer(serializers.ModelSerializer):
    house = serializers.PrimaryKeyRelatedField(queryset=House.objects.all())
    house_detail = serializers.SerializerMethodField(read_only=True)
    tenant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all())
    tenant_detail = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = HouseBooking
        fields = [
            'id', 'house', 'house_detail', 'tenant', 'tenant_detail', 'deposit_amount', 
            'rent_amount_paid', 'status', 'status_display', 'booking_date', 
            'move_in_date', 'date_added'
        ]
        read_only_fields = ['date_added', 'booking_date', 'status_display']
    
    def get_house_detail(self, obj):
        return {
            'id': obj.house.id,
            'number': obj.house.number,
            'apartment': obj.house.apartment.name,
            'monthly_rent': obj.house.monthly_rent
        }
    
    def get_tenant_detail(self, obj):
        return {
            'id': obj.tenant.id,
            'name': str(obj.tenant),
            'phone_number': obj.tenant.phone_number
        }
    
    def validate(self, attrs):
        """
        Additional validation for house bookings
        Ensures house is available and validates booking details
        """
        house = attrs.get('house')
        if house and house.status != 'vacant':
            raise serializers.ValidationError({"house": "This house is not available for booking"})
        
        return attrs

class InvoiceSerializer(serializers.ModelSerializer):
    tenant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all())
    tenant_detail = serializers.SerializerMethodField(read_only=True)
    house = serializers.PrimaryKeyRelatedField(queryset=House.objects.all())
    house_detail = serializers.SerializerMethodField(read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    remaining_amount = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'tenant', 'tenant_detail', 'house', 'house_detail', 'month', 'year', 
            'rent', 'additional_charges', 'discount', 'total_payable', 
            'amount_paid', 'remaining_amount', 'payment_status', 
            'payment_status_display', 'due_date', 'date_added'
        ]
        read_only_fields = ['date_added', 'total_payable', 'payment_status', 'payment_status_display', 'amount_paid']
    
    def get_tenant_detail(self, obj):
        return {
            'id': obj.tenant.id,
            'name': str(obj.tenant)
        }
    
    def get_house_detail(self, obj):
        return {
            'id': obj.house.id,
            'number': obj.house.number,
            'apartment': obj.house.apartment.name
        }
    
    def get_remaining_amount(self, obj):
        return obj.total_payable - obj.amount_paid
    
    def validate(self, attrs):
        """
        Additional validation for invoices
        Ensures tenant is assigned to the house and validates invoice details
        """
        tenant = attrs.get('tenant')
        house = attrs.get('house')
        
        if tenant and house and house.tenant != tenant:
            raise serializers.ValidationError({"tenant": "Invoice tenant must match house tenant"})
        
        return attrs

class PaymentSerializer(serializers.ModelSerializer):
    invoice = serializers.PrimaryKeyRelatedField(queryset=Invoice.objects.all())
    invoice_detail = serializers.SerializerMethodField(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_detail', 'amount', 'payment_method', 
            'payment_method_display', 'transaction_reference', 
            'payment_date', 'notes'
        ]
        read_only_fields = ['payment_date', 'payment_method_display']
    
    def get_invoice_detail(self, obj):
        return {
            'id': obj.invoice.id,
            'tenant': str(obj.invoice.tenant),
            'house': f"{obj.invoice.house.number} - {obj.invoice.house.apartment.name}",
            'month': obj.invoice.month,
            'year': obj.invoice.year,
            'total_payable': obj.invoice.total_payable,
            'amount_paid': obj.invoice.amount_paid
        }
    # Authentication Serializers
from rest_framework.authtoken.serializers import AuthTokenSerializer
from django.contrib.auth import authenticate

class CustomAuthTokenSerializer(AuthTokenSerializer):
    """
    Custom authentication serializer that returns additional user information
    """
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(request=self.context.get('request'),
                                username=username, password=password)

            # Check if authentication succeeded
            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "username" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs