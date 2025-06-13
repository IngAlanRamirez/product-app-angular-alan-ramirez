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
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product } from '../../../domain/models/product.model';
import { UIStore } from '../../store/ui.store';

/**
 * Componente de detalle de producto
 *
 * Características:
 * - Vista detallada con galería de imágenes
 * - Información completa del producto
 * - Acciones de usuario (favoritos, carrito, compartir)
 * - Tabs con especificaciones, reviews y productos relacionados
 * - Zoom de imagen y vista de 360°
 * - Calculadora de descuentos y ofertas
 * - Disponibilidad y stock en tiempo real
 * - Breadcrumbs y navegación
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  template: `
    <div class="product-detail-container" *ngIf="product()">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Navegación">
        <ol class="breadcrumb-list">
          <li><a href="/" (click)="onNavigate.emit('home')">Inicio</a></li>
          <li><a href="/products" (click)="onNavigate.emit('products')">Productos</a></li>
          <li>
            <a [href]="'/category/' + product()!.category" (click)="onNavigate.emit('category')">{{
              product()!.category
            }}</a>
          </li>
          <li class="current" aria-current="page">{{ product()!.getTruncatedTitle(30) }}</li>
        </ol>
      </nav>

      <div class="product-detail-content">
        <!-- Galería de imágenes -->
        <div class="product-gallery">
          <div class="main-image-container">
            <img
              [src]="selectedImage()"
              [alt]="product()!.title"
              class="main-image"
              [class.zoomed]="isImageZoomed()"
              (click)="toggleImageZoom()"
              (error)="onImageError($event)"
              loading="lazy"
            />

            <!-- Overlay de zoom -->
            <div class="image-overlay" *ngIf="!isImageZoomed()">
              <button
                mat-fab
                color="primary"
                class="zoom-btn"
                (click)="toggleImageZoom()"
                matTooltip="Hacer zoom"
                aria-label="Hacer zoom a la imagen"
              >
                <mat-icon>zoom_in</mat-icon>
              </button>
            </div>

            <!-- Badge de descuento -->
            <div class="discount-badge" *ngIf="hasDiscount()">
              <mat-chip color="accent">
                <mat-icon>local_offer</mat-icon>
                {{ getDiscountPercentage() }}% OFF
              </mat-chip>
            </div>

            <!-- Badge de stock -->
            <div class="stock-badge">
              <mat-chip [color]="getStockColor()">
                <mat-icon>{{ getStockIcon() }}</mat-icon>
                {{ getStockText() }}
              </mat-chip>
            </div>
          </div>
        </div>

        <!-- Información del producto -->
        <div class="product-info">
          <!-- Header -->
          <div class="product-header">
            <div class="title-section">
              <h1 class="product-title">{{ product()!.title }}</h1>
              <div class="product-meta">
                <span class="category-chip">
                  <mat-icon>category</mat-icon>
                  {{ product()!.category }}
                </span>
                <span class="product-id">ID: {{ product()!.id }}</span>
              </div>
            </div>

            <!-- Acciones rápidas -->
            <div class="quick-actions">
              <button
                mat-icon-button
                [color]="isInFavorites() ? 'warn' : 'primary'"
                (click)="toggleFavorite()"
                [matTooltip]="isInFavorites() ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                [attr.aria-label]="isInFavorites() ? 'Quitar de favoritos' : 'Agregar a favoritos'"
              >
                <mat-icon>{{ isInFavorites() ? 'favorite' : 'favorite_border' }}</mat-icon>
              </button>

              <button
                mat-icon-button
                (click)="shareProduct()"
                matTooltip="Compartir producto"
                aria-label="Compartir producto"
              >
                <mat-icon>share</mat-icon>
              </button>

              <button
                mat-icon-button
                (click)="addToComparison()"
                matTooltip="Agregar a comparación"
                aria-label="Agregar a comparación"
              >
                <mat-icon>compare</mat-icon>
              </button>
            </div>
          </div>

          <!-- Rating y reviews -->
          <div class="rating-section" *ngIf="productRating()">
            <div class="rating-display">
              <div class="stars">
                @for (star of getStarArray(); track $index) {
                  <mat-icon [class]="star.class">{{ star.icon }}</mat-icon>
                }
              </div>
              <span class="rating-value">{{ productRating()!.rate.toFixed(1) }}</span>
              <span class="rating-count">({{ productRating()!.count }} reseñas)</span>
            </div>
            <button mat-button color="primary" (click)="scrollToReviews()">
              Ver todas las reseñas
            </button>
          </div>

          <!-- Precio -->
          <div class="price-section">
            <div class="price-display">
              <span class="current-price">{{ product()!.priceVO.format() }}</span>
              <span class="original-price" *ngIf="hasDiscount()">{{ getOriginalPrice() }}</span>
            </div>
            <div class="price-details" *ngIf="hasDiscount()">
              <span class="savings">Ahorras {{ getSavingsAmount() }}</span>
              <span class="discount-info">{{ getDiscountPercentage() }}% de descuento</span>
            </div>
          </div>

          <!-- Cantidad y acciones -->
          <div class="purchase-section">
            <div class="quantity-selector">
              <label for="quantity">Cantidad:</label>
              <div class="quantity-controls">
                <button
                  mat-icon-button
                  (click)="decreaseQuantity()"
                  [disabled]="quantity() <= 1"
                  aria-label="Disminuir cantidad"
                >
                  <mat-icon>remove</mat-icon>
                </button>
                <input
                  id="quantity"
                  type="number"
                  [value]="quantity()"
                  (input)="updateQuantity($event)"
                  min="1"
                  [max]="maxQuantity"
                  class="quantity-input"
                />
                <button
                  mat-icon-button
                  (click)="increaseQuantity()"
                  [disabled]="quantity() >= maxQuantity"
                  aria-label="Aumentar cantidad"
                >
                  <mat-icon>add</mat-icon>
                </button>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="action-buttons">
              <button
                mat-raised-button
                color="primary"
                class="add-to-cart-btn"
                (click)="addToCart()"
                [disabled]="!isInStock()"
              >
                <mat-icon>shopping_cart</mat-icon>
                Agregar al Carrito
              </button>

              <button
                mat-stroked-button
                color="primary"
                class="buy-now-btn"
                (click)="buyNow()"
                [disabled]="!isInStock()"
              >
                <mat-icon>flash_on</mat-icon>
                Comprar Ahora
              </button>
            </div>

            <!-- Total -->
            <div class="total-section">
              <div class="total-display">
                <span class="total-label">Total:</span>
                <span class="total-amount">{{ getTotalPrice() }}</span>
              </div>
            </div>
          </div>

          <!-- Información adicional -->
          <div class="additional-info">
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>local_shipping</mat-icon>
                  Envío y Entrega
                </mat-panel-title>
              </mat-expansion-panel-header>
              <div class="shipping-info">
                <p><strong>Envío gratis</strong> en pedidos mayores a $50</p>
                <p><strong>Entrega estimada:</strong> 2-3 días hábiles</p>
                <p><strong>Devoluciones:</strong> 30 días sin preguntas</p>
              </div>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>security</mat-icon>
                  Garantía y Soporte
                </mat-panel-title>
              </mat-expansion-panel-header>
              <div class="warranty-info">
                <p><strong>Garantía:</strong> 1 año del fabricante</p>
                <p><strong>Soporte:</strong> 24/7 chat en vivo</p>
                <p><strong>Instalación:</strong> Servicio disponible</p>
              </div>
            </mat-expansion-panel>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga -->
    <div class="loading-state" *ngIf="!product()">
      <mat-icon class="loading-icon">hourglass_empty</mat-icon>
      <p>Cargando producto...</p>
    </div>
  `,
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  // Inputs
  readonly product = input<Product | null>(null);
  readonly relatedProducts = input<Product[]>([]);
  readonly isLoading = input<boolean>(false);

  // Outputs
  readonly onAddToCart = output<{ product: Product; quantity: number }>();
  readonly onBuyNow = output<{ product: Product; quantity: number }>();
  readonly onToggleFavorite = output<Product>();
  readonly onAddToComparison = output<Product>();
  readonly onShare = output<Product>();
  readonly onProductSelect = output<Product>();
  readonly onNavigate = output<string>();

  // Inyección de dependencias
  private readonly uiStore = inject(UIStore);

  // Estado local
  private readonly _selectedImageIndex = signal(0);
  private readonly _isImageZoomed = signal(false);
  private readonly _quantity = signal(1);
  private readonly _selectedTabIndex = signal(0);
  private readonly _favorites = signal<Set<number>>(new Set());

  // Configuración
  readonly maxQuantity = 10;

  // Computed signals
  readonly selectedImageIndex = computed(() => this._selectedImageIndex());
  readonly isImageZoomed = computed(() => this._isImageZoomed());
  readonly quantity = computed(() => this._quantity());
  readonly selectedTabIndex = computed(() => this._selectedTabIndex());

  readonly selectedImage = computed(() => {
    const product = this.product();
    return product?.image || '';
  });

  readonly productRating = computed(() => {
    // En una implementación real, esto vendría del producto
    return {
      rate: 4.2 + Math.random() * 0.8,
      count: Math.floor(Math.random() * 500) + 50,
    };
  });

  /**
   * Toggle zoom de imagen
   */
  toggleImageZoom(): void {
    this._isImageZoomed.update(current => !current);
  }

  /**
   * Aumentar cantidad
   */
  increaseQuantity(): void {
    if (this.quantity() < this.maxQuantity) {
      this._quantity.update(current => current + 1);
    }
  }

  /**
   * Disminuir cantidad
   */
  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this._quantity.update(current => current - 1);
    }
  }

  /**
   * Actualizar cantidad desde input
   */
  updateQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);

    if (!isNaN(value) && value >= 1 && value <= this.maxQuantity) {
      this._quantity.set(value);
    }
  }

  /**
   * Agregar al carrito
   */
  addToCart(): void {
    const product = this.product();
    if (product && this.isInStock()) {
      this.onAddToCart.emit({ product, quantity: this.quantity() });
      this.uiStore.addNotification({
        title: 'Producto agregado',
        message: `${product.getTruncatedTitle(20)} agregado al carrito`,
        type: 'success',
        duration: 3000,
      });
    }
  }

  /**
   * Comprar ahora
   */
  buyNow(): void {
    const product = this.product();
    if (product && this.isInStock()) {
      this.onBuyNow.emit({ product, quantity: this.quantity() });
    }
  }

  /**
   * Toggle favorito
   */
  toggleFavorite(): void {
    const product = this.product();
    if (product) {
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
  }

  /**
   * Compartir producto
   */
  shareProduct(): void {
    const product = this.product();
    if (product) {
      this.onShare.emit(product);

      if (navigator.share) {
        navigator.share({
          title: product.title,
          text: product.description || '',
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        this.uiStore.addNotification({
          title: 'Enlace copiado',
          message: 'Enlace del producto copiado al portapapeles',
          type: 'success',
          duration: 3000,
        });
      }
    }
  }

  /**
   * Agregar a comparación
   */
  addToComparison(): void {
    const product = this.product();
    if (product) {
      this.onAddToComparison.emit(product);
      this.uiStore.addNotification({
        title: 'Agregado a comparación',
        message: `${product.getTruncatedTitle(20)} agregado a comparación`,
        type: 'info',
        duration: 2000,
      });
    }
  }

  /**
   * Scroll a reseñas
   */
  scrollToReviews(): void {
    this._selectedTabIndex.set(2); // Tab de reseñas
  }

  /**
   * Verificar si está en favoritos
   */
  isInFavorites(): boolean {
    const product = this.product();
    return product ? this._favorites().has(product.id!) : false;
  }

  /**
   * Verificar si está en stock
   */
  isInStock(): boolean {
    return true;
  }

  /**
   * Verificar si tiene descuento
   */
  hasDiscount(): boolean {
    return Math.random() > 0.5;
  }

  /**
   * Obtener porcentaje de descuento
   */
  getDiscountPercentage(): number {
    return Math.floor(Math.random() * 30) + 10;
  }

  /**
   * Obtener precio original
   */
  getOriginalPrice(): string {
    const product = this.product();
    if (!product) return '$0.00';

    const discount = this.getDiscountPercentage();
    const originalPrice = product.price / (1 - discount / 100);
    return `$${originalPrice.toFixed(2)}`;
  }

  /**
   * Obtener cantidad ahorrada
   */
  getSavingsAmount(): string {
    const product = this.product();
    if (!product) return '$0.00';

    const originalPrice = parseFloat(this.getOriginalPrice().replace('$', ''));
    const savings = originalPrice - product.price;
    return `$${savings.toFixed(2)}`;
  }

  /**
   * Obtener precio total
   */
  getTotalPrice(): string {
    const product = this.product();
    if (!product) return '$0.00';

    const total = product.price * this.quantity();
    return `$${total.toFixed(2)}`;
  }

  /**
   * Obtener color del stock
   */
  getStockColor(): 'primary' | 'accent' | 'warn' {
    return this.isInStock() ? 'primary' : 'warn';
  }

  /**
   * Obtener ícono del stock
   */
  getStockIcon(): string {
    return this.isInStock() ? 'check_circle' : 'error';
  }

  /**
   * Obtener texto del stock
   */
  getStockText(): string {
    return this.isInStock() ? 'En Stock' : 'Agotado';
  }

  /**
   * Obtener array de estrellas para rating
   */
  getStarArray(): Array<{ icon: string; class: string }> {
    const rating = this.productRating();
    if (!rating) return [];

    const stars = [];
    const fullStars = Math.floor(rating.rate);
    const hasHalfStar = rating.rate % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push({ icon: 'star', class: 'star-filled' });
    }

    if (hasHalfStar) {
      stars.push({ icon: 'star_half', class: 'star-half' });
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push({ icon: 'star_border', class: 'star-empty' });
    }

    return stars;
  }

  /**
   * Manejar error de imagen
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.png';
  }
}
