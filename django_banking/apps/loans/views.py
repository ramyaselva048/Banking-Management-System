from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from decimal import Decimal

from .models import Loan, LoanStatus, LoanType
from .forms import LoanApplicationForm, LoanDisburseForm, LoanRepayForm
from .services import LoanService
from apps.accounts.decorators import staff_required
from apps.accounts.models import UserRole

@login_required
def loan_list_view(request):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        loans = user.customer_profile.loans.all()
    else:
        loans = Loan.objects.select_related('customer', 'customer__user').all()

    status_filter = request.GET.get('status')
    if status_filter:
        loans = loans.filter(status=status_filter)

    paginator = Paginator(loans, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'loans/loan_list.html', {
        'page_obj': page_obj,
        'statuses': LoanStatus.choices,
        'selected_status': status_filter
    })


@login_required
def loan_detail_view(request, pk):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        loan = get_object_or_404(Loan, pk=pk, customer=user.customer_profile)
    else:
        loan = get_object_or_404(Loan, pk=pk)

    repayments = loan.repayments.all()
    repay_form = LoanRepayForm(customer=loan.customer) if loan.status == LoanStatus.DISBURSED else None
    disburse_form = LoanDisburseForm(customer=loan.customer) if loan.status == LoanStatus.APPROVED else None

    return render(request, 'loans/loan_detail.html', {
        'loan': loan,
        'repayments': repayments,
        'repay_form': repay_form,
        'disburse_form': disburse_form,
    })


@login_required
def loan_apply_view(request):
    if not hasattr(request.user, 'customer_profile'):
        messages.error(request, "Only registered bank customers can submit loan applications.")
        return redirect('loans:loan_list')

    profile = request.user.customer_profile
    if request.method == 'POST':
        form = LoanApplicationForm(request.POST)
        if form.is_valid():
            loan = LoanService.apply_for_loan(
                customer=profile,
                loan_type=form.cleaned_data['loan_type'],
                amount=form.cleaned_data['amount'],
                tenure_months=form.cleaned_data['tenure_months'],
                interest_rate=form.cleaned_data['interest_rate'],
                purpose=form.cleaned_data['purpose']
            )
            messages.success(request, f"Loan application #{loan.loan_id} submitted successfully! Our loan department will review.")
            return redirect('loans:loan_detail', pk=loan.pk)
    else:
        form = LoanApplicationForm()
    return render(request, 'loans/loan_apply.html', {'form': form})


@login_required
@staff_required
def loan_approve_view(request, pk):
    loan = get_object_or_404(Loan, pk=pk)
    if request.method == 'POST':
        try:
            LoanService.approve_loan(loan.id, request.user)
            messages.success(request, f"Loan #{loan.loan_id} has been APPROVED.")
        except ValidationError as e:
            messages.error(request, str(e.message if hasattr(e, 'message') else e))
    return redirect('loans:loan_detail', pk=loan.pk)


@login_required
@staff_required
def loan_reject_view(request, pk):
    loan = get_object_or_404(Loan, pk=pk)
    if request.method == 'POST':
        reason = request.POST.get('rejection_reason', 'Did not meet credit criteria.')
        try:
            LoanService.reject_loan(loan.id, reason, request.user)
            messages.warning(request, f"Loan #{loan.loan_id} was REJECTED.")
        except ValidationError as e:
            messages.error(request, str(e.message if hasattr(e, 'message') else e))
    return redirect('loans:loan_detail', pk=loan.pk)


@login_required
@staff_required
def loan_disburse_view(request, pk):
    loan = get_object_or_404(Loan, pk=pk)
    if request.method == 'POST':
        form = LoanDisburseForm(request.POST, customer=loan.customer)
        if form.is_valid():
            target_acc = form.cleaned_data['target_account']
            try:
                LoanService.disburse_loan(
                    loan_id=loan.id,
                    target_account_id=target_acc.id,
                    staff_user=request.user,
                    ip=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"Loan funds of ${loan.amount:,.2f} disbursed directly to account {target_acc.account_number}!")
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    return redirect('loans:loan_detail', pk=loan.pk)


@login_required
def loan_repay_view(request, pk):
    loan = get_object_or_404(Loan, pk=pk)
    if request.method == 'POST':
        form = LoanRepayForm(request.POST, customer=loan.customer)
        if form.is_valid():
            src_acc = form.cleaned_data['source_account']
            try:
                LoanService.pay_emi(
                    loan_id=loan.id,
                    source_account_id=src_acc.id,
                    user=request.user,
                    ip=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"Monthly EMI payment of ${loan.monthly_emi:,.2f} received for Loan #{loan.loan_id}.")
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    return redirect('loans:loan_detail', pk=loan.pk)
