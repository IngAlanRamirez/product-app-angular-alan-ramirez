import { Signal, WritableSignal } from '@angular/core';

/**
 * Tipos y interfaces para manejo de estado con signals
 * Optimizados para performance y type safety
 */

/**
 * Estado de carga genérico
 */
export interface LoadingState<T = any> {
  isLoading: boolean;
  error: string | null;
  data?: T;
}

/**
 * Estado de paginación
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
  isLoadingMore: boolean;
  hasMore: boolean;
}

/**
 * Estado de formulario genérico
 */
export interface FormState<T = any> {
  data: T;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

/**
 * Estado de filtros de búsqueda
 */
export interface SearchFiltersState {
  searchTerm: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'price' | 'title' | 'category' | null;
  sortOrder: 'asc' | 'desc';
}

/**
 * Estado de selección múltiple
 */
export interface SelectionState<T = any> {
  selectedItems: T[];
  isAllSelected: boolean;
  selectionCount: number;
}

/**
 * Helpers para crear estados iniciales
 */
export const createLoadingState = <T = any>(initialData?: T): LoadingState<T> => ({
  isLoading: false,
  error: null,
  data: initialData,
});

export const createPaginationState = (pageSize: number = 10): PaginationState => ({
  currentPage: 1,
  pageSize,
  totalItems: 0,
  totalPages: 0,
  isLoadingMore: false,
  hasMore: true,
});

export const createFormState = <T = any>(initialData: T): FormState<T> => ({
  data: initialData,
  isValid: false,
  isDirty: false,
  isSubmitting: false,
  errors: {},
});

export const createSearchFiltersState = (): SearchFiltersState => ({
  searchTerm: '',
  category: null,
  minPrice: null,
  maxPrice: null,
  sortBy: null,
  sortOrder: 'asc',
});

export const createSelectionState = <T = any>(): SelectionState<T> => ({
  selectedItems: [],
  isAllSelected: false,
  selectionCount: 0,
});

/**
 * Tipos de utilidad para signals
 */
export type ReadonlySignal<T> = Signal<T>;
export type MutableSignal<T> = WritableSignal<T>;

/**
 * Helper para actualizar estado de carga
 */
export const updateLoadingState = <T>(
  current: LoadingState<T>,
  updates: Partial<LoadingState<T>>
): LoadingState<T> => ({
  ...current,
  ...updates,
});

/**
 * Helper para actualizar estado de paginación
 */
export const updatePaginationState = (
  current: PaginationState,
  updates: Partial<PaginationState>
): PaginationState => ({
  ...current,
  ...updates,
  totalPages:
    updates.totalItems && updates.pageSize
      ? Math.ceil(updates.totalItems / updates.pageSize)
      : current.totalPages,
});

/**
 * Helper para actualizar estado de formulario
 */
export const updateFormState = <T>(
  current: FormState<T>,
  updates: Partial<FormState<T>>
): FormState<T> => ({
  ...current,
  ...updates,
});

/**
 * Helper para resetear estado de carga
 */
export const resetLoadingState = <T>(data?: T): LoadingState<T> => ({
  isLoading: false,
  error: null,
  data,
});

/**
 * Helper para resetear estado de paginación
 */
export const resetPaginationState = (pageSize: number = 10): PaginationState => ({
  currentPage: 1,
  pageSize,
  totalItems: 0,
  totalPages: 0,
  isLoadingMore: false,
  hasMore: true,
});
