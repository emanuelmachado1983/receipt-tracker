import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { Receipt, ReceiptFormValue } from '../models/receipt.model';

const STORAGE_KEY = 'receipts';

/** Records saved before the status field existed had no status; treat them as already paid. */
function normalizeStatus(status: Receipt['status'] | undefined): Receipt['status'] {
  if (status === undefined) {
    return 'paid';
  }
  // Any legacy value other than 'paid' (e.g. the removed 'shipped' status) collapses to 'pending'.
  return status === 'paid' ? 'paid' : 'pending';
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly receiptsSignal = signal<Receipt[]>(
    this.storage.get<Receipt[]>(STORAGE_KEY, []).map((receipt) => ({
      ...receipt,
      status: normalizeStatus(receipt.status),
      sent: receipt.sent ?? false
    }))
  );

  readonly receipts = this.receiptsSignal.asReadonly();

  constructor(private storage: StorageService) {}

  getByPlanId(planId: string): Receipt[] {
    return this.receiptsSignal()
      .filter((receipt) => receipt.planId === planId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): Receipt | undefined {
    return this.receiptsSignal().find((receipt) => receipt.id === id);
  }

  create(planId: string, value: ReceiptFormValue): Receipt {
    const receipt: Receipt = {
      id: crypto.randomUUID(),
      planId,
      receiptNumber: this.getNextReceiptNumber(planId),
      createdAt: new Date().toISOString(),
      ...value
    };
    this.persist([...this.receiptsSignal(), receipt]);
    return receipt;
  }

  update(id: string, value: ReceiptFormValue): void {
    const list = this.receiptsSignal().map((receipt) =>
      receipt.id === id ? { ...receipt, ...value } : receipt
    );
    this.persist(list);
  }

  delete(id: string): void {
    this.persist(this.receiptsSignal().filter((receipt) => receipt.id !== id));
  }

  deleteByPlanId(planId: string): void {
    this.persist(this.receiptsSignal().filter((receipt) => receipt.planId !== planId));
  }

  getNextReceiptNumber(planId: string): number {
    const numbers = this.receiptsSignal()
      .filter((receipt) => receipt.planId === planId)
      .map((receipt) => receipt.receiptNumber);
    return numbers.length ? Math.max(...numbers) + 1 : 1;
  }

  private persist(list: Receipt[]): void {
    this.receiptsSignal.set(list);
    this.storage.set(STORAGE_KEY, list);
  }
}
