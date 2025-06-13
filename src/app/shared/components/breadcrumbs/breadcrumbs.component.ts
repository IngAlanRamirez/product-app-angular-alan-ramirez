import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Breadcrumb, UIStore } from '../../store/ui.store';

/**
 * Componente de breadcrumbs (migas de pan)
 *
 * Características:
 * - Conectado al UIStore
 * - Navegación automática
 * - Responsive design
 * - Accesibilidad completa
 * - Separadores personalizables
 */
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="breadcrumbs-nav" aria-label="Navegación de migas de pan" *ngIf="hasBreadcrumbs()">
      <ol class="breadcrumbs-list">
        <li
          *ngFor="let breadcrumb of breadcrumbs(); let last = last; trackBy: trackByBreadcrumb"
          class="breadcrumb-item"
          [class.active]="breadcrumb.active || last"
        >
          <!-- Enlace navegable -->
          <a
            *ngIf="breadcrumb.url && !breadcrumb.active && !last"
            [href]="breadcrumb.url"
            class="breadcrumb-link"
            (click)="onBreadcrumbClick(breadcrumb, $event)"
            [attr.aria-current]="breadcrumb.active ? 'page' : null"
          >
            {{ breadcrumb.label }}
          </a>

          <!-- Elemento actual (no navegable) -->
          <span
            *ngIf="!breadcrumb.url || breadcrumb.active || last"
            class="breadcrumb-current"
            [attr.aria-current]="breadcrumb.active || last ? 'page' : null"
          >
            {{ breadcrumb.label }}
          </span>

          <!-- Separador -->
          <span class="breadcrumb-separator" *ngIf="!last" aria-hidden="true">
            {{ separator }}
          </span>
        </li>
      </ol>

      <!-- Botón para limpiar breadcrumbs -->
      <button
        type="button"
        class="breadcrumbs-clear"
        (click)="clearBreadcrumbs()"
        aria-label="Limpiar navegación"
        *ngIf="breadcrumbs().length > 1"
      >
        ✕
      </button>
    </nav>
  `,
  styleUrls: ['./breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  // Inyección de dependencias
  private readonly uiStore = inject(UIStore);
  private readonly router = inject(Router);

  // Selectores del store
  readonly breadcrumbs = this.uiStore.breadcrumbs;
  readonly currentBreadcrumb = this.uiStore.currentBreadcrumb;

  // Configuración
  readonly separator = '>';

  // Computed signals
  readonly hasBreadcrumbs = computed(() => this.breadcrumbs().length > 0);

  readonly breadcrumbsWithHome = computed(() => {
    const breadcrumbs = this.breadcrumbs();

    // Asegurar que siempre tengamos "Inicio" como primer elemento
    if (breadcrumbs.length === 0) {
      return [];
    }

    const firstBreadcrumb = breadcrumbs[0];
    if (firstBreadcrumb.label !== 'Inicio') {
      return [{ label: 'Inicio', url: '/', active: false }, ...breadcrumbs];
    }

    return breadcrumbs;
  });

  /**
   * TrackBy function para optimizar el rendering
   */
  trackByBreadcrumb(index: number, breadcrumb: Breadcrumb): string {
    return `${breadcrumb.label}-${breadcrumb.url || index}`;
  }

  /**
   * Maneja el click en un breadcrumb
   */
  onBreadcrumbClick(breadcrumb: Breadcrumb, event: Event): void {
    event.preventDefault();

    if (breadcrumb.url) {
      // Navegar a la URL
      this.router.navigate([breadcrumb.url]);

      // Actualizar breadcrumbs para marcar como activo
      this.updateBreadcrumbsToActive(breadcrumb);
    }
  }

  /**
   * Limpia todos los breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.uiStore.clearBreadcrumbs();

    // Navegar al inicio
    this.router.navigate(['/']);
  }

  /**
   * Actualiza los breadcrumbs para marcar uno como activo
   */
  private updateBreadcrumbsToActive(targetBreadcrumb: Breadcrumb): void {
    const currentBreadcrumbs = this.breadcrumbs();
    const targetIndex = currentBreadcrumbs.findIndex(
      b => b.label === targetBreadcrumb.label && b.url === targetBreadcrumb.url
    );

    if (targetIndex !== -1) {
      // Crear nueva lista hasta el elemento seleccionado
      const newBreadcrumbs = currentBreadcrumbs
        .slice(0, targetIndex + 1)
        .map((breadcrumb, index) => ({
          ...breadcrumb,
          active: index === targetIndex,
        }));

      this.uiStore.setBreadcrumbs(newBreadcrumbs);
    }
  }
}
