import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Currency, Plan, PlanFormValue } from '../../models/plan.model';

@Component({
  selector: 'app-add-plan-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-plan-modal.component.html',
  styleUrl: './add-plan-modal.component.scss'
})
export class AddPlanModalComponent implements OnChanges {
  @Input() plan: Plan | null = null;

  @Output() save = new EventEmitter<PlanFormValue>();
  @Output() close = new EventEmitter<void>();

  readonly currencies: Currency[] = ['ARS', 'USD', 'EUR'];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    debtorName: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['ARS' as Currency, Validators.required],
    startDate: [this.today(), Validators.required],
    notes: ['']
  });

  constructor(private fb: FormBuilder) {}

  get isEditMode(): boolean {
    return !!this.plan;
  }

  ngOnChanges(): void {
    if (this.plan) {
      this.form.setValue({
        name: this.plan.name,
        description: this.plan.description ?? '',
        debtorName: this.plan.debtorName,
        totalAmount: this.plan.totalAmount,
        currency: this.plan.currency,
        startDate: this.plan.startDate.slice(0, 10),
        notes: this.plan.notes ?? ''
      });
    } else {
      this.form.reset({
        name: '',
        description: '',
        debtorName: '',
        totalAmount: 0,
        currency: 'ARS',
        startDate: this.today(),
        notes: ''
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.save.emit({
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      debtorName: value.debtorName.trim(),
      totalAmount: value.totalAmount,
      currency: value.currency,
      startDate: new Date(value.startDate).toISOString(),
      notes: value.notes.trim() || undefined
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
