import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { Product } from '../../../domain/models/product.model';

/**
 * Componente puro para mostrar una tarjeta de producto
 *
 * Características:
 * - OnPush para máxima performance
 * - Signals para reactividad optimizada
 * - Inputs inmutables
 * - Outputs tipados
 * - Lazy loading de imágenes
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card class="product-card" [class.loading]="isLoading()">
      <!-- Imagen del producto con lazy loading -->
      <div class="product-image-container">
        <img
          mat-card-image
          [src]="productImage()"
          [alt]="productTitle()"
          [loading]="'lazy'"
          (load)="onImageLoad()"
          (error)="onImageError()"
          class="product-image"
          [class.loaded]="imageLoaded()"
        />

        <!-- Overlay de loading -->
        <div class="image-loading-overlay" *ngIf="!imageLoaded()">
          <mat-icon>image</mat-icon>
        </div>

        <!-- Badge de precio -->
        <div class="price-badge" [class.expensive]="isExpensive()">
          {{ formattedPrice() }}
        </div>
      </div>

      <!-- Contenido de la tarjeta -->
      <mat-card-header>
        <mat-card-title class="product-title" [title]="productTitle()">
          {{ truncatedTitle() }}
        </mat-card-title>

        <mat-card-subtitle>
          <mat-chip class="category-chip">
            {{ capitalizedCategory() }}
          </mat-chip>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p class="product-description" *ngIf="hasDescription()">
          {{ truncatedDescription() }}
        </p>

        <!-- Metadata del producto -->
        <div class="product-metadata">
          <span class="product-id">ID: {{ productId() }}</span>
          <span class="product-slug">{{ productSlug() }}</span>
        </div>
      </mat-card-content>

      <!-- Acciones -->
      <mat-card-actions align="end">
        <button mat-button color="primary" (click)="onViewDetails()" [disabled]="isLoading()">
          <mat-icon>visibility</mat-icon>
          Ver Detalles
        </button>

        <button mat-raised-button color="accent" (click)="onAddToCart()" [disabled]="isLoading()">
          <mat-icon>add_shopping_cart</mat-icon>
          Agregar
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  // Inputs inmutables
  @Input({ required: true })
  set product(value: Product | null) {
    this._product.set(value);
  }

  @Input()
  set loading(value: boolean) {
    this._loading.set(value);
  }

  @Input()
  set maxTitleLength(value: number) {
    this._maxTitleLength.set(value);
  }

  @Input()
  set maxDescriptionLength(value: number) {
    this._maxDescriptionLength.set(value);
  }

  // Outputs tipados
  @Output() viewDetails = new EventEmitter<Product>();
  @Output() addToCart = new EventEmitter<Product>();
  @Output() imageLoadError = new EventEmitter<string>();

  // Signals internos
  private readonly _product = signal<Product | null>(null);
  private readonly _loading = signal(false);
  private readonly _maxTitleLength = signal(50);
  private readonly _maxDescriptionLength = signal(100);
  private readonly _imageLoaded = signal(false);

  // Computed signals para datos derivados
  readonly productId = computed(() => this._product()?.id ?? 0);
  readonly productTitle = computed(() => this._product()?.title ?? '');
  readonly productImage = computed(() => this._product()?.image ?? '');
  readonly productSlug = computed(() => this._product()?.getSlug() ?? '');
  readonly isLoading = computed(() => this._loading());
  readonly imageLoaded = computed(() => this._imageLoaded());

  readonly truncatedTitle = computed(() => {
    const product = this._product();
    const maxLength = this._maxTitleLength();
    return product?.getTruncatedTitle(maxLength) ?? '';
  });

  readonly truncatedDescription = computed(() => {
    const product = this._product();
    const description = product?.description;
    const maxLength = this._maxDescriptionLength();

    if (!description) return '';

    return description.length > maxLength
      ? `${description.substring(0, maxLength)}...`
      : description;
  });

  readonly hasDescription = computed(() => {
    const product = this._product();
    return !!product?.description?.trim();
  });

  readonly capitalizedCategory = computed(() => {
    const product = this._product();
    const category = product?.category ?? '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  });

  readonly formattedPrice = computed(() => {
    const product = this._product();
    return product?.priceVO.format() ?? '$0.00';
  });

  readonly isExpensive = computed(() => {
    const product = this._product();
    return product?.isExpensive() ?? false;
  });

  /**
   * Maneja el evento de carga de imagen
   */
  onImageLoad(): void {
    this._imageLoaded.set(true);
  }

  /**
   * Maneja el error de carga de imagen
   */
  onImageError(): void {
    this._imageLoaded.set(false);
    const product = this._product();
    if (product) {
      this.imageLoadError.emit(product.image);
    }
  }

  /**
   * Emite evento para ver detalles
   */
  onViewDetails(): void {
    const product = this._product();
    if (product && !this.isLoading()) {
      this.viewDetails.emit(product);
    }
  }

  /**
   * Emite evento para agregar al carrito
   */
  onAddToCart(): void {
    const product = this._product();
    if (product && !this.isLoading()) {
      this.addToCart.emit(product);
    }
  }
}
