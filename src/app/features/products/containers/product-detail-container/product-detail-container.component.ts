import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { Product } from '../../../../domain/models/product.model';
import { GetProductByIdUseCase } from '../../../../domain/use-cases/get-product-by-id.use-case';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { LoadingState } from '../../../../shared/utils/signal.types';

/**
 * Container inteligente para los detalles de producto
 *
 * Responsabilidades:
 * - Manejo de parámetros de ruta
 * - Carga de producto individual
 * - Manejo de estados de carga y error
 * - Navegación y breadcrumbs
 * - Acciones de producto (carrito, favoritos)
 */
@Component({
  selector: 'app-product-detail-container',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="product-detail-container-wrapper">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Navegación">
        <ol>
          <li>
            <a (click)="navigateToHome()" role="button" tabindex="0"> Inicio </a>
          </li>
          <li>
            <a (click)="navigateToProducts()" role="button" tabindex="0"> Productos </a>
          </li>
          <li *ngIf="product()" aria-current="page">
            {{ product()?.title }}
          </li>
        </ol>
      </nav>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loadingState().isLoading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Cargando producto...</p>
        </div>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="loadingState().error">
        <div class="error-message">
          <h2>Error al cargar producto</h2>
          <p>{{ loadingState().error }}</p>
          <div class="error-actions">
            <button type="button" (click)="onRetry()">Reintentar</button>
            <button type="button" (click)="navigateToProducts()">Volver a productos</button>
          </div>
        </div>
      </div>

      <!-- Product Detail -->
      <div class="product-detail-content" *ngIf="product() && !loadingState().isLoading">
        <!-- Product Card con vista detallada -->
        <app-product-card
          [product]="product()!"
          [maxTitleLength]="0"
          [maxDescriptionLength]="0"
          (viewDetails)="onProductViewDetails($event)"
          (addToCart)="onProductAddToCart($event)"
          (imageLoadError)="onImageLoadError($event)"
        />

        <!-- Información adicional -->
        <div class="product-additional-info">
          <!-- Especificaciones -->
          <div class="product-specs" *ngIf="productSpecs().length > 0">
            <h3>Especificaciones</h3>
            <dl class="specs-list">
              <div *ngFor="let spec of productSpecs()" class="spec-item">
                <dt>{{ spec.label }}</dt>
                <dd>{{ spec.value }}</dd>
              </div>
            </dl>
          </div>

          <!-- Información de envío -->
          <div class="shipping-info">
            <h3>Información de envío</h3>
            <ul>
              <li>Envío gratis en compras mayores a $50</li>
              <li>Entrega estimada: 3-5 días hábiles</li>
              <li>Devoluciones gratuitas hasta 30 días</li>
            </ul>
          </div>

          <!-- Productos relacionados placeholder -->
          <div class="related-products">
            <h3>Productos relacionados</h3>
            <p class="coming-soon">Próximamente...</p>
          </div>
        </div>
      </div>

      <!-- Acciones flotantes -->
      <div class="floating-actions" *ngIf="product()">
        <button
          type="button"
          [disabled]="isAddingToCart()"
          (click)="onProductAddToCart(product()!)"
          aria-label="Agregar al carrito"
        >
          🛒
        </button>

        <button
          type="button"
          (click)="onToggleFavorite(product()!)"
          [attr.aria-label]="isFavorite() ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        >
          {{ isFavorite() ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./product-detail-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailContainerComponent implements OnInit, OnDestroy {
  // Inyección de dependencias
  private readonly getProductByIdUseCase = inject(GetProductByIdUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Signals de estado
  private readonly _product = signal<Product | null>(null);
  private readonly _loadingState = signal<LoadingState>({
    isLoading: false,
    error: null,
  });
  private readonly _isAddingToCart = signal<boolean>(false);
  private readonly _isFavorite = signal<boolean>(false);
  private readonly _productId = signal<number | null>(null);

  // Computed signals públicos
  readonly product = computed(() => this._product());
  readonly loadingState = computed(() => this._loadingState());
  readonly isAddingToCart = computed(() => this._isAddingToCart());
  readonly isFavorite = computed(() => this._isFavorite());

  readonly productSpecs = computed(() => {
    const product = this.product();
    if (!product) return [];

    return [
      { label: 'ID', value: product.id?.toString() || 'N/A' },
      { label: 'Categoría', value: product.category || 'Sin categoría' },
      { label: 'Precio', value: product.price ? `$${product.price}` : 'N/A' },
    ].filter(spec => spec.value !== 'N/A');
  });

  readonly pageTitle = computed(() => {
    const product = this.product();
    return product ? `${product.title} - Detalles` : 'Cargando producto...';
  });

  constructor() {
    // Configurar efectos reactivos
    this.setupEffects();
  }

  ngOnInit(): void {
    this.loadProductFromRoute();
  }

  ngOnDestroy(): void {
    // Los observables se limpian automáticamente con takeUntilDestroyed
  }

  /**
   * Configura efectos reactivos
   */
  private setupEffects(): void {
    // Efecto para actualizar el título de la página
    effect(() => {
      const title = this.pageTitle();
      document.title = title;
    });

    // Efecto para logging en desarrollo
    if (!environment.production) {
      effect(() => {
        const product = this.product();
        if (product) {
          console.log('Product loaded:', product);
        }
      });

      effect(() => {
        const loadingState = this.loadingState();
        console.log('Loading state changed:', loadingState);
      });
    }
  }

  /**
   * Carga el producto desde los parámetros de ruta
   */
  private loadProductFromRoute(): void {
    this.route.paramMap
      .pipe(
        map(params => {
          const id = params.get('id');
          return id ? parseInt(id, 10) : null;
        }),
        switchMap(productId => {
          if (!productId || isNaN(productId)) {
            return of(null);
          }

          this._productId.set(productId);
          this._loadingState.update(state => ({ ...state, isLoading: true, error: null }));

          return this.getProductByIdUseCase.execute(productId).pipe(
            catchError(error => {
              console.error('Error loading product:', error);
              this._loadingState.update(state => ({
                ...state,
                isLoading: false,
                error: error.message || 'Error al cargar el producto',
              }));
              return of(null);
            }),
            finalize(() => {
              this._loadingState.update(state => ({ ...state, isLoading: false }));
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(product => {
        this._product.set(product);

        // Verificar si está en favoritos (simulado)
        if (product) {
          this.checkIfFavorite(product.id!);
        }
      });
  }

  /**
   * Verifica si el producto está en favoritos
   */
  private checkIfFavorite(productId: number): void {
    // Simular verificación de favoritos desde localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    this._isFavorite.set(favorites.includes(productId));
  }

  /**
   * Maneja la visualización de detalles (ya estamos en detalles)
   */
  onProductViewDetails(product: Product): void {
    // Ya estamos en la vista de detalles, no hacer nada
    console.log('Already in product details view');
  }

  /**
   * Maneja agregar producto al carrito
   */
  onProductAddToCart(product: Product): void {
    if (!product.id) return;

    this._isAddingToCart.set(true);

    // Simular operación async de agregar al carrito
    setTimeout(() => {
      this._isAddingToCart.set(false);

      // Aquí iría la lógica real del carrito
      console.log(`Producto ${product.title} agregado al carrito`);

      // Mostrar notificación de éxito (placeholder)
      this.showSuccessMessage('Producto agregado al carrito');
    }, 1500);
  }

  /**
   * Maneja toggle de favoritos
   */
  onToggleFavorite(product: Product): void {
    if (!product.id) return;

    const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = currentFavorites.includes(product.id);

    if (isFavorite) {
      // Remover de favoritos
      const newFavorites = currentFavorites.filter((id: number) => id !== product.id);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      this._isFavorite.set(false);
      this.showSuccessMessage('Producto removido de favoritos');
    } else {
      // Agregar a favoritos
      const newFavorites = [...currentFavorites, product.id];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      this._isFavorite.set(true);
      this.showSuccessMessage('Producto agregado a favoritos');
    }
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageLoadError(imageUrl: string): void {
    console.warn('Failed to load product image:', imageUrl);
  }

  /**
   * Maneja el retry de carga
   */
  onRetry(): void {
    const productId = this._productId();
    if (productId) {
      this.loadProductFromRoute();
    }
  }

  /**
   * Navega al inicio
   */
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Navega a la lista de productos
   */
  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Muestra mensaje de éxito (placeholder)
   */
  private showSuccessMessage(message: string): void {
    // Aquí iría la implementación real de notificaciones
    console.log('Success:', message);
  }
}

// Environment placeholder
const environment = { production: false };
