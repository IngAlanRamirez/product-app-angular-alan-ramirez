import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductsStore } from '../../store/products.store';

/**
 * Componente de búsqueda avanzada
 *
 * Características:
 * - Búsqueda en tiempo real con debounce
 * - Filtros por categoría y precio
 * - Ordenamiento configurable
 * - Sugerencias automáticas
 * - Historial de búsquedas
 * - Responsive design
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-bar-container">
      <!-- Barra de búsqueda principal -->
      <div class="search-input-wrapper">
        <div class="search-input-container">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="search-input"
            placeholder="Buscar productos..."
            [(ngModel)]="searchTerm"
            (input)="onSearchInput($event)"
            (focus)="onSearchFocus()"
            (blur)="onSearchBlur()"
            [attr.aria-label]="'Buscar productos'"
            [attr.aria-expanded]="showSuggestions()"
            [attr.aria-haspopup]="'listbox'"
          />

          <!-- Botón limpiar -->
          <button
            *ngIf="searchTerm"
            type="button"
            class="search-clear"
            (click)="clearSearch()"
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>

        <!-- Sugerencias -->
        <div
          class="search-suggestions"
          *ngIf="showSuggestions() && suggestions().length > 0"
          role="listbox"
          [attr.aria-label]="'Sugerencias de búsqueda'"
        >
          <div
            *ngFor="let suggestion of suggestions(); trackBy: trackBySuggestion"
            class="suggestion-item"
            role="option"
            [attr.aria-selected]="false"
            (click)="selectSuggestion(suggestion)"
          >
            <span class="suggestion-icon">🔍</span>
            <span class="suggestion-text">{{ suggestion }}</span>
          </div>
        </div>
      </div>

      <!-- Filtros avanzados -->
      <div class="search-filters" [class.expanded]="showFilters()">
        <!-- Toggle filtros -->
        <button
          type="button"
          class="filters-toggle"
          (click)="toggleFilters()"
          [attr.aria-expanded]="showFilters()"
          aria-label="Mostrar filtros avanzados"
        >
          <span>Filtros</span>
          <span class="toggle-icon">{{ showFilters() ? '▲' : '▼' }}</span>
        </button>

        <!-- Panel de filtros -->
        <div class="filters-panel" *ngIf="showFilters()">
          <!-- Filtro por categoría -->
          <div class="filter-group">
            <label for="category-filter">Categoría:</label>
            <select
              id="category-filter"
              [(ngModel)]="selectedCategory"
              (change)="onCategoryChange()"
              class="filter-select"
            >
              <option value="">Todas las categorías</option>
              <option *ngFor="let category of categories()" [value]="category">
                {{ category }}
              </option>
            </select>
          </div>

          <!-- Filtro por precio -->
          <div class="filter-group">
            <label>Rango de precio:</label>
            <div class="price-range">
              <input
                type="number"
                [(ngModel)]="minPrice"
                (input)="onPriceChange()"
                placeholder="Mín"
                class="price-input"
                [min]="0"
                [max]="priceRange().max"
              />
              <span class="price-separator">-</span>
              <input
                type="number"
                [(ngModel)]="maxPrice"
                (input)="onPriceChange()"
                placeholder="Máx"
                class="price-input"
                [min]="minPrice || 0"
                [max]="priceRange().max"
              />
            </div>
          </div>

          <!-- Ordenamiento -->
          <div class="filter-group">
            <label for="sort-filter">Ordenar por:</label>
            <select
              id="sort-filter"
              [(ngModel)]="sortBy"
              (change)="onSortChange()"
              class="filter-select"
            >
              <option value="">Sin ordenar</option>
              <option value="title">Nombre</option>
              <option value="price">Precio</option>
              <option value="category">Categoría</option>
            </select>

            <button
              *ngIf="sortBy"
              type="button"
              class="sort-order-toggle"
              (click)="toggleSortOrder()"
              [attr.aria-label]="sortOrderLabel()"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>

          <!-- Botón limpiar filtros -->
          <button
            type="button"
            class="clear-filters"
            (click)="clearAllFilters()"
            *ngIf="hasActiveFilters()"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <!-- Resultados info -->
      <div class="search-results-info" *ngIf="searchTerm || hasActiveFilters()">
        <span class="results-count">
          {{ filteredProductsCount() }} resultado{{ filteredProductsCount() !== 1 ? 's' : '' }}
        </span>
        <span *ngIf="searchTerm" class="search-term"> para "{{ searchTerm }}" </span>
      </div>
    </div>
  `,
  styleUrls: ['./search-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  // Inyección del store
  private readonly productsStore = inject(ProductsStore);

  // Estado local
  searchTerm = '';
  selectedCategory = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  private readonly _showFilters = signal(false);
  private readonly _showSuggestions = signal(false);
  private readonly _searchHistory = signal<string[]>([]);

  // Subjects para debounce
  private readonly searchSubject = new Subject<string>();
  private readonly priceSubject = new Subject<void>();

  // Selectores del store
  readonly categories = this.productsStore.categories;
  readonly priceRange = this.productsStore.priceRange;
  readonly filteredProducts = this.productsStore.filteredProducts;
  readonly filters = this.productsStore.filters;

  // Computed signals
  readonly showFilters = computed(() => this._showFilters());
  readonly showSuggestions = computed(() => this._showSuggestions());
  readonly filteredProductsCount = computed(() => this.filteredProducts().length);

  readonly suggestions = computed(() => {
    if (!this.searchTerm || this.searchTerm.length < 2) {
      return [];
    }

    const history = this._searchHistory();
    const term = this.searchTerm.toLowerCase();

    // Filtrar historial que coincida con el término actual
    const historySuggestions = history
      .filter(h => h.toLowerCase().includes(term) && h !== this.searchTerm)
      .slice(0, 3);

    // Agregar sugerencias basadas en categorías
    const categorySuggestions = this.categories()
      .filter(cat => cat.toLowerCase().includes(term))
      .slice(0, 2);

    return [...historySuggestions, ...categorySuggestions];
  });

  readonly hasActiveFilters = computed(() => {
    return !!(this.selectedCategory || this.minPrice || this.maxPrice || this.sortBy);
  });

  readonly sortOrderLabel = computed(() => {
    return this.sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente';
  });

  constructor() {
    // Configurar debounce para búsqueda
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(term => {
        this.updateSearchFilter(term);
      });

    // Configurar debounce para precio
    this.priceSubject.pipe(debounceTime(500), takeUntilDestroyed()).subscribe(() => {
      this.updatePriceFilters();
    });

    // Cargar historial desde localStorage
    this.loadSearchHistory();

    // Sincronizar con el store
    this.syncWithStore();
  }

  /**
   * Maneja la entrada de texto en búsqueda
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Maneja el foco en el input de búsqueda
   */
  onSearchFocus(): void {
    this._showSuggestions.set(true);
  }

  /**
   * Maneja la pérdida de foco en el input de búsqueda
   */
  onSearchBlur(): void {
    // Delay para permitir clicks en sugerencias
    setTimeout(() => {
      this._showSuggestions.set(false);
    }, 200);
  }

  /**
   * Limpia la búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.updateSearchFilter('');
  }

  /**
   * Selecciona una sugerencia
   */
  selectSuggestion(suggestion: string): void {
    this.searchTerm = suggestion;
    this.updateSearchFilter(suggestion);
    this._showSuggestions.set(false);
    this.addToSearchHistory(suggestion);
  }

  /**
   * Toggle del panel de filtros
   */
  toggleFilters(): void {
    this._showFilters.update(current => !current);
  }

  /**
   * Maneja cambio de categoría
   */
  onCategoryChange(): void {
    this.productsStore.updateFilters({
      category: this.selectedCategory || null,
    });
  }

  /**
   * Maneja cambio de precio
   */
  onPriceChange(): void {
    this.priceSubject.next();
  }

  /**
   * Maneja cambio de ordenamiento
   */
  onSortChange(): void {
    this.productsStore.updateFilters({
      sortBy: (this.sortBy as any) || null,
    });
  }

  /**
   * Toggle del orden de clasificación
   */
  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.productsStore.updateFilters({ sortOrder: this.sortOrder });
  }

  /**
   * Limpia todos los filtros
   */
  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = '';
    this.sortOrder = 'asc';

    this.productsStore.clearFilters();
  }

  /**
   * TrackBy para sugerencias
   */
  trackBySuggestion(index: number, suggestion: string): string {
    return suggestion;
  }

  /**
   * Actualiza el filtro de búsqueda
   */
  private updateSearchFilter(term: string): void {
    this.productsStore.updateFilters({ searchTerm: term });

    if (term && term.length > 2) {
      this.addToSearchHistory(term);
    }
  }

  /**
   * Actualiza los filtros de precio
   */
  private updatePriceFilters(): void {
    this.productsStore.updateFilters({
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
    });
  }

  /**
   * Agrega término al historial de búsqueda
   */
  private addToSearchHistory(term: string): void {
    const history = this._searchHistory();
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);

    this._searchHistory.set(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }

  /**
   * Carga el historial de búsqueda
   */
  private loadSearchHistory(): void {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      this._searchHistory.set(history);
    } catch (error) {
      console.warn('Error loading search history:', error);
    }
  }

  /**
   * Sincroniza con el estado del store
   */
  private syncWithStore(): void {
    effect(() => {
      const filters = this.filters();

      // Sincronizar solo si los valores son diferentes
      if (this.searchTerm !== filters.searchTerm) {
        this.searchTerm = filters.searchTerm;
      }

      if (this.selectedCategory !== (filters.category || '')) {
        this.selectedCategory = filters.category || '';
      }

      if (this.minPrice !== filters.minPrice) {
        this.minPrice = filters.minPrice;
      }

      if (this.maxPrice !== filters.maxPrice) {
        this.maxPrice = filters.maxPrice;
      }

      if (this.sortBy !== (filters.sortBy || '')) {
        this.sortBy = filters.sortBy || '';
      }

      if (this.sortOrder !== filters.sortOrder) {
        this.sortOrder = filters.sortOrder;
      }
    });
  }
}
