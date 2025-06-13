import { Signal, WritableSignal, computed } from '@angular/core';

/**
 * Tipos para mejorar el trabajo con Signals
 */

/**
 * Estado de carga genérico para operaciones asíncronas
 */
export interface LoadingState<T = unknown> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Signal de estado de carga
 */
export type LoadingSignal<T> = WritableSignal<LoadingState<T>>;

/**
 * Estado base para formularios reactivos
 */
export interface FormState<T = unknown> {
  value: T;
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  errors: Record<string, string> | null;
}

/**
 * Signal de estado de formulario
 */
export type FormSignal<T> = WritableSignal<FormState<T>>;

/**
 * Estado de paginación
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Signal de paginación
 */
export type PaginationSignal = WritableSignal<PaginationState>;

/**
 * Helper para crear un signal de loading state
 */
export function createLoadingSignal<T>(initialData: T | null = null): LoadingSignal<T> {
  return signal<LoadingState<T>>({
    loading: false,
    data: initialData,
    error: null,
  });
}

/**
 * Helper para crear un signal de form state
 */
export function createFormSignal<T>(initialValue: T): FormSignal<T> {
  return signal<FormState<T>>({
    value: initialValue,
    valid: false,
    dirty: false,
    touched: false,
    errors: null,
  });
}

/**
 * Helper para crear un signal de paginación
 */
export function createPaginationSignal(pageSize: number = 10): PaginationSignal {
  return signal<PaginationState>({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
  });
}

/**
 * Helper para crear computed que deriva loading state
 */
export function deriveLoadingState<T, R>(
  source: Signal<LoadingState<T>>,
  transform: (data: T) => R
) {
  return computed(() => {
    const state = source();
    if (!state.data) return null;
    return transform(state.data);
  });
}
