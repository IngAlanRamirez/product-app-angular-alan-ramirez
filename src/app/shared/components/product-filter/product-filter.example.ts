/**
 * Ejemplos de uso del ProductFilterComponent
 *
 * Este archivo contiene ejemplos prácticos de cómo implementar
 * el componente de filtrado de productos en diferentes escenarios.
 */

import { Component, signal } from '@angular/core';
import { Product } from '../../../domain/models/product.model';
import { FilterOptions, ProductFilters } from './product-filter.component';

// ===================================
// Ejemplo 1: Uso Básico
// ===================================

@Component({
  selector: 'app-basic-product-filter-example',
  template: `
    <div class="filter-example">
      <h2>Filtro Básico de Productos</h2>

      <div class="layout">
        <aside class="sidebar">
          <app-product-filter
            [products]="products"
            [filterOptions]="filterOptions"
            [totalResults]="filteredProducts().length"
            (onFiltersChange)="handleFiltersChange($event)"
            (onFiltersApply)="handleFiltersApply($event)"
            (onFiltersSave)="handleFiltersSave($event)"
          />
        </aside>

        <main class="content">
          <div class="products-grid">
            @for (product of filteredProducts(); track product.id) {
              <div class="product-card">
                <img [src]="product.image" [alt]="product.title" />
                <h3>{{ product.title }}</h3>
                <p class="price">{{ product.priceVO.format() }}</p>
                <p class="category">{{ product.category }}</p>
              </div>
            } @empty {
              <div class="no-results">
                <p>No se encontraron productos con los filtros aplicados.</p>
              </div>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .filter-example {
        padding: 2rem;
      }

      .layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        margin-top: 2rem;
      }

      .sidebar {
        position: sticky;
        top: 2rem;
        height: fit-content;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .product-card {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
      }

      .product-card img {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }

      .product-card h3 {
        margin: 0.5rem 0;
        font-size: 1rem;
      }

      .price {
        font-weight: bold;
        color: #1976d2;
        margin: 0.25rem 0;
      }

      .category {
        color: #666;
        font-size: 0.875rem;
        margin: 0;
      }

      .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #666;
      }

      @media (max-width: 768px) {
        .layout {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: static;
        }
      }
    `,
  ],
})
export class BasicProductFilterExample {
  products: Product[] = [
    Product.fromData({
      id: 1,
      title: 'Smartphone Premium',
      price: 899.99,
      description: 'Smartphone de última generación',
      category: 'electronics',
      image: 'https://example.com/phone.jpg',
    }),
    Product.fromData({
      id: 2,
      title: 'Laptop Gaming',
      price: 1299.99,
      description: 'Laptop para gaming profesional',
      category: 'electronics',
      image: 'https://example.com/laptop.jpg',
    }),
    Product.fromData({
      id: 3,
      title: 'Camiseta Casual',
      price: 29.99,
      description: 'Camiseta de algodón premium',
      category: 'clothing',
      image: 'https://example.com/shirt.jpg',
    }),
    Product.fromData({
      id: 4,
      title: 'Zapatillas Deportivas',
      price: 129.99,
      description: 'Zapatillas para running',
      category: 'clothing',
      image: 'https://example.com/shoes.jpg',
    }),
  ];

  filterOptions: FilterOptions = {
    categories: [
      { value: 'electronics', label: 'Electrónicos', count: 2 },
      { value: 'clothing', label: 'Ropa', count: 2 },
    ],
    brands: [
      { value: 'apple', label: 'Apple', count: 1 },
      { value: 'samsung', label: 'Samsung', count: 1 },
      { value: 'nike', label: 'Nike', count: 1 },
      { value: 'adidas', label: 'Adidas', count: 1 },
    ],
    priceRange: { min: 0, max: 1500 },
    tags: [
      { value: 'premium', label: 'Premium', count: 2 },
      { value: 'gaming', label: 'Gaming', count: 1 },
      { value: 'casual', label: 'Casual', count: 1 },
      { value: 'sport', label: 'Deportivo', count: 1 },
    ],
  };

