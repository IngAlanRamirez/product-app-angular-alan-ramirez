import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BreadcrumbsComponent, NotificationSystemComponent } from './shared/components';

/**
 * Componente raíz de la aplicación
 *
 * Incluye:
 * - Sistema de notificaciones global
 * - Breadcrumbs de navegación
 * - Router outlet para las páginas
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationSystemComponent, BreadcrumbsComponent],
  template: `
    <div class="app-container">
      <!-- Header con breadcrumbs -->
      <header class="app-header">
        <div class="container">
          <h1 class="app-title">
            <a href="/" class="title-link">🛍️ Product Store</a>
          </h1>
          <app-breadcrumbs />
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="app-main">
        <div class="container">
          <router-outlet />
        </div>
      </main>

      <!-- Footer -->
      <footer class="app-footer">
        <div class="container">
          <p>&copy; 2024 Product Store - Aplicación Angular con Clean Architecture</p>
        </div>
      </footer>

      <!-- Sistema de notificaciones -->
      <app-notification-system />
    </div>
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Product Store';
}
