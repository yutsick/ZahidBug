# backend/users/views.py (повна версія)
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid

from .models import User, Department, AdminDepartmentAccess, PasswordResetToken
from .serializers import *

class RegisterView(generics.CreateAPIView):
    """Реєстрація переможця тендеру"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Заявка успішно подана. Очікуйте підтвердження від адміністратора.',
            'tender_number': user.tender_number,
            'user_id': user.id
        }, status=status.HTTP_201_CREATED)

class ActivateUserView(generics.GenericAPIView):
    """Активація користувача через лінк"""
    serializer_class = UserActivationSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        new_username = serializer.validated_data.get('new_username')
        
        try:
            user = User.objects.get(
                activation_token=token,
                is_activated=False,
                activation_expires__gt=timezone.now()
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'Недійсний або прострочений токен активації'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(password)
        user.is_activated = True
        if new_username:
            user.username = new_username
        user.save()
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Акаунт успішно активовано',
            'token': token.key,
            'user': UserSerializer(user).data
        })

class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Успішно вийшли з системи'})
    except:
        return Response({'error': 'Помилка при виході'}, 
                       status=status.HTTP_400_BAD_REQUEST)

class DepartmentListView(generics.ListAPIView):
    """Список підрозділів"""
    queryset = Department.objects.filter(is_active=True)
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

class UserListView(generics.ListAPIView):
    """Список користувачів для адмінів"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if not user.is_admin:
            return User.objects.none()
        
        queryset = User.objects.filter(role='user')
        
        if user.is_superadmin:
            department_filter = self.request.query_params.get('department')
            if department_filter:
                queryset = queryset.filter(department_id=department_filter)
        else:
            accessible_departments = AdminDepartmentAccess.objects.filter(
                admin=user
            ).values_list('department', flat=True)
            queryset = queryset.filter(department__in=accessible_departments)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset.order_by('-created_at')

class UserDetailView(generics.RetrieveUpdateAPIView):
    """Детальна інформація про користувача"""
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'user':
            return User.objects.filter(id=user.id)
        elif user.is_superadmin:
            return User.objects.all()
        elif user.role == 'admin':
            accessible_departments = AdminDepartmentAccess.objects.filter(
                admin=user
            ).values_list('department', flat=True)
            return User.objects.filter(department__in=accessible_departments)
        else:
            return User.objects.none()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_user(request, user_id):
    """Схвалення користувача адміністратором"""
    if not request.user.is_admin:
        return Response({'error': 'Недостатньо прав'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id, role='user')
        
        if request.user.role == 'admin':
            accessible_departments = AdminDepartmentAccess.objects.filter(
                admin=request.user
            ).values_list('department', flat=True)
            
            if user.department_id not in accessible_departments:
                return Response({'error': 'Немає доступу до цього підрозділу'}, 
                               status=status.HTTP_403_FORBIDDEN)
        
        user.create_documents_folder()
        user.activation_token = uuid.uuid4()
        user.activation_expires = timezone.now() + timedelta(days=7)
        user.status = 'in_progress'
        user.save()
        
        activation_link = f"{settings.FRONTEND_URL}/activate/{user.activation_token}"
        
        send_mail(
            'Підтвердження участі в тендері',
            f'''
            Вітаємо!
            
            Ваша заявка на участь в тендері {user.tender_number} схвалена.
            
            Для активації акаунту перейдіть за посиланням:
            {activation_link}
            
            Посилання дійсне протягом 7 днів.
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Користувач схвалений. Лінк активації надіслано на email.'
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Користувач не знайдений'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_user(request, user_id):
    """Відхилення користувача"""
    if not request.user.is_admin:
        return Response({'error': 'Недостатньо прав'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id, role='user')
        
        if request.user.role == 'admin':
            accessible_departments = AdminDepartmentAccess.objects.filter(
                admin=request.user
            ).values_list('department', flat=True)
            
            if user.department_id not in accessible_departments:
                return Response({'error': 'Немає доступу до цього підрозділу'}, 
                               status=status.HTTP_403_FORBIDDEN)
        
        decline_reason = request.data.get('reason', '')
        user.status = 'declined'
        user.save()
        
        send_mail(
            'Відхилення заявки на участь в тендері',
            f'''
            На жаль, ваша заявка на участь в тендері {user.tender_number} відхилена.
            
            {f"Причина: {decline_reason}" if decline_reason else ""}
            
            З повагою,
            Адміністрація
            ''',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({
            'message': 'Користувач відхилений. Повідомлення надіслано на email.'
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Користувач не знайдений'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_admin_user(request):
    """Створення адміністратора підрозділу (тільки для суперадміна)"""
    if not request.user.is_superadmin:
        return Response({'error': 'Тільки суперадмін може створювати адміністраторів'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    data = request.data
    required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    # Перевірка обов'язкових полів
    for field in required_fields:
        if not data.get(field):
            return Response({'error': f'Поле {field} обов\'язкове'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    # Перевірка унікальності
    if User.objects.filter(username=data['username']).exists():
        return Response({'error': 'Користувач з таким логіном вже існує'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=data['email']).exists():
        return Response({'error': 'Користувач з таким email вже існує'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Валідація паролю
    try:
        validate_password(data['password'])
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
    
    # Створення користувача
    try:
        user = User.objects.create(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role='admin',
            is_staff=True,
            is_activated=True
        )
        user.set_password(data['password'])
        user.save()
        
        # Якщо вказані підрозділи, додати доступ
        department_ids = data.get('departments', [])
        for dept_id in department_ids:
            try:
                department = Department.objects.get(id=dept_id)
                AdminDepartmentAccess.objects.create(admin=user, department=department)
            except Department.DoesNotExist:
                pass
        
        return Response({
            'message': 'Адміністратор створений успішно',
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)