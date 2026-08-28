import { Component, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PlanService } from '../../services/plan.service';
import { ReceiptService } from '../../services/receipt.service';
import { Currency } from '../../models/plan.model';

interface CurrencyTotals {
  currency: Currency;
  planCount: number;
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
}

interface RecentPayment {
  planName: string;
  amount: number;
  currency: Currency;
  date: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent {
  readonly totalPlans = computed(() => this.planService.planSummaries().length);

  readonly totalsByCurrency = computed<CurrencyTotals[]>(() => {
    const summaries = this.planService.planSummaries();
    const map = new Map<Currency, CurrencyTotals>();

    for (const plan of summaries) {
      const entry = map.get(plan.currency) ?? {
        currency: plan.currency,
        planCount: 0,
        totalAmount: 0,
        totalCollected: 0,
        totalPending: 0
      };
      entry.planCount += 1;
      entry.totalAmount += plan.totalAmount;
      entry.totalCollected += plan.totalPaid;
      entry.totalPending += Math.max(0, plan.remainingBalance);
      map.set(plan.currency, entry);
    }

    return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  });

  readonly mostRecentPayment = computed<RecentPayment | null>(() => {
    const receipts = this.receiptService.receipts();
    if (!receipts.length) {
      return null;
    }
    const latest = [...receipts].sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
    )[0];
    const plan = this.planService.plans().find((p) => p.id === latest.planId);
    return {
      planName: plan?.name ?? 'Plan eliminado',
      amount: latest.amount,
      currency: plan?.currency ?? 'ARS',
      date: latest.date
    };
  });

  constructor(private planService: PlanService, private receiptService: ReceiptService) {}
}
