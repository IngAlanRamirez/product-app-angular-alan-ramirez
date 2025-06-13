/**
 * Barrel exports para stores globales
 * Sistema de gestión de estado usando Angular Signals
 */

// Stores
export { ProductsStore } from './products.store';
export { UIStore } from './ui.store';

// Interfaces de estado
export type { ProductsState } from './products.store';

export type { Breadcrumb, Notification, NotificationAction, UIState } from './ui.store';

// Re-exports de tipos relacionados
export type { LoadingState, PaginationState, SearchFiltersState } from '../utils/signal.types';
