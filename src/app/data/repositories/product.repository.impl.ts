/**
 * Implementación concreta del repositorio de productos usando una API REST.
 * Esta clase implementa la interfaz de dominio IProductRepository.
 * Toda la lógica de acceso a datos debe estar aquí, nunca en los componentes.
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHelper } from '../../core/http-helper';
import { Product } from '../../domain/models/product.model';
import { IProductRepository } from '../../domain/repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class ProductRepositoryImpl implements IProductRepository {
  private readonly API_URL = 'https://fakestoreapi.com/products';

  constructor(private http: HttpHelper) {}

  /**
   * Obtiene todos los productos. Puedes pasar parámetros o headers opcionales.
   */
  getProducts(params?: any, headers?: any): Observable<Product[]> {
    return this.http.get<Product[]>(this.API_URL, params, headers);
  }

  /**
   * Obtiene un producto por ID. Puedes pasar headers opcionales.
   */
  getProduct(id: number, headers?: any): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`, undefined, headers);
  }

  /**
   * Agrega un producto. Puedes pasar headers opcionales.
   */
  addProduct(product: Product, headers?: any): Observable<Product> {
    return this.http.post<Product>(this.API_URL, product, headers);
  }

  /**
   * Actualiza un producto. Puedes pasar headers opcionales.
   */
  updateProduct(
    id: number,
    product: Product,
    headers?: any
  ): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/${id}`, product, headers);
  }

  /**
   * Elimina un producto. Puedes pasar headers opcionales.
   */
  deleteProduct(id: number, headers?: any): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, headers);
  }
}
