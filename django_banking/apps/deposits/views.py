from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import FixedDeposit, RecurringDeposit, DepositStatus
from .forms import FixedDepositForm
from .services import DepositService
from apps.accounts.models import UserRole

RATE_MAP = {
    6: Decimal('5.50'),
    12: Decimal('6.50'),
    24: Decimal('7.00'),
    36: Decimal('7.25'),
    60: Decimal('7.50'),
}

@login_required
def fd_list_view(request):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        fds = user.customer_profile.fixed_deposits.all()
    else:
        fds = FixedDeposit.objects.select_related('customer', 'customer__user').all()

    paginator = Paginator(fds, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'deposits/fd_list.html', {'page_obj': page_obj})


@login_required
def fd_detail_view(request, pk):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        fd = get_object_or_404(FixedDeposit, pk=pk, customer=user.customer_profile)
    else:
        fd = get_object_or_404(FixedDeposit, pk=pk)
    return render(request, 'deposits/fd_detail.html', {'fd': fd})


@login_required
def fd_create_view(request):
    if not hasattr(request.user, 'customer_profile'):
        messages.error(request, "Only customers can open Fixed Deposits.")
        return redirect('deposits:fd_list')

    profile = request.user.customer_profile
    if request.method == 'POST':
        form = FixedDepositForm(request.POST, customer=profile)
        if form.is_valid():
            tenure = int(form.cleaned_data['tenure_months'])
            rate = RATE_MAP.get(tenure, Decimal('6.50'))
            try:
                fd = DepositService.open_fixed_deposit(
                    customer=profile,
                    linked_account_id=form.cleaned_data['linked_account'].id,
                    principal=form.cleaned_data['principal_amount'],
                    tenure_months=tenure,
                    annual_rate=rate,
                    user=request.user
                )
                messages.success(request, f"Fixed Deposit certificate #{fd.fd_number} opened successfully!")
                return redirect('deposits:fd_detail', pk=fd.pk)
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    else:
        form = FixedDepositForm(customer=profile)
    return render(request, 'deposits/fd_create.html', {'form': form})


@login_required
def fd_close_view(request, pk):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        fd = get_object_or_404(FixedDeposit, pk=pk, customer=user.customer_profile)
    else:
        fd = get_object_or_404(FixedDeposit, pk=pk)

    if request.method == 'POST':
        try:
            DepositService.close_fixed_deposit(fd.id, user=request.user)
            messages.success(request, f"Fixed Deposit #{fd.fd_number} settled successfully.")
        except ValidationError as e:
            messages.error(request, str(e.message if hasattr(e, 'message') else e))
    return redirect('deposits:fd_detail', pk=fd.pk)