  private currentFilters = signal<ProductFilters>({
    categories: [],
    priceRange: { min: 0, max: 1500 },
    rating: null,
    inStock: null,
    brands: [],
    sortBy: 'newest',
    searchTerm: '',
    tags: [],
  });

  filteredProducts = signal<Product[]>(this.products);

  handleFiltersChange(filters: ProductFilters): void {
    this.currentFilters.set(filters);
    this.applyFilters(filters);
  }

  handleFiltersApply(filters: ProductFilters): void {
    console.log('Filtros aplicados:', filters);
    this.applyFilters(filters);
  }

  handleFiltersSave(filters: ProductFilters): void {
    console.log('Filtros guardados:', filters);
    localStorage.setItem('savedFilters', JSON.stringify(filters));
  }

  private applyFilters(filters: ProductFilters): void {
    let filtered = [...this.products];

    // Filtrar por categorías
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => filters.categories.includes(product.category));
    }

    // Filtrar por rango de precio
    filtered = filtered.filter(
      product => product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
    );

    // Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.title.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar resultados
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        // Simular ordenamiento por rating
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'newest':
      default:
        // Mantener orden original para "newest"
        break;
    }

    this.filteredProducts.set(filtered);
  }
}

// ===================================
// Ejemplo 2: Con Estado Persistente
// ===================================

