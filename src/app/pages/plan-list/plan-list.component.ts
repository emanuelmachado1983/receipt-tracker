import { Component, computed, signal } from '@angular/core';
import { PlanService } from '../../services/plan.service';
import { PlanCardComponent } from '../../shared/plan-card/plan-card.component';
import { AddPlanModalComponent } from '../../shared/add-plan-modal/add-plan-modal.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { Plan, PlanFormValue, PlanStatus } from '../../models/plan.model';

type StatusFilter = PlanStatus | 'all';

interface FilterOption {
  value: StatusFilter;
  label: string;
}

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [PlanCardComponent, AddPlanModalComponent, ConfirmDialogComponent],
  templateUrl: './plan-list.component.html',
  styleUrl: './plan-list.component.scss'
})
export class PlanListComponent {
  readonly searchTerm = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly showAddModal = signal(false);
  readonly editingPlan = signal<Plan | null>(null);
  readonly deletingPlanId = signal<string | null>(null);

  readonly filters: FilterOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'completed', label: 'Completados' },
    { value: 'overdue', label: 'Vencidos' }
  ];

  readonly plans = computed(() => {
    const searched = this.planService.search(this.searchTerm());
    const status = this.statusFilter();
    return status === 'all' ? searched : searched.filter((plan) => plan.status === status);
  });

  constructor(private planService: PlanService) {}

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  openCreate(): void {
    this.editingPlan.set(null);
    this.showAddModal.set(true);
  }

  openEdit(plan: Plan): void {
    this.editingPlan.set(plan);
    this.showAddModal.set(true);
  }

  savePlan(value: PlanFormValue): void {
    const editing = this.editingPlan();
    if (editing) {
      this.planService.update(editing.id, value);
    } else {
      this.planService.create(value);
    }
    this.closeModal();
  }

  closeModal(): void {
    this.showAddModal.set(false);
    this.editingPlan.set(null);
  }

  confirmDelete(id: string): void {
    this.deletingPlanId.set(id);
  }

  deletePlan(): void {
    const id = this.deletingPlanId();
    if (id) {
      this.planService.delete(id);
    }
    this.deletingPlanId.set(null);
  }
}
