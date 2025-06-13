import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';

import { Product } from '../../domain/models/product.model';
import {
  ProductRepositoryInterface,
  ProductSearchFilters,
  ProductSearchResult,
} from '../../domain/repositories/product.repository.interface';
import { ProductApiDto } from '../dtos/product.dto';
import { ProductMapper } from '../mappers/product.mapper';

/**
 * Implementación HTTP del repositorio de productos
 *
 * Conecta con la Fake Store API y transforma los datos usando mappers
 */
@Injectable({
  providedIn: 'root',
})
export class ProductHttpRepository implements ProductRepositoryInterface {
  private readonly API_BASE_URL = 'https://fakestoreapi.com';
  private readonly ENDPOINTS = {
    products: `${this.API_BASE_URL}/products`,
    categories: `${this.API_BASE_URL}/products/categories`,
  };

  // Caché simple para optimizar requests
  private cache = new Map<
    string,
    {
      data: any;
      timestamp: number;
      ttl: number;
    }
  >();

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene todos los productos
   */
  getAll(): Observable<Product[]> {
    const cacheKey = 'products_all';
    const cached = this.getFromCache<ProductApiDto[]>(cacheKey);

    if (cached) {
      return cached.pipe(map(dtos => ProductMapper.safeFromApiDtoList(dtos)));
    }

    return this.http.get<ProductApiDto[]>(this.ENDPOINTS.products).pipe(
      tap(dtos => this.setCache(cacheKey, dtos, 300000)), // 5 minutos
      map(dtos => ProductMapper.safeFromApiDtoList(dtos)),
      catchError(error => this.handleError('getAll', error)),
      shareReplay(1)
    );
  }

