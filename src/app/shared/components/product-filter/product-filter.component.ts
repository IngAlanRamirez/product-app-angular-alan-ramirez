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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Product } from '../../../domain/models/product.model';
import { UIStore } from '../../store/ui.store';

/**
 * Interfaz para los filtros de producto
 */
export interface ProductFilters {
  categories: string[];
  priceRange: { min: number; max: number };
  rating: number | null;
  inStock: boolean | null;
  brands: string[];
  sortBy: 'price-asc' | 'price-desc' | 'rating' | 'name' | 'newest';
  searchTerm: string;
  tags: string[];
}

/**
 * Interfaz para opciones de filtro
 */
export interface FilterOptions {
  categories: Array<{ value: string; label: string; count: number }>;
  brands: Array<{ value: string; label: string; count: number }>;
  priceRange: { min: number; max: number };
  tags: Array<{ value: string; label: string; count: number }>;
}

/**
 * Componente de filtrado de productos
 *
 * Características:
 * - Filtros por categoría, precio, rating, stock
 * - Búsqueda por texto
 * - Filtros por marca y etiquetas
 * - Ordenamiento múltiple
 * - Filtros activos con chips
 * - Guardado de estado de filtros
 * - Responsive y accesible
 * - Filtros avanzados colapsables
 */
