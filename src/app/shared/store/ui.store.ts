import { Injectable, computed, signal } from '@angular/core';

/**
 * Estado global de la UI
 */
export interface UIState {
  // Tema
  theme: 'light' | 'dark' | 'auto';

  // Navegación
  sidenavOpen: boolean;

  // Notificaciones
  notifications: Notification[];

  // Loading global
  globalLoading: boolean;

  // Modales
  activeModal: string | null;

  // Breadcrumbs
  breadcrumbs: Breadcrumb[];

  // Configuración de vista
  viewMode: 'grid' | 'list';
  itemsPerPage: number;

  // Offline status
  isOnline: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface Breadcrumb {
  label: string;
  url?: string;
  active?: boolean;
}

/**
 * Store global de UI usando Angular Signals
 *
 * Características:
 * - Estado reactivo de la interfaz
 * - Gestión de tema y preferencias
 * - Sistema de notificaciones
 * - Control de navegación
 * - Persistencia de preferencias
 */
@Injectable({
  providedIn: 'root',
})
export class UIStore {
  // Estado privado
  private readonly _state = signal<UIState>(this.getInitialState());

  // Selectores públicos
  readonly state = computed(() => this._state());
  readonly theme = computed(() => this._state().theme);
  readonly sidenavOpen = computed(() => this._state().sidenavOpen);
  readonly notifications = computed(() => this._state().notifications);
  readonly globalLoading = computed(() => this._state().globalLoading);
  readonly activeModal = computed(() => this._state().activeModal);
  readonly breadcrumbs = computed(() => this._state().breadcrumbs);
  readonly viewMode = computed(() => this._state().viewMode);
  readonly itemsPerPage = computed(() => this._state().itemsPerPage);
  readonly isOnline = computed(() => this._state().isOnline);

  // Selectores derivados
  readonly isDarkTheme = computed(() => {
    const theme = this.theme();
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  readonly hasNotifications = computed(() => this.notifications().length > 0);
  readonly unreadNotifications = computed(() =>
    this.notifications().filter(n => !n.actions?.some(a => a.label === 'read'))
  );

  readonly isModalOpen = computed(() => this.activeModal() !== null);

  readonly currentBreadcrumb = computed(() => {
    const breadcrumbs = this.breadcrumbs();
    return breadcrumbs.find(b => b.active) || breadcrumbs[breadcrumbs.length - 1];
  });

  constructor() {
    // Cargar preferencias desde localStorage
    this.loadPreferences();

    // Configurar listeners del sistema
    this.setupSystemListeners();

    // Configurar persistencia automática
    this.setupPersistence();
  }

  /**
   * Acciones del store
   */

  // Gestión de tema
  setTheme(theme: 'light' | 'dark' | 'auto') {
    this.updateState({ theme });
    this.applyTheme(theme);
  }

  toggleTheme() {
    const currentTheme = this.theme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  // Gestión de navegación
  toggleSidenav() {
    const isOpen = this.sidenavOpen();
    this.updateState({ sidenavOpen: !isOpen });
  }

  openSidenav() {
    this.updateState({ sidenavOpen: true });
  }

  closeSidenav() {
    this.updateState({ sidenavOpen: false });
  }

  // Gestión de notificaciones
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    const currentNotifications = this.notifications();
    this.updateState({
      notifications: [...currentNotifications, newNotification],
    });

    // Auto-remove después de la duración especificada
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, notification.duration);
    }
  }

  removeNotification(id: string) {
    const currentNotifications = this.notifications();
    this.updateState({
      notifications: currentNotifications.filter(n => n.id !== id),
    });
  }

  clearNotifications() {
    this.updateState({ notifications: [] });
  }

  // Métodos de conveniencia para notificaciones
  showSuccess(title: string, message: string, duration: number = 5000) {
    this.addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }

  showError(title: string, message: string, duration: number = 0) {
    this.addNotification({
      type: 'error',
      title,
      message,
      duration,
    });
  }

  showWarning(title: string, message: string, duration: number = 7000) {
    this.addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  }

  showInfo(title: string, message: string, duration: number = 5000) {
    this.addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }

  // Gestión de loading global
  setGlobalLoading(loading: boolean) {
    this.updateState({ globalLoading: loading });
  }

  // Gestión de modales
  openModal(modalId: string) {
    this.updateState({ activeModal: modalId });
  }

  closeModal() {
    this.updateState({ activeModal: null });
  }

  // Gestión de breadcrumbs
  setBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.updateState({ breadcrumbs });
  }

  addBreadcrumb(breadcrumb: Breadcrumb) {
    const currentBreadcrumbs = this.breadcrumbs();
    // Marcar todos como inactivos
    const updatedBreadcrumbs = currentBreadcrumbs.map(b => ({ ...b, active: false }));
    // Agregar el nuevo como activo
    this.updateState({
      breadcrumbs: [...updatedBreadcrumbs, { ...breadcrumb, active: true }],
    });
  }

  clearBreadcrumbs() {
    this.updateState({ breadcrumbs: [] });
  }

  // Gestión de vista
  setViewMode(mode: 'grid' | 'list') {
    this.updateState({ viewMode: mode });
  }

  toggleViewMode() {
    const currentMode = this.viewMode();
    this.setViewMode(currentMode === 'grid' ? 'list' : 'grid');
  }

  setItemsPerPage(count: number) {
    this.updateState({ itemsPerPage: count });
  }

  // Estado de conexión
  setOnlineStatus(isOnline: boolean) {
    this.updateState({ isOnline });

    if (isOnline) {
      this.showSuccess('Conexión restaurada', 'Ya puedes usar todas las funciones');
    } else {
      this.showWarning('Sin conexión', 'Algunas funciones pueden no estar disponibles');
    }
  }

  /**
   * Métodos privados
   */

  private updateState(partialState: Partial<UIState>) {
    this._state.update(current => ({ ...current, ...partialState }));
  }

  private getInitialState(): UIState {
    return {
      theme: 'auto',
      sidenavOpen: false,
      notifications: [],
      globalLoading: false,
      activeModal: null,
      breadcrumbs: [],
      viewMode: 'grid',
      itemsPerPage: 20,
      isOnline: navigator.onLine,
    };
  }

  private loadPreferences() {
    try {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto';
      const savedViewMode = localStorage.getItem('viewMode') as 'grid' | 'list';
      const savedItemsPerPage = parseInt(localStorage.getItem('itemsPerPage') || '20');

      if (savedTheme) {
        this.updateState({ theme: savedTheme });
        this.applyTheme(savedTheme);
      }

      if (savedViewMode) {
        this.updateState({ viewMode: savedViewMode });
      }

      if (savedItemsPerPage) {
        this.updateState({ itemsPerPage: savedItemsPerPage });
      }
    } catch (error) {
      console.warn('Error loading UI preferences:', error);
    }
  }

  private setupSystemListeners() {
    // Listener para cambios de tema del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.theme() === 'auto') {
        this.applyTheme('auto');
      }
    });

    // Listeners para estado de conexión
    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));
  }

  private setupPersistence() {
    // En un entorno real, usarías effect() de Angular para persistir automáticamente
    // Por ahora, se maneja en los métodos de actualización
  }

  private applyTheme(theme: 'light' | 'dark' | 'auto') {
    const isDark =
      theme === 'dark' ||
      (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark-theme', isDark);
    document.documentElement.classList.toggle('light-theme', !isDark);

    // Persistir preferencia
    localStorage.setItem('theme', theme);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
