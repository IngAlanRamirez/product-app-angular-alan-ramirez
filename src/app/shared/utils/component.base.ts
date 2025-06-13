import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Clase base para componentes de presentación
 *
 * Características:
 * - OnPush change detection por defecto
 * - Configuración optimizada para Signals
 * - Convencioness de naming consistentes
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-product-card',
 *   template: `...`,
 *   styleUrls: ['./product-card.component.scss']
 * })
 * export class ProductCardComponent extends BaseComponent {
 *   // Usar input() y output() en lugar de @Input() y @Output()
 *   product = input.required<Product>();
 *   onEdit = output<Product>();
 * }
 * ```
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class BaseComponent {}

/**
 * Configuración por defecto para componentes de presentación
 */
export const PRESENTATION_COMPONENT_CONFIG = {
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
} as const;

/**
 * Configuración por defecto para containers
 */
export const CONTAINER_COMPONENT_CONFIG = {
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
} as const;
