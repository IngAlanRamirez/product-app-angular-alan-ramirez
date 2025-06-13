/**
 * Caso de uso: Obtener un producto por ID.
 * Orquesta la lógica para recuperar un producto específico desde el repositorio.
 */
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { IProductRepository } from '../repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class GetProductByIdUseCase {
  /**
   * Inyecta el repositorio de productos usando el token de Angular.
   */
  constructor(
    @Inject('IProductRepository') private productRepository: IProductRepository
  ) {}

  execute(id: number): Observable<Product> {
    return this.productRepository.getProduct(id);
  }
}
