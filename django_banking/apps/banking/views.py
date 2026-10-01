from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from django.db.models import Q
from decimal import Decimal

from .models import Account, Transaction, Beneficiary, AccountType, TransactionType
from .forms import AccountCreationForm, DepositForm, WithdrawalForm, TransferForm, BeneficiaryForm, StatementFilterForm
from .services import BankingService
from apps.accounts.decorators import staff_required, admin_required
from apps.accounts.models import UserRole

@login_required
def account_list_view(request):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        accounts = user.customer_profile.accounts.all()
    else:
        accounts = Account.objects.select_related('customer', 'customer__user').all()

    account_type_filter = request.GET.get('type')
    search_query = request.GET.get('q', '').strip()

    if account_type_filter:
        accounts = accounts.filter(account_type=account_type_filter)
    if search_query:
        accounts = accounts.filter(
            Q(account_number__icontains=search_query) |
            Q(customer__user__first_name__icontains=search_query) |
            Q(customer__user__last_name__icontains=search_query)
        )

    paginator = Paginator(accounts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'accounts/account_list.html', {
        'page_obj': page_obj,
        'account_types': AccountType.choices,
        'selected_type': account_type_filter,
        'search_query': search_query,
    })


@login_required
def account_detail_view(request, pk):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        account = get_object_or_404(Account, pk=pk, customer=user.customer_profile)
    else:
        account = get_object_or_404(Account, pk=pk)

    transactions = Transaction.objects.filter(
        Q(account=account) | Q(recipient_account=account)
    ).order_by('-created_at')[:25]

    return render(request, 'accounts/account_detail.html', {
        'account': account,
        'transactions': transactions
    })


@login_required
@staff_required
def account_create_view(request):
    if request.method == 'POST':
        form = AccountCreationForm(request.POST)
        if form.is_valid():
            try:
                account = BankingService.open_account(
                    customer=form.cleaned_data['customer'],
                    account_type=form.cleaned_data['account_type'],
                    initial_deposit=form.cleaned_data['initial_deposit'],
                    interest_rate=form.cleaned_data.get('interest_rate'),
                    user=request.user,
                    ip=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"New Account {account.account_number} created successfully!")
                return redirect('banking:account_detail', pk=account.pk)
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    else:
        form = AccountCreationForm()
    return render(request, 'accounts/account_create.html', {'form': form})


@login_required
@staff_required
def deposit_view(request):
    if request.method == 'POST':
        form = DepositForm(request.POST)
        if form.is_valid():
            acc_num = form.cleaned_data['account_number'].strip()
            amount = form.cleaned_data['amount']
            desc = form.cleaned_data['description']
            try:
                account = Account.objects.get(account_number=acc_num)
                txn = BankingService.deposit(
                    account_id=account.id,
                    amount=amount,
                    description=desc,
                    user=request.user,
                    ip=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"Deposit of ${amount:,.2f} completed! Reference: {txn.reference_id}")
                return redirect('banking:account_detail', pk=account.pk)
            except Account.DoesNotExist:
                messages.error(request, f"No account found with number {acc_num}.")
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    else:
        initial_acc = request.GET.get('acc', '')
        form = DepositForm(initial={'account_number': initial_acc})
    return render(request, 'banking/deposit.html', {'form': form})


@login_required
@staff_required
def withdrawal_view(request):
    if request.method == 'POST':
        form = WithdrawalForm(request.POST)
        if form.is_valid():
            acc_num = form.cleaned_data['account_number'].strip()
            amount = form.cleaned_data['amount']
            desc = form.cleaned_data['description']
            try:
                account = Account.objects.get(account_number=acc_num)
                txn = BankingService.withdraw(
                    account_id=account.id,
                    amount=amount,
                    description=desc,
                    user=request.user,
                    ip=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"Withdrawal of ${amount:,.2f} processed. Reference: {txn.reference_id}")
                return redirect('banking:account_detail', pk=account.pk)
            except Account.DoesNotExist:
                messages.error(request, f"No account found with number {acc_num}.")
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    else:
        initial_acc = request.GET.get('acc', '')
        form = WithdrawalForm(initial={'account_number': initial_acc})
    return render(request, 'banking/withdraw.html', {'form': form})


