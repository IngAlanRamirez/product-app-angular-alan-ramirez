import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../../domain/models/product.model';

/**
 * Componente de formulario de producto.
 * Recibe un producto opcional para edición y emite el evento save con los datos.
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="fill">
        <mat-label>Título</mat-label>
        <input matInput formControlName="title" required />
      </mat-form-field>
      <mat-form-field appearance="fill">
        <mat-label>Precio</mat-label>
        <input matInput type="number" formControlName="price" required />
      </mat-form-field>
      <mat-form-field appearance="fill">
        <mat-label>Descripción</mat-label>
        <input matInput formControlName="description" />
      </mat-form-field>
      <mat-form-field appearance="fill">
        <mat-label>Categoría</mat-label>
        <input matInput formControlName="category" />
      </mat-form-field>
      <mat-form-field appearance="fill">
        <mat-label>Imagen</mat-label>
        <input matInput formControlName="image" />
      </mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid">Guardar</button>
    </form>
  `
})
export class ProductFormComponent {
  @Input() set product(value: Product | null) {
    if (value) {
      this.productForm.patchValue(value);
    }
  }
  @Output() save = new EventEmitter<Partial<Product>>();

  productForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      description: [''],
      category: [''],
      image: ['']
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.save.emit(this.productForm.value);
    }
  }
}
