import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanSummary } from '../../models/plan.model';

const STATUS_LABELS: Record<PlanSummary['status'], string> = {
  completed: 'Completado',
  active: 'Activo',
  overdue: 'Vencido'
};

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss'
})
export class PlanCardComponent {
  @Input({ required: true }) plan!: PlanSummary;
  @Input() showActions = false;

  @Output() edit = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  get statusLabel(): string {
    return STATUS_LABELS[this.plan.status];
  }

  get clampedProgress(): number {
    return Math.min(100, Math.max(0, this.plan.progressPercent));
  }
}
