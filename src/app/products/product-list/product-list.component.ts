import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Product } from '../../domain/models/product.model';
import { ProductsStore } from '../../shared/store/products.store';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ProductSearchModalComponent } from '../product-search-modal/product-search-modal.component';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    ProductModalComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {
  // Inyección de dependencias usando inject()
  private readonly productsStore = inject(ProductsStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Signals del store
  readonly products = this.productsStore.products;
  readonly loading = this.productsStore.isLoading;
  readonly error = this.productsStore.error;

  // Estado local del componente
  showForm = false;
  editingProduct: Product | null = null;
  formLoading = false;

  constructor() {
    // Cargar productos al inicializar
    this.productsStore.loadProducts();
  }

  /**
   * Recarga la lista de productos
   */
  loadProducts() {
    this.productsStore.loadProducts(true); // Force refresh
  }

  onAdd() {
    this.editingProduct = null;
    this.showForm = true;
  }

  onEdit(product: Product) {
    this.editingProduct = Product.fromData(product.toData());
    this.showForm = true;
  }

  onCancelForm() {
    this.showForm = false;
    this.editingProduct = null;
  }

  /**
   * Guarda un producto nuevo o actualizado.
   */
  onSave(product: Product) {
    if (!product || typeof product !== 'object' || Object.keys(product).length === 0) {
      this.formLoading = false;
      return;
    }

    this.formLoading = true;

    if (this.editingProduct && this.editingProduct.id) {
      // TODO: Implementar actualización en el store
      this.snackBar.open('Función de edición pendiente de implementar', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-info',
      });
      this.formLoading = false;
    } else {
      // TODO: Implementar creación en el store
      this.snackBar.open('Función de creación pendiente de implementar', 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-info',
      });
      this.formLoading = false;
    }

    this.showForm = false;
    this.editingProduct = null;
  }

  /**
   * Elimina un producto
   */
  onDelete(product: Product) {
    if (!product || typeof product !== 'object' || !product.id || typeof product.id !== 'number') {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Eliminar producto',
        message: `¿Seguro que deseas eliminar el producto "${product.title}"?`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // TODO: Implementar eliminación en el store
        this.snackBar.open('Función de eliminación pendiente de implementar', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-info',
        });
      }
    });
  }

  // Mostrar el modal de búsqueda
  onShowSearchModal() {
    const dialogRef = this.dialog.open(ProductSearchModalComponent, {
      width: '400px',
      data: {},
      disableClose: false,
    });
  }
}
