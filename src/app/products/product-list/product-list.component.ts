import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Product } from '../product.service';
import { ProductFormComponent } from '../product-form/product-form.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import * as ProductsActions from '../../store/products.actions';
import * as ProductsSelectors from '../../store/products.selectors';
import * as NotificationsSelectors from '../../store/notifications.selectors';
import * as NotificationsActions from '../../store/notifications.actions';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, ProductFormComponent, ProductModalComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent {
  products$: Observable<Product[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  notificationMessage$: Observable<string | null>;
  notificationType$: Observable<string | null>;

  showForm = false;
  editingProduct: Product | null = null;
  formLoading = false;

  constructor(private store: Store) {
    this.products$ = this.store.select(ProductsSelectors.selectAllProducts);
    this.loading$ = this.store.select(ProductsSelectors.selectProductsLoading);
    this.error$ = this.store.select(ProductsSelectors.selectProductsError);
    this.notificationMessage$ = this.store.select(NotificationsSelectors.selectNotificationMessage);
    this.notificationType$ = this.store.select(NotificationsSelectors.selectNotificationType);

    this.store.dispatch(ProductsActions.loadProducts());
  }

  onAdd() {
    this.editingProduct = null;
    this.showForm = true;
  }

  onEdit(product: Product) {
    this.editingProduct = product;
    this.showForm = true;
  }

  onCancelForm() {
    this.showForm = false;
    this.editingProduct = null;
  }

  onSave(product: Product) {
    this.formLoading = true;
    if (this.editingProduct && this.editingProduct.id) {
      this.store.dispatch(ProductsActions.updateProduct({ id: this.editingProduct.id, product }));
    } else {
      this.store.dispatch(ProductsActions.addProduct({ product }));
    }
    this.showForm = false;
    this.editingProduct = null;
    this.formLoading = false;
  }

  onDelete(product: Product) {
    if (!product.id) return;
    if (confirm(`¿Seguro que deseas eliminar el producto "${product.title}"?`)) {
      this.store.dispatch(ProductsActions.deleteProduct({ id: product.id }));
    }
  }
}

