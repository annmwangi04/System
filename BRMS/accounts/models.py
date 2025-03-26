from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django_countries.fields import CountryField

# Profile Model - connected to built-in User
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    picture = models.ImageField(upload_to='pics', default="np_pic.png")
    studied_at = models.CharField(max_length=200, blank=True, null=True)
    county = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    my_profile = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    occupation = models.CharField(max_length=200, blank=True, null=True)
    education = models.CharField(max_length=200, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    country = CountryField(blank=True, null=True)

    def __str__(self):
        return self.user.username

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

# Landlord Model
class Landlord(models.Model):
    first_name = models.CharField(max_length=150, default='Unknown')
    middle_name = models.CharField(max_length=150, default='Unknown')
    other_names = models.CharField(max_length=150, blank=True, null=True)
    id_number = models.IntegerField(unique=True, default=0)  # Changed from id_Number
    email = models.EmailField(unique=True, default='unknown@example.com')
    phone_number = models.CharField(max_length=200, unique=True, default='0000000000')
    physical_address = models.CharField(max_length=200, default='Unknown')
    aob = models.CharField(max_length=200, blank=True, null=True)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.first_name} {self.middle_name}"
    
    class Meta:
        verbose_name = 'Landlord'
        verbose_name_plural = 'Landlords'
# Apartment Type
class ApartmentType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Apartment Model
class Apartment(models.Model):
    name = models.CharField(max_length=100, unique=True)
    apartment_type = models.ForeignKey(ApartmentType, on_delete=models.CASCADE, related_name="apartments")
    location = models.CharField(max_length=100, default='e.g Opp Equity Bank')
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(Landlord, on_delete=models.CASCADE, related_name="apartments")
    management_fee_percentage = models.PositiveIntegerField()
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# House Type
class HouseType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# House Model
class House(models.Model):
    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name="houses")
    number = models.CharField(max_length=50, unique=True)
    monthly_rent = models.PositiveIntegerField()
    deposit_amount = models.PositiveIntegerField(blank=True, null=True)
    house_type = models.ForeignKey(HouseType, on_delete=models.CASCADE, related_name="houses")
    description = models.TextField(blank=True, null=True)
    occupied = models.BooleanField(default=False)
    tenant = models.OneToOneField('Tenant', on_delete=models.SET_NULL, null=True, blank=True, related_name="rented_house")
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'House {self.number} in {self.apartment.name}'

# Tenant Model
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
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tenant_profile')
    id_number_or_passport = models.CharField(max_length=50, unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=200, unique=True, null=True, blank=True)  # Made nullable
    physical_address = models.CharField(max_length=200, null=True, blank=True)  # Also made nullable
    occupation = models.CharField(choices=OCCUPATION_CHOICES, max_length=150, blank=True, null=True)
    workplace = models.CharField(max_length=150, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=150, blank=True, null=True)
    date_added = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} - ID: {self.id_number_or_passport}"
    
    class Meta:
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'

# House Booking Model
class HouseBooking(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name="bookings")
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="bookings")
    deposit_amount = models.PositiveIntegerField()
    rent_amount_paid = models.PositiveIntegerField()
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Booking: {self.tenant} - {self.house}'

# Invoice Model
class Invoice(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="invoices")
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name="invoices")
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    rent = models.PositiveIntegerField()
    total_payable = models.PositiveIntegerField()
    paid = models.BooleanField(default=False)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Invoice {self.id} for {self.tenant}'