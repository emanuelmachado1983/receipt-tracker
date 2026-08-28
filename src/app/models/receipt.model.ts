export type PaymentMethod = 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro';

export type ReceiptStatus = 'pending' | 'paid';

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado'
};

export interface Receipt {
  id: string;
  planId: string;
  receiptNumber: number; // auto-incremented per plan
  date: string; // ISO format
  amount: number;
  paymentMethod: PaymentMethod;
  status: ReceiptStatus;
  sent: boolean;
  notes?: string;
  createdAt: string; // ISO format
}

export type ReceiptFormValue = Omit<Receipt, 'id' | 'planId' | 'receiptNumber' | 'createdAt'>;
