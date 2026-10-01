from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
import json

from apps.accounts.models import User, CustomerProfile, Branch, UserRole
from apps.banking.models import Account, Transaction, TransactionType
from apps.loans.models import Loan, LoanStatus
from apps.deposits.models import FixedDeposit, RecurringDeposit
from .models import AuditLog, Notification
from apps.accounts.decorators import staff_required, admin_required

@login_required
def dashboard_view(request):
    user = request.user

    # Customer specific dashboard
    if user.role == UserRole.CUSTOMER:
        profile = getattr(user, 'customer_profile', None)
        accounts = profile.accounts.all() if profile else []
        account_ids = [acc.id for acc in accounts]
        
        total_balance = sum(acc.balance for acc in accounts) if accounts else 0
        recent_transactions = Transaction.objects.filter(
            Q(account_id__in=account_ids) | Q(recipient_account_id__in=account_ids)
        ).select_related('account', 'recipient_account').order_by('-created_at')[:8]
        
        loans = profile.loans.all() if profile else []
        active_loans = loans.filter(status=LoanStatus.DISBURSED)
        fixed_deposits = profile.fixed_deposits.all() if profile else []

        context = {
            'accounts': accounts,
            'total_balance': total_balance,
            'recent_transactions': recent_transactions,
            'loans': loans,
            'active_loans': active_loans,
            'fixed_deposits': fixed_deposits,
            'profile': profile
        }
        return render(request, 'dashboard/customer_dashboard.html', context)

    # Admin and Staff Dashboard
    total_customers = CustomerProfile.objects.count()
    total_accounts = Account.objects.count()
    total_branches = Branch.objects.count()
    
    total_balance_res = Account.objects.aggregate(total=Sum('balance'))['total'] or 0
    total_loans_res = Loan.objects.filter(status=LoanStatus.DISBURSED).aggregate(total=Sum('amount'))['total'] or 0
    pending_loans_count = Loan.objects.filter(status=LoanStatus.PENDING).count()
    
    # 7-day transaction trends for Chart.js
    today = timezone.now().date()
    dates = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
    date_labels = [d.strftime('%b %d') for d in dates]
    
    deposits_data = []
    withdrawals_data = []
    
    for d in dates:
        dep = Transaction.objects.filter(
            transaction_type__in=[TransactionType.DEPOSIT, TransactionType.TRANSFER_IN],
            status='COMPLETED',
            created_at__date=d
        ).aggregate(total=Sum('amount'))['total'] or 0
        wth = Transaction.objects.filter(
            transaction_type__in=[TransactionType.WITHDRAWAL, TransactionType.TRANSFER_OUT],
            status='COMPLETED',
            created_at__date=d
        ).aggregate(total=Sum('amount'))['total'] or 0
        deposits_data.append(float(dep))
        withdrawals_data.append(float(wth))

    recent_transactions = Transaction.objects.select_related('account', 'account__customer__user').order_by('-created_at')[:10]
    recent_customers = CustomerProfile.objects.select_related('user').order_by('-created_at')[:5]

    context = {
        'total_customers': total_customers,
        'total_accounts': total_accounts,
        'total_branches': total_branches,
        'total_deposits_balance': total_balance_res,
        'total_disbursed_loans': total_loans_res,
        'pending_loans_count': pending_loans_count,
        'recent_transactions': recent_transactions,
        'recent_customers': recent_customers,
        'chart_labels': json.dumps(date_labels),
        'chart_deposits': json.dumps(deposits_data),
        'chart_withdrawals': json.dumps(withdrawals_data),
    }

    if user.role == UserRole.ADMIN or user.is_superuser:
        return render(request, 'dashboard/admin_dashboard.html', context)
    return render(request, 'dashboard/staff_dashboard.html', context)


@login_required
@staff_required
def analytics_view(request):
    """Detailed analytics with Chart.js visualization."""
    account_types = Account.objects.values('account_type').annotate(count=Count('id'), total=Sum('balance'))
    loan_statuses = Loan.objects.values('status').annotate(count=Count('id'), total=Sum('amount'))
    
    type_labels = [item['account_type'] for item in account_types]
    type_counts = [item['count'] for item in account_types]
    type_balances = [float(item['total'] or 0) for item in account_types]

    loan_labels = [item['status'] for item in loan_statuses]
    loan_counts = [item['count'] for item in loan_statuses]

    return render(request, 'reports/analytics.html', {
        'type_labels': json.dumps(type_labels),
        'type_counts': json.dumps(type_counts),
        'type_balances': json.dumps(type_balances),
        'loan_labels': json.dumps(loan_labels),
        'loan_counts': json.dumps(loan_counts),
        'account_types': account_types,
        'loan_statuses': loan_statuses,
    })


@login_required
def notifications_view(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'core/notifications.html', {'notifications': notifications})


@login_required
def mark_all_notifications_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    messages.success(request, "All notifications marked as read.")
    return redirect('core:notifications')


@login_required
@staff_required
def audit_log_view(request):
    action_filter = request.GET.get('action', '')
    logs = AuditLog.objects.select_related('user').all()
    if action_filter:
        logs = logs.filter(action=action_filter)
    
    actions = AuditLog.objects.values_list('action', flat=True).distinct()
    return render(request, 'core/audit_logs.html', {
        'logs': logs[:100],
        'actions': actions,
        'action_filter': action_filter
    })
