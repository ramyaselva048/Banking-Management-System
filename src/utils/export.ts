import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, BankAccount, Customer, Loan } from '../types/banking';
import { formatCurrency } from './finance';

export function exportTransactionsToExcel(transactions: Transaction[], filename = 'apex_bank_transactions.xlsx') {
  const rows = transactions.map((t) => ({
    'Reference ID': t.referenceId,
    'Date & Time': new Date(t.createdAt).toLocaleString(),
    'Account Number': t.accountNumber,
    'Customer Name': t.customerName,
    'Transaction Type': t.type.replace('_', ' '),
    'Amount ($)': t.amount,
    'Balance After ($)': t.balanceAfter,
    'Status': t.status,
    'Description': t.description,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, filename);
}

export function exportCustomersToExcel(customers: Customer[], filename = 'apex_bank_customers.xlsx') {
  const rows = customers.map((c) => ({
    'Customer ID': c.customerId,
    'Full Name': c.fullName,
    'Email Address': c.email,
    'Phone': c.phone,
    'Branch': c.branchName,
    'KYC Status': c.kycStatus,
    'Occupation': c.occupation,
    'Annual Income ($)': c.annualIncome,
    'Created At': new Date(c.createdAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
  XLSX.writeFile(workbook, filename);
}

export function exportLoansToExcel(loans: Loan[], filename = 'apex_bank_loans.xlsx') {
  const rows = loans.map((l) => ({
    'Loan ID': l.loanId,
    'Customer': l.customerName,
    'Loan Type': l.loanType,
    'Principal Amount ($)': l.amount,
    'Interest Rate (%)': `${l.interestRate}%`,
    'Tenure (Months)': l.tenureMonths,
    'Monthly EMI ($)': l.monthlyEmi,
    'Total Payable ($)': l.totalPayable,
    'Amount Repaid ($)': l.amountPaid,
    'Status': l.status,
    'Applied Date': new Date(l.appliedAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Loans');
  XLSX.writeFile(workbook, filename);
}

export function generateAccountStatementPDF(
  account: BankAccount,
  transactions: Transaction[],
  customer?: Customer
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Navy slate #0F172A
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('APEX NATIONAL BANK', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Account Statement | Enterprise Banking System', 14, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

  // Account Information Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT SUMMARY', 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account Holder: ${account.customerName}`, 14, 55);
  doc.text(`Account Number: ${account.accountNumber}`, 14, 61);
  doc.text(`Account Type: ${account.accountType.replace('_', ' ')}`, 14, 67);
  doc.text(`Branch: ${customer?.branchName || 'Downtown Headquarters'}`, 14, 73);

  doc.setFont('helvetica', 'bold');
  doc.text(`Current Balance: ${formatCurrency(account.balance)}`, 120, 55);
  doc.text(`Minimum Balance: ${formatCurrency(account.minimumBalance)}`, 120, 61);
  doc.text(`Status: ${account.status}`, 120, 67);
  doc.text(`Currency: ${account.currency}`, 120, 73);

  // Table of Transactions
  const tableData = transactions.map((t) => [
    new Date(t.createdAt).toLocaleDateString(),
    t.referenceId,
    t.type.replace('_', ' '),
    t.description,
    `${t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' ? '+' : '-'}${formatCurrency(t.amount)}`,
    formatCurrency(t.balanceAfter),
  ]);

  autoTable(doc, {
    startY: 82,
    head: [['Date', 'Ref ID', 'Type', 'Description', 'Amount', 'Balance']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 60 },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
    },
  });

  // Footer Note
  const finalY = (doc as any).lastAutoTable?.finalY || 240;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated bank statement from Apex National Bank and requires no physical signature.', 14, finalY + 15);

  doc.save(`Statement_${account.accountNumber}.pdf`);
}
