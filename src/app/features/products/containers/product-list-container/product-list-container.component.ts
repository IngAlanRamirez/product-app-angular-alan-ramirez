import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of } from 'rxjs';

import { Product } from '../../../../domain/models/product.model';
import { GetProductsUseCase } from '../../../../domain/use-cases/get-products.use-case';
import { ProductListComponent } from '../../../../shared/components/product-list/product-list.component';
import { LoadingState, PaginationState } from '../../../../shared/utils/signal.types';

/**
 * Container inteligente para la lista de productos
 *
 * Responsabilidades:
 * - Manejo de estado de la aplicación
 * - Conexión con casos de uso del dominio
 * - Coordinación entre componentes de presentación
 * - Manejo de navegación y routing
 * - Gestión de errores y loading states
 */
@Component({
  selector: 'app-product-list-container',
  standalone: true,
  imports: [CommonModule, ProductListComponent],
  template: `
    <div class="product-list-container-wrapper">
      <!-- Header de la página -->
      <div class="page-header">
        <h1>Catálogo de Productos</h1>
        <p class="page-subtitle">Descubre nuestra colección completa de productos</p>
      </div>

      <!-- Componente de presentación -->
      <app-product-list
        [products]="products()"
        [loading]="loadingState().isLoading"
        [loadingMore]="paginationState().isLoadingMore"
        [totalCount]="totalCount()"
        [hasMore]="hasMoreProducts()"
        [emptyMessage]="emptyMessage()"
        [emptySubMessage]="emptySubMessage()"
        [maxTitleLength]="50"
        [maxDescriptionLength]="100"
        [useVirtualScrolling]="shouldUseVirtualScrolling()"
        [showHeader]="true"
        [loadingProductIds]="loadingProductIds()"
        (productViewDetails)="onProductViewDetails($event)"
        (productAddToCart)="onProductAddToCart($event)"
        (loadMore)="onLoadMore()"
        (refresh)="onRefresh()"
        (imageLoadError)="onImageLoadError($event)"
      />

      <!-- Mensajes de error -->
      <div class="error-container" *ngIf="loadingState().error">
        <div class="error-message">
          <h3>Error al cargar productos</h3>
          <p>{{ loadingState().error }}</p>
          <button mat-raised-button color="primary" (click)="onRefresh()">Reintentar</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./product-list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListContainerComponent implements OnInit, OnDestroy {
  // Inyección de dependencias
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly router = inject(Router);

  // Signals de estado
  private readonly _products = signal<Product[]>([]);
  private readonly _loadingState = signal<LoadingState>({
    isLoading: false,
    error: null,
  });
  private readonly _paginationState = signal<PaginationState>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    isLoadingMore: false,
    hasMore: true,
  });
  private readonly _loadingProductIds = signal<number[]>([]);
  private readonly _selectedCategory = signal<string | null>(null);

  // Subjects para manejo de eventos
  private readonly refreshSubject = new Subject<void>();
  private readonly loadMoreSubject = new Subject<void>();

  // Computed signals públicos
  readonly products = computed(() => this._products());
  readonly loadingState = computed(() => this._loadingState());
  readonly paginationState = computed(() => this._paginationState());
  readonly loadingProductIds = computed(() => this._loadingProductIds());
  readonly totalCount = computed(() => this._paginationState().totalItems);
  readonly hasMoreProducts = computed(() => this._paginationState().hasMore);

  readonly emptyMessage = computed(() => {
    const category = this._selectedCategory();
    return category
      ? `No hay productos en la categoría "${category}"`
      : 'No hay productos disponibles';
  });

  readonly emptySubMessage = computed(() => {
    const category = this._selectedCategory();
    return category
      ? 'Intenta seleccionar otra categoría o actualizar la página'
      : 'Intenta actualizar la página o contactar soporte';
  });

  readonly shouldUseVirtualScrolling = computed(() => {
    return this.products().length > 50; // Usar virtual scrolling para más de 50 items
  });

  constructor() {
    // Configurar efectos reactivos
    this.setupEffects();
    this.setupEventHandlers();
  }

  ngOnInit(): void {
    this.loadInitialProducts();
  }

  ngOnDestroy(): void {
    // Los subjects se limpian automáticamente con takeUntilDestroyed
  }

  /**
   * Configura efectos reactivos
   */
  private setupEffects(): void {
    // Efecto para logging de cambios de estado (solo en desarrollo)
    if (!environment.production) {
      effect(() => {
        const state = this.loadingState();
        console.log('Loading state changed:', state);
      });

      effect(() => {
        const products = this.products();
        console.log(`Products loaded: ${products.length} items`);
      });
    }
  }

  /**
   * Configura manejadores de eventos reactivos
   */
  private setupEventHandlers(): void {
    // Manejo de refresh con debounce
    this.refreshSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.loadProducts(true));

    // Manejo de load more
    this.loadMoreSubject
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.loadMoreProducts());
  }

  /**
   * Carga productos iniciales
   */
  private loadInitialProducts(): void {
    this.loadProducts(true);
  }

  /**
   * Carga productos con manejo de estado
   */
  private loadProducts(reset: boolean = false) {
    if (reset) {
      this._loadingState.update(state => ({ ...state, isLoading: true, error: null }));
      this._paginationState.update(state => ({ ...state, currentPage: 1 }));
    }

    this.getProductsUseCase
      .execute()
      .pipe(
        catchError(error => {
          console.error('Error loading products:', error);
          this._loadingState.update(state => ({
            ...state,
            isLoading: false,
            error: error.message || 'Error al cargar productos',
          }));
          return of([]);
        }),
        finalize(() => {
          this._loadingState.update(state => ({ ...state, isLoading: false }));
        }),
        takeUntilDestroyed()
      )
      .subscribe(products => {
        if (reset) {
          this._products.set(products);
        } else {
          this._products.update(current => [...current, ...products]);
        }

        // Actualizar estado de paginación
        this._paginationState.update(state => ({
          ...state,
          totalItems: products.length,
          hasMore: products.length >= state.pageSize,
        }));
      });
  }

  /**
   * Carga más productos (paginación)
   */
  private loadMoreProducts(): void {
    this._paginationState.update(state => ({ ...state, isLoadingMore: true }));

    const currentPage = this._paginationState().currentPage;
    const pageSize = this._paginationState().pageSize;

    // Simular paginación ya que la API no la soporta nativamente
    this.getProductsUseCase
      .execute()
      .pipe(
        catchError(error => {
          console.error('Error loading more products:', error);
          return of([]);
        }),
        finalize(() => {
          this._paginationState.update(state => ({ ...state, isLoadingMore: false }));
        }),
        takeUntilDestroyed()
      )
      .subscribe(allProducts => {
        // Simular paginación cortando el array
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const newProducts = allProducts.slice(startIndex, endIndex);

        if (newProducts.length > 0) {
          this._products.update(current => [...current, ...newProducts]);
          this._paginationState.update(state => ({
            ...state,
            currentPage: currentPage + 1,
            totalItems: allProducts.length,
            hasMore: endIndex < allProducts.length,
          }));
        } else {
          this._paginationState.update(state => ({
            ...state,
            hasMore: false,
          }));
        }
      });
  }

  /**
   * Maneja la visualización de detalles de producto
   */
  onProductViewDetails(product: Product): void {
    if (product.id) {
      this.router.navigate(['/products', product.id]);
    }
  }

  /**
   * Maneja agregar producto al carrito
   */
  onProductAddToCart(product: Product): void {
    if (!product.id) return;

    // Agregar ID a loading state
    this._loadingProductIds.update(ids => [...ids, product.id!]);

    // Simular operación async (aquí iría la lógica real del carrito)
    setTimeout(() => {
      this._loadingProductIds.update(ids => ids.filter(id => id !== product.id));

      // Aquí podrías mostrar un toast o notificación
      console.log(`Producto ${product.title} agregado al carrito`);
    }, 1000);
  }

  /**
   * Maneja el refresh de la lista
   */
  onRefresh(): void {
    this.refreshSubject.next();
  }

  /**
   * Maneja cargar más productos
   */
  onLoadMore(): void {
    if (this.hasMoreProducts() && !this.paginationState().isLoadingMore) {
      this.loadMoreSubject.next();
    }
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageLoadError(imageUrl: string): void {
    console.warn('Failed to load image:', imageUrl);
    // Aquí podrías implementar lógica para reportar imágenes rotas
  }

  /**
   * Filtra productos por categoría
   */
  filterByCategory(category: string | null): void {
    this._selectedCategory.set(category);

    if (category) {
      this._loadingState.update(state => ({ ...state, isLoading: true, error: null }));

      this.getProductsUseCase
        .executeByCategory(category)
        .pipe(
          catchError(error => {
            this._loadingState.update(state => ({
              ...state,
              isLoading: false,
              error: error.message || 'Error al filtrar productos',
            }));
            return of([]);
          }),
          finalize(() => {
            this._loadingState.update(state => ({ ...state, isLoading: false }));
          }),
          takeUntilDestroyed()
        )
        .subscribe(products => {
          this._products.set(products);
          this._paginationState.update(state => ({
            ...state,
            currentPage: 1,
            totalItems: products.length,
            hasMore: false, // No hay paginación en filtros por categoría
          }));
        });
    } else {
      this.loadInitialProducts();
    }
  }
}

// Importar environment para el efecto de desarrollo
const environment = { production: false }; // TODO: Importar desde environment real
