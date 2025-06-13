/**
 * Caso de uso: Obtener todos los productos.
 * Orquesta la lógica para recuperar productos desde el repositorio.
 * Los componentes nunca deben saber cómo se obtiene la información, solo usan el caso de uso.
 */
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { IProductRepository } from '../repositories/product.repository';

@Injectable({ providedIn: 'root' })
export class GetProductsUseCase {
  /**
   * Inyecta el repositorio de productos usando el token de Angular.
   * Esto permite desacoplar la lógica de negocio de la infraestructura concreta.
   */
  constructor(
    @Inject('IProductRepository') private productRepository: IProductRepository
  ) {}

  execute(): Observable<Product[]> {
    return this.productRepository.getProducts();
  }
}
