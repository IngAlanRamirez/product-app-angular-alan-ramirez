/**
 * Barrel exports para containers de productos
 * Componentes inteligentes que manejan estado y lógica de negocio
 */

// Container Components
export { ProductDetailContainerComponent } from './product-detail-container/product-detail-container.component';
export { ProductListContainerComponent } from './product-list-container/product-list-container.component';

// Re-exports de tipos relacionados
export type { LoadingState, PaginationState } from '../../../shared/utils/signal.types';
