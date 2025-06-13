/**
 * Value Object para Precio de Producto
 *
 * Encapsula la lógica de validación, formateo y cálculos relacionados con precios.
 */
export class Price {
  private readonly _value: number;
  private readonly _currency: string;

  constructor(value: number, currency: string = 'USD') {
    if (!this.isValid(value)) {
      throw new Error(`Precio inválido: ${value}`);
    }

    if (!this.isValidCurrency(currency)) {
      throw new Error(`Moneda inválida: ${currency}`);
    }

    this._value = Math.round(value * 100) / 100; // Redondear a 2 decimales
    this._currency = currency.toUpperCase();
  }

  /**
   * Obtiene el valor numérico del precio
   */
  get value(): number {
    return this._value;
  }

  /**
   * Obtiene la moneda
   */
  get currency(): string {
    return this._currency;
  }

  /**
   * Valida si un precio es válido
   */
  private isValid(value: number): boolean {
    return typeof value === 'number' && value >= 0 && !isNaN(value) && isFinite(value);
  }

  /**
   * Valida si una moneda es válida (simplificado)
   */
  private isValidCurrency(currency: string): boolean {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'MXN', 'COP'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Formatea el precio para mostrar
   */
  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
    }).format(this._value);
  }

  /**
   * Aplica un descuento en porcentaje
   */
  applyDiscount(percentage: number): Price {
    if (percentage < 0 || percentage > 100) {
      throw new Error('El porcentaje de descuento debe estar entre 0 y 100');
    }

    const discountAmount = (this._value * percentage) / 100;
    return new Price(this._value - discountAmount, this._currency);
  }

  /**
   * Suma un impuesto en porcentaje
   */
  addTax(percentage: number): Price {
    if (percentage < 0) {
      throw new Error('El porcentaje de impuesto no puede ser negativo');
    }

    const taxAmount = (this._value * percentage) / 100;
    return new Price(this._value + taxAmount, this._currency);
  }

  /**
   * Compara dos precios
   */
  equals(other: Price): boolean {
    return this._value === other._value && this._currency === other._currency;
  }

  /**
   * Verifica si es mayor que otro precio
   */
  isGreaterThan(other: Price): boolean {
    this.validateSameCurrency(other);
    return this._value > other._value;
  }

  /**
   * Verifica si es menor que otro precio
   */
  isLessThan(other: Price): boolean {
    this.validateSameCurrency(other);
    return this._value < other._value;
  }

  /**
   * Valida que dos precios tengan la misma moneda para comparación
   */
  private validateSameCurrency(other: Price): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `No se pueden comparar precios de diferentes monedas: ${this._currency} vs ${other._currency}`
      );
    }
  }

  /**
   * Factory method para crear desde string
   */
  static fromString(value: string, currency?: string): Price {
    const numericValue = parseFloat(value);
    return new Price(numericValue, currency);
  }

  /**
   * Factory method para precio gratuito
   */
  static free(currency: string = 'USD'): Price {
    return new Price(0, currency);
  }

  /**
   * Representación en string
   */
  toString(): string {
    return `${this._value} ${this._currency}`;
  }
}
