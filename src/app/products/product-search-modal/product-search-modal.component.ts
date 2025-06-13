import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Product, ProductService } from '../product.service';

@Component({
  selector: 'app-product-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './product-search-modal.component.html',
  styleUrls: ['./product-search-modal.component.scss']
})
export class ProductSearchModalComponent {
  productId: string = '';
  loading = false;
  product: Product | null = null;
  error: string | null = null;
  searched = false;

  constructor(
    private dialogRef: MatDialogRef<ProductSearchModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productService: ProductService
  ) {}

  onSearch() {
    if (!this.productId) return;
    this.loading = true;
    this.product = null;
    this.error = null;
    this.searched = false;
    this.productService.getProduct(+this.productId).subscribe({
      next: (prod) => {
        this.product = prod;
        this.loading = false;
        this.searched = true;
      },
      error: (err) => {
        this.product = null;
        this.loading = false;
        this.searched = true;
        this.error = 'No se encontraron coincidencias para el ID ingresado';
      }
    });
  }

  onClose() {
    this.dialogRef.close();
    this.productId = '';
  }
}
