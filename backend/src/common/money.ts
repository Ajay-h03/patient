import { Prisma } from '@prisma/client';

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateBill(amount: number, taxRate: number) {
  const safeAmount = roundMoney(amount);
  const safeRate = roundMoney(taxRate);
  const taxAmount = roundMoney((safeAmount * safeRate) / 100);
  const total = roundMoney(safeAmount + taxAmount);
  return {
    amount: new Prisma.Decimal(safeAmount.toFixed(2)),
    taxRate: new Prisma.Decimal(safeRate.toFixed(2)),
    taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
    total: new Prisma.Decimal(total.toFixed(2)),
  };
}

export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

type PaymentRecord = {
  amount: Prisma.Decimal | number | string;
  [key: string]: unknown;
};

type BillRecord = {
  amount: Prisma.Decimal | number | string;
  taxRate: Prisma.Decimal | number | string;
  taxAmount: Prisma.Decimal | number | string;
  total: Prisma.Decimal | number | string;
  payments?: PaymentRecord[];
  [key: string]: unknown;
};

export function mapPayment<T extends PaymentRecord>(payment: T) {
  return {
    ...payment,
    amount: toNumber(payment.amount),
  };
}

export function mapBill<T extends BillRecord>(bill: T) {
  return {
    ...bill,
    amount: toNumber(bill.amount),
    taxRate: toNumber(bill.taxRate),
    taxAmount: toNumber(bill.taxAmount),
    total: toNumber(bill.total),
    payments: bill.payments?.map((payment) => mapPayment(payment)),
  };
}
