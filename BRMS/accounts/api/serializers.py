from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from ..models import (
    Profile, Landlord, Tenant, ApartmentType, Apartment,
    HouseType, House, HouseBooking, Invoice
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
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
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
    
    class Meta:
        model = Profile
        exclude = ['country']
        
    country_name = serializers.SerializerMethodField()
    
    def get_country_name(self, obj):
        return str(obj.country) if hasattr(obj, 'country') and obj.country else None

class LandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Landlord
        fields = [
            'id', 'first_name', 'middle_name', 'other_names',
            'id_number', 'email', 'phone_number',
            'physical_address', 'aob', 'date_added'
        ]

class TenantSerializer(serializers.ModelSerializer):
    user_first_name = serializers.CharField(source='user.first_name', read_only=True, required=False)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True, required=False)

    class Meta:
        model = Tenant
        fields = [
            'id', 
            'user', 
            'user_first_name', 
            'user_last_name',
            'id_number_or_passport', 
            'phone_number', 
            'physical_address', 
            'occupation', 
            'workplace', 
            'emergency_contact_phone',
            'date_added'
        ]
        extra_kwargs = {
            'user': {'required': False},
            'id_number_or_passport': {'required': False},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        
        if not request:
            return Tenant.objects.create(**validated_data)
        
        if 'user' not in validated_data:
            validated_data['user'] = request.user
        
        return Tenant.objects.create(**validated_data)

class ApartmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApartmentType
        fields = '__all__'

class HouseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseType
        fields = '__all__'

class ApartmentSerializer(serializers.ModelSerializer):
    owner = LandlordSerializer(read_only=True)
    apartment_type = ApartmentTypeSerializer(read_only=True)
    
    class Meta:
        model = Apartment
        fields = '__all__'

class HouseSerializer(serializers.ModelSerializer):
    apartment = ApartmentSerializer(read_only=True)
    house_type = HouseTypeSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = House
        fields = '__all__'

class HouseBookingSerializer(serializers.ModelSerializer):
    house = HouseSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = HouseBooking
        fields = '__all__'
    
    def validate(self, attrs):
        """
        Additional validation for house bookings
        Ensures house is available and validates booking details
        """
        house = attrs.get('house')
        if house and house.status != 'vacant':
            raise serializers.ValidationError("This house is not available for booking")
        
        return attrs

class InvoiceSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    house = HouseSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
    
    def validate(self, attrs):
        """
        Additional validation for invoices
        Ensures tenant is assigned to the house and validates invoice details
        """
        tenant = attrs.get('tenant')
        house = attrs.get('house')
        
        if tenant and house and house.tenant != tenant:
            raise serializers.ValidationError("Invoice tenant must match house tenant")
        
        return attrs