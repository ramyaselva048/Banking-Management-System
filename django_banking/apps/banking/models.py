from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid
from apps.accounts.models import CustomerProfile

class AccountType(models.TextChoices):
    SAVINGS = 'SAVINGS', _('Savings Account')
    CURRENT = 'CURRENT', _('Current / Checking Account')
    FIXED_DEPOSIT = 'FIXED_DEPOSIT', _('Fixed Deposit Account')
    RECURRING_DEPOSIT = 'RECURRING_DEPOSIT', _('Recurring Deposit Account')


class AccountStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', _('Active')
    DORMANT = 'DORMANT', _('Dormant')
    FROZEN = 'FROZEN', _('Frozen / Blocked')
    CLOSED = 'CLOSED', _('Closed')


class Account(models.Model):
    account_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='accounts')
    account_type = models.CharField(max_length=25, choices=AccountType.choices, default=AccountType.SAVINGS)
    currency = models.CharField(max_length=5, default='USD')
    balance = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    minimum_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('100.00'))
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('3.50'))
    status = models.CharField(max_length=20, choices=AccountStatus.choices, default=AccountStatus.ACTIVE)
    daily_transfer_limit = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('50000.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account_number} ({self.get_account_type_display()}) - {self.customer.user.get_full_name()} [${self.balance:,.2f}]"

    @property
    def available_balance(self):
        """Calculates balance available for withdrawal above minimum balance requirement."""
        available = self.balance - self.minimum_balance
        return max(Decimal('0.00'), available)


class TransactionType(models.TextChoices):
    DEPOSIT = 'DEPOSIT', _('Deposit')
    WITHDRAWAL = 'WITHDRAWAL', _('Withdrawal')
    TRANSFER_IN = 'TRANSFER_IN', _('Transfer Received')
    TRANSFER_OUT = 'TRANSFER_OUT', _('Transfer Sent')
    LOAN_DISBURSEMENT = 'LOAN_DISBURSEMENT', _('Loan Disbursed')
    EMI_PAYMENT = 'EMI_PAYMENT', _('Loan EMI Repayment')
    FD_INTEREST = 'FD_INTEREST', _('Fixed Deposit Interest')


class TransactionStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending')
    COMPLETED = 'COMPLETED', _('Completed')
    FAILED = 'FAILED', _('Failed')
    REVERSED = 'REVERSED', _('Reversed')


class Transaction(models.Model):
    reference_id = models.CharField(max_length=36, unique=True, editable=False)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    recipient_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transfers')
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=16, decimal_places=2)
    balance_after = models.DecimalField(max_digits=16, decimal_places=2)
    description = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.COMPLETED)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.reference_id:
            self.reference_id = f"TXN{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_id} - {self.transaction_type} (${self.amount:,.2f}) [{self.status}]"


class Beneficiary(models.Model):
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='beneficiaries')
    beneficiary_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=30)
    bank_name = models.CharField(max_length=150, default='Apex National Bank')
    ifsc_code = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=25, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Beneficiaries"
        unique_together = ('customer', 'account_number')
        ordering = ['beneficiary_name']

    def __str__(self):
        return f"{self.beneficiary_name} ({self.account_number} - {self.bank_name})"
