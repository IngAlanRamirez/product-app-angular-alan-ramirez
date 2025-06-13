/**
 * Value Object para Título de Producto
 *
 * Encapsula la lógica de validación y normalización del título de producto.
 */
export class ProductTitle {
  private readonly _value: string;

  constructor(value: string) {
    const normalizedValue = this.normalize(value);

    if (!this.isValid(normalizedValue)) {
      throw new Error(`Título de producto inválido: ${value}`);
    }

    this._value = normalizedValue;
  }

  /**
   * Obtiene el valor del título
   */
  get value(): string {
    return this._value;
  }

  /**
   * Normaliza el título (trim, espacios múltiples, etc.)
   */
  private normalize(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
      .replace(/[^\w\s\-.,()]/g, ''); // Remover caracteres especiales excepto algunos permitidos
  }

  /**
   * Valida si un título es válido
   */
  private isValid(value: string): boolean {
    return (
      typeof value === 'string' &&
      value.length >= 3 &&
      value.length <= 100 &&
      value.trim().length > 0 &&
      !this.containsOnlyNumbers(value) &&
      !this.containsInappropriateContent(value)
    );
  }

  /**
   * Verifica si contiene solo números
   */
  private containsOnlyNumbers(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  /**
   * Verifica si contiene contenido inapropiado (básico)
   */
  private containsInappropriateContent(value: string): boolean {
    const inappropriateWords = ['spam', 'fake', 'scam'];
    const lowerValue = value.toLowerCase();
    return inappropriateWords.some(word => lowerValue.includes(word));
  }

  /**
   * Genera un slug SEO-friendly del título
   */
  toSlug(): string {
    return this._value
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/--+/g, '-') // Reemplazar múltiples guiones por uno solo
      .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
  }

  /**
   * Genera una versión truncada del título
   */
  truncate(maxLength: number = 50, suffix: string = '...'): string {
    if (this._value.length <= maxLength) {
      return this._value;
    }

    return this._value.substring(0, maxLength - suffix.length).trim() + suffix;
  }

  /**
   * Obtiene la primera palabra del título
   */
  getFirstWord(): string {
    return this._value.split(' ')[0];
  }

  /**
   * Cuenta las palabras en el título
   */
  getWordCount(): number {
    return this._value.split(' ').filter(word => word.length > 0).length;
  }

  /**
   * Convierte a formato de título (Title Case)
   */
  toTitleCase(): string {
    return this._value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Compara dos títulos
   */
  equals(other: ProductTitle): boolean {
    return this._value === other._value;
  }

  /**
   * Verifica si contiene una palabra específica
   */
  contains(word: string): boolean {
    return this._value.toLowerCase().includes(word.toLowerCase());
  }

  /**
   * Factory method para crear desde string
   */
  static fromString(value: string): ProductTitle {
    return new ProductTitle(value);
  }

  /**
   * Representación en string
   */
  toString(): string {
    return this._value;
  }
}
