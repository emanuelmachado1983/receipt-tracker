import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PaymentMethod,
  Receipt,
  ReceiptFormValue,
  ReceiptStatus,
  RECEIPT_STATUS_LABELS
} from '../../models/receipt.model';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

interface ReceiptStatusOption {
  value: ReceiptStatus;
  label: string;
}

@Component({
  selector: 'app-add-receipt-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-receipt-modal.component.html',
  styleUrl: './add-receipt-modal.component.scss'
})
export class AddReceiptModalComponent implements OnChanges {
  @Input() receipt: Receipt | null = null;

  @Output() save = new EventEmitter<ReceiptFormValue>();
  @Output() close = new EventEmitter<void>();

  readonly paymentMethods: PaymentMethodOption[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'otro', label: 'Otro' }
  ];

  readonly statuses: ReceiptStatusOption[] = (['pending', 'paid'] as ReceiptStatus[]).map((value) => ({
    value,
    label: RECEIPT_STATUS_LABELS[value]
  }));

  readonly form = this.fb.nonNullable.group({
    date: [this.today(), Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['efectivo' as PaymentMethod, Validators.required],
    status: ['pending' as ReceiptStatus, Validators.required],
    sent: [false],
    notes: ['']
  });

  constructor(private fb: FormBuilder) {}

  get isEditMode(): boolean {
    return !!this.receipt;
  }

  ngOnChanges(): void {
    if (this.receipt) {
      this.form.setValue({
        date: this.receipt.date.slice(0, 10),
        amount: this.receipt.amount,
        paymentMethod: this.receipt.paymentMethod,
        status: this.receipt.status,
        sent: this.receipt.sent,
        notes: this.receipt.notes ?? ''
      });
    } else {
      this.form.reset({
        date: this.today(),
        amount: 0,
        paymentMethod: 'efectivo',
        status: 'pending',
        sent: false,
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
      date: new Date(value.date).toISOString(),
      amount: value.amount,
      paymentMethod: value.paymentMethod,
      status: value.status,
      sent: value.sent,
      notes: value.notes.trim() || undefined
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
