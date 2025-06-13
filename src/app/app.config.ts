import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { PRODUCT_REPOSITORY_TOKEN } from './domain/use-cases/get-products.use-case';
import { ProductHttpRepository } from './infrastructure/repositories/product-http.repository';

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
    // Router con preloading optimizado
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // HTTP Client con interceptors
    provideHttpClient(withInterceptorsFromDi()),

    // Animaciones asíncronas para mejor performance
    provideAnimationsAsync(),

    // Importar módulo de animaciones para compatibilidad
    importProvidersFrom(BrowserAnimationsModule),

    // Configuración de inyección de dependencias
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: ProductHttpRepository,
    },

    // Configuraciones de performance
    // Zone.js optimizations ya están en main.ts
  ],
};
