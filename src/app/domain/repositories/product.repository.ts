/**
 * Interfaz de repositorio para productos.
 * Define las operaciones que cualquier fuente de datos de productos debe implementar.
 * Esto permite desacoplar la lógica de negocio de la infraestructura concreta (API, base de datos, etc).
 */
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface IProductRepository {
  getProducts(): Observable<Product[]>;
  getProduct(id: number): Observable<Product>;
  addProduct(product: Product): Observable<Product>;
  updateProduct(id: number, product: Product): Observable<Product>;
  deleteProduct(id: number): Observable<any>;
}
