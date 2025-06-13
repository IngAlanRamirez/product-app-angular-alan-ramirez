import { Inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../app.config';
import { Product } from '../models/product.model';
import { ProductRepositoryInterface } from '../repositories/product.repository.interface';

/**
 * Caso de uso para obtener productos
 *
 * Encapsula la lógica de negocio para obtener productos con
 * optimizaciones de caché y manejo de errores
 */
@Injectable({
  providedIn: 'root',
})
export class GetProductsUseCase {
  private readonly CACHE_KEY = 'products_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private cachedProducts$?: Observable<Product[]>;
  private lastCacheTime = 0;

  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: ProductRepositoryInterface
  ) {}

  /**
   * Ejecuta el caso de uso principal: obtener todos los productos
   */
  execute(): Observable<Product[]> {
    // Verificar si el caché es válido
    if (this.isCacheValid()) {
      return this.cachedProducts$!;
    }

    // Crear nueva consulta con caché
    this.cachedProducts$ = this.productRepository.getAll().pipe(
      map(products => this.sortProductsByRelevance(products)),
      tap(products => {
        this.lastCacheTime = Date.now();
        this.saveToLocalStorage(products);
      }),
      catchError(error => {
        console.error('Error obteniendo productos:', error);
        return this.getFromLocalStorage();
      }),
      shareReplay(1) // Compartir resultado entre suscriptores
    );

    return this.cachedProducts$;
  }

  /**
   * Obtiene productos con caché invalidado (fuerza recarga)
   */
  executeWithRefresh(): Observable<Product[]> {
    this.invalidateCache();
    return this.execute();
  }

  /**
   * Obtiene productos filtrados por categoría
   */
  executeByCategory(category: string): Observable<Product[]> {
    if (!category.trim()) {
      return this.execute();
    }

    return this.productRepository.getByCategory(category).pipe(
      map(products => this.sortProductsByRelevance(products)),
      catchError(error => {
        console.error(`Error obteniendo productos de categoría ${category}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene productos con paginación optimizada
   */
  executeWithPagination(
    page: number,
    pageSize: number = 10
  ): Observable<{
    products: Product[];
    total: number;
    hasMore: boolean;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * pageSize;

    return this.productRepository.getWithPagination(pageSize, offset).pipe(
      map(result => ({
        products: this.sortProductsByRelevance(result.products),
        total: result.total,
        hasMore: result.hasMore,
        page,
        totalPages: Math.ceil(result.total / pageSize),
      })),
      catchError(error => {
        console.error('Error obteniendo productos paginados:', error);
        return of({
          products: [],
          total: 0,
          hasMore: false,
          page,
          totalPages: 0,
        });
      })
    );
  }

  /**
   * Ordena productos por relevancia (lógica de negocio)
   */
  private sortProductsByRelevance(products: Product[]): Product[] {
    return products.sort((a, b) => {
      // Prioridad 1: Productos con imágenes válidas
      const aHasImage = this.hasValidImage(a);
      const bHasImage = this.hasValidImage(b);

      if (aHasImage !== bHasImage) {
        return bHasImage ? 1 : -1;
      }

      // Prioridad 2: Productos con descripción
      const aHasDescription = !!a.description;
      const bHasDescription = !!b.description;

      if (aHasDescription !== bHasDescription) {
        return bHasDescription ? 1 : -1;
      }

      // Prioridad 3: Precio (productos de precio medio primero)
      const aPriceScore = this.calculatePriceScore(a.price);
      const bPriceScore = this.calculatePriceScore(b.price);

      if (aPriceScore !== bPriceScore) {
        return bPriceScore - aPriceScore;
      }

      // Prioridad 4: Alfabético por título
      return a.title.localeCompare(b.title);
    });
  }

  /**
   * Verifica si un producto tiene una imagen válida
   */
  private hasValidImage(product: Product): boolean {
    try {
      new URL(product.image);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calcula un score de precio (productos de precio medio tienen mayor score)
   */
  private calculatePriceScore(price: number): number {
    // Rango óptimo: $20-$100
    if (price >= 20 && price <= 100) {
      return 3;
    }
    // Rango aceptable: $10-$200
    if (price >= 10 && price <= 200) {
      return 2;
    }
    // Muy barato o muy caro
    return 1;
  }

  /**
   * Verifica si el caché es válido
   */
  private isCacheValid(): boolean {
    return !!this.cachedProducts$ && Date.now() - this.lastCacheTime < this.CACHE_DURATION;
  }

  /**
   * Invalida el caché
   */
  private invalidateCache(): void {
    this.cachedProducts$ = undefined;
    this.lastCacheTime = 0;
    this.clearLocalStorage();
  }

  /**
   * Guarda productos en localStorage como respaldo
   */
  private saveToLocalStorage(products: Product[]): void {
    try {
      const data = {
        products: products.map(p => p.toData()),
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error guardando productos en localStorage:', error);
    }
  }

  /**
   * Recupera productos desde localStorage como fallback
   */
  private getFromLocalStorage(): Observable<Product[]> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheAge = Date.now() - data.timestamp;

        // Solo usar caché local si es reciente (1 hora)
        if (cacheAge < 60 * 60 * 1000) {
          const products = data.products.map((productData: any) => Product.fromData(productData));
          return of(products);
        }
      }
    } catch (error) {
      console.warn('Error recuperando productos desde localStorage:', error);
    }

    return of([]);
  }

  /**
   * Limpia el caché de localStorage
   */
  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Error limpiando localStorage:', error);
    }
  }

  /**
   * Obtiene estadísticas de uso del caché
   */
  getCacheStats(): {
    isCached: boolean;
    age: number;
    validUntil: number;
  } {
    return {
      isCached: !!this.cachedProducts$,
      age: Date.now() - this.lastCacheTime,
      validUntil: this.lastCacheTime + this.CACHE_DURATION,
    };
  }
}
