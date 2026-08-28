export type Currency = 'ARS' | 'USD' | 'EUR';

export type PlanStatus = 'completed' | 'active' | 'overdue';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  debtorName: string;
  totalAmount: number;
  currency: Currency;
  startDate: string; // ISO format
  notes?: string;
  completedManually: boolean;
  createdAt: string; // ISO format
}

export type PlanFormValue = Omit<Plan, 'id' | 'completedManually' | 'createdAt'>;

export interface PlanSummary extends Plan {
  totalPaid: number;
  remainingBalance: number;
  progressPercent: number;
  lastReceiptDate: string | null;
  status: PlanStatus;
  receiptCount: number;
}
