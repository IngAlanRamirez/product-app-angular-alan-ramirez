/**
 * Value Object para ID de Producto
 *
 * Encapsula la lógica de validación y comportamiento del ID de producto.
 * Los Value Objects son inmutables y se comparan por valor, no por referencia.
 */
export class ProductId {
  private readonly _value: number;

  constructor(value: number | string) {
    const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;

    if (!this.isValid(numericValue)) {
      throw new Error(`ID de producto inválido: ${value}`);
    }

    this._value = numericValue;
  }

  /**
   * Obtiene el valor numérico del ID
   */
  get value(): number {
    return this._value;
  }

  /**
   * Valida si un ID es válido
   */
  private isValid(value: number): boolean {
    return Number.isInteger(value) && value > 0;
  }

  /**
   * Compara dos ProductId por valor
   */
  equals(other: ProductId): boolean {
    return this._value === other._value;
  }

  /**
   * Representación en string del ID
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * Factory method para crear desde string
   */
  static fromString(value: string): ProductId {
    return new ProductId(value);
  }

  /**
   * Factory method para crear desde número
   */
  static fromNumber(value: number): ProductId {
    return new ProductId(value);
  }

  /**
   * Método para generar un ID temporal (para productos nuevos)
   */
  static temporary(): ProductId {
    return new ProductId(Date.now());
  }
}
