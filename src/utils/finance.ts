/**
 * Financial calculations using Decimal-like rounding to avoid floating point anomalies.
 */

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  const rounded = roundMoney(amount);
  return `${currency}${rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): { monthlyEmi: number; totalPayable: number; totalInterest: number } {
  if (tenureMonths <= 0 || principal <= 0) {
    return { monthlyEmi: 0, totalPayable: 0, totalInterest: 0 };
  }

  if (annualInterestRate === 0) {
    const emi = roundMoney(principal / tenureMonths);
    return {
      monthlyEmi: emi,
      totalPayable: roundMoney(emi * tenureMonths),
      totalInterest: 0,
    };
  }

  const r = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + r, tenureMonths);
  const emi = roundMoney(principal * r * (factor / (factor - 1)));
  const totalPayable = roundMoney(emi * tenureMonths);
  const totalInterest = roundMoney(totalPayable - principal);

  return { monthlyEmi: emi, totalPayable, totalInterest };
}

export function calculateFDMaturity(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  compoundsPerYear: number = 4
): { maturityAmount: number; totalInterest: number } {
  const P = principal;
  const r = annualRate / 100;
  const n = compoundsPerYear;
  const t = tenureMonths / 12;

  const maturityAmount = roundMoney(P * Math.pow(1 + r / n, n * t));
  const totalInterest = roundMoney(maturityAmount - P);

  return { maturityAmount, totalInterest };
}

export function generateId(prefix: string): string {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateAccountNumber(): string {
  return `100${Math.floor(100000000 + Math.random() * 900000000)}`;
}
