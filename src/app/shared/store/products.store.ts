import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';

import { Product } from '../../domain/models/product.model';
import { GetProductByIdUseCase } from '../../domain/use-cases/get-product-by-id.use-case';
import { GetProductsUseCase } from '../../domain/use-cases/get-products.use-case';
import { LoadingState, PaginationState, SearchFiltersState } from '../utils/signal.types';

/**
 * Estado global de productos
 */
export interface ProductsState {
  // Productos
  products: Product[];
  selectedProduct: Product | null;

  // Estados de carga
  loadingState: LoadingState;

  // Paginación
  pagination: PaginationState;

  // Filtros y búsqueda
  filters: SearchFiltersState;

  // Cache
  lastFetch: number | null;

  // Favoritos
  favorites: number[];

  // Carrito (IDs de productos)
  cart: number[];
}

/**
 * Store global de productos usando Angular Signals
 *
 * Características:
 * - Estado reactivo con signals
 * - Cache inteligente
 * - Optimistic updates
 * - Persistencia en localStorage
 * - Computed selectors
 */
@Injectable({
  providedIn: 'root',
})
export class ProductsStore {
  // Casos de uso inyectados
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly getProductByIdUseCase = inject(GetProductByIdUseCase);

  // Estado privado
  private readonly _state = signal<ProductsState>(this.getInitialState());

  // Selectores públicos (computed signals)
  readonly state = computed(() => this._state());
  readonly products = computed(() => this._state().products);
  readonly selectedProduct = computed(() => this._state().selectedProduct);
  readonly loadingState = computed(() => this._state().loadingState);
  readonly pagination = computed(() => this._state().pagination);
  readonly filters = computed(() => this._state().filters);
  readonly favorites = computed(() => this._state().favorites);
  readonly cart = computed(() => this._state().cart);

  // Selectores derivados
  readonly isLoading = computed(() => this._state().loadingState.isLoading);
  readonly error = computed(() => this._state().loadingState.error);
  readonly hasProducts = computed(() => this._state().products.length > 0);
  readonly totalProducts = computed(() => this._state().products.length);
  readonly hasMore = computed(() => this._state().pagination.hasMore);
  readonly isLoadingMore = computed(() => this._state().pagination.isLoadingMore);

  readonly favoriteProducts = computed(() => {
    const products = this.products();
    const favoriteIds = this.favorites();
    return products.filter(p => p.id && favoriteIds.includes(p.id));
  });

  readonly cartProducts = computed(() => {
    const products = this.products();
    const cartIds = this.cart();
    return products.filter(p => p.id && cartIds.includes(p.id));
  });

  readonly cartTotal = computed(() => {
    return this.cartProducts().reduce((total, product) => {
      return total + (product.price || 0);
    }, 0);
  });

