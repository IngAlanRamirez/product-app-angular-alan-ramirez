import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { Product } from '../../../domain/models/product.model';
import { UIStore } from '../../store/ui.store';

/**
 * Componente de tarjeta de producto avanzado
 *
 * Características:
 * - Diseño moderno con imagen, precio y acciones
 * - Estados interactivos (hover, loading, disabled)
 * - Integración con favoritos y carrito
 * - Badges de descuento y categoría
 * - Animaciones fluidas
 * - Responsive design
 * - Accesibilidad completa
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <article
      class="product-card"
      [class.loading]="loading"
      [class.disabled]="disabled"
      [class.favorite]="isFavorite"
      [attr.aria-label]="'Producto: ' + product.title"
      role="article"
    >
      <!-- Imagen del producto -->
      <div class="product-image-container">
        <img
          [src]="product.image"
          [alt]="product.title"
          class="product-image"
          [class.loaded]="imageLoaded()"
          (load)="onImageLoad()"
          (error)="onImageError()"
          loading="lazy"
        />

        <!-- Overlay de carga de imagen -->
        <div class="image-skeleton" *ngIf="!imageLoaded()">
          <div class="skeleton-shimmer"></div>
        </div>

        <!-- Badge de categoría -->
        <div class="category-badge">
          {{ getCategoryDisplay() }}
        </div>

        <!-- Badge de descuento (si aplica) -->
        <div class="discount-badge" *ngIf="discountPercentage > 0">-{{ discountPercentage }}%</div>

        <!-- Botón de favorito -->
        <button
          type="button"
          class="favorite-btn"
          [class.active]="isFavorite"
          (click)="onFavoriteClick($event)"
          [attr.aria-label]="favoriteLabel"
          [disabled]="loading"
        >
          {{ isFavorite ? '❤️' : '🤍' }}
        </button>

        <!-- Overlay de acciones rápidas -->
        <div class="quick-actions">
          <button
            type="button"
            class="quick-action-btn"
            (click)="onQuickView($event)"
            aria-label="Vista rápida"
            [disabled]="loading"
          >
            👁️
          </button>
          <button
            type="button"
            class="quick-action-btn"
            (click)="onAddToCart($event)"
            aria-label="Agregar al carrito"
            [disabled]="loading"
          >
            🛒
          </button>
        </div>
      </div>

      <!-- Información del producto -->
      <div class="product-info">
        <!-- Título -->
        <h3 class="product-title">
          <button type="button" class="title-link" (click)="onTitleClick()" [disabled]="loading">
            {{ getTruncatedTitle() }}
          </button>
        </h3>

        <!-- Precio -->
        <div class="product-pricing">
          <span class="current-price">
            {{ formatPrice(product.price) }}
          </span>
          <span class="original-price" *ngIf="originalPrice > product.price">
            {{ formatPrice(originalPrice) }}
          </span>
        </div>

        <!-- Rating (simulado) -->
        <div class="product-rating">
          <div class="stars">
            <span *ngFor="let star of getStars()" class="star" [class.filled]="star">⭐</span>
          </div>
          <span class="rating-text">({{ getRatingCount() }})</span>
        </div>

        <!-- Descripción corta -->
        <p class="product-description" *ngIf="showDescription">
          {{ getTruncatedDescription() }}
        </p>

        <!-- Acciones principales -->
        <div class="product-actions">
          <button
            type="button"
            class="action-btn primary"
            (click)="onViewDetails()"
            [disabled]="loading"
          >
            <span *ngIf="!loading">Ver Detalles</span>
            <span *ngIf="loading" class="loading-spinner">⏳</span>
          </button>

          <button
            type="button"
            class="action-btn secondary"
            (click)="onAddToCart($event)"
            [disabled]="loading"
          >
            <span *ngIf="!loading">Agregar</span>
            <span *ngIf="loading" class="loading-spinner">⏳</span>
          </button>
        </div>
      </div>

      <!-- Indicador de carga general -->
      <div class="card-loading-overlay" *ngIf="loading">
        <div class="loading-spinner-large">⏳</div>
      </div>
    </article>
  `,
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  // Inputs
  @Input({ required: true }) product!: Product;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() isFavorite = false;
  @Input() showDescription = true;
  @Input() discountPercentage = 0;
  @Input() originalPrice = 0;

  // Outputs
  @Output() favoriteToggle = new EventEmitter<Product>();
  @Output() addToCart = new EventEmitter<Product>();
  @Output() viewDetails = new EventEmitter<Product>();
  @Output() quickView = new EventEmitter<Product>();

  // Inyección de dependencias
  private readonly router = inject(Router);
  private readonly uiStore = inject(UIStore);

  // Estado local
  private readonly _imageLoaded = signal(false);

  // Computed signals
  readonly imageLoaded = computed(() => this._imageLoaded());

  get favoriteLabel(): string {
    return this.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
  }

  /**
   * Maneja la carga exitosa de la imagen
   */
  onImageLoad(): void {
    this._imageLoaded.set(true);
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(): void {
    // Aquí podrías establecer una imagen por defecto
    this._imageLoaded.set(true);
  }

  /**
   * Obtiene el nombre de categoría formateado
   */
  getCategoryDisplay(): string {
    const category = this.product.category;
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Obtiene el título truncado
   */
  getTruncatedTitle(): string {
    return this.product.getTruncatedTitle(50);
  }

  /**
   * Obtiene la descripción truncada
   */
  getTruncatedDescription(): string {
    const description = this.product.description;
    if (!description) return '';

    return description.length > 100 ? description.substring(0, 100) + '...' : description;
  }

  /**
   * Formatea el precio
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  }

  /**
   * Genera estrellas para rating (simulado)
   */
  getStars(): boolean[] {
    // Simulamos un rating basado en el ID del producto
    const rating = ((this.product.id || 1) % 5) + 1;
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }

  /**
   * Obtiene el número de reseñas (simulado)
   */
  getRatingCount(): number {
    // Simulamos el número de reseñas basado en el precio
    return Math.floor(this.product.price * 10) + 50;
  }

  /**
   * Maneja el click en favorito
   */
  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.product);

    // Mostrar notificación
    const message = this.isFavorite
      ? 'Producto agregado a favoritos'
      : 'Producto removido de favoritos';

    this.uiStore.addNotification({
      type: 'success',
      title: 'Favoritos',
      message,
      duration: 2000,
    });
  }

  /**
   * Maneja el click en agregar al carrito
   */
  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);

    // Mostrar notificación
    this.uiStore.addNotification({
      type: 'success',
      title: 'Carrito',
      message: `${this.product.title} agregado al carrito`,
      duration: 2000,
    });
  }

  /**
   * Maneja el click en vista rápida
   */
  onQuickView(event: Event): void {
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  /**
   * Maneja el click en el título
   */
  onTitleClick(): void {
    this.onViewDetails();
  }

  /**
   * Maneja la navegación a detalles
   */
  onViewDetails(): void {
    this.viewDetails.emit(this.product);

    // Navegar a la página de detalles
    const productId = this.product.id;
    if (productId) {
      this.router.navigate(['/products', productId]);
    }
  }
}
