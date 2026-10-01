from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from .models import UserRole

def role_required(allowed_roles=[]):
    """Decorator to enforce role-based access control."""
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('accounts:login')
            if request.user.role in allowed_roles or request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            messages.error(request, "Access Denied: You do not possess the required permissions to view this resource.")
            raise PermissionDenied
        return _wrapped_view
    return decorator

def admin_required(view_func):
    return role_required([UserRole.ADMIN])(view_func)

def staff_required(view_func):
    return role_required([UserRole.ADMIN, UserRole.STAFF])(view_func)

def customer_required(view_func):
    return role_required([UserRole.CUSTOMER])(view_func)
