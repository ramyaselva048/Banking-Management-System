from django.conf import settings
from .models import Notification

def banking_context(request):
    """Global template variables for banking context."""
    unread_notifications = 0
    recent_notifications = []
    if request.user.is_authenticated:
        recent_notifications = Notification.objects.filter(user=request.user, is_read=False)[:5]
        unread_notifications = Notification.objects.filter(user=request.user, is_read=False).count()

    return {
        'BANK_NAME': getattr(settings, 'BANK_NAME', 'Apex National Bank'),
        'BANK_CODE': getattr(settings, 'BANK_CODE', 'APEX'),
        'BASE_CURRENCY': getattr(settings, 'BASE_CURRENCY', '$'),
        'unread_notifications_count': unread_notifications,
        'recent_notifications': recent_notifications,
    }
