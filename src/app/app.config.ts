import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { productsReducer } from './store/products.reducer';
import { notificationsReducer } from './store/notifications.reducer';
import { provideEffects } from '@ngrx/effects';
import { ProductsEffects } from './store/products.effects';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore({
      products: productsReducer,
      notifications: notificationsReducer
    }),
    provideEffects([ProductsEffects]),
    provideHttpClient(),
  ],
};
