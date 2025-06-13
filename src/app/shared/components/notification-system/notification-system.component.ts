import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';

import { Notification, UIStore } from '../../store/ui.store';

/**
 * Sistema de notificaciones visual
 *
 * Características:
 * - Conectado al UIStore
 * - Animaciones fluidas
 * - Auto-dismiss configurable
 * - Diferentes tipos de notificación
 * - Acciones personalizables
 * - Responsive design
 */
@Component({
  selector: 'app-notification-system',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="notification-container"
      [@notificationContainer]="notifications().length"
      *ngIf="hasNotifications()"
    >
      <div
        *ngFor="let notification of notifications(); trackBy: trackByNotificationId"
        class="notification"
        [class]="getNotificationClasses(notification)"
        [@notificationItem]
        (click)="onNotificationClick(notification)"
        role="alert"
        [attr.aria-live]="notification.type === 'error' ? 'assertive' : 'polite'"
      >
        <!-- Icono -->
        <div class="notification-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>

        <!-- Contenido -->
        <div class="notification-content">
          <h4 class="notification-title">{{ notification.title }}</h4>
          <p class="notification-message">{{ notification.message }}</p>

          <!-- Acciones -->
          <div
            class="notification-actions"
            *ngIf="notification.actions && notification.actions.length > 0"
          >
            <button
              *ngFor="let action of notification.actions"
              type="button"
              class="notification-action"
              [class.primary]="action.primary"
              (click)="onActionClick(action, notification, $event)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <!-- Botón cerrar -->
        <button
          type="button"
          class="notification-close"
          (click)="onCloseClick(notification, $event)"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>

        <!-- Barra de progreso para auto-dismiss -->
        <div
          class="notification-progress"
          *ngIf="notification.duration && notification.duration > 0"
          [style.animation-duration.ms]="notification.duration"
        ></div>
      </div>
    </div>
  `,
  styleUrls: ['./notification-system.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('notificationContainer', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ transform: 'translateX(100%)', opacity: 0 }),
            stagger(100, [
              animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
            ]),
          ],
          { optional: true }
        ),
        query(
          ':leave',
          [animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))],
          { optional: true }
        ),
      ]),
    ]),
    trigger('notificationItem', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0, height: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0, height: 0 })),
      ]),
    ]),
  ],
})
export class NotificationSystemComponent {
  // Inyección del store
  private readonly uiStore = inject(UIStore);

  // Selectores del store
  readonly notifications = this.uiStore.notifications;
  readonly hasNotifications = this.uiStore.hasNotifications;

  // Estado local para animaciones
  private readonly _animatingOut = signal<Set<string>>(new Set());

  constructor() {
    // Configurar efectos para auto-dismiss
    this.setupAutoRemoval();
  }

  /**
   * TrackBy function para optimizar el rendering
   */
  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  /**
   * Obtiene las clases CSS para una notificación
   */
  getNotificationClasses(notification: Notification): string {
    const classes = [`notification-${notification.type}`];

    if (this._animatingOut().has(notification.id)) {
      classes.push('animating-out');
    }

    return classes.join(' ');
  }

  /**
   * Obtiene el icono para un tipo de notificación
   */
  getNotificationIcon(type: Notification['type']): string {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    return icons[type] || icons.info;
  }

  /**
   * Maneja el click en una notificación
   */
  onNotificationClick(notification: Notification): void {
    // Si tiene una sola acción, ejecutarla
    if (notification.actions && notification.actions.length === 1) {
      const action = notification.actions[0];
      action.action();
      this.removeNotification(notification.id);
    }
  }

  /**
   * Maneja el click en una acción
   */
  onActionClick(action: any, notification: Notification, event: Event): void {
    event.stopPropagation();
    action.action();

    // Remover la notificación después de ejecutar la acción
    this.removeNotification(notification.id);
  }

  /**
   * Maneja el click en el botón cerrar
   */
  onCloseClick(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.removeNotification(notification.id);
  }

  /**
   * Remueve una notificación con animación
   */
  private removeNotification(id: string): void {
    // Marcar como animando para aplicar estilos
    this._animatingOut.update(current => new Set([...current, id]));

    // Remover después de la animación
    setTimeout(() => {
      this.uiStore.removeNotification(id);
      this._animatingOut.update(current => {
        const newSet = new Set(current);
        newSet.delete(id);
        return newSet;
      });
    }, 200);
  }

  /**
   * Configura la remoción automática de notificaciones
   */
  private setupAutoRemoval(): void {
    effect(() => {
      const notifications = this.notifications();

      notifications.forEach(notification => {
        if (notification.duration && notification.duration > 0) {
          // Verificar si ya tiene un timer configurado
          const timerId = `timer-${notification.id}`;

          if (!(window as any)[timerId]) {
            (window as any)[timerId] = setTimeout(() => {
              this.removeNotification(notification.id);
              delete (window as any)[timerId];
            }, notification.duration);
          }
        }
      });
    });
  }
}
