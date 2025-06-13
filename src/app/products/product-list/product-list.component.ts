import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductService } from '../product.service';
// import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, ProductModalComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {
  products: Product[] = [];
  loading: boolean = false;
  error: string | null = null;
  notificationMessage: string | null = null;
  notificationType: 'success' | 'error' | null = null;

  showForm = false;
  editingProduct: Product | null = null;
  formLoading = false;

  constructor(private productService: ProductService) {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Error cargando productos';
        this.loading = false;
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    setTimeout(() => {
      this.notificationMessage = null;
      this.notificationType = null;
    }, 3000);
  }

  onAdd() {
    this.editingProduct = null;
    this.showForm = true;
  }

  onEdit(product: Product) {
    this.editingProduct = { ...product };
    this.showForm = true;
  }

  onCancelForm() {
    this.showForm = false;
    this.editingProduct = null;
  }

  onSave(product: Product) {
    this.formLoading = true;
    if (this.editingProduct && this.editingProduct.id) {
      // Editar producto
      this.productService.updateProduct(this.editingProduct.id, product).subscribe({
        next: (updated) => {
          this.products = this.products.map(p => p.id === updated.id ? updated : p);
          this.showNotification('Producto actualizado correctamente', 'success');
          this.formLoading = false;
        },
        error: (err) => {
          this.showNotification('Error actualizando producto', 'error');
          this.formLoading = false;
        }
      });
    } else {
      // Agregar producto
      this.productService.addProduct(product).subscribe({
        next: (created) => {
          this.products = [...this.products, created];
          this.showNotification('Producto agregado correctamente', 'success');
          this.formLoading = false;
        },
        error: (err) => {
          this.showNotification('Error agregando producto', 'error');
          this.formLoading = false;
        }
      });
    }
    this.showForm = false;
    this.editingProduct = null;
  }

  onDelete(product: Product) {
    if (!product.id) return;
    if (confirm(`¿Seguro que deseas eliminar el producto "${product.title}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.showNotification('Producto eliminado correctamente', 'success');
        },
        error: (err) => {
          this.showNotification('Error eliminando producto', 'error');
        }
      });
    }
  }

}

