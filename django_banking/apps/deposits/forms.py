from django import forms
from decimal import Decimal
from .models import FixedDeposit, RecurringDeposit
from apps.banking.models import Account

class FixedDepositForm(forms.ModelForm):
    linked_account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    principal_amount = forms.DecimalField(
        min_value=Decimal('500.00'),
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '100.00'})
    )
    tenure_months = forms.ChoiceField(
        choices=[
            (6, '6 Months @ 5.5% p.a.'),
            (12, '12 Months @ 6.5% p.a.'),
            (24, '24 Months @ 7.0% p.a.'),
            (36, '36 Months @ 7.25% p.a.'),
            (60, '60 Months @ 7.50% p.a.'),
        ],
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    class Meta:
        model = FixedDeposit
        fields = ['linked_account', 'principal_amount', 'tenure_months']

    def __init__(self, *args, **kwargs):
        customer = kwargs.pop('customer', None)
        super().__init__(*args, **kwargs)
        if customer:
            self.fields['linked_account'].queryset = customer.accounts.filter(status='ACTIVE')