@Component({
  selector: 'app-product-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatExpansionModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatTooltipModule,
  ],
  template: `
    <div class="product-filter-container">
      <!-- Header con controles principales -->
      <div class="filter-header">
        <div class="filter-title">
          <h3>Filtros</h3>
          <span class="results-count" *ngIf="totalResults() > 0">
            {{ totalResults() }} {{ totalResults() === 1 ? 'resultado' : 'resultados' }}
          </span>
        </div>

        <div class="filter-actions">
          <button
            mat-button
            color="primary"
            (click)="toggleCompactMode()"
            [matTooltip]="isCompactMode() ? 'Vista expandida' : 'Vista compacta'"
            aria-label="Cambiar vista de filtros"
          >
            <mat-icon>{{ isCompactMode() ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>

          <button
            mat-button
            color="warn"
            (click)="clearAllFilters()"
            [disabled]="!hasActiveFilters()"
            matTooltip="Limpiar todos los filtros"
            aria-label="Limpiar filtros"
          >
            <mat-icon>clear_all</mat-icon>
            Limpiar
          </button>
        </div>
      </div>

      <!-- Filtros activos -->
      <div class="active-filters" *ngIf="hasActiveFilters()">
        <h4>Filtros Activos:</h4>
        <div class="filter-chips">
          <!-- Categorías -->
          @for (category of currentFilters().categories; track category) {
            <mat-chip class="filter-chip" (removed)="removeCategory(category)" [removable]="true">
              <mat-icon>category</mat-icon>
              {{ getCategoryLabel(category) }}
              <mat-icon matChipRemove>cancel</mat-icon>
            </mat-chip>
          }

          <!-- Marcas -->
          @for (brand of currentFilters().brands; track brand) {
            <mat-chip class="filter-chip" (removed)="removeBrand(brand)" [removable]="true">
              <mat-icon>business</mat-icon>
              {{ brand }}
              <mat-icon matChipRemove>cancel</mat-icon>
            </mat-chip>
          }

          <!-- Rango de precio -->
          @if (hasPriceFilter()) {
            <mat-chip class="filter-chip" (removed)="clearPriceFilter()" [removable]="true">
              <mat-icon>attach_money</mat-icon>
              {{ getPriceRangeDisplay() }}
              <mat-icon matChipRemove>cancel</mat-icon>
            </mat-chip>
          }

          <!-- Rating -->
          @if (currentFilters().rating !== null) {
            <mat-chip class="filter-chip" (removed)="clearRatingFilter()" [removable]="true">
              <mat-icon>star</mat-icon>
              {{ currentFilters().rating }}+ estrellas
              <mat-icon matChipRemove>cancel</mat-icon>
            </mat-chip>
          }

          <!-- Stock -->
          @if (currentFilters().inStock !== null) {
            <mat-chip class="filter-chip" (removed)="clearStockFilter()" [removable]="true">
              <mat-icon>inventory</mat-icon>
              {{ currentFilters().inStock ? 'En stock' : 'Agotado' }}
              <mat-icon matChipRemove>cancel</mat-icon>
            </mat-chip>
          }

          <!-- Etiquetas -->
          @for (tag of currentFilters().tags; track tag) {
            <mat-chip class="filter-chip" (removed)="removeTag(tag)" [removable]="true">
              <mat-icon>label</mat-icon>
              {{ tag }}
              <mat-icon matChipRemove>cancel</mat-icon>
            </mat-chip>
          }
        </div>
      </div>

      <!-- Búsqueda rápida -->
      <div class="quick-search">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar productos</mat-label>
          <input
            matInput
            type="text"
            [value]="currentFilters().searchTerm"
            (input)="updateSearchTerm($event)"
            placeholder="Nombre, descripción, marca..."
            [attr.aria-label]="'Buscar productos'"
          />
          <mat-icon matPrefix>search</mat-icon>
          @if (currentFilters().searchTerm) {
            <button matSuffix mat-icon-button (click)="clearSearch()" aria-label="Limpiar búsqueda">
              <mat-icon>clear</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      <!-- Ordenamiento -->
      <div class="sort-section">
        <mat-form-field appearance="outline">
          <mat-label>Ordenar por</mat-label>
          <mat-select
            [value]="currentFilters().sortBy"
            (selectionChange)="updateSortBy($event.value)"
            aria-label="Ordenar productos"
          >
            <mat-option value="newest">Más recientes</mat-option>
            <mat-option value="name">Nombre A-Z</mat-option>
            <mat-option value="price-asc">Precio: menor a mayor</mat-option>
            <mat-option value="price-desc">Precio: mayor a menor</mat-option>
            <mat-option value="rating">Mejor valorados</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Filtros principales -->
      <div class="main-filters" [class.compact]="isCompactMode()">
        <!-- Categorías -->
        <mat-expansion-panel [expanded]="!isCompactMode()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>category</mat-icon>
              Categorías
            </mat-panel-title>
            <mat-panel-description>
              {{ getSelectedCategoriesCount() }} seleccionadas
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="filter-content">
            @for (category of filterOptions().categories; track category.value) {
              <mat-checkbox
                [checked]="isCategorySelected(category.value)"
                (change)="toggleCategory(category.value, $event.checked)"
                [attr.aria-label]="'Filtrar por categoría ' + category.label"
              >
                {{ category.label }}
                <span class="count">({{ category.count }})</span>
              </mat-checkbox>
            }
          </div>
        </mat-expansion-panel>

        <!-- Rango de precio -->
        <mat-expansion-panel [expanded]="!isCompactMode()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>attach_money</mat-icon>
              Precio
            </mat-panel-title>
            <mat-panel-description>
              {{ getPriceRangeDisplay() }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="filter-content price-filter">
            <div class="price-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Mínimo</mat-label>
                <input
                  matInput
                  type="number"
                  [value]="currentFilters().priceRange.min"
                  (input)="updateMinPrice($event)"
                  min="0"
                  [max]="filterOptions().priceRange.max"
                />
                <span matPrefix>$</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Máximo</mat-label>
                <input
                  matInput
                  type="number"
                  [value]="currentFilters().priceRange.max"
                  (input)="updateMaxPrice($event)"
                  [min]="currentFilters().priceRange.min"
                  [max]="filterOptions().priceRange.max"
                />
                <span matPrefix>$</span>
              </mat-form-field>
            </div>

            <div class="price-slider">
              <mat-slider
                [min]="filterOptions().priceRange.min"
                [max]="filterOptions().priceRange.max"
                [step]="10"
                discrete
                [displayWith]="formatPrice"
              >
                <input
                  matSliderStartThumb
                  [value]="currentFilters().priceRange.min"
                  (valueChange)="updatePriceRange($event, currentFilters().priceRange.max)"
                />
                <input
                  matSliderEndThumb
                  [value]="currentFilters().priceRange.max"
                  (valueChange)="updatePriceRange(currentFilters().priceRange.min, $event)"
                />
              </mat-slider>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Rating -->
        <mat-expansion-panel [expanded]="!isCompactMode()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>star</mat-icon>
              Valoración
            </mat-panel-title>
            <mat-panel-description>
              {{ currentFilters().rating ? currentFilters().rating + '+ estrellas' : 'Todas' }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="filter-content rating-filter">
            <mat-radio-group
              [value]="currentFilters().rating"
              (change)="updateRating($event.value)"
              aria-label="Filtrar por valoración"
            >
              <mat-radio-button [value]="null"> Todas las valoraciones </mat-radio-button>

              @for (rating of [5, 4, 3, 2, 1]; track rating) {
                <mat-radio-button [value]="rating">
                  <div class="rating-option">
                    <div class="stars">
                      @for (star of getStarArray(rating); track $index) {
                        <mat-icon class="star">star</mat-icon>
                      }
                    </div>
                    <span>{{ rating }}+ estrellas</span>
                  </div>
                </mat-radio-button>
              }
            </mat-radio-group>
          </div>
        </mat-expansion-panel>

        <!-- Disponibilidad -->
        <mat-expansion-panel [expanded]="!isCompactMode()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>inventory</mat-icon>
              Disponibilidad
            </mat-panel-title>
            <mat-panel-description>
              {{ getStockDescription() }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="filter-content stock-filter">
            <mat-radio-group
              [value]="currentFilters().inStock"
              (change)="updateStock($event.value)"
              aria-label="Filtrar por disponibilidad"
            >
              <mat-radio-button [value]="null"> Todos los productos </mat-radio-button>
              <mat-radio-button [value]="true">
                <mat-icon>check_circle</mat-icon>
                Solo en stock
              </mat-radio-button>
              <mat-radio-button [value]="false">
                <mat-icon>error</mat-icon>
                Solo agotados
              </mat-radio-button>
            </mat-radio-group>
          </div>
        </mat-expansion-panel>

        <!-- Marcas -->
        <mat-expansion-panel [expanded]="!isCompactMode()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>business</mat-icon>
              Marcas
            </mat-panel-title>
            <mat-panel-description>
              {{ getSelectedBrandsCount() }} seleccionadas
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="filter-content brands-filter">
            <div class="brand-search" *ngIf="filterOptions().brands.length > 5">
              <mat-form-field appearance="outline">
                <mat-label>Buscar marca</mat-label>
                <input
                  matInput
                  type="text"
                  [value]="brandSearchTerm()"
                  (input)="updateBrandSearch($event)"
                  placeholder="Nombre de la marca..."
                />
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>
            </div>

            <div class="brands-list">
              @for (brand of getFilteredBrands(); track brand.value) {
                <mat-checkbox
                  [checked]="isBrandSelected(brand.value)"
                  (change)="toggleBrand(brand.value, $event.checked)"
                  [attr.aria-label]="'Filtrar por marca ' + brand.label"
                >
                  {{ brand.label }}
                  <span class="count">({{ brand.count }})</span>
                </mat-checkbox>
              }
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Etiquetas -->
        <mat-expansion-panel [expanded]="!isCompactMode()">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>label</mat-icon>
              Etiquetas
            </mat-panel-title>
            <mat-panel-description>
              {{ getSelectedTagsCount() }} seleccionadas
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="filter-content tags-filter">
            <div class="tags-chips">
              @for (tag of filterOptions().tags; track tag.value) {
                <mat-chip
                  [class.selected]="isTagSelected(tag.value)"
                  (click)="toggleTag(tag.value)"
                  [attr.aria-label]="'Filtrar por etiqueta ' + tag.label"
                >
                  {{ tag.label }}
                  <span class="count">({{ tag.count }})</span>
                </mat-chip>
              }
            </div>
          </div>
        </mat-expansion-panel>
      </div>

      <!-- Acciones finales -->
      <div class="filter-footer">
        <button
          mat-raised-button
          color="primary"
          (click)="applyFilters()"
          [disabled]="!hasChanges()"
          class="apply-btn"
        >
          <mat-icon>filter_list</mat-icon>
          Aplicar Filtros
        </button>

        <button
          mat-button
          (click)="saveFilters()"
          [disabled]="!hasActiveFilters()"
          matTooltip="Guardar configuración actual"
        >
          <mat-icon>bookmark</mat-icon>
          Guardar
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./product-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFilterComponent {
  // Inputs
  readonly products = input<Product[]>([]);
  readonly filterOptions = input<FilterOptions>({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 1000 },
    tags: [],
  });
  readonly initialFilters = input<Partial<ProductFilters> | null>(null);
  readonly totalResults = input<number>(0);

  // Outputs
  readonly onFiltersChange = output<ProductFilters>();
  readonly onFiltersApply = output<ProductFilters>();
  readonly onFiltersSave = output<ProductFilters>();
  readonly onFiltersLoad = output<void>();

  // Inyección de dependencias
  private readonly uiStore = inject(UIStore);

  // Estado local
  private readonly _currentFilters = signal<ProductFilters>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    rating: null,
    inStock: null,
    brands: [],
    sortBy: 'newest',
    searchTerm: '',
    tags: [],
  });

  private readonly _isCompactMode = signal(false);
  private readonly _brandSearchTerm = signal('');
  private readonly _hasChanges = signal(false);

  // Computed signals
  readonly currentFilters = computed(() => this._currentFilters());
  readonly isCompactMode = computed(() => this._isCompactMode());
  readonly brandSearchTerm = computed(() => this._brandSearchTerm());
  readonly hasChanges = computed(() => this._hasChanges());

  readonly hasActiveFilters = computed(() => {
    const filters = this.currentFilters();
    return (
      filters.categories.length > 0 ||
      filters.brands.length > 0 ||
      filters.tags.length > 0 ||
      filters.rating !== null ||
      filters.inStock !== null ||
      filters.searchTerm.length > 0 ||
      this.hasPriceFilter()
    );
  });

  readonly getFilteredBrands = computed(() => {
    const searchTerm = this.brandSearchTerm().toLowerCase();
    if (!searchTerm) return this.filterOptions().brands;

    return this.filterOptions().brands.filter(brand =>
      brand.label.toLowerCase().includes(searchTerm)
    );
  });

  constructor() {
    // Inicializar filtros si se proporcionan
    const initial = this.initialFilters();
    if (initial) {
      this._currentFilters.set({ ...this.currentFilters(), ...initial });
    }
  }

  /**
   * Toggle modo compacto
   */
  toggleCompactMode(): void {
    this._isCompactMode.update(current => !current);
  }

  /**
   * Limpiar todos los filtros
   */
  clearAllFilters(): void {
    const defaultFilters: ProductFilters = {
      categories: [],
      priceRange: this.filterOptions().priceRange,
      rating: null,
      inStock: null,
      brands: [],
      sortBy: 'newest',
      searchTerm: '',
      tags: [],
    };

    this._currentFilters.set(defaultFilters);
    this._hasChanges.set(true);
    this.onFiltersChange.emit(defaultFilters);

    this.uiStore.addNotification({
      title: 'Filtros limpiados',
      message: 'Todos los filtros han sido eliminados',
      type: 'info',
      duration: 2000,
    });
  }

  /**
   * Actualizar término de búsqueda
   */
  updateSearchTerm(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchTerm = input.value;

    this._currentFilters.update(filters => ({
      ...filters,
      searchTerm,
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Limpiar búsqueda
   */
  clearSearch(): void {
    this._currentFilters.update(filters => ({
      ...filters,
      searchTerm: '',
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Actualizar ordenamiento
   */
  updateSortBy(sortBy: ProductFilters['sortBy']): void {
    this._currentFilters.update(filters => ({
      ...filters,
      sortBy,
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Toggle categoría
   */
  toggleCategory(category: string, checked: boolean): void {
    this._currentFilters.update(filters => ({
      ...filters,
      categories: checked
        ? [...filters.categories, category]
        : filters.categories.filter(c => c !== category),
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Remover categoría específica
   */
  removeCategory(category: string): void {
    this.toggleCategory(category, false);
  }

  /**
   * Verificar si categoría está seleccionada
   */
  isCategorySelected(category: string): boolean {
    return this.currentFilters().categories.includes(category);
  }

  /**
   * Obtener número de categorías seleccionadas
   */
  getSelectedCategoriesCount(): number {
    return this.currentFilters().categories.length;
  }

  /**
   * Obtener etiqueta de categoría
   */
  getCategoryLabel(category: string): string {
    const option = this.filterOptions().categories.find(c => c.value === category);
    return option?.label || category;
  }

  /**
   * Actualizar precio mínimo
   */
  updateMinPrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    const min = Number(input.value);
    const currentMax = this.currentFilters().priceRange.max;

    if (min <= currentMax) {
      this.updatePriceRange(min, currentMax);
    }
  }

  /**
   * Actualizar precio máximo
   */
  updateMaxPrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    const max = Number(input.value);
    const currentMin = this.currentFilters().priceRange.min;

    if (max >= currentMin) {
      this.updatePriceRange(currentMin, max);
    }
  }

  /**
   * Actualizar rango de precio
   */
  updatePriceRange(min: number, max: number): void {
    this._currentFilters.update(filters => ({
      ...filters,
      priceRange: { min, max },
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Formatear precio para mostrar
   */
  formatPrice(value: number): string {
    return `$${value}`;
  }

  /**
   * Obtener display del rango de precio
   */
  getPriceRangeDisplay(): string {
    const range = this.currentFilters().priceRange;
    return `$${range.min} - $${range.max}`;
  }

  /**
   * Verificar si hay filtro de precio activo
   */
  hasPriceFilter(): boolean {
    const current = this.currentFilters().priceRange;
    const defaultRange = this.filterOptions().priceRange;

    return current.min !== defaultRange.min || current.max !== defaultRange.max;
  }

  /**
   * Limpiar filtro de precio
   */
  clearPriceFilter(): void {
    const defaultRange = this.filterOptions().priceRange;
    this.updatePriceRange(defaultRange.min, defaultRange.max);
  }

  /**
   * Actualizar rating
   */
  updateRating(rating: number | null): void {
    this._currentFilters.update(filters => ({
      ...filters,
      rating,
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Limpiar filtro de rating
   */
  clearRatingFilter(): void {
    this.updateRating(null);
  }

  /**
   * Obtener array de estrellas para rating
   */
  getStarArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  /**
   * Actualizar stock
   */
  updateStock(inStock: boolean | null): void {
    this._currentFilters.update(filters => ({
      ...filters,
      inStock,
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Limpiar filtro de stock
   */
  clearStockFilter(): void {
    this.updateStock(null);
  }

  /**
   * Obtener descripción de stock
   */
  getStockDescription(): string {
    const stock = this.currentFilters().inStock;
    if (stock === null) return 'Todos';
    return stock ? 'Solo en stock' : 'Solo agotados';
  }

  /**
   * Toggle marca
   */
  toggleBrand(brand: string, checked: boolean): void {
    this._currentFilters.update(filters => ({
      ...filters,
      brands: checked ? [...filters.brands, brand] : filters.brands.filter(b => b !== brand),
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Remover marca específica
   */
  removeBrand(brand: string): void {
    this.toggleBrand(brand, false);
  }

  /**
   * Verificar si marca está seleccionada
   */
  isBrandSelected(brand: string): boolean {
    return this.currentFilters().brands.includes(brand);
  }

  /**
   * Obtener número de marcas seleccionadas
   */
  getSelectedBrandsCount(): number {
    return this.currentFilters().brands.length;
  }

  /**
   * Actualizar búsqueda de marcas
   */
  updateBrandSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._brandSearchTerm.set(input.value);
  }

  /**
   * Toggle etiqueta
   */
  toggleTag(tag: string): void {
    const isSelected = this.isTagSelected(tag);

    this._currentFilters.update(filters => ({
      ...filters,
      tags: isSelected ? filters.tags.filter(t => t !== tag) : [...filters.tags, tag],
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Remover etiqueta específica
   */
  removeTag(tag: string): void {
    this._currentFilters.update(filters => ({
      ...filters,
      tags: filters.tags.filter(t => t !== tag),
    }));

    this._hasChanges.set(true);
    this.onFiltersChange.emit(this.currentFilters());
  }

  /**
   * Verificar si etiqueta está seleccionada
   */
  isTagSelected(tag: string): boolean {
    return this.currentFilters().tags.includes(tag);
  }

  /**
   * Obtener número de etiquetas seleccionadas
   */
  getSelectedTagsCount(): number {
    return this.currentFilters().tags.length;
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    this._hasChanges.set(false);
    this.onFiltersApply.emit(this.currentFilters());

    this.uiStore.addNotification({
      title: 'Filtros aplicados',
      message: 'Los filtros se han aplicado correctamente',
      type: 'success',
      duration: 2000,
    });
  }

  /**
   * Guardar filtros
   */
  saveFilters(): void {
    this.onFiltersSave.emit(this.currentFilters());

    this.uiStore.addNotification({
      title: 'Filtros guardados',
      message: 'La configuración de filtros se ha guardado',
      type: 'success',
      duration: 2000,
    });
  }
}
