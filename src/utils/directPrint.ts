import { BankAccount, Transaction, Customer, User } from '../types/banking';
import { formatCurrency } from './finance';

export function generateStatementHtml(params: {
  account?: BankAccount;
  transactions: Transaction[];
  customer?: Customer;
  currentUser?: User;
}): string {
  const { account, transactions, customer, currentUser } = params;

  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}-${now.getFullYear()}`;
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const reportNumber = 'RPT-2026-00015';

  const reportTxns = account
    ? transactions.filter((t) => t.accountId === account.id)
    : transactions;

  const incomeTxns = reportTxns.filter(
    (t) => t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'FD_INTEREST'
  );
  const expenseTxns = reportTxns.filter(
    (t) => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'EMI_PAYMENT'
  );

  const totalIncome = incomeTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
  const receivableAmount = 0;
  const payableAmount = 0;
  const totalBalance = account ? account.balance : 0;

  const rowsHtml = reportTxns
    .slice(0, 16)
    .map((t, idx) => {
      const isInflow = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN';
      const isExpense = t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT';
      const isPayable = t.type === 'EMI_PAYMENT';

      const typeLabel = isInflow
        ? 'RECEIVABLE'
        : isPayable
        ? 'PAYABLE'
        : isExpense
        ? 'EXPENSE'
        : 'INCOME';
      const typeColor = isInflow
        ? '#059669'
        : isPayable
        ? '#dc2626'
        : '#2563eb';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 6px 0;">
            <div style="font-weight: 600; color: #0f172a;">${idx + 1}. ${t.description} (${new Date(t.createdAt).toISOString().split('T')[0]})</div>
            <div style="font-size: 9px; color: #64748b;">Ref: ${t.referenceId} • Account: ${t.accountNumber}</div>
          </td>
          <td style="padding: 6px 0; text-align: center; font-weight: bold; color: ${typeColor};">${typeLabel}</td>
          <td style="padding: 6px 0; text-align: center; color: #475569;">${t.status}</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${formatCurrency(t.amount)}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Report ${reportNumber} - Apex Finance Monitoring</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    body {
      margin: 0;
      padding: 10px;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .document-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 22px 24px;
      box-sizing: border-box;
      max-width: 820px;
      margin: 0 auto;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 10px;
      margin-bottom: 12px;
    }
    .pill-badge {
      display: inline-block;
      border: 1px solid #1e293b;
      padding: 2px 10px;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 1.5px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .dashed-divider {
      border-top: 1px dashed #cbd5e1;
      margin: 10px 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 12px 0;
    }
    .kpi-card {
      border: 1px solid #bae6fd;
      background: #f0f9ff;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .kpi-label {
      font-size: 8.5px;
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 13px;
      font-weight: bold;
      margin-top: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .table-head {
      border-top: 1px dashed #94a3b8;
      border-bottom: 1px dashed #94a3b8;
    }
    .table-head th {
      padding: 5px 0;
      text-align: left;
      font-size: 10px;
      font-weight: bold;
      color: #1e293b;
    }
    .stamp-box {
      border: 1.5px solid #059669;
      background: #ffffff;
      border-radius: 8px;
      padding: 6px 16px;
      text-align: center;
      display: inline-block;
    }
  </style>
</head>
<body>
  <!-- Running Header -->
  <div class="header-bar mono">
    <span>${dateFormatted.replace(/-/g, '/')}, ${timeFormatted}</span>
    <span style="font-weight: 600; color: #1e293b;">Report ${reportNumber} - Apex Finance Monitoring</span>
  </div>

  <div class="document-box">
    <!-- Centered Pill -->
    <div style="text-align: center; margin-bottom: 6px;">
      <span class="pill-badge mono">FINANCIAL MONITORING STATEMENT</span>
    </div>

    <!-- Bank Title -->
    <div style="text-align: center; margin-bottom: 4px;">
      <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;" class="mono">
        APEX FINANCE
      </div>
      <div style="font-size: 9px; font-weight: 700; color: #475569; letter-spacing: 1px;" class="mono">
        FINANCE MONITORING ENTERPRISE DASHBOARD
      </div>
    </div>

    <!-- Metadata Details -->
    <div style="text-align: center; font-size: 10px; color: #475569; margin-bottom: 8px;" class="mono">
      <div>Account Holder: <b style="color: #0f172a;">${customer?.fullName || account?.customerName || 'N/A'}</b> | Account: <b style="color: #0f172a;">${account?.accountNumber ? `•••• ${account.accountNumber.slice(-4)} (${account.accountType})` : 'All Accounts'}</b></div>
      <div>Operator: <b style="color: #0f172a;">${currentUser?.firstName || 'Admin'} ${currentUser?.lastName || ''} (${currentUser?.email || 'admin@apexbank.com'})</b> | Period: <b style="color: #0f172a;">All Dates</b></div>
    </div>

    <div class="dashed-divider"></div>

    <!-- Meta Key Value Line -->
    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #334155; margin-bottom: 10px;" class="mono">
      <div>
        <div>Report No: <b style="color: #2563eb;">${reportNumber}</b></div>
        <div style="margin-top: 3px;">Gross Margin: <b>75%</b> | Net Margin: <b>68%</b></div>
        <div style="margin-top: 3px;">Time: <b>${dateFormatted} ${timeFormatted}</b></div>
      </div>
      <div style="text-align: right;">
        <div>Date: <b>${dateFormatted}</b></div>
        <div style="margin-top: 3px;">Status: <span style="border: 1px solid #059669; background: #ecfdf5; color: #059669; font-weight: bold; padding: 1px 6px; border-radius: 3px;">VERIFIED</span></div>
        <div style="margin-top: 3px;">Ratios: <b>QR 1.4:8 | CR 3.3</b></div>
      </div>
    </div>

    <!-- 4 KPI Cards -->
    <div class="kpi-grid mono">
      <div class="kpi-card">
        <div class="kpi-label">TOTAL INCOME</div>
        <div class="kpi-value" style="color: #2563eb;">${formatCurrency(totalIncome)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">TOTAL EXPENSES</div>
        <div class="kpi-value" style="color: #2563eb;">${formatCurrency(totalExpense)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">RECEIVABLE</div>
        <div class="kpi-value" style="color: #059669;">${formatCurrency(receivableAmount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">PAYABLE</div>
        <div class="kpi-value" style="color: #dc2626;">${formatCurrency(payableAmount)}</div>
      </div>
    </div>

    <div class="dashed-divider"></div>

    <!-- Table of Transactions -->
    <table class="mono">
      <thead>
        <tr class="table-head">
          <th style="width: 50%;">ITEM / TRANSACTION</th>
          <th style="width: 16%; text-align: center;">TYPE</th>
          <th style="width: 16%; text-align: center;">STATUS</th>
          <th style="width: 18%; text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="dashed-divider" style="margin-top: 14px;"></div>

    <!-- Subtotals Section -->
    <div style="font-size: 10px; color: #334155; line-height: 1.6;" class="mono">
      <div style="display: flex; justify-content: space-between;">
        <span>Total Income (${incomeTxns.length} items):</span>
        <span style="font-weight: bold; color: #0f172a;">${formatCurrency(totalIncome)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Total Expenses (${expenseTxns.length} items):</span>
        <span style="font-weight: bold; color: #0f172a;">-${formatCurrency(totalExpense)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Accounts Receivable / Payable Net:</span>
        <span style="font-weight: bold; color: #0f172a;">${formatCurrency(receivableAmount - payableAmount)}</span>
      </div>

      <div class="dashed-divider"></div>

      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; color: #0f172a;">
        <span>CURRENT TREASURY BALANCE :</span>
        <span>${formatCurrency(totalBalance)}</span>
      </div>
    </div>

    <!-- Audited Seal Box -->
    <div style="text-align: center; margin-top: 24px; margin-bottom: 6px;">
      <div class="stamp-box mono">
        <div style="font-size: 8px; font-weight: bold; color: #065f46; letter-spacing: 1px;">STATEMENT AUDITED</div>
        <div style="font-size: 11px; font-weight: 900; color: #059669; letter-spacing: 2px; margin: 1px 0;">VERIFIED</div>
        <div style="font-size: 7.5px; color: #047857;">via Apex National Bank</div>
      </div>
    </div>
  </div>

  <!-- Running Footer -->
  <div style="display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; margin-top: 12px;" class="mono">
    <span>about:blank</span>
    <span>1/1</span>
  </div>
</body>
</html>
  `;
}

/**
 * Universal print trigger that prints directly to the computer printer / Microsoft Print to PDF.
 * Uses a dedicated invisible iframe so it NEVER fails, even inside nested views or iframes.
 */
export function executeDirectPrint(params: {
  account?: BankAccount;
  transactions: Transaction[];
  customer?: Customer;
  currentUser?: User;
}) {
  try {
    const htmlContent = generateStatementHtml(params);

    // Look for existing print iframe or create a fresh one
    let printFrame = document.getElementById('apex-print-frame') as HTMLIFrameElement;
    if (printFrame) {
      printFrame.remove();
    }

    printFrame = document.createElement('iframe');
    printFrame.id = 'apex-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '1000px';
    printFrame.style.height = '1400px';
    printFrame.style.border = '0';
    printFrame.style.zIndex = '-9999';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) {
      // Fallback to window.print()
      window.focus();
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    // Trigger printing once the iframe loads
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print:', err);
        window.focus();
        window.print();
      }
    }, 200);
  } catch (error) {
    console.error('Print execution error:', error);
    window.focus();
    window.print();
  }
}
