from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid
from apps.accounts.models import CustomerProfile
from apps.banking.models import Account

class DepositStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    MATURED = 'MATURED', _('Matured')
    CLOSED_PREMATURE = 'CLOSED_PREMATURE', _('Closed Prematurely')


class FixedDeposit(models.Model):
    fd_number = models.CharField(max_length=30, unique=True, editable=False)
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='fixed_deposits')
    linked_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_fds')
    principal_amount = models.DecimalField(max_digits=16, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('6.50'))
    tenure_months = models.PositiveIntegerField(help_text=_("Tenure in months"))
    maturity_amount = models.DecimalField(max_digits=16, decimal_places=2)
    total_interest = models.DecimalField(max_digits=16, decimal_places=2)
    status = models.CharField(max_length=25, choices=DepositStatus.choices, default=DepositStatus.ACTIVE)
    start_date = models.DateField(auto_now_add=True)
    maturity_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.fd_number:
            self.fd_number = f"FD{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.fd_number} - Principal: ${self.principal_amount:,.2f} [Maturity: ${self.maturity_amount:,.2f}]"


class RecurringDeposit(models.Model):
    rd_number = models.CharField(max_length=30, unique=True, editable=False)
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='recurring_deposits')
    linked_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_rds')
    monthly_installment = models.DecimalField(max_digits=14, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.80'))
    tenure_months = models.PositiveIntegerField()
    installments_paid = models.PositiveIntegerField(default=1)
    total_deposited = models.DecimalField(max_digits=16, decimal_places=2)
    maturity_amount = models.DecimalField(max_digits=16, decimal_places=2)
    status = models.CharField(max_length=25, choices=DepositStatus.choices, default=DepositStatus.ACTIVE)
    start_date = models.DateField(auto_now_add=True)
    maturity_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.rd_number:
            self.rd_number = f"RD{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.rd_number} - ${self.monthly_installment:,.2f}/mo ({self.installments_paid}/{self.tenure_months})"
