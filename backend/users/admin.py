from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Department, AdminDepartmentAccess

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role', 'tender_number', 'company_name', 'status', 'is_activated']
    list_filter = ['role', 'status', 'is_activated', 'department', 'is_staff', 'is_superuser']
    search_fields = ['email', 'username', 'tender_number', 'company_name']
    
    # Розділити користувачів по типам
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Показувати всіх користувачів для суперадміна
        return qs
    
    # Додати можливість створювати адмінів підрозділів
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Тендерна інформація', {
            'fields': ('tender_number', 'department', 'status', 'role')
        }),
        ('Дані компанії (тільки для зовнішніх користувачів)', {
            'fields': ('company_name', 'edrpou', 'legal_address', 'actual_address', 
                      'director_name', 'contact_person', 'phone'),
            'classes': ('collapse',)
        }),
        ('Активація', {
            'fields': ('is_activated', 'activation_token', 'activation_expires'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Додаткові поля', {
            'fields': ('email', 'role', 'department')
        }),
    )

# Створимо окремі проксі моделі для різних типів користувачів
class TenderUser(User):
    """Зовнішні користувачі (переможці тендерів)"""
    class Meta:
        proxy = True
        verbose_name = "Переможець тендеру"
        verbose_name_plural = "Переможці тендерів"

class AdminUser(User):
    """Адміністратори підрозділів"""
    class Meta:
        proxy = True
        verbose_name = "Адміністратор підрозділу"
        verbose_name_plural = "Адміністратори підрозділів"

@admin.register(TenderUser)
class TenderUserAdmin(admin.ModelAdmin):
    """Адмін для зовнішніх користувачів"""
    list_display = ['tender_number', 'company_name', 'email', 'status', 'department_name', 'is_activated', 'created_at']
    list_filter = ['status', 'is_activated', 'department']
    search_fields = ['tender_number', 'company_name', 'email', 'edrpou']
    readonly_fields = ['tender_number', 'created_at', 'updated_at', 'activation_token']
    
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='user')
    
    def department_name(self, obj):
        return obj.department.name if obj.department else '-'
    department_name.short_description = 'Підрозділ'
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('email', 'tender_number', 'status', 'department', 'is_activated')
        }),
        ('Дані компанії', {
            'fields': ('company_name', 'edrpou', 'legal_address', 'actual_address', 
                      'director_name', 'contact_person', 'phone')
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',)
        }),
    )

@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    """Адмін для адміністраторів підрозділів"""
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined']
    list_filter = ['is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_queryset(self, request):
        return super().get_queryset(request).filter(role__in=['admin', 'superadmin'])
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('username', 'email', 'first_name', 'last_name', 'is_active')
        }),
        ('Права доступу', {
            'fields': ('role', 'is_staff', 'is_superuser')
        }),
        ('Пароль', {
            'fields': ('password',),
            'description': 'Для зміни паролю використовуйте форму зміни паролю.'
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # Якщо створюємо нового користувача
            if not obj.role:
                obj.role = 'admin'  # За замовчуванням роль admin
            obj.is_staff = True  # Дозволити доступ до admin панелі
        super().save_model(request, obj, form, change)

@admin.register(AdminDepartmentAccess)
class AdminDepartmentAccessAdmin(admin.ModelAdmin):
    list_display = ['admin', 'admin_email', 'department', 'created_at']
    list_filter = ['department']
    search_fields = ['admin__username', 'admin__email', 'department__name']
    
    def admin_email(self, obj):
        return obj.admin.email
    admin_email.short_description = 'Email адміна'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "admin":
            # Показувати тільки користувачів з роллю admin
            kwargs["queryset"] = User.objects.filter(role='admin')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
