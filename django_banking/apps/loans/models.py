from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import uuid
from apps.accounts.models import CustomerProfile
from apps.banking.models import Account, Transaction

class LoanType(models.TextChoices):
    PERSONAL = 'PERSONAL', _('Personal Loan')
    HOME = 'HOME', _('Home Loan / Mortgage')
    VEHICLE = 'VEHICLE', _('Auto / Vehicle Loan')
    EDUCATION = 'EDUCATION', _('Education Loan')
    BUSINESS = 'BUSINESS', _('Small Business Loan')


class LoanStatus(models.TextChoices):
    PENDING = 'PENDING', _('Pending Review')
    APPROVED = 'APPROVED', _('Approved')
    REJECTED = 'REJECTED', _('Rejected')
    DISBURSED = 'DISBURSED', _('Disbursed & Active')
    CLOSED = 'CLOSED', _('Closed / Fully Paid')


class Loan(models.Model):
    loan_id = models.CharField(max_length=30, unique=True, editable=False)
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='loans')
    loan_type = models.CharField(max_length=30, choices=LoanType.choices, default=LoanType.PERSONAL)
    amount = models.DecimalField(max_digits=16, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text=_("Annual interest rate percentage"))
    tenure_months = models.PositiveIntegerField(help_text=_("Repayment term in months"))
    monthly_emi = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    total_payable = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    total_interest = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=LoanStatus.choices, default=LoanStatus.PENDING)
    purpose = models.CharField(max_length=255, blank=True)
    disbursed_to_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='disbursed_loans')
    rejection_reason = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-applied_at']

    def save(self, *args, **kwargs):
        if not self.loan_id:
            self.loan_id = f"LN{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    @property
    def remaining_balance(self):
        return max(Decimal('0.00'), self.total_payable - self.amount_paid)

    def __str__(self):
        return f"{self.loan_id} ({self.get_loan_type_display()}) - ${self.amount:,.2f} [{self.status}]"


class LoanRepayment(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayments')
    installment_number = models.PositiveIntegerField()
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2)
    principal_component = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    interest_component = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    payment_date = models.DateTimeField(auto_now_add=True)
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['installment_number']

    def __str__(self):
        return f"Installment #{self.installment_number} for {self.loan.loan_id} - ${self.amount_paid:,.2f}"
