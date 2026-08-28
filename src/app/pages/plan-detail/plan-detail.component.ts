import { Component, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PlanService } from '../../services/plan.service';
import { ReceiptService } from '../../services/receipt.service';
import { AddPlanModalComponent } from '../../shared/add-plan-modal/add-plan-modal.component';
import { AddReceiptModalComponent } from '../../shared/add-receipt-modal/add-receipt-modal.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Plan, PlanFormValue } from '../../models/plan.model';
import { Receipt, ReceiptFormValue, RECEIPT_STATUS_LABELS } from '../../models/receipt.model';

interface ReceiptRow extends Receipt {
  runningBalance: number;
}

const PAYMENT_METHOD_LABELS: Record<Receipt['paymentMethod'], string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  otro: 'Otro'
};

const STATUS_LABELS: Record<'completed' | 'active' | 'overdue', string> = {
  completed: 'Completado',
  active: 'Activo',
  overdue: 'Vencido'
};

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, AddPlanModalComponent, AddReceiptModalComponent, ConfirmDialogComponent],
  templateUrl: './plan-detail.component.html',
  styleUrl: './plan-detail.component.scss'
})
export class PlanDetailComponent implements OnDestroy {
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly statusLabels = STATUS_LABELS;
  readonly receiptStatusLabels = RECEIPT_STATUS_LABELS;

  private readonly planId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id')!)), {
    requireSync: true
  });

  readonly plan = computed(() => this.planService.getSummaryById(this.planId()));

  readonly receiptRows = computed<ReceiptRow[]>(() => {
    const descending = this.receiptService.getByPlanId(this.planId());
    const ascending = [...descending].reverse();

    let cumulativePaid = 0;
    const runningBalanceById = new Map<string, number>();
    const total = this.plan()?.totalAmount ?? 0;

    for (const receipt of ascending) {
      if (receipt.status === 'paid') {
        cumulativePaid += receipt.amount;
      }
      runningBalanceById.set(receipt.id, total - cumulativePaid);
    }

    return descending.map((receipt) => ({ ...receipt, runningBalance: runningBalanceById.get(receipt.id)! }));
  });

  readonly showEditPlanModal = signal(false);
  readonly showReceiptModal = signal(false);
  readonly editingReceipt = signal<Receipt | null>(null);
  readonly deletingReceiptId = signal<string | null>(null);
  readonly confirmingDeletePlan = signal(false);
  readonly printingReceipt = signal<Receipt | null>(null);

  private readonly onAfterPrint = () => this.printingReceipt.set(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private planService: PlanService,
    private receiptService: ReceiptService
  ) {
    window.addEventListener('afterprint', this.onAfterPrint);
  }

  ngOnDestroy(): void {
    window.removeEventListener('afterprint', this.onAfterPrint);
  }

  savePlan(value: PlanFormValue): void {
    this.planService.update(this.planId(), value);
    this.showEditPlanModal.set(false);
  }

  markCompleted(): void {
    this.planService.markCompleted(this.planId());
  }

  deletePlan(): void {
    this.planService.delete(this.planId());
    this.router.navigate(['/planes']);
  }

  openAddReceipt(): void {
    this.editingReceipt.set(null);
    this.showReceiptModal.set(true);
  }

  openEditReceipt(receipt: Receipt): void {
    this.editingReceipt.set(receipt);
    this.showReceiptModal.set(true);
  }

  saveReceipt(value: ReceiptFormValue): void {
    const editing = this.editingReceipt();
    if (editing) {
      this.receiptService.update(editing.id, value);
    } else {
      this.receiptService.create(this.planId(), value);
    }
    this.closeReceiptModal();
  }

  closeReceiptModal(): void {
    this.showReceiptModal.set(false);
    this.editingReceipt.set(null);
  }

  clampProgress(percent: number): number {
    return Math.min(100, Math.max(0, percent));
  }

  confirmDeleteReceipt(id: string): void {
    this.deletingReceiptId.set(id);
  }

  deleteReceipt(): void {
    const id = this.deletingReceiptId();
    if (id) {
      this.receiptService.delete(id);
    }
    this.deletingReceiptId.set(null);
  }

  printReceipt(receipt: Receipt): void {
    this.printingReceipt.set(receipt);
    setTimeout(() => window.print());
  }
}
