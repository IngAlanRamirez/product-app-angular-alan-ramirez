/**
 * DTOs para la capa de infraestructura
 *
 * Estos DTOs representan la estructura de datos tal como viene de la API externa
 * y se mapean al modelo de dominio para mantener la separación de capas
 */

/**
 * DTO para los datos del producto tal como vienen de la Fake Store API
 */
export interface ProductApiDto {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

/**
 * DTO para crear un producto (request hacia la API)
 */
export interface CreateProductDto {
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

/**
 * DTO para actualizar un producto (request hacia la API)
 */
export interface UpdateProductDto {
  id: number;
  title?: string;
  price?: number;
  description?: string;
  image?: string;
  category?: string;
}

/**
 * DTO para la respuesta de paginación de productos
 */
export interface ProductListApiResponse {
  products: ProductApiDto[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * DTO para filtros de búsqueda de productos
 */
export interface ProductSearchFiltersDto {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
  sortBy?: 'price' | 'title' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

/**
 * DTO para parámetros de consulta de productos
 */
export interface ProductQueryParamsDto {
  limit?: number;
  skip?: number;
  filters?: ProductSearchFiltersDto;
}

/**
 * DTO simplificado para listas de productos (para optimización)
 */
export interface ProductListItemDto {
  id: number;
  title: string;
  price: number;
  category: string;
  image: string;
}

/**
 * DTO para estadísticas de productos
 */
export interface ProductStatsDto {
  totalProducts: number;
  averagePrice: number;
  categoriesCount: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
  };
}
