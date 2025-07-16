# backend/users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Реєстрація та активація
    path('register/', views.RegisterView.as_view(), name='register'),
    path('activate/', views.ActivateUserView.as_view(), name='activate'),
    
    # Авторизація
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    
    # Довідники
    path('departments/', views.DepartmentListView.as_view(), name='departments'),
    
    # Користувачі (для адмінів)
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    
    # Дії адміна
    path('users/<int:user_id>/approve/', views.approve_user, name='approve-user'),
    path('users/<int:user_id>/decline/', views.decline_user, name='decline-user'),
    
    # Створення адміністратора (тільки для суперадміна)
    path('create-admin/', views.create_admin_user, name='create-admin'),
]