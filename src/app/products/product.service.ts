import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpHelper } from '../core/http-helper';

export interface Product {
  id?: number;
  title: string;
  price: number;
  category: string;
  image: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
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
