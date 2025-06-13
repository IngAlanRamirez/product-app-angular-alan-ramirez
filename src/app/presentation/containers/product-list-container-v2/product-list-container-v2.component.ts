import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';

import { SearchBarComponent } from '../../../shared/components';
import { ProductsStore } from '../../../shared/store/products.store';
import { UIStore } from '../../../shared/store/ui.store';

/**
 * Container V2 para lista de productos con estado global
 */
@Component({
  selector: 'app-product-list-container-v2',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  template: `
    <div class="product-list-container">
      <!-- Barra de búsqueda avanzada -->
      <app-search-bar />

      <!-- Controles de vista y tema -->
      <div class="view-controls">
        <div class="view-mode-controls">
          <button
            type="button"
            class="view-toggle"
            [class.active]="viewMode() === 'grid'"
            (click)="setViewMode('grid')"
          >
            ⊞
          </button>
          <button
            type="button"
            class="view-toggle"
            [class.active]="viewMode() === 'list'"
            (click)="setViewMode('list')"
          >
            ☰
          </button>
        </div>

        <div class="theme-controls">
          <button type="button" class="theme-toggle" (click)="toggleTheme()">
            {{ themeIcon() }}
          </button>
        </div>
      </div>

      <!-- Filtros por categoría -->
      <div class="category-filters" *ngIf="categories().length > 0">
        <div class="filter-chips">
          <button
            type="button"
            class="filter-chip"
            [class.active]="!currentFilters().category"
            (click)="clearCategoryFilter()"
          >
            Todas
          </button>
          <button
            *ngFor="let category of categories()"
            type="button"
            class="filter-chip"
            [class.active]="currentFilters().category === category"
            (click)="setCategoryFilter(category)"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Lista de productos -->
      <div class="products-grid" *ngIf="filteredProducts().length > 0">
        <div class="product-count">{{ filteredProducts().length }} productos encontrados</div>
        <div class="products-placeholder">
          <p>Productos cargados: {{ filteredProducts().length }}</p>
          <p *ngIf="isLoading()">Cargando productos...</p>
          <p *ngIf="error()">Error: {{ error() }}</p>
        </div>
      </div>

      <!-- Estado vacío -->
      <div class="empty-state" *ngIf="filteredProducts().length === 0 && !isLoading()">
        <h3>No se encontraron productos</h3>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    </div>
  `,
  styleUrls: ['./product-list-container-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListContainerV2Component implements OnInit {
  // Inyección de stores
  private readonly productsStore = inject(ProductsStore);
  private readonly uiStore = inject(UIStore);

  // Selectores del ProductsStore
  readonly products = this.productsStore.products;
  readonly filteredProducts = this.productsStore.filteredProducts;
  readonly isLoading = this.productsStore.isLoading;
  readonly error = this.productsStore.error;
  readonly categories = this.productsStore.categories;
  readonly currentFilters = this.productsStore.filters;

  // Selectores del UIStore
  readonly viewMode = this.uiStore.viewMode;
  readonly theme = this.uiStore.theme;

  // Computed signals
  readonly themeIcon = computed(() => {
    const currentTheme = this.theme();
    return currentTheme === 'dark' ? '🌙' : currentTheme === 'light' ? '☀️' : '🔄';
  });

  ngOnInit(): void {
    // Configurar breadcrumbs
    this.uiStore.setBreadcrumbs([
      { label: 'Inicio', url: '/', active: false },
      { label: 'Productos', url: '/products', active: true },
    ]);

    // Cargar productos si no están cargados
    if (this.products().length === 0) {
      this.productsStore.loadProducts();
    }

    // Mostrar notificación de bienvenida
    this.uiStore.addNotification({
      type: 'info',
      title: 'Bienvenido',
      message: 'Explora nuestro catálogo de productos',
      duration: 3000,
    });
  }

  /**
   * Cambia el modo de vista
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.uiStore.setViewMode(mode);
  }

  /**
   * Toggle del tema
   */
  toggleTheme(): void {
    this.uiStore.toggleTheme();
  }

  /**
   * Establece filtro de categoría
   */
  setCategoryFilter(category: string): void {
    this.productsStore.updateFilters({ category });
  }

  /**
   * Limpia el filtro de categoría
   */
  clearCategoryFilter(): void {
    this.productsStore.updateFilters({ category: null });
  }
}
