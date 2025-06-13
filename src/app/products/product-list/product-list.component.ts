import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { Product, ProductService } from '../product.service';
// import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ProductSearchModalComponent } from '../product-search-modal/product-search-modal.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    ProductModalComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {
  products: Product[] = [];
  loading: boolean = false;
  error: string | null = null;


  showForm = false;
  editingProduct: Product | null = null;
  formLoading = false;

  // Estado para búsqueda por ID


  constructor(
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
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
        this.error = 'Error al cargar productos';
        this.loading = false;
        this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000, panelClass: 'snackbar-error' });
      }
    });
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
          this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
          this.formLoading = false;
        },
        error: (err) => {
          this.snackBar.open('Error al actualizar producto', 'Cerrar', { duration: 3000, panelClass: 'snackbar-error' });
          this.formLoading = false;
        }
      });
    } else {
      // Agregar producto
      this.productService.addProduct(product).subscribe({
        next: (newProduct) => {
          this.products.push(newProduct);
          this.showForm = false;
          this.formLoading = false;
          this.snackBar.open('Producto agregado exitosamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        },
        error: (err) => {
          this.snackBar.open('Error al agregar producto', 'Cerrar', { duration: 3000, panelClass: 'snackbar-error' });
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
          this.snackBar.open('Producto eliminado exitosamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        },
        error: (err) => {
          this.snackBar.open('Error al eliminar producto', 'Cerrar', { duration: 3000, panelClass: 'snackbar-error' });
        }
      });
    }
  }

  // Mostrar el modal de búsqueda usando MatDialog
  onShowSearchModal() {
    const dialogRef = this.dialog.open(ProductSearchModalComponent, {
      width: '400px',
      data: {},
      disableClose: false
    });
    // No es necesario manejar afterClosed aquí, el modal gestiona su propio estado
  }


}