@login_required
def transfer_view(request):
    if request.method == 'POST':
        form = TransferForm(request.POST, user=request.user)
        if form.is_valid():
            src_acc = form.cleaned_data['source_account']
            dest_acc_num = form.cleaned_data['destination_account_number'].strip()
            amount = form.cleaned_data['amount']
            desc = form.cleaned_data['description']
            try:
                dest_acc = Account.objects.get(account_number=dest_acc_num)
                txn = BankingService.transfer(
                    sender_account_id=src_acc.id,
                    recipient_account_id=dest_acc.id,
                    amount=amount,
                    description=desc,
                    user=request.user,
                    ip=request.META.get('REMOTE_ADDR')
                )
                messages.success(request, f"Fund Transfer of ${amount:,.2f} to account {dest_acc_num} successful! Ref: {txn.reference_id}")
                return redirect('banking:account_detail', pk=src_acc.pk)
            except Account.DoesNotExist:
                messages.error(request, f"Destination account '{dest_acc_num}' does not exist.")
            except ValidationError as e:
                messages.error(request, str(e.message if hasattr(e, 'message') else e))
    else:
        initial_dest = request.GET.get('to', '')
        form = TransferForm(user=request.user, initial={'destination_account_number': initial_dest})
    return render(request, 'banking/transfer.html', {'form': form})


@login_required
def transaction_history_view(request):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        acc_ids = user.customer_profile.accounts.values_list('id', flat=True)
        transactions = Transaction.objects.filter(
            Q(account_id__in=acc_ids) | Q(recipient_account_id__in=acc_ids)
        ).select_related('account', 'recipient_account')
    else:
        transactions = Transaction.objects.select_related('account', 'recipient_account').all()

    txn_type = request.GET.get('type')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')

    if txn_type:
        transactions = transactions.filter(transaction_type=txn_type)
    if start_date:
        transactions = transactions.filter(created_at__date__gte=start_date)
    if end_date:
        transactions = transactions.filter(created_at__date__lte=end_date)

    paginator = Paginator(transactions.order_by('-created_at'), 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'banking/transactions.html', {
        'page_obj': page_obj,
        'types': TransactionType.choices,
        'selected_type': txn_type,
    })


@login_required
def statement_view(request):
    user = request.user
    if user.role == UserRole.CUSTOMER:
        accounts = user.customer_profile.accounts.all()
    else:
        accounts = Account.objects.all()

    account_id = request.GET.get('account_id')
    selected_account = None
    transactions = []

    if account_id:
        selected_account = get_object_or_404(accounts, id=account_id)
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        txns = Transaction.objects.filter(
            Q(account=selected_account) | Q(recipient_account=selected_account)
        )
        if start_date:
            txns = txns.filter(created_at__date__gte=start_date)
        if end_date:
            txns = txns.filter(created_at__date__lte=end_date)

        transactions = txns.order_by('created_at')

    return render(request, 'accounts/statement.html', {
        'accounts': accounts,
        'selected_account': selected_account,
        'transactions': transactions,
    })


@login_required
def beneficiary_list_view(request):
    if not hasattr(request.user, 'customer_profile'):
        messages.info(request, "Beneficiary management is available for customer accounts.")
        return redirect('core:dashboard')

    profile = request.user.customer_profile
    beneficiaries = profile.beneficiaries.all()
    return render(request, 'banking/beneficiaries.html', {'beneficiaries': beneficiaries})


@login_required
def beneficiary_create_view(request):
    if not hasattr(request.user, 'customer_profile'):
        return redirect('core:dashboard')

    profile = request.user.customer_profile
    if request.method == 'POST':
        form = BeneficiaryForm(request.POST)
        if form.is_valid():
            beneficiary = form.save(commit=False)
            beneficiary.customer = profile
            beneficiary.save()
            messages.success(request, f"Beneficiary '{beneficiary.beneficiary_name}' added successfully.")
            return redirect('banking:beneficiary_list')
    else:
        form = BeneficiaryForm()
    return render(request, 'banking/beneficiary_form.html', {'form': form})


@login_required
def beneficiary_delete_view(request, pk):
    if not hasattr(request.user, 'customer_profile'):
        return redirect('core:dashboard')

    beneficiary = get_object_or_404(Beneficiary, pk=pk, customer=request.user.customer_profile)
    beneficiary.delete()
    messages.success(request, "Beneficiary removed.")
    return redirect('banking:beneficiary_list')
