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

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.API_URL);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.API_URL, product);
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/${id}`, product);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
