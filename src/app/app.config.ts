import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideHttpClient } from '@angular/common/http';

import { ProductRepositoryImpl } from './data/repositories/product.repository.impl';
import { IProductRepository } from './domain/repositories/product.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    /**
     * Provider para Clean Architecture:
     * Cuando se solicite 'IProductRepository', Angular inyectará ProductRepositoryImpl.
     * Así los casos de uso reciben la implementación concreta desacoplada.
     */
    /**
     * Provider para Clean Architecture:
     * Cuando se solicite 'IProductRepository' (string), Angular inyectará ProductRepositoryImpl.
     * Así los casos de uso reciben la implementación concreta desacoplada.
     */
    { provide: 'IProductRepository', useClass: ProductRepositoryImpl },
  ],
};
