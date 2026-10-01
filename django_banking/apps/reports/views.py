import io
import csv
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from apps.accounts.decorators import staff_required
from apps.accounts.models import CustomerProfile, UserRole
from apps.banking.models import Account, Transaction
from apps.loans.models import Loan

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

@login_required
def export_transactions_excel(request):
    """Exports transaction history in Excel (.xlsx) format."""
    user = request.user
    if user.role == UserRole.CUSTOMER:
        acc_ids = user.customer_profile.accounts.values_list('id', flat=True)
        transactions = Transaction.objects.filter(account_id__in=acc_ids).order_by('-created_at')
    else:
        transactions = Transaction.objects.select_related('account', 'account__customer__user').order_by('-created_at')[:500]

    if HAS_OPENPYXL:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Transactions Log"

        # Header styling
        headers = ["Reference ID", "Date & Time", "Account", "Customer", "Type", "Amount ($)", "Balance After ($)", "Status", "Description"]
        ws.append(headers)
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")

        for txn in transactions:
            customer_name = txn.account.customer.user.get_full_name() if txn.account and txn.account.customer else "N/A"
            ws.append([
                txn.reference_id,
                txn.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                txn.account.account_number if txn.account else "N/A",
                customer_name,
                txn.get_transaction_type_display(),
                float(txn.amount),
                float(txn.balance_after),
                txn.status,
                txn.description
            ])

        # Auto-adjust column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="transactions_statement.xlsx"'
        return response
    else:
        # Fallback to CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions_statement.csv"'
        writer = csv.writer(response)
        writer.writerow(["Reference ID", "Date", "Account", "Customer", "Type", "Amount", "Balance After", "Status", "Description"])
        for txn in transactions:
            customer_name = txn.account.customer.user.get_full_name() if txn.account and txn.account.customer else "N/A"
            writer.writerow([
                txn.reference_id,
                txn.created_at.strftime('%Y-%m-%d %H:%M'),
                txn.account.account_number,
                customer_name,
                txn.get_transaction_type_display(),
                txn.amount,
                txn.balance_after,
                txn.status,
                txn.description
            ])
        return response


@login_required
@staff_required
def export_customers_excel(request):
    """Exports registered customer database."""
    customers = CustomerProfile.objects.select_related('user', 'branch').all().order_by('-created_at')

    if HAS_OPENPYXL:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Customer Directory"
        headers = ["Customer ID", "Full Name", "Email", "Phone", "Branch", "KYC Status", "Annual Income ($)", "Registered Date"]
        ws.append(headers)

        header_fill = PatternFill(start_color="0F766E", end_color="0F766E", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font

        for c in customers:
            ws.append([
                c.customer_id,
                c.user.get_full_name(),
                c.user.email,
                c.user.phone_number or "N/A",
                c.branch.name if c.branch else "Headquarters",
                c.kyc_status,
                float(c.annual_income),
                c.created_at.strftime('%Y-%m-%d')
            ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="apex_bank_customers.xlsx"'
        return response
    else:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="apex_bank_customers.csv"'
        writer = csv.writer(response)
        writer.writerow(["Customer ID", "Full Name", "Email", "Phone", "Branch", "KYC Status", "Annual Income", "Registered Date"])
        for c in customers:
            writer.writerow([
                c.customer_id,
                c.user.get_full_name(),
                c.user.email,
                c.user.phone_number or "N/A",
                c.branch.name if c.branch else "Headquarters",
                c.kyc_status,
                c.annual_income,
                c.created_at.strftime('%Y-%m-%d')
            ])
        return response


@login_required
def export_statement_pdf(request, account_id):
    """Generates official bank account statement in printable PDF format."""
    user = request.user
    if user.role == UserRole.CUSTOMER:
        account = get_object_or_404(Account, id=account_id, customer=user.customer_profile)
    else:
        account = get_object_or_404(Account, id=account_id)

    transactions = Transaction.objects.filter(account=account).order_by('-created_at')[:100]

    # Return structured printable HTML view styled specifically for window.print() or headless PDF
    from django.shortcuts import render
    return render(request, 'reports/statement_print.html', {
        'account': account,
        'customer': account.customer,
        'transactions': transactions,
    })
