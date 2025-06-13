import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
  TrackByFunction,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Product } from '../../../domain/models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

/**
 * Componente optimizado para mostrar listas de productos
 *
 * Características:
 * - Virtual scrolling para listas grandes
 * - TrackBy functions para performance
 * - Estados de loading y error
 * - Paginación infinita
 * - Responsive grid layout
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    ScrollingModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    ProductCardComponent,
  ],
  template: `
    <div class="product-list-container">
      <!-- Header con información -->
      <div class="list-header" *ngIf="_showHeader()">
        <div class="list-info">
          <span class="product-count">
            {{ _totalCount() }} producto{{ _totalCount() !== 1 ? 's' : '' }}
            <span *ngIf="isFiltered()" class="filtered-indicator">
              (filtrado{{ filteredCount() !== _totalCount() ? 's' : '' }})
            </span>
          </span>

          <button
            mat-icon-button
            *ngIf="canRefresh()"
            (click)="onRefresh()"
            [disabled]="_loading()"
            title="Actualizar lista"
          >
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      <!-- Lista de productos -->
      <div class="product-grid" [class.loading]="_loading()">
        <!-- Virtual scrolling para listas grandes -->
        <cdk-virtual-scroll-viewport
          *ngIf="_useVirtualScrolling() && hasProducts(); else regularList"
          itemSize="400"
          class="virtual-scroll-viewport"
        >
          <div
            *cdkVirtualFor="let product of _products(); trackBy: trackByProductId"
            class="virtual-item"
          >
            <app-product-card
              [product]="product"
              [loading]="isProductLoading(product.id!)"
              [maxTitleLength]="_maxTitleLength()"
              [maxDescriptionLength]="_maxDescriptionLength()"
              (viewDetails)="onProductViewDetails($event)"
              (addToCart)="onProductAddToCart($event)"
              (imageLoadError)="onImageLoadError($event)"
            />
          </div>
        </cdk-virtual-scroll-viewport>

        <!-- Lista regular para pocas items -->
        <ng-template #regularList>
          <div class="regular-grid" *ngIf="hasProducts()">
            <app-product-card
              *ngFor="let product of _products(); trackBy: trackByProductId"
              [product]="product"
              [loading]="isProductLoading(product.id!)"
              [maxTitleLength]="_maxTitleLength()"
              [maxDescriptionLength]="_maxDescriptionLength()"
              (viewDetails)="onProductViewDetails($event)"
              (addToCart)="onProductAddToCart($event)"
              (imageLoadError)="onImageLoadError($event)"
            />
          </div>
        </ng-template>

        <!-- Estado de loading -->
        <div class="loading-state" *ngIf="_loading() && !hasProducts()">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando productos...</p>
        </div>

        <!-- Estado vacío -->
        <div class="empty-state" *ngIf="!_loading() && !hasProducts()">
          <mat-icon class="empty-icon">inventory_2</mat-icon>
          <h3>{{ _emptyMessage() }}</h3>
          <p>{{ _emptySubMessage() }}</p>

          <button mat-raised-button color="primary" *ngIf="canRefresh()" (click)="onRefresh()">
            <mat-icon>refresh</mat-icon>
            Intentar de nuevo
          </button>
        </div>

        <!-- Loading más productos -->
        <div class="load-more-container" *ngIf="canLoadMore()">
          <button
            mat-raised-button
            color="accent"
            (click)="onLoadMore()"
            [disabled]="_loadingMore()"
          >
            <mat-spinner diameter="20" *ngIf="_loadingMore()"></mat-spinner>
            <mat-icon *ngIf="!_loadingMore()">expand_more</mat-icon>
            {{ _loadingMore() ? 'Cargando...' : 'Cargar más productos' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent {
  // Inputs
  @Input()
  set products(value: Product[]) {
    this._products.set(value || []);
  }

  @Input()
  set loading(value: boolean) {
    this._loading.set(value);
  }

  @Input()
  set loadingMore(value: boolean) {
    this._loadingMore.set(value);
  }

  @Input()
  set totalCount(value: number) {
    this._totalCount.set(value);
  }

  @Input()
  set hasMore(value: boolean) {
    this._hasMore.set(value);
  }

  @Input()
  set emptyMessage(value: string) {
    this._emptyMessage.set(value);
  }

  @Input()
  set emptySubMessage(value: string) {
    this._emptySubMessage.set(value);
  }

  @Input()
  set maxTitleLength(value: number) {
    this._maxTitleLength.set(value);
  }

  @Input()
  set maxDescriptionLength(value: number) {
    this._maxDescriptionLength.set(value);
  }

  @Input()
  set useVirtualScrolling(value: boolean) {
    this._useVirtualScrolling.set(value);
  }

  @Input()
  set showHeader(value: boolean) {
    this._showHeader.set(value);
  }

  @Input()
  set loadingProductIds(value: number[]) {
    this._loadingProductIds.set(value || []);
  }

  // Outputs
  @Output() productViewDetails = new EventEmitter<Product>();
  @Output() productAddToCart = new EventEmitter<Product>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() imageLoadError = new EventEmitter<string>();

  // Signals internos
  readonly _products = signal<Product[]>([]);
  readonly _loading = signal(false);
  readonly _loadingMore = signal(false);
  readonly _totalCount = signal(0);
  readonly _hasMore = signal(false);
  readonly _emptyMessage = signal('No hay productos disponibles');
  readonly _emptySubMessage = signal('Intenta ajustar los filtros o actualizar la página');
  readonly _maxTitleLength = signal(50);
  readonly _maxDescriptionLength = signal(100);
  readonly _useVirtualScrolling = signal(false);
  readonly _showHeader = signal(true);
  readonly _loadingProductIds = signal<number[]>([]);

  // Computed signals
  readonly hasProducts = computed(() => this._products().length > 0);
  readonly filteredCount = computed(() => this._products().length);
  readonly isFiltered = computed(
    () => this.filteredCount() !== this._totalCount() && this._totalCount() > 0
  );

  readonly canLoadMore = computed(() => this._hasMore() && this.hasProducts() && !this._loading());

  readonly canRefresh = computed(() => !this._loading());

  /**
   * TrackBy function optimizada para productos
   */
  readonly trackByProductId: TrackByFunction<Product> = (index: number, product: Product) => {
    return product.id || index;
  };

  /**
   * Verifica si un producto específico está cargando
   */
  isProductLoading(productId: number): boolean {
    return this._loadingProductIds().includes(productId);
  }

  /**
   * Maneja el evento de ver detalles de producto
   */
  onProductViewDetails(product: Product): void {
    this.productViewDetails.emit(product);
  }

  /**
   * Maneja el evento de agregar al carrito
   */
  onProductAddToCart(product: Product): void {
    this.productAddToCart.emit(product);
  }

  /**
   * Maneja el evento de cargar más productos
   */
  onLoadMore(): void {
    if (this.canLoadMore()) {
      this.loadMore.emit();
    }
  }

  /**
   * Maneja el evento de actualizar lista
   */
  onRefresh(): void {
    if (this.canRefresh()) {
      this.refresh.emit();
    }
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageLoadError(imageUrl: string): void {
    this.imageLoadError.emit(imageUrl);
  }
}
