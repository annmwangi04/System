from django.db import models
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import (
    RegexValidator, 
    MinValueValidator, 
    MaxValueValidator
)
from django_countries.fields import CountryField

# Common phone regex validator to avoid repetition
phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$', 
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)

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

# Role Model (Modified)
class Role(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('landlord', 'Landlord'),
        ('tenant', 'Tenant'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='role')
    role_type = models.CharField(max_length=20, choices=ROLE_CHOICES, default='tenant')
    date_assigned = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_type_display()}"
    
    class Meta:
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'

# Landlord Model
class Landlord(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='landlord_profile',
        null=True,
        blank=True
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
    image = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.location}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update total houses count after saving
        self.total_houses = self.houses.count()
        if self.total_houses > 0:  # Only update if needed to avoid infinite recursion
            models.Model.save(self, *args, **kwargs)

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
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='tenant_profile',
        null=True,  
        blank=True  
    )
    
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    
    id_number_or_passport = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="National ID or Passport Number",
        null=True,  
        blank=True 
    )
    
    email = models.EmailField(unique=True, null=True, blank=True)
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
        if self.user:
            return f"{self.user.get_full_name()} - ID: {self.id_number_or_passport}"
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name} - ID: {self.id_number_or_passport}"
        else:
            return f"Tenant #{self.id} - ID: {self.id_number_or_passport}"

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
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="rented_houses"
    )
    date_added = models.DateTimeField(auto_now_add=True)
    image = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"House {self.number} - {self.apartment.name}"

    def save(self, *args, **kwargs):
        # Automatically update status based on tenant
        if self.tenant:
            self.status = 'occupied'
        elif self.status != 'maintenance':
            self.status = 'vacant'
        super().save(*args, **kwargs)
        
        # Update apartment's total houses count
        self.apartment.save()

    class Meta:
        verbose_name = 'House'
        verbose_name_plural = 'Houses'
        ordering = ['apartment', 'number']
        unique_together = ['apartment', 'number']  # Ensure house numbers are unique within each apartment

# HouseBooking Model
class HouseBooking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
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
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    booking_date = models.DateTimeField(default=timezone.now)
    move_in_date = models.DateField(null=True, blank=True)
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Booking: {self.tenant} - {self.house} ({self.get_status_display()})'

    class Meta:
        verbose_name = 'House Booking'
        verbose_name_plural = 'House Bookings'
        ordering = ['-date_added']

# Invoice Model
class Invoice(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]
    
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
    additional_charges = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    total_payable = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='unpaid'
    )
    due_date = models.DateField(default=timezone.now() + timedelta(days=30))
    date_added = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculate total payable
        self.total_payable = self.rent + self.additional_charges - self.discount
        
        # Update payment status
        if self.amount_paid >= self.total_payable:
            self.payment_status = 'paid'
        elif self.amount_paid > 0:
            self.payment_status = 'partial'
        elif self.due_date and self.due_date < models.functions.Now().date() and self.payment_status == 'unpaid':
            self.payment_status = 'overdue'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Invoice {self.id} for {self.tenant} - {self.month}/{self.year}'

    class Meta:
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-date_added']
        unique_together = ['tenant', 'house', 'month', 'year']  # Prevent duplicate invoices

# Payment Model
class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('credit_card', 'Credit Card'),
        ('other', 'Other')
    ]
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='cash'
    )
    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the invoice payment status
        invoice = self.invoice
        total_payments = sum(payment.amount for payment in invoice.payments.all())
        invoice.amount_paid = total_payments
        invoice.save()
    
    def __str__(self):
        return f"Payment of {self.amount} for Invoice #{self.invoice.id}"
    
    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']

# Signals to create profile and role automatically
@receiver(post_save, sender=User)
def create_user_profile_and_role(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)
        Role.objects.get_or_create(user=instance, defaults={'role_type': 'tenant'})

@receiver(post_save, sender=User)
def save_user_profile_and_role(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)
    
    try:
        instance.role.save()
    except Role.DoesNotExist:
        Role.objects.create(user=instance, role_type='tenant')