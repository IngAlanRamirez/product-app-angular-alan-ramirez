import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpHelper } from '../core/http-helper';
import { Product, ProductData } from '../domain/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API_URL = 'https://fakestoreapi.com/products';

  constructor(private http: HttpHelper) {}

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ProductData[]>(this.API_URL)
      .pipe(map(products => products.map(data => Product.fromData(data))));
  }

  getProduct(id: number): Observable<Product> {
    return this.http
      .get<ProductData>(`${this.API_URL}/${id}`)
      .pipe(map(data => Product.fromData(data)));
  }

  addProduct(product: Product): Observable<Product> {
    return this.http
      .post<ProductData>(this.API_URL, product.toData())
      .pipe(map(data => Product.fromData(data)));
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.http
      .put<ProductData>(`${this.API_URL}/${id}`, product.toData())
      .pipe(map(data => Product.fromData(data)));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