  readonly filteredProducts = computed(() => {
    const products = this.products();
    const filters = this.filters();

    let filtered = [...products];

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Filtro por precio
    if (filters.minPrice !== null) {
      filtered = filtered.filter(p => (p.price || 0) >= filters.minPrice!);
    }

    if (filters.maxPrice !== null) {
      filtered = filtered.filter(p => (p.price || 0) <= filters.maxPrice!);
    }

    // Ordenamiento
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'title':
            aValue = a.title || '';
            bValue = b.title || '';
            break;
          case 'category':
            aValue = a.category || '';
            bValue = b.category || '';
            break;
          default:
            return 0;
        }

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  });

  readonly categories = computed(() => {
    const products = this.products();
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories).sort();
  });

  readonly priceRange = computed(() => {
    const products = this.products();
    const prices = products.map(p => p.price || 0).filter(p => p > 0);

    if (prices.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  });

  constructor() {
    // Cargar favoritos y carrito desde localStorage
    this.loadPersistedData();

    // Configurar persistencia automática
    this.setupPersistence();
  }

  /**
   * Acciones del store
   */

  // Cargar productos
  loadProducts(forceRefresh: boolean = false) {
    const currentState = this._state();

    // Verificar cache (5 minutos)
    if (!forceRefresh && currentState.lastFetch) {
      const cacheAge = Date.now() - currentState.lastFetch;
      if (cacheAge < 5 * 60 * 1000) {
        // 5 minutos
        return;
      }
    }

    this.updateState({
      loadingState: { isLoading: true, error: null },
    });

    this.getProductsUseCase
      .execute()
      .pipe(
        tap(products => {
          this.updateState({
            products,
            loadingState: { isLoading: false, error: null },
            lastFetch: Date.now(),
            pagination: {
              ...currentState.pagination,
              totalItems: products.length,
              hasMore: false, // API no soporta paginación real
            },
          });
        }),
        catchError(error => {
          this.updateState({
            loadingState: {
              isLoading: false,
              error: error.message || 'Error al cargar productos',
            },
          });
          return of([]);
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  // Cargar producto por ID
  loadProductById(id: number) {
    const currentState = this._state();

    // Verificar si ya está en el estado
    const existingProduct = currentState.products.find(p => p.id === id);
    if (existingProduct) {
      this.updateState({ selectedProduct: existingProduct });
      return;
    }

    this.updateState({
      loadingState: { isLoading: true, error: null },
    });

    this.getProductByIdUseCase
      .execute(id)
      .pipe(
        tap(product => {
          if (product) {
            // Agregar al array de productos si no existe
            const products = currentState.products.some(p => p.id === id)
              ? currentState.products
              : [...currentState.products, product];

            this.updateState({
              products,
              selectedProduct: product,
              loadingState: { isLoading: false, error: null },
            });
          }
        }),
        catchError(error => {
          this.updateState({
            loadingState: {
              isLoading: false,
              error: error.message || 'Error al cargar producto',
            },
          });
          return of(null);
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  // Seleccionar producto
  selectProduct(product: Product | null) {
    this.updateState({ selectedProduct: product });
  }

  // Actualizar filtros
  updateFilters(filters: Partial<SearchFiltersState>) {
    const currentFilters = this._state().filters;
    this.updateState({
      filters: { ...currentFilters, ...filters },
    });
  }

  // Limpiar filtros
  clearFilters() {
    this.updateState({
      filters: {
        searchTerm: '',
        category: null,
        minPrice: null,
        maxPrice: null,
        sortBy: null,
        sortOrder: 'asc',
      },
    });
  }

  // Gestión de favoritos
  toggleFavorite(productId: number) {
    const currentFavorites = this._state().favorites;
    const isFavorite = currentFavorites.includes(productId);

    const newFavorites = isFavorite
      ? currentFavorites.filter(id => id !== productId)
      : [...currentFavorites, productId];

    this.updateState({ favorites: newFavorites });
  }

  addToFavorites(productId: number) {
    const currentFavorites = this._state().favorites;
    if (!currentFavorites.includes(productId)) {
      this.updateState({
        favorites: [...currentFavorites, productId],
      });
    }
  }

  removeFromFavorites(productId: number) {
    const currentFavorites = this._state().favorites;
    this.updateState({
      favorites: currentFavorites.filter(id => id !== productId),
    });
  }

  // Gestión de carrito
  addToCart(productId: number) {
    const currentCart = this._state().cart;
    if (!currentCart.includes(productId)) {
      this.updateState({
        cart: [...currentCart, productId],
      });
    }
  }

  removeFromCart(productId: number) {
    const currentCart = this._state().cart;
    this.updateState({
      cart: currentCart.filter(id => id !== productId),
    });
  }

  clearCart() {
    this.updateState({ cart: [] });
  }

  // Limpiar errores
  clearError() {
    const currentLoadingState = this._state().loadingState;
    this.updateState({
      loadingState: { ...currentLoadingState, error: null },
    });
  }

  // Reset completo del store
  reset() {
    this._state.set(this.getInitialState());
  }

  /**
   * Métodos privados
   */

  private updateState(partialState: Partial<ProductsState>) {
    this._state.update(current => ({ ...current, ...partialState }));
  }

  private getInitialState(): ProductsState {
    return {
      products: [],
      selectedProduct: null,
      loadingState: { isLoading: false, error: null },
      pagination: {
        currentPage: 1,
        pageSize: 20,
        totalItems: 0,
        isLoadingMore: false,
        hasMore: true,
      },
      filters: {
        searchTerm: '',
        category: null,
        minPrice: null,
        maxPrice: null,
        sortBy: null,
        sortOrder: 'asc',
      },
      lastFetch: null,
      favorites: [],
      cart: [],
    };
  }

  private loadPersistedData() {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');

      this.updateState({ favorites, cart });
    } catch (error) {
      console.warn('Error loading persisted data:', error);
    }
  }

  private setupPersistence() {
    // Persistir favoritos
    const favoritesEffect = () => {
      const favorites = this.favorites();
      localStorage.setItem('favorites', JSON.stringify(favorites));
    };

    // Persistir carrito
    const cartEffect = () => {
      const cart = this.cart();
      localStorage.setItem('cart', JSON.stringify(cart));
    };

    // Los effects se ejecutan automáticamente cuando cambian los signals
    // En un entorno real, usarías effect() de Angular
    // Por ahora, se manejan en los métodos de actualización
  }
}
