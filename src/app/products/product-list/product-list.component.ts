import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../domain/models/product.model';
import { AddProductUseCase } from '../../domain/use-cases/add-product.usecase';
import { DeleteProductUseCase } from '../../domain/use-cases/delete-product.usecase';
import { GetProductsUseCase } from '../../domain/use-cases/get-products.usecase';
import { UpdateProductUseCase } from '../../domain/use-cases/update-product.usecase';
// import { ProductFormComponent } from '../product-form/product-form.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
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
  products: Product[] = [];
  loading: boolean = false;
  error: string | null = null;

  showForm = false;
  editingProduct: Product | null = null;
  formLoading = false;

  // Estado para búsqueda por ID

  /**
   * Inyectamos los casos de uso y servicios de Angular Material.
   * Los casos de uso encapsulan la lógica de negocio y acceso a datos.
   */
  /**
   * El parámetro opcional autoLoad permite desactivar la carga automática de productos (útil para pruebas unitarias).
   */
  autoLoad: boolean = true;

  constructor(
    private getProductsUseCase: GetProductsUseCase,
    private addProductUseCase: AddProductUseCase,
    private updateProductUseCase: UpdateProductUseCase,
    private deleteProductUseCase: DeleteProductUseCase,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    if (this.autoLoad) {
      this.loadProducts();
    }
  }

  /**
   * Carga la lista de productos usando el caso de uso correspondiente.
   * Maneja el estado de carga y errores.
   */
  loadProducts() {
    this.loading = true;
    this.error = null;
    this.getProductsUseCase.execute().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;
      },
      error: err => {
        this.error = 'Error al cargar productos';
        this.loading = false;
        this.snackBar.open('Error al cargar productos', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-error',
        });
      },
    });
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
   * Defensa: Si el producto es nulo o inválido, no ejecuta el caso de uso ni llama a subscribe.
   */
  onSave(product: Product) {
    if (!product || typeof product !== 'object' || Object.keys(product).length === 0) {
      // Defensa: no hacer nada si el producto es nulo o vacío
      this.formLoading = false;
      return;
    }
    this.formLoading = true;
    if (this.editingProduct && this.editingProduct.id) {
      // Editar producto
      this.updateProductUseCase.execute(this.editingProduct.id, product).subscribe({
        next: updated => {
          this.products = this.products.map(p => (p.id === updated.id ? updated : p));
          this.snackBar.open('Producto actualizado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-success',
          });
          this.formLoading = false;
        },
        error: err => {
          this.snackBar.open('Error al actualizar producto', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-error',
          });
          this.formLoading = false;
        },
      });
    } else {
      // Agregar producto
      this.addProductUseCase.execute(product).subscribe({
        next: newProduct => {
          this.products.push(newProduct);
          this.showForm = false;
          this.formLoading = false;
          this.snackBar.open('Producto agregado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-success',
          });
        },
        error: err => {
          this.snackBar.open('Error al agregar producto', 'Cerrar', {
            duration: 3000,
            panelClass: 'snackbar-error',
          });
          this.formLoading = false;
        },
      });
    }
    this.showForm = false;
    this.editingProduct = null;
  }

  /**
   * Abre un diálogo Material para confirmar la eliminación de un producto.
   * Si el usuario confirma, ejecuta el caso de uso de borrado y muestra notificación.
   */
  /**
   * Abre un diálogo Material para confirmar la eliminación de un producto.
   * Defensa: Si el producto es nulo o no tiene ID válido, no ejecuta el caso de uso ni subscribe.
   */
  onDelete(product: Product) {
    if (!product || typeof product !== 'object' || !product.id || typeof product.id !== 'number') {
      // Defensa: no hacer nada si el producto es nulo o el id no es válido
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
        this.deleteProductUseCase.execute(product.id!).subscribe({
          next: () => {
            this.products = this.products.filter(p => p.id !== product.id);
            this.snackBar.open('Producto eliminado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-success',
            });
          },
          error: err => {
            this.snackBar.open('Error al eliminar producto', 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-error',
            });
          },
        });
      }
    });
  }

  // Mostrar el modal de búsqueda usando MatDialog
  onShowSearchModal() {
    const dialogRef = this.dialog.open(ProductSearchModalComponent, {
      width: '400px',
      data: {},
      disableClose: false,
    });
    // No es necesario manejar afterClosed aquí, el modal gestiona su propio estado
  }
}
