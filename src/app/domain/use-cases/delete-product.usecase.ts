/**
 * Caso de uso: Eliminar un producto.
 * Orquesta la lógica para eliminar un producto usando el repositorio.
 */
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IProductRepository } from '../repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class DeleteProductUseCase {
  /**
   * Inyecta el repositorio de productos usando el token de Angular.
   */
  constructor(
    @Inject('IProductRepository') private productRepository: IProductRepository
  ) {}

  execute(id: number): Observable<any> {
    return this.productRepository.deleteProduct(id);
  }
}
