from django.contrib import admin
from django.contrib.admin.models import LogEntry, DELETION
from django.utils.html import escape
from django.urls import reverse
from django.utils.safestring import mark_safe
from import_export.admin import ImportExportModelAdmin
from .models import (
    Profile, HouseBooking, Landlord, Invoice, 
    Tenant, ApartmentType, Apartment, HouseType, House
)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_filter = ('user', 'studied_at', 'county', 'location', 'phone')
    search_fields = ('user__username', 'user__email')
    list_display = (
        'user', 'studied_at', 'county', 'location',
        'phone', 'occupation', 'education'
    )

@admin.register(ApartmentType)
class ApartmentTypeAdmin(ImportExportModelAdmin):
    list_filter = ('name', 'date_added')
    search_fields = ('name',)
    list_display = ('name', 'date_added')

@admin.register(Apartment)
class ApartmentAdmin(ImportExportModelAdmin):
    list_filter = ('name', 'location', 'owner', 'management_fee_percentage', 'date_added')
    search_fields = ('name', 'location', 'description')
    list_display = ('name', 'owner', 'location', 'description', 'management_fee_percentage', 'date_added')

@admin.register(HouseType)
class HouseTypeAdmin(ImportExportModelAdmin):
    list_filter = ('name', 'date_added')
    search_fields = ('name',)
    list_display = ('name', 'date_added')

@admin.register(House)
class HouseAdmin(ImportExportModelAdmin):
    list_filter = ('apartment', 'number', 'monthly_rent', 'occupied', 'date_added')
    search_fields = ('number', 'description')
    list_display = ('number', 'apartment', 'monthly_rent', 'deposit_amount', 'house_type', 'occupied', 'tenant')

@admin.register(Landlord)
class LandlordAdmin(ImportExportModelAdmin):
    list_filter = ('date_added',)
    list_display = ['first_name', 'middle_name', 'id_number', 'email', 'phone_number']
    search_fields = ['first_name', 'middle_name', 'other_names', 'email', 'phone_number']
    # Update any other admin configurations that reference 'user'

@admin.register(Tenant)
class TenantAdmin(ImportExportModelAdmin):
    list_filter = ('occupation', 'date_added')
    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name')
    list_display = ('user', 'occupation', 'date_added')

@admin.register(HouseBooking)
class HouseBookingAdmin(ImportExportModelAdmin):
    list_filter = ('tenant', 'house', 'date_added')
    search_fields = ('tenant__user__username', 'house__number')
    list_display = ('tenant', 'house', 'deposit_amount', 'rent_amount_paid', 'date_added')

@admin.register(Invoice)
class InvoiceAdmin(ImportExportModelAdmin):
    list_filter = ('month', 'year', 'paid', 'date_added')
    search_fields = ('tenant__user__username', 'house__number')
    list_display = ('tenant', 'house', 'month', 'year', 'rent', 'total_payable', 'paid', 'date_added')

@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    date_hierarchy = 'action_time'
    list_filter = ['user', 'content_type', 'action_flag']
    search_fields = ['object_repr', 'change_message']
    list_display = ['action_time', 'user', 'content_type', 'object_link', 'action_flag']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def object_link(self, obj):
        """ Create a link to the object if it wasn't deleted """
        if obj.action_flag == DELETION:
            link = escape(obj.object_repr)
        else:
            ct = obj.content_type
            link = '<a href="%s">%s</a>' % (
                reverse('admin:%s_%s_change' % (ct.app_label, ct.model), args=[obj.object_id]),
                escape(obj.object_repr),
            )
        return mark_safe(link)

    object_link.admin_order_field = "object_repr"
    object_link.short_description = "Object"