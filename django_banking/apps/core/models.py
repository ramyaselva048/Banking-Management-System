from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=20, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def log(cls, user, action, description, ip_address=None, status='SUCCESS'):
        return cls.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            description=description,
            ip_address=ip_address,
            status=status
        )

    def __str__(self):
        user_name = self.user.username if self.user else "System"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {user_name} - {self.action}"


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def send(cls, user, title, message, link=None):
        return cls.objects.create(user=user, title=title, message=message, link=link)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({'Read' if self.is_read else 'Unread'})"
