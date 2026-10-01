from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', _('System Administrator')
    STAFF = 'STAFF', _('Bank Staff / Officer')
    CUSTOMER = 'CUSTOMER', _('Bank Customer')

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        help_text=_("Role determining system access permissions.")
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_bank_admin(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_bank_staff(self):
        return self.role in [UserRole.ADMIN, UserRole.STAFF] or self.is_staff

    @property
    def is_bank_customer(self):
        return self.role == UserRole.CUSTOMER

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class Branch(models.Model):
    name = models.CharField(max_length=150)
    branch_code = models.CharField(max_length=20, unique=True)
    ifsc_code = models.CharField(max_length=20, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=25)
    email = models.EmailField()
    manager_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Branches"
        ordering = ['branch_code']

    def __str__(self):
        return f"{self.name} ({self.branch_code})"


class KYCStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending Verification')
    VERIFIED = 'VERIFIED', _('Verified')
    REJECTED = 'REJECTED', _('Rejected')


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    customer_id = models.CharField(max_length=30, unique=True, editable=False)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=15, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], default='Male')
    id_type = models.CharField(max_length=50, default='National ID / Passport')
    id_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    annual_income = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    kyc_status = models.CharField(max_length=20, choices=KYCStatus.choices, default=KYCStatus.PENDING)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.customer_id:
            self.customer_id = f"CUST{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_id} - {self.user.get_full_name() or self.user.username}"


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(max_length=30, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    department = models.CharField(max_length=100, default='Retail Banking')
    designation = models.CharField(max_length=100, default='Bank Officer')
    joining_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"
