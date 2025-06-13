import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

/**
 * Interface del repositorio de productos para la capa de dominio
 *
 * Define los contratos de acceso a datos sin especificar la implementación.
 * La implementación concreta estará en la capa de infraestructura.
 */
export interface ProductRepositoryInterface {
  /**
   * Obtiene todos los productos
   */
  getAll(): Observable<Product[]>;

  /**
   * Obtiene un producto por su ID
   */
  getById(id: number): Observable<Product | null>;

  /**
   * Obtiene productos por categoría
   */
  getByCategory(category: string): Observable<Product[]>;

  /**
   * Obtiene productos con paginación
   */
  getWithPagination(
    limit: number,
    offset: number
  ): Observable<{
    products: Product[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Busca productos por término de búsqueda
   */
  search(searchTerm: string): Observable<Product[]>;

  /**
   * Filtra productos por precio
   */
  filterByPriceRange(minPrice: number, maxPrice: number): Observable<Product[]>;

  /**
   * Crea un nuevo producto
   */
  create(product: Product): Observable<Product>;

  /**
   * Actualiza un producto existente
   */
  update(id: number, product: Product): Observable<Product>;

  /**
   * Elimina un producto
   */
  delete(id: number): Observable<boolean>;

  /**
   * Obtiene todas las categorías disponibles
   */
  getCategories(): Observable<string[]>;

  /**
   * Cuenta el total de productos
   */
  count(): Observable<number>;

  /**
   * Verifica si existe un producto con el ID especificado
   */
  exists(id: number): Observable<boolean>;

  /**
   * Obtiene productos ordenados por precio
   */
  getOrderedByPrice(ascending: boolean): Observable<Product[]>;

  /**
   * Obtiene los productos más caros
   */
  getMostExpensive(limit: number): Observable<Product[]>;

  /**
   * Obtiene los productos más baratos
   */
  getCheapest(limit: number): Observable<Product[]>;

  /**
   * Busca productos con filtros avanzados
   */
  searchWithFilters(filters: ProductSearchFilters): Observable<ProductSearchResult>;
}

/**
 * Filtros para búsqueda avanzada de productos
 */
export interface ProductSearchFilters {
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'title' | 'category';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Resultado de búsqueda con metadata
 */
export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  filters: ProductSearchFilters;
}
