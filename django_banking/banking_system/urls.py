"""
Apex Banking System URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', lambda request: redirect('core:dashboard')),
    path('core/', include('apps.core.urls', namespace='core')),
    path('accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('banking/', include('apps.banking.urls', namespace='banking')),
    path('loans/', include('apps.loans.urls', namespace='loans')),
    path('deposits/', include('apps.deposits.urls', namespace='deposits')),
    path('reports/', include('apps.reports.urls', namespace='reports')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
