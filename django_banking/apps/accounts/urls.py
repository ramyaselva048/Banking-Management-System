from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),
    
    # Customer Management
    path('customers/', views.customer_list_view, name='customer_list'),
    path('customers/add/', views.customer_create_view, name='customer_create'),
    path('customers/<int:pk>/', views.customer_detail_view, name='customer_detail'),
    path('customers/<int:pk>/edit/', views.customer_update_view, name='customer_update'),
    path('customers/<int:pk>/delete/', views.customer_delete_view, name='customer_delete'),
    
    # Branch Management
    path('branches/', views.branch_list_view, name='branch_list'),
    path('branches/add/', views.branch_create_view, name='branch_create'),
    path('branches/<int:pk>/edit/', views.branch_update_view, name='branch_update'),
]
