# backend/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
import uuid
import os


class Department(models.Model):
    """Підрозділи"""
    name = models.CharField(max_length=255, verbose_name=_('Назва підрозділу'))
    code = models.CharField(max_length=50, unique=True, verbose_name=_('Код підрозділу'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Підрозділ')
        verbose_name_plural = _('Підрозділи')
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Розширена модель користувача"""
    STATUS_CHOICES = [
        ('new', _('Новий')),  # Щойно зареєструвався
        ('in_progress', _('В процесі')),  # Акцептований, вносить дані
        ('pending', _('Очікує рішення')),  # Завантажив документи
        ('accepted', _('Підтверджений')),  # Допущений до роботи
        ('declined', _('Відхилений')),  # Відхилений
        ('blocked', _('Заблокований')),  # Заблокований
    ]

    ROLE_CHOICES = [
        ('user', _('Користувач')),
        ('admin', _('Адміністратор')),
        ('superadmin', _('Суперадміністратор')),
    ]

    email = models.EmailField(unique=True, verbose_name=_('Email'))
    phone = models.CharField(max_length=20, blank=True, verbose_name=_('Телефон'))

    # Дані юридичної особи
    company_name = models.CharField(max_length=500, blank=True, verbose_name=_('Назва компанії'))
    edrpou = models.CharField(
        max_length=10,
        blank=True,
        validators=[RegexValidator(r'^\d{8,10}$', 'ЄДРПОУ має містити 8-10 цифр')],
        verbose_name=_('ЄДРПОУ')
    )
    legal_address = models.TextField(blank=True, verbose_name=_('Юридична адреса'))
    actual_address = models.TextField(blank=True, verbose_name=_('Фактична адреса'))
    director_name = models.CharField(max_length=255, blank=True, verbose_name=_('ПІБ директора'))
    contact_person = models.CharField(max_length=255, blank=True, verbose_name=_('Контактна особа'))

    # Тендерна інформація
    tender_number = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('Номер тендеру')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Підрозділ')
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        verbose_name=_('Статус')
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        verbose_name=_('Роль')
    )

    # Активація акаунту
    is_activated = models.BooleanField(default=False, verbose_name=_('Активований'))
    activation_token = models.UUIDField(default=uuid.uuid4, verbose_name=_('Токен активації'))
    activation_expires = models.DateTimeField(null=True, blank=True, verbose_name=_('Токен діє до'))

    # Поля для синхронізації з 1С
    synced_to_1c = models.BooleanField(default=False, verbose_name=_('Синхронізовано з 1С'))
    sync_1c_id = models.CharField(max_length=50, blank=True, verbose_name=_('ID в 1С'))
    last_sync_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Остання синхронізація'))

    # Папка для документів
    documents_folder = models.CharField(max_length=255, blank=True, verbose_name=_('Папка документів'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _('Користувач')
        verbose_name_plural = _('Користувачі')

    def __str__(self):
        return f"{self.tender_number} - {self.company_name or self.email}"

    @property
    def is_admin(self):
        return self.role in ['admin', 'superadmin']

    @property
    def is_superadmin(self):
        return self.role == 'superadmin'

    def create_documents_folder(self):
        """Створення папки для документів"""
        if not self.documents_folder and self.tender_number:
            from django.conf import settings
            folder_name = f"tender_{self.tender_number}"
            folder_path = os.path.join(settings.MEDIA_ROOT, 'tenders', folder_name)

            # Створюємо папку якщо не існує
            os.makedirs(folder_path, exist_ok=True)

            self.documents_folder = folder_name
            self.save(update_fields=['documents_folder'])

        return self.documents_folder

    def get_documents_path(self):
        """Отримання повного шляху до папки документів"""
        if self.documents_folder:
            from django.conf import settings
            return os.path.join(settings.MEDIA_ROOT, 'tenders', self.documents_folder)
        return None


class AdminDepartmentAccess(models.Model):
    """Доступ адміністраторів до підрозділів"""
    admin = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'admin'},
        verbose_name=_('Адміністратор')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        verbose_name=_('Підрозділ')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['admin', 'department']
        verbose_name = _('Доступ адміністратора до підрозділу')
        verbose_name_plural = _('Доступи адміністраторів до підрозділів')

    def __str__(self):
        return f"{self.admin.email} -> {self.department.name}"


class PasswordResetToken(models.Model):
    """Токени для відновлення паролю"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Токен відновлення паролю')
        verbose_name_plural = _('Токени відновлення паролів')

    def is_valid(self):
        """Перевірка чи токен ще дійсний (24 години)"""
        from django.utils import timezone
        from datetime import timedelta
        return (
                not self.used and
                self.created_at > timezone.now() - timedelta(hours=24)
        )


# backend/forms/models.py  
from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User, Department


class DocumentTab(models.Model):
    """Таби для завантаження документів"""
    name = models.CharField(max_length=255, verbose_name=_('Назва табу'))
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        verbose_name=_('Підрозділ')
    )
    order = models.PositiveIntegerField(default=0, verbose_name=_('Порядок відображення'))
    is_required = models.BooleanField(default=True, verbose_name=_('Обов\'язковий'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))

    class Meta:
        verbose_name = _('Таб документів')
        verbose_name_plural = _('Таби документів')
        ordering = ['department', 'order', 'name']

    def __str__(self):
        return f"{self.department.name} - {self.name}"


class DocumentField(models.Model):
    """Поля для завантаження документів у табі"""
    FIELD_TYPES = [
        ('file', _('Файл')),
        ('text', _('Текст')),
        ('number', _('Число')),
        ('date', _('Дата')),
        ('select', _('Вибір')),
    ]

    tab = models.ForeignKey(DocumentTab, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255, verbose_name=_('Назва поля'))
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES, verbose_name=_('Тип поля'))
    is_required = models.BooleanField(default=True, verbose_name=_('Обов\'язкове'))
    order = models.PositiveIntegerField(default=0, verbose_name=_('Порядок'))
    placeholder = models.CharField(max_length=255, blank=True, verbose_name=_('Підказка'))
    validation_rules = models.JSONField(blank=True, null=True, verbose_name=_('Правила валідації'))
    select_options = models.JSONField(blank=True, null=True, verbose_name=_('Варіанти вибору'))

    class Meta:
        verbose_name = _('Поле документа')
        verbose_name_plural = _('Поля документів')
        ordering = ['tab', 'order', 'name']

    def __str__(self):
        return f"{self.tab.name} - {self.name}"


