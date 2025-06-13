import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Product } from '../../domain/models/product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
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
      // Convertir la instancia de Product a datos planos para el formulario
      this.form.patchValue(this.product.toData());
    } else {
      this.form.reset();
    }
  }

  onSubmit() {
    if (this.form.valid) {
      // Crear una instancia de Product desde los datos del formulario
      const formValue = this.form.value;
      const productData = {
        id: this.product?.id,
        title: formValue.title || '',
        price: formValue.price || 0,
        category: formValue.category || '',
        image: formValue.image || '',
        description: formValue.description || undefined,
      };
      const product = Product.fromData(productData);
      this.save.emit(product);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
