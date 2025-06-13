/**
 * Caso de uso: Actualizar un producto.
 * Orquesta la lógica para actualizar un producto usando el repositorio.
 */
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { IProductRepository } from '../repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class UpdateProductUseCase {
  /**
   * Inyecta el repositorio de productos usando el token de Angular.
   */
  constructor(
    @Inject('IProductRepository') private productRepository: IProductRepository
  ) {}

  execute(id: number, product: Product): Observable<Product> {
    return this.productRepository.updateProduct(id, product);
  }
}
