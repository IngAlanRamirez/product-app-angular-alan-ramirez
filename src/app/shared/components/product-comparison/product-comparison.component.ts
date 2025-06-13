import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product } from '../../../domain/models/product.model';
import { UIStore } from '../../store/ui.store';

/**
 * Componente de comparación de productos
 *
 * Características:
 * - Comparación lado a lado de hasta 4 productos
 * - Tabla responsive con características destacadas
 * - Indicadores visuales de mejor/peor valor
 * - Acciones rápidas (agregar al carrito, favoritos)
 * - Modo compacto para móviles
 * - Exportar comparación como imagen/PDF
 * - Compartir comparación
 */
@Component({
  selector: 'app-product-comparison',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="comparison-container" [class.compact]="isCompactMode()">
      <!-- Header -->
      <div class="comparison-header">
        <div class="header-content">
          <h2 class="comparison-title">
            <mat-icon>compare</mat-icon>
            Comparar Productos
            <span class="product-count">({{ products().length }})</span>
          </h2>

          <div class="header-actions">
            <!-- Toggle vista compacta -->
            <button
              mat-icon-button
              [matTooltip]="isCompactMode() ? 'Vista completa' : 'Vista compacta'"
              (click)="toggleCompactMode()"
              [attr.aria-label]="
                isCompactMode() ? 'Cambiar a vista completa' : 'Cambiar a vista compacta'
              "
            >
              <mat-icon>{{ isCompactMode() ? 'view_list' : 'view_compact' }}</mat-icon>
            </button>

            <!-- Exportar -->
            <button
              mat-icon-button
              matTooltip="Exportar comparación"
              (click)="exportComparison()"
              [disabled]="products().length === 0"
              aria-label="Exportar comparación"
            >
              <mat-icon>download</mat-icon>
            </button>

            <!-- Compartir -->
            <button
              mat-icon-button
              matTooltip="Compartir comparación"
              (click)="shareComparison()"
              [disabled]="products().length === 0"
              aria-label="Compartir comparación"
            >
              <mat-icon>share</mat-icon>
            </button>

            <!-- Limpiar -->
            <button
              mat-icon-button
              matTooltip="Limpiar comparación"
              (click)="clearComparison()"
              [disabled]="products().length === 0"
              aria-label="Limpiar comparación"
            >
              <mat-icon>clear_all</mat-icon>
            </button>
          </div>
        </div>

        <!-- Indicador de límite -->
        <div class="comparison-limit" *ngIf="products().length > 0">
          <mat-chip-set>
            <mat-chip [color]="products().length >= maxProducts() ? 'warn' : 'primary'">
              {{ products().length }} / {{ maxProducts() }} productos
            </mat-chip>
          </mat-chip-set>
        </div>
      </div>

      <!-- Estado vacío -->
      <div class="empty-state" *ngIf="products().length === 0">
        <div class="empty-content">
          <mat-icon class="empty-icon">compare</mat-icon>
          <h3>No hay productos para comparar</h3>
          <p>Agrega productos desde la lista para comenzar la comparación</p>
          <button mat-raised-button color="primary" (click)="onAddProducts.emit()">
            <mat-icon>add</mat-icon>
            Agregar Productos
          </button>
        </div>
      </div>

      <!-- Tabla de comparación -->
      <div class="comparison-table-container" *ngIf="products().length > 0">
        <table mat-table [dataSource]="comparisonData()" class="comparison-table">
          <!-- Columna de características -->
          <ng-container matColumnDef="feature">
            <th mat-header-cell *matHeaderCellDef class="feature-header">Características</th>
            <td mat-cell *matCellDef="let row" class="feature-cell">
              <div class="feature-info">
                <mat-icon class="feature-icon">{{ row.icon }}</mat-icon>
                <span class="feature-label">{{ row.label }}</span>
                <mat-icon
                  *ngIf="row.tooltip"
                  class="info-icon"
                  [matTooltip]="row.tooltip"
                  matTooltipPosition="right"
                >
                  info
                </mat-icon>
              </div>
            </td>
          </ng-container>

          <!-- Columnas de productos -->
          <ng-container
            *ngFor="let product of products(); trackBy: trackByProduct; let i = index"
            [matColumnDef]="'product-' + i"
          >
            <th mat-header-cell *matHeaderCellDef class="product-header">
              <div class="product-header-content">
                <!-- Imagen del producto -->
                <div class="product-image-container">
                  <img
                    [src]="product.image"
                    [alt]="product.title"
                    class="product-image"
                    loading="lazy"
                    (error)="onImageError($event)"
                  />
                  <div class="product-overlay">
                    <button
                      mat-icon-button
                      class="remove-product"
                      (click)="removeProduct(product)"
                      matTooltip="Quitar de comparación"
                      aria-label="Quitar producto de comparación"
                    >
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>

                <!-- Info del producto -->
                <div class="product-info">
                  <h4 class="product-title" [matTooltip]="product.title">
                    {{ product.getTruncatedTitle(30) }}
                  </h4>
                  <div class="product-price">
                    <span class="price-current">{{ product.priceVO.format() }}</span>
                    <mat-chip
                      *ngIf="getBestValue() === product.id"
                      class="best-value-chip"
                      color="accent"
                    >
                      Mejor Precio
                    </mat-chip>
                  </div>
                </div>

                <!-- Acciones rápidas -->
                <div class="product-actions">
                  <button
                    mat-icon-button
                    [color]="isInFavorites(product) ? 'warn' : 'primary'"
                    (click)="toggleFavorite(product)"
                    [matTooltip]="
                      isInFavorites(product) ? 'Quitar de favoritos' : 'Agregar a favoritos'
                    "
                    [attr.aria-label]="
                      isInFavorites(product) ? 'Quitar de favoritos' : 'Agregar a favoritos'
                    "
                  >
                    <mat-icon>{{
                      isInFavorites(product) ? 'favorite' : 'favorite_border'
                    }}</mat-icon>
                  </button>

                  <button
                    mat-raised-button
                    color="primary"
                    (click)="addToCart(product)"
                    class="add-to-cart-btn"
                  >
                    <mat-icon>shopping_cart</mat-icon>
                    <span class="btn-text">Agregar</span>
                  </button>
                </div>
              </div>
            </th>
            <td mat-cell *matCellDef="let row" [class]="getCellClass(row, product)">
              <div class="cell-content">
                <span class="cell-value">{{ getCellValue(row, product) }}</span>
                <mat-icon
                  *ngIf="isHighlightedValue(row, product)"
                  class="highlight-icon"
                  [matTooltip]="getHighlightTooltip(row, product)"
                >
                  {{ getHighlightIcon(row, product) }}
                </mat-icon>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </div>

      <!-- Resumen de comparación -->
      <div class="comparison-summary" *ngIf="products().length > 1">
        <mat-card class="summary-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>analytics</mat-icon>
              Resumen de Comparación
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Precio promedio:</span>
                <span class="stat-value">{{ getAveragePrice() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Diferencia de precio:</span>
                <span class="stat-value">{{ getPriceDifference() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Mejor valorado:</span>
                <span class="stat-value">{{ getBestRated()?.getTruncatedTitle(20) || 'N/A' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./product-comparison.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductComparisonComponent {
  // Inputs
  readonly products = input<Product[]>([]);
  readonly maxProducts = input<number>(4);

  // Outputs
  readonly onAddProducts = output<void>();
  readonly onRemoveProduct = output<Product>();
  readonly onToggleFavorite = output<Product>();
  readonly onAddToCart = output<Product>();
  readonly onExport = output<'image' | 'pdf'>();
  readonly onShare = output<string>();

  // Inyección de dependencias
  private readonly uiStore = inject(UIStore);

  // Estado local
  private readonly _isCompactMode = signal(false);
  private readonly _favorites = signal<Set<number>>(new Set());

  // Computed signals
  readonly isCompactMode = computed(() => this._isCompactMode());

  readonly displayedColumns = computed(() => {
    const columns = ['feature'];
    for (let i = 0; i < this.products().length; i++) {
      columns.push(`product-${i}`);
    }
    return columns;
  });

  readonly comparisonData = computed(() => {
    const features = [
      {
        key: 'title',
        label: 'Nombre',
        icon: 'label',
        tooltip: 'Nombre completo del producto',
      },
      {
        key: 'price',
        label: 'Precio',
        icon: 'attach_money',
        tooltip: 'Precio actual del producto',
      },
      {
        key: 'category',
        label: 'Categoría',
        icon: 'category',
        tooltip: 'Categoría del producto',
      },
      {
        key: 'rating',
        label: 'Valoración',
        icon: 'star',
        tooltip: 'Valoración promedio de usuarios',
      },
      {
        key: 'description',
        label: 'Descripción',
        icon: 'description',
        tooltip: 'Descripción del producto',
      },
      {
        key: 'availability',
        label: 'Disponibilidad',
        icon: 'inventory',
        tooltip: 'Estado de disponibilidad',
      },
    ];

    return this.isCompactMode() ? features.slice(0, 4) : features;
  });

  /**
   * Toggle modo compacto
   */
  toggleCompactMode(): void {
    this._isCompactMode.update(current => !current);
    this.uiStore.addNotification({
      title: 'Vista cambiada',
      message: `Vista ${this._isCompactMode() ? 'compacta' : 'completa'} activada`,
      type: 'info',
      duration: 2000,
    });
  }

  /**
   * Quitar producto de la comparación
   */
  removeProduct(product: Product): void {
    this.onRemoveProduct.emit(product);
    this.uiStore.addNotification({
      title: 'Producto eliminado',
      message: `${product.getTruncatedTitle(20)} eliminado de la comparación`,
      type: 'info',
      duration: 3000,
    });
  }

  /**
   * Limpiar toda la comparación
   */
  clearComparison(): void {
    this.products().forEach(product => this.onRemoveProduct.emit(product));
    this.uiStore.addNotification({
      title: 'Comparación limpiada',
      message: 'Comparación limpiada',
      type: 'info',
      duration: 2000,
    });
  }

  /**
   * Toggle favorito
   */
  toggleFavorite(product: Product): void {
    const favorites = new Set(this._favorites());
    if (favorites.has(product.id!)) {
      favorites.delete(product.id!);
    } else {
      favorites.add(product.id!);
    }
    this._favorites.set(favorites);
    this.onToggleFavorite.emit(product);

    const action = favorites.has(product.id!) ? 'agregado a' : 'eliminado de';
    this.uiStore.addNotification({
      title: 'Favoritos actualizado',
      message: `${product.getTruncatedTitle(20)} ${action} favoritos`,
      type: 'success',
      duration: 2000,
    });
  }

  /**
   * Agregar al carrito
   */
  addToCart(product: Product): void {
    this.onAddToCart.emit(product);
    this.uiStore.addNotification({
      title: 'Producto agregado',
      message: `${product.getTruncatedTitle(20)} agregado al carrito`,
      type: 'success',
      duration: 3000,
      actions: [{ label: 'Ver Carrito', action: () => {} }],
    });
  }

  /**
   * Exportar comparación
   */
  exportComparison(): void {
    // Por ahora exportamos como imagen
    this.onExport.emit('image');
    this.uiStore.addNotification({
      title: 'Exportando',
      message: 'Exportando comparación...',
      type: 'info',
      duration: 2000,
    });
  }

  /**
   * Compartir comparación
   */
  shareComparison(): void {
    const shareData = this.generateShareData();
    this.onShare.emit(shareData);

    if (navigator.share) {
      navigator.share({
        title: 'Comparación de Productos',
        text: shareData,
        url: window.location.href,
      });
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(shareData);
      this.uiStore.addNotification({
        title: 'Enlace copiado',
        message: 'Enlace copiado al portapapeles',
        type: 'success',
        duration: 3000,
      });
    }
  }

  /**
   * Verificar si producto está en favoritos
   */
  isInFavorites(product: Product): boolean {
    return this._favorites().has(product.id!);
  }

  /**
   * Obtener mejor valor (precio más bajo)
   */
  getBestValue(): number | null {
    if (this.products().length === 0) return null;

    return this.products().reduce((best, current) => (current.price < best.price ? current : best))
      .id!;
  }

  /**
   * Obtener mejor valorado
   */
  getBestRated(): Product | null {
    if (this.products().length === 0) return null;

    return this.products().reduce((best, current) => {
      const currentRating = this.getProductRating(current);
      const bestRating = this.getProductRating(best);
      return currentRating > bestRating ? current : best;
    });
  }

  /**
   * Obtener precio promedio
   */
  getAveragePrice(): string {
    if (this.products().length === 0) return '$0.00';

    const total = this.products().reduce((sum, product) => sum + product.price, 0);
    const average = total / this.products().length;
    return `$${average.toFixed(2)}`;
  }

  /**
   * Obtener diferencia de precio
   */
  getPriceDifference(): string {
    if (this.products().length < 2) return '$0.00';

    const prices = this.products().map(p => p.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    return `$${(max - min).toFixed(2)}`;
  }

  /**
   * Obtener valor de celda
   */
  getCellValue(row: any, product: Product): string {
    switch (row.key) {
      case 'title':
        return product.getTruncatedTitle(25);
      case 'price':
        return product.priceVO.format();
      case 'category':
        return product.category;
      case 'rating':
        return `${this.getProductRating(product).toFixed(1)} ⭐`;
      case 'description':
        const description = product.description || '';
        return description.length > 50 ? description.substring(0, 50) + '...' : description;
      case 'availability':
        return 'En stock'; // Placeholder
      default:
        return 'N/A';
    }
  }

  /**
   * Obtener clase CSS de celda
   */
  getCellClass(row: any, product: Product): string {
    const classes = ['comparison-cell'];

    if (this.isHighlightedValue(row, product)) {
      classes.push('highlighted');
    }

    return classes.join(' ');
  }

  /**
   * Verificar si valor debe ser destacado
   */
  isHighlightedValue(row: any, product: Product): boolean {
    switch (row.key) {
      case 'price':
        return this.getBestValue() === product.id;
      case 'rating':
        return this.getBestRated()?.id === product.id;
      default:
        return false;
    }
  }

  /**
   * Obtener ícono de destacado
   */
  getHighlightIcon(row: any, product: Product): string {
    switch (row.key) {
      case 'price':
        return 'trending_down';
      case 'rating':
        return 'trending_up';
      default:
        return 'star';
    }
  }

  /**
   * Obtener tooltip de destacado
   */
  getHighlightTooltip(row: any, product: Product): string {
    switch (row.key) {
      case 'price':
        return 'Mejor precio';
      case 'rating':
        return 'Mejor valoración';
      default:
        return 'Destacado';
    }
  }

  /**
   * Manejar error de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.png';
  }

  /**
   * TrackBy para productos
   */
  trackByProduct(index: number, product: Product): number {
    return product.id || index;
  }

  /**
   * Obtener rating del producto
   */
  private getProductRating(product: Product): number {
    // Placeholder - en una implementación real esto vendría del producto
    return Math.random() * 5;
  }

  /**
   * Generar datos para compartir
   */
  private generateShareData(): string {
    const productNames = this.products()
      .map(p => p.getTruncatedTitle(20))
      .join(', ');
    return `Comparando: ${productNames} - ${window.location.href}`;
  }
}
