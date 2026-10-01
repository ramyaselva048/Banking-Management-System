from django.urls import path
from . import views

app_name = 'deposits'

urlpatterns = [
    path('fixed-deposits/', views.fd_list_view, name='fd_list'),
    path('fixed-deposits/open/', views.fd_create_view, name='fd_create'),
    path('fixed-deposits/<int:pk>/', views.fd_detail_view, name='fd_detail'),
    path('fixed-deposits/<int:pk>/close/', views.fd_close_view, name='fd_close'),
]
