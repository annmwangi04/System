from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import (
    RegexValidator, 
    MinValueValidator, 
    MaxValueValidator
)
from django_countries.fields import CountryField

# Profile Model
class Profile(models.Model):
    EDUCATION_CHOICES = [
        ('high_school', 'High School'),
        ('bachelor', 'Bachelor\'s Degree'),
        ('master', 'Master\'s Degree'),
        ('phd', 'PhD'),
        ('other', 'Other')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    picture = models.ImageField(
        upload_to='profile_pics/', 
        default="np_pic.png", 
        blank=True, 
        null=True
    )
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', 
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        blank=True, 
        null=True
    )
    
    studied_at = models.CharField(max_length=200, blank=True, null=True)
    county = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    my_profile = models.TextField(blank=True, null=True)
    
    occupation = models.CharField(max_length=200, blank=True, null=True)
    education = models.CharField(
        max_length=20, 
        choices=EDUCATION_CHOICES, 
        blank=True, 
        null=True
    )
    skills = models.TextField(blank=True, null=True)
    country = CountryField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

# Landlord Model
class Landlord(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='landlord_profile',
        null=True,
        blank=True
    )
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', 
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    
    first_name = models.CharField(max_length=150)
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    other_names = models.CharField(max_length=150, blank=True, null=True)
    
    id_number = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="National ID or Passport Number"
    )
    
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        unique=True
    )
    
    physical_address = models.CharField(max_length=200)
    aob = models.CharField(
        max_length=200, 
        verbose_name="Area of Business", 
        blank=True, 
        null=True
    )
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.first_name} {self.middle_name or ''}"
    
    class Meta:
        verbose_name = 'Landlord'
        verbose_name_plural = 'Landlords'
        ordering = ['first_name']

# ApartmentType Model
class ApartmentType(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name="Apartment Type Name"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Type Description"
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Apartment Type'
        verbose_name_plural = 'Apartment Types'
        ordering = ['name']

# Apartment Model
class Apartment(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name="Apartment Name"
    )
    apartment_type = models.ForeignKey(
        ApartmentType, 
        on_delete=models.PROTECT, 
        related_name="apartments"
    )
    location = models.CharField(
        max_length=200, 
        verbose_name="Specific Location Details"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Apartment Description"
    )
    owner = models.ForeignKey(
        Landlord, 
        on_delete=models.CASCADE, 
        related_name="apartments"
    )
    management_fee_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100)
        ],
        verbose_name="Management Fee Percentage"
    )
    total_houses = models.PositiveIntegerField(
        default=0, 
        verbose_name="Total Number of Houses"
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.location}"

    def save(self, *args, **kwargs):
        # Update total houses count
        if hasattr(self, 'houses'):
            self.total_houses = self.houses.count()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Apartment'
        verbose_name_plural = 'Apartments'
        ordering = ['name']

# HouseType Model
class HouseType(models.Model):
    name = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name="House Type Name"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Type Description"
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'House Type'
        verbose_name_plural = 'House Types'
        ordering = ['name']

# Tenant Model
class Tenant(models.Model):
    OCCUPATION_CHOICES = [
        ('employed', 'Employed'),
        ('self_employed', 'Self Employed'),
        ('student', 'Student'),
        ('retired', 'Retired'),
        ('unemployed', 'Unemployed'),
        ('other', 'Other'),
    ]
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$', 
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='tenant_profile',
        null=True,  
        blank=True  
    )
    
    id_number_or_passport = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="National ID or Passport Number",
        null=True,  
        blank=True 

    )
    
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        unique=True,
         default='+000000000'
    )
    
    physical_address = models.CharField(
        max_length=200,
        default='Not Provided'
        )
    
    occupation = models.CharField(
        choices=OCCUPATION_CHOICES, 
        max_length=150,
        null=True,
        blank=True
    )
    
    workplace = models.CharField(
        max_length=150, 
        blank=True, 
        null=True
    )
    
    emergency_contact_phone = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        blank=True, 
        null=True
    )
    
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() if self.user else 'Unnamed Tenant'} - ID: {self.id_number_or_passport}"

    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['date_added']

# House Model
class House(models.Model):
    STATUS_CHOICES = [
        ('vacant', 'Vacant'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Under Maintenance')
    ]

    apartment = models.ForeignKey(
        Apartment, 
        on_delete=models.CASCADE, 
        related_name="houses"
    )
    number = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="House Number"
    )
    monthly_rent = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    deposit_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        blank=True, 
        null=True,
        validators=[MinValueValidator(0)]
    )
    house_type = models.ForeignKey(
        HouseType, 
        on_delete=models.PROTECT, 
        related_name="houses"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="House Description"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='vacant'
    )
    tenant = models.OneToOneField(
        Tenant, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="rented_house"
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"House {self.number} - {self.apartment.name}"

    def save(self, *args, **kwargs):
        # Automatically update status based on tenant
        if self.tenant:
            self.status = 'occupied'
        else:
            self.status = 'vacant'
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'House'
        verbose_name_plural = 'Houses'
        ordering = ['apartment', 'number']

# HouseBooking Model
class HouseBooking(models.Model):
    house = models.ForeignKey(
        House, 
        on_delete=models.CASCADE, 
        related_name="bookings"
    )
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="bookings"
    )
    deposit_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    rent_amount_paid = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Booking: {self.tenant} - {self.house}'

    class Meta:
        verbose_name = 'House Booking'
        verbose_name_plural = 'House Bookings'
        ordering = ['-date_added']

# Invoice Model
class Invoice(models.Model):
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="invoices"
    )
    house = models.ForeignKey(
        House, 
        on_delete=models.CASCADE, 
        related_name="invoices"
    )
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    rent = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    total_payable = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    paid = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Invoice {self.id} for {self.tenant}'

    class Meta:
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-date_added']

# Signals to create profile automatically
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)