  /**
   * Obtiene un producto por ID
   */
  getById(id: number): Observable<Product | null> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error(`ID inválido: ${id}`));
    }

    const cacheKey = `product_${id}`;
    const cached = this.getFromCache<ProductApiDto>(cacheKey);

    if (cached) {
      return cached.pipe(map(dto => (dto ? ProductMapper.safeFromApiDto(dto) : null)));
    }

    return this.http.get<ProductApiDto>(`${this.ENDPOINTS.products}/${id}`).pipe(
      tap(dto => this.setCache(cacheKey, dto, 600000)), // 10 minutos
      map(dto => ProductMapper.safeFromApiDto(dto)),
      catchError(error => {
        if (error.status === 404) {
          return of(null);
        }
        return this.handleError('getById', error);
      })
    );
  }

  /**
   * Obtiene productos por categoría
   */
  getByCategory(category: string): Observable<Product[]> {
    if (!category?.trim()) {
      return this.getAll();
    }

    const normalizedCategory = category.toLowerCase().trim();
    const cacheKey = `products_category_${normalizedCategory}`;
    const cached = this.getFromCache<ProductApiDto[]>(cacheKey);

    if (cached) {
      return cached.pipe(map(dtos => ProductMapper.safeFromApiDtoList(dtos)));
    }

    return this.http
      .get<ProductApiDto[]>(`${this.ENDPOINTS.products}/category/${normalizedCategory}`)
      .pipe(
        tap(dtos => this.setCache(cacheKey, dtos, 300000)),
        map(dtos => ProductMapper.safeFromApiDtoList(dtos)),
        catchError(error => this.handleError('getByCategory', error))
      );
  }

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
  }> {
    const params = {
      limit: Math.max(1, Math.min(limit, 20)), // Límite entre 1 y 20
      skip: Math.max(0, offset),
    };

    return this.http.get<ProductApiDto[]>(this.ENDPOINTS.products, { params }).pipe(
      map(dtos => {
        const products = ProductMapper.safeFromApiDtoList(dtos);
        return {
          products,
          total: products.length, // La API no devuelve total real
          hasMore: products.length === params.limit,
        };
      }),
      catchError(error => this.handleError('getWithPagination', error))
    );
  }

  /**
   * Busca productos por término
   */
  search(searchTerm: string): Observable<Product[]> {
    if (!searchTerm?.trim()) {
      return of([]);
    }

    // La Fake Store API no tiene búsqueda, simulamos filtrando todos los productos
    return this.getAll().pipe(
      map(products => this.filterProductsBySearchTerm(products, searchTerm.trim()))
    );
  }

  /**
   * Filtra productos por rango de precio
   */
  filterByPriceRange(minPrice: number, maxPrice: number): Observable<Product[]> {
    return this.getAll().pipe(
      map(products =>
        products.filter(product => product.price >= minPrice && product.price <= maxPrice)
      )
    );
  }

  /**
   * Crea un nuevo producto
   */
  create(product: Product): Observable<Product> {
    const createDto = ProductMapper.toCreateDto(product);

    return this.http.post<ProductApiDto>(this.ENDPOINTS.products, createDto).pipe(
      map(dto => ProductMapper.fromApiDto(dto)),
      tap(() => this.invalidateCache()),
      catchError(error => this.handleError('create', error))
    );
  }

  /**
   * Actualiza un producto
   */
  update(id: number, product: Product): Observable<Product> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error(`ID inválido: ${id}`));
    }

    const updateDto = ProductMapper.toUpdateDto(product);

    return this.http.put<ProductApiDto>(`${this.ENDPOINTS.products}/${id}`, updateDto).pipe(
      map(dto => ProductMapper.fromApiDto(dto)),
      tap(() => this.invalidateProductCache(id)),
      catchError(error => this.handleError('update', error))
    );
  }

  /**
   * Elimina un producto
   */
  delete(id: number): Observable<boolean> {
    if (!this.isValidId(id)) {
      return throwError(() => new Error(`ID inválido: ${id}`));
    }

    return this.http.delete(`${this.ENDPOINTS.products}/${id}`).pipe(
      map(() => true),
      tap(() => this.invalidateProductCache(id)),
      catchError(error => {
        if (error.status === 404) {
          return of(false);
        }
        return this.handleError('delete', error);
      })
    );
  }

  /**
   * Obtiene todas las categorías
   */
  getCategories(): Observable<string[]> {
    const cacheKey = 'categories';
    const cached = this.getFromCache<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    return this.http.get<string[]>(this.ENDPOINTS.categories).pipe(
      tap(categories => this.setCache(cacheKey, categories, 3600000)), // 1 hora
      catchError(error => this.handleError('getCategories', error)),
      shareReplay(1)
    );
  }

  /**
   * Cuenta el total de productos
   */
  count(): Observable<number> {
    return this.getAll().pipe(map(products => products.length));
  }

  /**
   * Verifica si existe un producto
   */
  exists(id: number): Observable<boolean> {
    return this.getById(id).pipe(
      map(product => product !== null),
      catchError(() => of(false))
    );
  }

  /**
   * Obtiene productos ordenados por precio
   */
  getOrderedByPrice(ascending: boolean = true): Observable<Product[]> {
    return this.getAll().pipe(
      map(products => products.sort((a, b) => (ascending ? a.price - b.price : b.price - a.price)))
    );
  }

  /**
   * Obtiene los productos más caros
   */
  getMostExpensive(limit: number = 5): Observable<Product[]> {
    return this.getOrderedByPrice(false).pipe(map(products => products.slice(0, limit)));
  }

  /**
   * Obtiene los productos más baratos
   */
  getCheapest(limit: number = 5): Observable<Product[]> {
    return this.getOrderedByPrice(true).pipe(map(products => products.slice(0, limit)));
  }

  /**
   * Búsqueda avanzada con filtros
   */
  searchWithFilters(filters: ProductSearchFilters): Observable<ProductSearchResult> {
    return this.getAll().pipe(
      map(products => {
        let filteredProducts = [...products];

        // Aplicar filtros
        if (filters.searchTerm) {
          filteredProducts = this.filterProductsBySearchTerm(filteredProducts, filters.searchTerm);
        }

        if (filters.category) {
          filteredProducts = filteredProducts.filter(p => p.isInCategory(filters.category!));
        }

        if (filters.minPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
        }

        if (filters.maxPrice !== undefined) {
          filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
        }

        // Ordenar
        if (filters.sortBy) {
          filteredProducts = this.sortProducts(filteredProducts, filters.sortBy, filters.sortOrder);
        }

        // Paginación
        const limit = filters.limit || 10;
        const offset = filters.offset || 0;
        const total = filteredProducts.length;
        const paginatedProducts = filteredProducts.slice(offset, offset + limit);

        return {
          products: paginatedProducts,
          total,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasMore: offset + limit < total,
          filters,
        };
      })
    );
  }

  /**
   * Filtra productos por término de búsqueda
   */
  private filterProductsBySearchTerm(products: Product[], searchTerm: string): Product[] {
    const term = searchTerm.toLowerCase();
    return products.filter(
      product =>
        product.title.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term))
    );
  }

  /**
   * Ordena productos según criterio
   */
  private sortProducts(
    products: Product[],
    sortBy: 'price' | 'title' | 'category',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Product[] {
    return products.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Valida que el ID sea válido
   */
  private isValidId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
  }

  /**
   * Manejo de errores
   */
  private handleError(operation: string, error: HttpErrorResponse): Observable<never> {
    console.error(`ProductHttpRepository.${operation} falló:`, error);

    let errorMessage = `Error en ${operation}`;

    if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error.status >= 500) {
      errorMessage = 'Error del servidor. Intenta más tarde.';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado.';
    }

    return throwError(() => ({
      message: errorMessage,
      operation,
      originalError: error,
    }));
  }

  /**
   * Obtiene datos del caché
   */
  private getFromCache<T>(key: string): Observable<T> | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return of(cached.data);
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Guarda datos en caché
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalida caché de un producto específico
   */
  private invalidateProductCache(id: number): void {
    this.cache.delete(`product_${id}`);
    this.cache.delete('products_all');
  }

  /**
   * Invalida todo el caché
   */
  private invalidateCache(): void {
    this.cache.clear();
  }
}
