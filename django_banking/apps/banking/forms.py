from django import forms
from decimal import Decimal
from .models import Account, Beneficiary, AccountType, TransactionType
from apps.accounts.models import CustomerProfile

class AccountCreationForm(forms.ModelForm):
    customer = forms.ModelChoiceField(
        queryset=CustomerProfile.objects.select_related('user').all(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    initial_deposit = forms.DecimalField(
        max_digits=14, decimal_places=2, initial=Decimal('500.00'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'})
    )

    class Meta:
        model = Account
        fields = ['customer', 'account_type', 'interest_rate']
        widgets = {
            'account_type': forms.Select(attrs={'class': 'form-select'}),
            'interest_rate': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }


class DepositForm(forms.Form):
    account_number = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter 12-digit Account Number'})
    )
    amount = forms.DecimalField(
        max_digits=14, decimal_places=2, min_value=Decimal('1.00'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': '0.00'})
    )
    description = forms.CharField(
        max_length=200, required=False, initial="Counter Cash Deposit",
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )


class WithdrawalForm(forms.Form):
    account_number = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter Account Number'})
    )
    amount = forms.DecimalField(
        max_digits=14, decimal_places=2, min_value=Decimal('1.00'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': '0.00'})
    )
    description = forms.CharField(
        max_length=200, required=False, initial="Counter Cash Withdrawal",
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )


class TransferForm(forms.Form):
    source_account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    destination_account_number = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '12-digit Recipient Account Number'})
    )
    amount = forms.DecimalField(
        max_digits=14, decimal_places=2, min_value=Decimal('1.00'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'placeholder': '0.00'})
    )
    description = forms.CharField(
        max_length=200, required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Purpose of transfer (e.g. Rent, Invoice, Family)'})
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            if hasattr(user, 'customer_profile'):
                self.fields['source_account'].queryset = user.customer_profile.accounts.filter(status='ACTIVE')
            else:
                self.fields['source_account'].queryset = Account.objects.filter(status='ACTIVE')


class BeneficiaryForm(forms.ModelForm):
    class Meta:
        model = Beneficiary
        fields = ['beneficiary_name', 'account_number', 'bank_name', 'ifsc_code', 'email', 'phone_number']
        widgets = {
            'beneficiary_name': forms.TextInput(attrs={'class': 'form-control'}),
            'account_number': forms.TextInput(attrs={'class': 'form-control'}),
            'bank_name': forms.TextInput(attrs={'class': 'form-control'}),
            'ifsc_code': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone_number': forms.TextInput(attrs={'class': 'form-control'}),
        }


class StatementFilterForm(forms.Form):
    account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    start_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    end_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    transaction_type = forms.ChoiceField(
        choices=[('', 'All Transaction Types')] + list(TransactionType.choices),
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
