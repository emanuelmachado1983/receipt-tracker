import { Component, computed, signal } from '@angular/core';
import { PlanService } from '../../services/plan.service';
import { PlanCardComponent } from '../../shared/plan-card/plan-card.component';
import { AddPlanModalComponent } from '../../shared/add-plan-modal/add-plan-modal.component';
import { PlanFormValue } from '../../models/plan.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PlanCardComponent, AddPlanModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly searchTerm = signal('');
  readonly showAddModal = signal(false);

  readonly plans = computed(() => this.planService.search(this.searchTerm()));

  constructor(private planService: PlanService) {}

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  createPlan(value: PlanFormValue): void {
    this.planService.create(value);
    this.showAddModal.set(false);
  }
}
