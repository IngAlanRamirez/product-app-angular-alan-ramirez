import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  PreloadAllModules,
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withPreloading,
} from '@angular/router';

import { routes } from './app.routes';
import { ProductRepositoryImpl } from './data/repositories/product.repository.impl';

/**
 * Configuración de la aplicación Angular 19
 *
 * Incluye optimizaciones de performance:
 * - Zone change detection con event coalescing
 * - Preloading de rutas para mejor UX
 * - Animaciones asíncronas para mejor bundle splitting
 * - HTTP client con interceptors modernos
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración de Zone.js optimizada para performance
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),

    // Configuración del router con preloading y navegación bloqueante
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation(),
      withPreloading(PreloadAllModules)
    ),

    // HTTP client con interceptors modernos
    provideHttpClient(withInterceptorsFromDi()),

    // Animaciones asíncronas para mejor code splitting
    provideAnimationsAsync(),

    /**
     * Dependency Injection para Clean Architecture
     *
     * Pattern: Interface Segregation
     * Los casos de uso dependen de interfaces, no de implementaciones concretas.
     * Esto permite intercambiar implementaciones sin afectar la lógica de negocio.
     */
    {
      provide: 'IProductRepository',
      useClass: ProductRepositoryImpl,
    },
  ],
};
