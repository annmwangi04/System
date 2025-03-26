from rest_framework import serializers
from django.contrib.auth.models import User
from ..models import (
    Profile, Landlord, Tenant, ApartmentType, Apartment,
    HouseType, House, HouseBooking, Invoice
)

# User Serializer 
from django.contrib.auth.models import User
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # Ensure password is write-only

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
    
    def create(self, validated_data):
        """Ensure password is hashed when creating a user"""
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)  # Hash password before saving
        user.save()
        return user


# Profile Serializer
class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    # This will exclude the country field from serialization
    class Meta:
        model = Profile
        exclude = ['country']
        
    # Then add it back as a string representation
    country_name = serializers.SerializerMethodField()
    
    def get_country_name(self, obj):
        return str(obj.country) if hasattr(obj, 'country') and obj.country else None

# Landlord Serializer
class LandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Landlord
        fields = [
            'id', 'first_name', 'middle_name', 'other_names',
            'id_number', 'email', 'phone_number',
            'physical_address', 'aob', 'date_added'
        ]

# Tenant Serializer
class TenantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'user', 'full_name', 'id_number_or_passport',
            'email', 'phone_number', 'physical_address', 'occupation',
            'workplace', 'emergency_contact_phone', 'date_added'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

# ApartmentType Serializer
class ApartmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApartmentType
        fields = '__all__'

# HouseType Serializer
class HouseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseType
        fields = '__all__'

# Apartment Serializer
class ApartmentSerializer(serializers.ModelSerializer):
    owner = LandlordSerializer(read_only=True)
    apartment_type = ApartmentTypeSerializer(read_only=True)
    
    class Meta:
        model = Apartment
        fields = '__all__'

# House Serializer
class HouseSerializer(serializers.ModelSerializer):
    apartment = ApartmentSerializer(read_only=True)
    house_type = HouseTypeSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = House
        fields = '__all__'

# HouseBooking Serializer
class HouseBookingSerializer(serializers.ModelSerializer):
    house = HouseSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = HouseBooking
        fields = '__all__'

# Invoice Serializer
class InvoiceSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    house = HouseSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'