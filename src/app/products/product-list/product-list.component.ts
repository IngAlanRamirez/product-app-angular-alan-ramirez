import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../product.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products$!: Observable<Product[]>;
  loading = true;
  error: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.products$ = this.productService.getProducts();
    this.products$.subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        if (err instanceof Error) {
          this.error = err.message;
        } else if (typeof err === 'string') {
          this.error = err;
        } else {
          this.error = 'Ocurrió un error inesperado al cargar los productos.';
        }
        this.loading = false;
      },
    });
  }
}
