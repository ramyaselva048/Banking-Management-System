from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('analytics/', views.analytics_view, name='analytics'),
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/mark-all-read/', views.mark_all_notifications_read, name='mark_all_read'),
    path('audit-logs/', views.audit_log_view, name='audit_logs'),
]
