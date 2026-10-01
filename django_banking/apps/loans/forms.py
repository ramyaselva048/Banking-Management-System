from django import forms
from decimal import Decimal
from .models import Loan, LoanType
from apps.banking.models import Account

class LoanApplicationForm(forms.ModelForm):
    amount = forms.DecimalField(
        min_value=Decimal('500.00'), max_value=Decimal('5000000.00'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '100.00'})
    )
    tenure_months = forms.IntegerField(
        min_value=6, max_value=360,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )
    interest_rate = forms.DecimalField(
        min_value=Decimal('1.00'), max_value=Decimal('35.00'), initial=Decimal('8.50'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'})
    )
    purpose = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Describe purpose of loan and repayment plan'})
    )

    class Meta:
        model = Loan
        fields = ['loan_type', 'amount', 'interest_rate', 'tenure_months', 'purpose']
        widgets = {
            'loan_type': forms.Select(attrs={'class': 'form-select'}),
        }


class LoanDisburseForm(forms.Form):
    target_account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    def __init__(self, *args, **kwargs):
        customer = kwargs.pop('customer', None)
        super().__init__(*args, **kwargs)
        if customer:
            self.fields['target_account'].queryset = customer.accounts.filter(status='ACTIVE')


class LoanRepayForm(forms.Form):
    source_account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    def __init__(self, *args, **kwargs):
        customer = kwargs.pop('customer', None)
        super().__init__(*args, **kwargs)
        if customer:
            self.fields['source_account'].queryset = customer.accounts.filter(status='ACTIVE')
