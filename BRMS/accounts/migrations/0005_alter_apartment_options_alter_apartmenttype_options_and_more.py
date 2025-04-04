# Generated by Django 5.1.7 on 2025-03-28 13:11

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_alter_tenant_user'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='apartment',
            options={'ordering': ['name'], 'verbose_name': 'Apartment', 'verbose_name_plural': 'Apartments'},
        ),
        migrations.AlterModelOptions(
            name='apartmenttype',
            options={'ordering': ['name'], 'verbose_name': 'Apartment Type', 'verbose_name_plural': 'Apartment Types'},
        ),
        migrations.AlterModelOptions(
            name='house',
            options={'ordering': ['apartment', 'number'], 'verbose_name': 'House', 'verbose_name_plural': 'Houses'},
        ),
        migrations.AlterModelOptions(
            name='housebooking',
            options={'ordering': ['-date_added'], 'verbose_name': 'House Booking', 'verbose_name_plural': 'House Bookings'},
        ),
        migrations.AlterModelOptions(
            name='housetype',
            options={'ordering': ['name'], 'verbose_name': 'House Type', 'verbose_name_plural': 'House Types'},
        ),
        migrations.AlterModelOptions(
            name='invoice',
            options={'ordering': ['-date_added'], 'verbose_name': 'Invoice', 'verbose_name_plural': 'Invoices'},
        ),
        migrations.AlterModelOptions(
            name='landlord',
            options={'ordering': ['first_name'], 'verbose_name': 'Landlord', 'verbose_name_plural': 'Landlords'},
        ),
        migrations.AlterModelOptions(
            name='tenant',
            options={'ordering': ['date_added'], 'verbose_name': 'Tenant', 'verbose_name_plural': 'Tenants'},
        ),
        migrations.RemoveField(
            model_name='house',
            name='occupied',
        ),
        migrations.AddField(
            model_name='apartment',
            name='total_houses',
            field=models.PositiveIntegerField(default=0, verbose_name='Total Number of Houses'),
        ),
        migrations.AddField(
            model_name='apartmenttype',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='Type Description'),
        ),
        migrations.AddField(
            model_name='house',
            name='status',
            field=models.CharField(choices=[('vacant', 'Vacant'), ('occupied', 'Occupied'), ('maintenance', 'Under Maintenance')], default='vacant', max_length=20),
        ),
        migrations.AddField(
            model_name='housetype',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='Type Description'),
        ),
        migrations.AddField(
            model_name='landlord',
            name='user',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='landlord_profile', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='apartment',
            name='apartment_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='apartments', to='accounts.apartmenttype'),
        ),
        migrations.AlterField(
            model_name='apartment',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='Apartment Description'),
        ),
        migrations.AlterField(
            model_name='apartment',
            name='location',
            field=models.CharField(max_length=200, verbose_name='Specific Location Details'),
        ),
        migrations.AlterField(
            model_name='apartment',
            name='management_fee_percentage',
            field=models.DecimalField(decimal_places=2, max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)], verbose_name='Management Fee Percentage'),
        ),
        migrations.AlterField(
            model_name='apartment',
            name='name',
            field=models.CharField(max_length=100, unique=True, verbose_name='Apartment Name'),
        ),
        migrations.AlterField(
            model_name='apartmenttype',
            name='name',
            field=models.CharField(max_length=100, unique=True, verbose_name='Apartment Type Name'),
        ),
        migrations.AlterField(
            model_name='house',
            name='deposit_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='house',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='House Description'),
        ),
        migrations.AlterField(
            model_name='house',
            name='house_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='houses', to='accounts.housetype'),
        ),
        migrations.AlterField(
            model_name='house',
            name='monthly_rent',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='house',
            name='number',
            field=models.CharField(max_length=50, unique=True, verbose_name='House Number'),
        ),
        migrations.AlterField(
            model_name='housebooking',
            name='deposit_amount',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='housebooking',
            name='rent_amount_paid',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='housetype',
            name='name',
            field=models.CharField(max_length=100, unique=True, verbose_name='House Type Name'),
        ),
        migrations.AlterField(
            model_name='invoice',
            name='rent',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='invoice',
            name='total_payable',
            field=models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='aob',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='Area of Business'),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='email',
            field=models.EmailField(max_length=254, unique=True),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='first_name',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='id_number',
            field=models.CharField(help_text='National ID or Passport Number', max_length=50, unique=True),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='middle_name',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='phone_number',
            field=models.CharField(max_length=17, unique=True, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')]),
        ),
        migrations.AlterField(
            model_name='landlord',
            name='physical_address',
            field=models.CharField(max_length=200),
        ),
        migrations.AlterField(
            model_name='profile',
            name='education',
            field=models.CharField(blank=True, choices=[('high_school', 'High School'), ('bachelor', "Bachelor's Degree"), ('master', "Master's Degree"), ('phd', 'PhD'), ('other', 'Other')], max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name='profile',
            name='phone',
            field=models.CharField(blank=True, max_length=17, null=True, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')]),
        ),
        migrations.AlterField(
            model_name='profile',
            name='picture',
            field=models.ImageField(blank=True, default='np_pic.png', null=True, upload_to='profile_pics/'),
        ),
        migrations.AlterField(
            model_name='tenant',
            name='emergency_contact_phone',
            field=models.CharField(blank=True, max_length=17, null=True, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')]),
        ),
        migrations.AlterField(
            model_name='tenant',
            name='id_number_or_passport',
            field=models.CharField(blank=True, help_text='National ID or Passport Number', max_length=50, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='tenant',
            name='phone_number',
            field=models.CharField(default='+000000000', max_length=17, unique=True, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')]),
        ),
        migrations.AlterField(
            model_name='tenant',
            name='physical_address',
            field=models.CharField(default='Not Provided', max_length=200),
        ),
    ]
