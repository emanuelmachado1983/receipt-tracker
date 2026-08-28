import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { ReceiptService } from './receipt.service';
import { Plan, PlanFormValue, PlanSummary, PlanStatus } from '../models/plan.model';

const STORAGE_KEY = 'plans';
const OVERDUE_THRESHOLD_DAYS = 30;

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly plansSignal = signal<Plan[]>(this.storage.get<Plan[]>(STORAGE_KEY, []));

  readonly plans = this.plansSignal.asReadonly();

  readonly planSummaries = computed<PlanSummary[]>(() =>
    this.plansSignal().map((plan) => this.toSummary(plan))
  );

  constructor(private storage: StorageService, private receiptService: ReceiptService) {}

  getSummaryById(id: string): PlanSummary | undefined {
    return this.planSummaries().find((plan) => plan.id === id);
  }

  search(term: string): PlanSummary[] {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return this.planSummaries();
    }
    return this.planSummaries().filter(
      (plan) =>
        plan.name.toLowerCase().includes(normalized) ||
        plan.debtorName.toLowerCase().includes(normalized)
    );
  }

  filterByStatus(status: PlanStatus | 'all'): PlanSummary[] {
    if (status === 'all') {
      return this.planSummaries();
    }
    return this.planSummaries().filter((plan) => plan.status === status);
  }

  create(value: PlanFormValue): Plan {
    const plan: Plan = {
      id: crypto.randomUUID(),
      completedManually: false,
      createdAt: new Date().toISOString(),
      ...value
    };
    this.persist([...this.plansSignal(), plan]);
    return plan;
  }

  update(id: string, value: PlanFormValue): void {
    const list = this.plansSignal().map((plan) => (plan.id === id ? { ...plan, ...value } : plan));
    this.persist(list);
  }

  delete(id: string): void {
    this.persist(this.plansSignal().filter((plan) => plan.id !== id));
    this.receiptService.deleteByPlanId(id);
  }

  markCompleted(id: string): void {
    const list = this.plansSignal().map((plan) =>
      plan.id === id ? { ...plan, completedManually: true } : plan
    );
    this.persist(list);
  }

  private persist(list: Plan[]): void {
    this.plansSignal.set(list);
    this.storage.set(STORAGE_KEY, list);
  }

  private toSummary(plan: Plan): PlanSummary {
    const receipts = this.receiptService.getByPlanId(plan.id);
    const paidReceipts = receipts.filter((receipt) => receipt.status === 'paid');
    const totalPaid = paidReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const remainingBalance = plan.totalAmount - totalPaid;
    const progressPercent = plan.totalAmount > 0 ? (totalPaid / plan.totalAmount) * 100 : 0;
    const lastReceiptDate = paidReceipts.length ? paidReceipts[0].date : null;

    return {
      ...plan,
      totalPaid,
      remainingBalance,
      progressPercent,
      lastReceiptDate,
      receiptCount: receipts.length,
      status: this.computeStatus(plan, remainingBalance, lastReceiptDate)
    };
  }

  private computeStatus(plan: Plan, remainingBalance: number, lastReceiptDate: string | null): PlanStatus {
    if (plan.completedManually || remainingBalance <= 0) {
      return 'completed';
    }
    const referenceDate = lastReceiptDate ?? plan.startDate;
    const daysSinceReference = (Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReference > OVERDUE_THRESHOLD_DAYS) {
      return 'overdue';
    }
    return 'active';
  }
}