class UserDocument(models.Model):
    """Документи/дані користувача"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name=_('Користувач'))
    tab = models.ForeignKey(DocumentTab, on_delete=models.CASCADE, verbose_name=_('Таб'))
    field = models.ForeignKey(DocumentField, on_delete=models.CASCADE, verbose_name=_('Поле'))

    # Значення залежно від типу поля
    text_value = models.TextField(blank=True, verbose_name=_('Текстове значення'))
    file_value = models.FileField(upload_to='temp/', blank=True, verbose_name=_('Файл'))
    number_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    date_value = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Документ користувача')
        verbose_name_plural = _('Документи користувачів')
        unique_together = ['user', 'field']

    def __str__(self):
        return f"{self.user.tender_number} - {self.field.name}"

    def save(self, *args, **kwargs):
        # Переміщуємо файл в правильну папку користувача
        if self.file_value and self.field.field_type == 'file':
            user_folder = self.user.create_documents_folder()
            if user_folder:
                # Логіка переміщення файлу в правильну папку
                pass
        super().save(*args, **kwargs)


class UserDocumentStatus(models.Model):
    """Статус завантаження документів по табах"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tab = models.ForeignKey(DocumentTab, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False, verbose_name=_('Завершено'))
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'tab']
        verbose_name = _('Статус документів користувача')
        verbose_name_plural = _('Статуси документів користувачів')

# backend/sync_1c/models.py - без змін, як раніше