import { Inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductRepositoryInterface } from '../repositories/product.repository.interface';
import { PRODUCT_REPOSITORY_TOKEN } from './get-products.use-case';

/**
 * Caso de uso para obtener un producto por ID
 *
 * Incluye validaciones, caché y manejo de errores específicos
 */
@Injectable({
  providedIn: 'root',
})
export class GetProductByIdUseCase {
  private readonly CACHE_KEY_PREFIX = 'product_';
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private productCache = new Map<
    number,
    {
      product$: Observable<Product | null>;
      timestamp: number;
    }
  >();

  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepositoryInterface
  ) {}

  /**
   * Ejecuta el caso de uso: obtener producto por ID
   */
  execute(id: number): Observable<Product | null> {
    // Validar ID
    if (!this.isValidId(id)) {
      return throwError(() => new Error(`ID de producto inválido: ${id}`));
    }

    // Verificar caché
    const cached = this.getCachedProduct(id);
    if (cached) {
      return cached;
    }

    // Crear nueva consulta con caché
    const product$ = this.productRepository.getById(id).pipe(
      map(product => {
        if (product) {
          this.validateProduct(product);
        }
        return product;
      }),
      tap(product => {
        this.saveToLocalStorage(id, product);
      }),
      catchError(error => {
        console.error(`Error obteniendo producto ${id}:`, error);
        return this.getFromLocalStorage(id);
      }),
      shareReplay(1)
    );

    // Guardar en caché
    this.productCache.set(id, {
      product$,
      timestamp: Date.now(),
    });

    return product$;
  }

  /**
   * Obtiene producto con validación obligatoria (lanza error si no existe)
   */
  executeRequired(id: number): Observable<Product> {
    return this.execute(id).pipe(
      map(product => {
        if (!product) {
          throw new Error(`Producto con ID ${id} no encontrado`);
        }
        return product;
      })
    );
  }

  /**
   * Obtiene producto con reintentos automáticos
   */
  executeWithRetry(id: number, maxRetries: number = 3): Observable<Product | null> {
    return this.execute(id).pipe(
      catchError(error => {
        if (maxRetries > 0) {
          console.warn(
            `Reintentando obtener producto ${id}. Intentos restantes: ${maxRetries - 1}`
          );
          return this.executeWithRetry(id, maxRetries - 1);
        }
        throw error;
      })
    );
  }

  /**
   * Obtiene producto con datos enriquecidos
   */
  executeEnriched(id: number): Observable<EnrichedProduct | null> {
    return this.execute(id).pipe(
      map(product => {
        if (!product) {
          return null;
        }

        return {
          product,
          metadata: {
            slug: product.getSlug(),
            isExpensive: product.isExpensive(),
            truncatedTitle: product.getTruncatedTitle(),
            formattedPrice: product.priceVO.format(),
            hasDiscount: false, // TODO: implementar lógica de descuentos
            retrievedAt: new Date(),
            cacheHit: this.isCacheHit(id),
          },
        };
      })
    );
  }

  /**
   * Verifica si existe un producto con el ID especificado
   */
  exists(id: number): Observable<boolean> {
    if (!this.isValidId(id)) {
      return of(false);
    }

    return this.productRepository.exists(id).pipe(
      catchError(error => {
        console.error(`Error verificando existencia del producto ${id}:`, error);
        return of(false);
      })
    );
  }

  /**
   * Valida que el ID sea válido
   */
  private isValidId(id: number): boolean {
    return Number.isInteger(id) && id > 0;
  }

  /**
   * Valida que el producto tenga los datos mínimos requeridos
   */
  private validateProduct(product: Product): void {
    if (!product.title || product.title.trim().length === 0) {
      console.warn(`Producto ${product.id} tiene título vacío`);
    }

    if (!product.image || !this.isValidUrl(product.image)) {
      console.warn(`Producto ${product.id} tiene imagen inválida: ${product.image}`);
    }

    if (product.price <= 0) {
      console.warn(`Producto ${product.id} tiene precio inválido: ${product.price}`);
    }
  }

  /**
   * Verifica si una URL es válida
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene producto desde caché si es válido
   */
  private getCachedProduct(id: number): Observable<Product | null> | null {
    const cached = this.productCache.get(id);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.product$;
    }

    return null;
  }

  /**
   * Verifica si el caché es válido
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Verifica si el resultado viene del caché
   */
  private isCacheHit(id: number): boolean {
    const cached = this.productCache.get(id);
    return cached ? this.isCacheValid(cached.timestamp) : false;
  }

  /**
   * Guarda producto en localStorage
   */
  private saveToLocalStorage(id: number, product: Product | null): void {
    try {
      const key = `${this.CACHE_KEY_PREFIX}${id}`;
      const data = {
        product: product?.toData() || null,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`Error guardando producto ${id} en localStorage:`, error);
    }
  }

  /**
   * Recupera producto desde localStorage
   */
  private getFromLocalStorage(id: number): Observable<Product | null> {
    try {
      const key = `${this.CACHE_KEY_PREFIX}${id}`;
      const cached = localStorage.getItem(key);

      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = Date.now() - data.timestamp;

        // Solo usar caché local si es reciente (1 hora)
        if (cacheAge < 60 * 60 * 1000 && data.product) {
          return of(Product.fromData(data.product));
        }
      }
    } catch (error) {
      console.warn(`Error recuperando producto ${id} desde localStorage:`, error);
    }

    return of(null);
  }

  /**
   * Invalida el caché de un producto específico
   */
  invalidateCache(id: number): void {
    this.productCache.delete(id);

    try {
      const key = `${this.CACHE_KEY_PREFIX}${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error limpiando caché del producto ${id}:`, error);
    }
  }

  /**
   * Invalida todo el caché de productos
   */
  invalidateAllCache(): void {
    this.productCache.clear();

    try {
      // Limpiar localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Error limpiando caché de localStorage:', error);
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats(): {
    totalCached: number;
    cacheHits: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.productCache.values());

    return {
      totalCached: entries.length,
      cacheHits: entries.filter(entry => this.isCacheValid(entry.timestamp)).length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => now - e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => now - e.timestamp)) : 0,
    };
  }
}

/**
 * Interface para producto enriquecido con metadata
 */
export interface EnrichedProduct {
  product: Product;
  metadata: {
    slug: string;
    isExpensive: boolean;
    truncatedTitle: string;
    formattedPrice: string;
    hasDiscount: boolean;
    retrievedAt: Date;
    cacheHit: boolean;
  };
}
