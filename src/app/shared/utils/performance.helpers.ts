/**
 * Helpers para optimización de performance
 */

/**
 * TrackBy functions genéricas para optimizar *ngFor
 */
export class TrackByHelpers {
  /**
   * TrackBy por ID (más común)
   */
  static byId<T extends { id: number | string }>(index: number, item: T): number | string {
    return item?.id || index;
  }

  /**
   * TrackBy por índice (cuando no hay ID único)
   */
  static byIndex(index: number): number {
    return index;
  }

  /**
   * TrackBy por propiedad específica
   */
  static byProperty<T>(property: keyof T) {
    return (index: number, item: T): unknown => item?.[property] || index;
  }

  /**
   * TrackBy combinado (ID + otra propiedad para mayor precisión)
   */
  static byIdAndProperty<T extends { id: number | string }>(property: keyof T) {
    return (index: number, item: T): string => `${item?.id || index}-${item?.[property]}`;
  }
}

/**
 * Decorador para memoizar resultados de funciones costosas
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keySelector?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keySelector ? keySelector(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Helper para detectar cambios en objetos (útil con OnPush)
 */
export function hasChanged<T>(
  previous: T | null,
  current: T | null,
  compareBy?: (keyof T)[]
): boolean {
  if (previous === current) return false;
  if (!previous || !current) return true;

  // Si no se especifican propiedades, comparar referencia
  if (!compareBy) return previous !== current;

  // Comparar propiedades específicas
  return compareBy.some(key => previous[key] !== current[key]);
}

/**
 * Helper para crear funciones de comparación para OnPush
 */
export function createCompareFn<T>(compareBy: (keyof T)[]) {
  return (previous: T | null, current: T | null): boolean => {
    return !hasChanged(previous, current, compareBy);
  };
}

/**
 * Debounce para optimizar búsquedas y llamadas API
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle para eventos frecuentes (scroll, resize)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
