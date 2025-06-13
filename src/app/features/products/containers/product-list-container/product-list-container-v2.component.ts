import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../../../domain/models/product.model';
import { ProductListComponent } from '../../../../shared/components/product-list/product-list.component';
import { ProductsStore } from '../../../../shared/store/products.store';
import { UIStore } from '../../../../shared/store/ui.store';

/**
 * Container inteligente para la lista de productos usando stores globales
 *
 * Responsabilidades:
 * - Conectar con stores globales
 * - Manejar eventos de usuario
 * - Coordinar navegación
 * - Gestionar breadcrumbs
 */
@Component({
  selector: 'app-product-list-container-v2',
  standalone: true,
  imports: [CommonModule, ProductListComponent],
  template: `
    <div class="product-list-container-wrapper">
      <!-- Header de la página -->
      <div class="page-header">
        <h1>Catálogo de Productos</h1>
        <p class="page-subtitle">Descubre nuestra colección completa de productos</p>

        <!-- Controles de vista -->
        <div class="view-controls">
          <button type="button" (click)="toggleViewMode()" [attr.aria-label]="viewModeLabel()">
            {{ viewMode() === 'grid' ? '📋' : '⊞' }}
          </button>

          <button type="button" (click)="toggleTheme()" [attr.aria-label]="themeLabel()">
            {{ isDarkTheme() ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>

      <!-- Filtros rápidos -->
      <div class="quick-filters" *ngIf="categories().length > 0">
        <h3>Categorías</h3>
        <div class="filter-chips">
          <button
            type="button"
            class="filter-chip"
            [class.active]="!selectedCategory()"
            (click)="clearFilters()"
          >
            Todas
          </button>
          <button
            *ngFor="let category of categories()"
            type="button"
            class="filter-chip"
            [class.active]="selectedCategory() === category"
            (click)="filterByCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Componente de presentación -->
      <app-product-list
        [products]="displayProducts()"
        [loading]="isLoading()"
        [loadingMore]="false"
        [totalCount]="totalProducts()"
        [hasMore]="false"
        [emptyMessage]="emptyMessage()"
        [emptySubMessage]="emptySubMessage()"
        [maxTitleLength]="50"
        [maxDescriptionLength]="100"
        [useVirtualScrolling]="shouldUseVirtualScrolling()"
        [showHeader]="true"
        [loadingProductIds]="[]"
        (productViewDetails)="onProductViewDetails($event)"
        (productAddToCart)="onProductAddToCart($event)"
        (loadMore)="onLoadMore()"
        (refresh)="onRefresh()"
        (imageLoadError)="onImageLoadError($event)"
      />

      <!-- Mensajes de error -->
      <div class="error-container" *ngIf="error()">
        <div class="error-message">
          <h3>Error al cargar productos</h3>
          <p>{{ error() }}</p>
          <button type="button" (click)="onRefresh()">Reintentar</button>
        </div>
      </div>

      <!-- Información de estado -->
      <div class="status-info" *ngIf="!isOnline()">
        <p>⚠️ Sin conexión a internet</p>
      </div>
    </div>
  `,
  styleUrls: ['./product-list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListContainerV2Component implements OnInit {
  // Inyección de stores
  private readonly productsStore = inject(ProductsStore);
  private readonly uiStore = inject(UIStore);
  private readonly router = inject(Router);

  // Selectores del store de productos
  readonly products = this.productsStore.products;
  readonly filteredProducts = this.productsStore.filteredProducts;
  readonly isLoading = this.productsStore.isLoading;
  readonly error = this.productsStore.error;
  readonly totalProducts = this.productsStore.totalProducts;
  readonly categories = this.productsStore.categories;
  readonly selectedCategory = computed(() => this.productsStore.filters().category);

  // Selectores del store de UI
  readonly viewMode = this.uiStore.viewMode;
  readonly isDarkTheme = this.uiStore.isDarkTheme;
  readonly isOnline = this.uiStore.isOnline;

  // Computed signals locales
  readonly displayProducts = computed(() => {
    const filtered = this.filteredProducts();
    const viewMode = this.viewMode();
    const itemsPerPage = this.uiStore.itemsPerPage();

    // En modo lista, mostrar menos items por página
    if (viewMode === 'list') {
      return filtered.slice(0, Math.min(itemsPerPage / 2, filtered.length));
    }

    return filtered.slice(0, Math.min(itemsPerPage, filtered.length));
  });

  readonly emptyMessage = computed(() => {
    const category = this.selectedCategory();
    const hasProducts = this.products().length > 0;

    if (!hasProducts) {
      return 'No hay productos disponibles';
    }

    return category
      ? `No hay productos en la categoría "${category}"`
      : 'No se encontraron productos';
  });

  readonly emptySubMessage = computed(() => {
    const category = this.selectedCategory();
    return category
      ? 'Intenta seleccionar otra categoría'
      : 'Intenta actualizar la página o cambiar los filtros';
  });

  readonly shouldUseVirtualScrolling = computed(() => {
    return this.displayProducts().length > 50;
  });

  readonly viewModeLabel = computed(() => {
    return this.viewMode() === 'grid'
      ? 'Cambiar a vista de lista'
      : 'Cambiar a vista de cuadrícula';
  });

  readonly themeLabel = computed(() => {
    return this.isDarkTheme() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
  });

  constructor() {
    // Configurar efectos reactivos
    this.setupEffects();
  }

  ngOnInit(): void {
    // Configurar breadcrumbs
    this.setupBreadcrumbs();

    // Cargar productos
    this.loadProducts();
  }

  /**
   * Configura efectos reactivos
   */
  private setupEffects(): void {
    // Efecto para logging en desarrollo
    if (!environment.production) {
      effect(() => {
        const products = this.products();
        console.log(`Products in store: ${products.length} items`);
      });

      effect(() => {
        const filtered = this.filteredProducts();
        console.log(`Filtered products: ${filtered.length} items`);
      });
    }

    // Efecto para actualizar título de página
    effect(() => {
      const category = this.selectedCategory();
      const title = category ? `Productos - ${category}` : 'Catálogo de Productos';
      document.title = title;
    });
  }

  /**
   * Configura breadcrumbs
   */
  private setupBreadcrumbs(): void {
    this.uiStore.setBreadcrumbs([
      { label: 'Inicio', url: '/' },
      { label: 'Productos', url: '/products', active: true },
    ]);
  }

  /**
   * Carga productos usando el store
   */
  private loadProducts(): void {
    this.productsStore.loadProducts();
  }

  /**
   * Maneja la visualización de detalles de producto
   */
  onProductViewDetails(product: Product): void {
    if (product.id) {
      // Actualizar breadcrumbs para detalles
      this.uiStore.addBreadcrumb({
        label: product.title || 'Producto',
        url: `/products/${product.id}`,
      });

      this.router.navigate(['/products', product.id]);
    }
  }

  /**
   * Maneja agregar producto al carrito
   */
  onProductAddToCart(product: Product): void {
    if (!product.id) return;

    // Agregar al carrito en el store
    this.productsStore.addToCart(product.id);

    // Mostrar notificación
    this.uiStore.showSuccess('Producto agregado', `${product.title} se agregó al carrito`);
  }

  /**
   * Maneja el refresh de la lista
   */
  onRefresh(): void {
    this.productsStore.loadProducts(true);
    this.uiStore.showInfo('Actualizando', 'Cargando productos...');
  }

  /**
   * Maneja cargar más productos (placeholder)
   */
  onLoadMore(): void {
    // En esta implementación no hay paginación real
    console.log('Load more requested');
  }

  /**
   * Maneja errores de carga de imagen
   */
  onImageLoadError(imageUrl: string): void {
    console.warn('Failed to load image:', imageUrl);
  }

  /**
   * Filtra productos por categoría
   */
  filterByCategory(category: string): void {
    this.productsStore.updateFilters({ category });

    // Actualizar breadcrumbs
    this.uiStore.setBreadcrumbs([
      { label: 'Inicio', url: '/' },
      { label: 'Productos', url: '/products' },
      { label: category, active: true },
    ]);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.productsStore.clearFilters();

    // Resetear breadcrumbs
    this.setupBreadcrumbs();
  }

  /**
   * Cambia el modo de vista
   */
  toggleViewMode(): void {
    this.uiStore.toggleViewMode();
  }

  /**
   * Cambia el tema
   */
  toggleTheme(): void {
    this.uiStore.toggleTheme();
  }
}

// Environment placeholder
const environment = { production: false };