@Component({
  selector: 'app-persistent-filter-example',
  template: `
    <div class="persistent-example">
      <h2>Filtros con Estado Persistente</h2>

      <div class="controls">
        <button (click)="loadSavedFilters()">Cargar Filtros Guardados</button>
        <button (click)="resetToDefaults()">Restaurar Predeterminados</button>
        <button (click)="exportFilters()">Exportar Configuración</button>
      </div>

      <app-product-filter
        [products]="products"
        [filterOptions]="filterOptions"
        [initialFilters]="initialFilters"
        [totalResults]="totalResults"
        (onFiltersChange)="onFiltersChange($event)"
        (onFiltersApply)="onFiltersApply($event)"
        (onFiltersSave)="onFiltersSave($event)"
      />

      <div class="filter-state" *ngIf="currentFilters">
        <h3>Estado Actual de Filtros:</h3>
        <pre>{{ currentFilters | json }}</pre>
      </div>
    </div>
  `,
  styles: [
    `
      .persistent-example {
        padding: 2rem;
        max-width: 600px;
      }

      .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .controls button {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      }

      .controls button:hover {
        background: #f5f5f5;
      }

      .filter-state {
        margin-top: 2rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .filter-state h3 {
        margin-top: 0;
      }

      .filter-state pre {
        background: white;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class PersistentFilterExample {
  products: Product[] = [];
  filterOptions: FilterOptions = {
    categories: [
      { value: 'electronics', label: 'Electrónicos', count: 15 },
      { value: 'clothing', label: 'Ropa', count: 23 },
      { value: 'books', label: 'Libros', count: 8 },
      { value: 'home', label: 'Hogar', count: 12 },
    ],
    brands: [
      { value: 'apple', label: 'Apple', count: 5 },
      { value: 'samsung', label: 'Samsung', count: 7 },
      { value: 'nike', label: 'Nike', count: 8 },
      { value: 'adidas', label: 'Adidas', count: 6 },
    ],
    priceRange: { min: 0, max: 2000 },
    tags: [
      { value: 'premium', label: 'Premium', count: 12 },
      { value: 'sale', label: 'En Oferta', count: 18 },
      { value: 'new', label: 'Nuevo', count: 9 },
    ],
  };

  initialFilters: Partial<ProductFilters> | null = null;
  currentFilters: ProductFilters | null = null;
  totalResults = 58;

  constructor() {
    this.loadInitialFilters();
  }

  private loadInitialFilters(): void {
    const saved = localStorage.getItem('productFilters');
    if (saved) {
      try {
        this.initialFilters = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }

  loadSavedFilters(): void {
    const saved = localStorage.getItem('productFilters');
    if (saved) {
      try {
        this.initialFilters = JSON.parse(saved);
        alert('Filtros cargados desde el almacenamiento local');
      } catch (error) {
        alert('Error al cargar los filtros guardados');
      }
    } else {
      alert('No hay filtros guardados');
    }
  }

  resetToDefaults(): void {
    this.initialFilters = {
      categories: [],
      priceRange: this.filterOptions.priceRange,
      rating: null,
      inStock: null,
      brands: [],
      sortBy: 'newest',
      searchTerm: '',
      tags: [],
    };
    localStorage.removeItem('productFilters');
    alert('Filtros restaurados a valores predeterminados');
  }

  exportFilters(): void {
    if (this.currentFilters) {
      const dataStr = JSON.stringify(this.currentFilters, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'product-filters.json';
      link.click();

      URL.revokeObjectURL(url);
    }
  }

  onFiltersChange(filters: ProductFilters): void {
    this.currentFilters = filters;
    // Auto-guardar cambios
    localStorage.setItem('productFilters', JSON.stringify(filters));
  }

  onFiltersApply(filters: ProductFilters): void {
    console.log('Aplicando filtros:', filters);
    // Aquí harías la llamada a la API con los filtros
  }

  onFiltersSave(filters: ProductFilters): void {
    localStorage.setItem('savedProductFilters', JSON.stringify(filters));
    console.log('Filtros guardados permanentemente');
  }
}

// ===================================
// Ejemplo 3: Integración con API
// ===================================

@Component({
  selector: 'app-api-filter-example',
  template: `
    <div class="api-example">
      <h2>Filtros con Integración API</h2>

      <div class="stats">
        <div class="stat">
          <span class="label">Total productos:</span>
          <span class="value">{{ totalProducts }}</span>
        </div>
        <div class="stat">
          <span class="label">Filtrados:</span>
          <span class="value">{{ filteredCount }}</span>
        </div>
        <div class="stat">
          <span class="label">Tiempo de respuesta:</span>
          <span class="value">{{ responseTime }}ms</span>
        </div>
      </div>

      <app-product-filter
        [products]="products"
        [filterOptions]="dynamicFilterOptions"
        [totalResults]="filteredCount"
        (onFiltersChange)="onFiltersChange($event)"
        (onFiltersApply)="onFiltersApply($event)"
      />

      <div class="loading" *ngIf="isLoading">
        <p>Aplicando filtros...</p>
      </div>

      <div class="api-log">
        <h3>Log de API:</h3>
        <div class="log-entries">
          @for (entry of apiLog; track $index) {
            <div class="log-entry" [class]="entry.type">
              <span class="timestamp">{{ entry.timestamp | date: 'HH:mm:ss' }}</span>
              <span class="message">{{ entry.message }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .api-example {
        padding: 2rem;
        max-width: 800px;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat {
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
        text-align: center;
      }

      .stat .label {
        display: block;
        font-size: 0.875rem;
        color: #666;
        margin-bottom: 0.25rem;
      }

      .stat .value {
        display: block;
        font-size: 1.5rem;
        font-weight: bold;
        color: #1976d2;
      }

      .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
      }

      .api-log {
        margin-top: 2rem;
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
      }

      .api-log h3 {
        margin-top: 0;
      }

      .log-entry {
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.875rem;
      }

      .log-entry.info {
        background: #e3f2fd;
      }

      .log-entry.success {
        background: #e8f5e8;
      }

      .log-entry.error {
        background: #ffebee;
      }

      .timestamp {
        color: #666;
        margin-right: 0.5rem;
      }
    `,
  ],
})
export class ApiFilterExample {
  products: Product[] = [];
  dynamicFilterOptions: FilterOptions = {
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 1000 },
    tags: [],
  };

  totalProducts = 0;
  filteredCount = 0;
  responseTime = 0;
  isLoading = false;

  apiLog: Array<{ timestamp: Date; message: string; type: 'info' | 'success' | 'error' }> = [];

  constructor() {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.addLogEntry('Cargando datos iniciales...', 'info');

    try {
      // Simular llamada a API
      await this.delay(1000);

      this.totalProducts = 150;
      this.filteredCount = 150;

      // Simular opciones de filtro dinámicas
      this.dynamicFilterOptions = {
        categories: [
          { value: 'electronics', label: 'Electrónicos', count: 45 },
          { value: 'clothing', label: 'Ropa', count: 38 },
          { value: 'books', label: 'Libros', count: 22 },
          { value: 'home', label: 'Hogar', count: 28 },
          { value: 'sports', label: 'Deportes', count: 17 },
        ],
        brands: [
          { value: 'apple', label: 'Apple', count: 12 },
          { value: 'samsung', label: 'Samsung', count: 15 },
          { value: 'nike', label: 'Nike', count: 18 },
          { value: 'adidas', label: 'Adidas', count: 14 },
          { value: 'sony', label: 'Sony', count: 9 },
        ],
        priceRange: { min: 0, max: 2500 },
        tags: [
          { value: 'premium', label: 'Premium', count: 25 },
          { value: 'sale', label: 'En Oferta', count: 42 },
          { value: 'new', label: 'Nuevo', count: 18 },
          { value: 'bestseller', label: 'Más Vendido', count: 31 },
        ],
      };

      this.addLogEntry('Datos cargados exitosamente', 'success');
    } catch (error) {
      this.addLogEntry('Error al cargar datos iniciales', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  async onFiltersChange(filters: ProductFilters): void {
    this.addLogEntry(`Filtros cambiados: ${this.getFilterSummary(filters)}`, 'info');
  }

  async onFiltersApply(filters: ProductFilters): void {
    this.isLoading = true;
    const startTime = Date.now();

    this.addLogEntry('Aplicando filtros en el servidor...', 'info');

    try {
      // Simular llamada a API con filtros
      await this.delay(800);

      // Simular conteo de resultados filtrados
      this.filteredCount = Math.floor(Math.random() * this.totalProducts) + 1;
      this.responseTime = Date.now() - startTime;

      this.addLogEntry(
        `Filtros aplicados: ${this.filteredCount} resultados encontrados`,
        'success'
      );
    } catch (error) {
      this.addLogEntry('Error al aplicar filtros', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  private getFilterSummary(filters: ProductFilters): string {
    const parts = [];

    if (filters.categories.length > 0) {
      parts.push(`${filters.categories.length} categorías`);
    }

    if (filters.brands.length > 0) {
      parts.push(`${filters.brands.length} marcas`);
    }

    if (filters.searchTerm) {
      parts.push(`búsqueda: "${filters.searchTerm}"`);
    }

    if (filters.rating !== null) {
      parts.push(`rating: ${filters.rating}+`);
    }

    return parts.length > 0 ? parts.join(', ') : 'sin filtros';
  }

  private addLogEntry(message: string, type: 'info' | 'success' | 'error'): void {
    this.apiLog.unshift({
      timestamp: new Date(),
      message,
      type,
    });

    // Mantener solo los últimos 20 entries
    if (this.apiLog.length > 20) {
      this.apiLog = this.apiLog.slice(0, 20);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===================================
// Patrones de Uso Recomendados
// ===================================

/**
 * 1. GESTIÓN DE ESTADO
 *
 * - Usar signals para estado reactivo
 * - Persistir filtros importantes en localStorage
 * - Implementar debounce para búsquedas
 * - Manejar estado de carga apropiadamente
 */

/**
 * 2. PERFORMANCE
 *
 * - Implementar paginación para grandes datasets
 * - Usar virtual scrolling si es necesario
 * - Optimizar re-renders con OnPush
 * - Cachear resultados de filtros comunes
 */

/**
 * 3. UX/UI
 *
 * - Mostrar contadores de resultados
 * - Implementar filtros activos visibles
 * - Permitir limpiar filtros fácilmente
 * - Usar modo compacto en móviles
 */

/**
 * 4. ACCESIBILIDAD
 *
 * - Usar ARIA labels apropiados
 * - Implementar navegación por teclado
 * - Anunciar cambios de resultados
 * - Mantener focus management
 */

/**
 * 5. INTEGRACIÓN API
 *
 * - Implementar debounce para llamadas
 * - Manejar errores de red gracefully
 * - Mostrar estados de carga
 * - Cachear opciones de filtro
 */

export { ApiFilterExample, BasicProductFilterExample, PersistentFilterExample };
