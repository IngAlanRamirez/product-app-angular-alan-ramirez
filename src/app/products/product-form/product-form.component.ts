import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Product } from '../product.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProductFormComponent {
  @Input() product: Product | null = null;
  @Input() loading = false;
  @Output() save = new EventEmitter<Product>();
  @Output() cancel = new EventEmitter<void>();

  form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      category: ['', [Validators.required]],
      image: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]],
      description: [''],
    });
  }

  ngOnChanges() {
    if (this.product) {
      // TODO: Reimplementar esta lógica sin NgRx
      this.form.patchValue(this.product);
    } else {
      this.form.reset();
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value as Product);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
