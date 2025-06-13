import { Price, ProductId, ProductTitle } from './value-objects';

/**
 * Modelo de dominio para Producto (Versión mejorada)
 *
 * Esta versión usa Value Objects para encapsular la lógica de validación
 * y comportamiento de los campos, siguiendo principios de DDD.
 *
 * NOTA: Mantenemos compatibilidad con la versión anterior mediante la interfaz ProductData
 */

/**
 * Entidad Product del dominio
 *
 * Representa un producto con toda su lógica de negocio encapsulada
 */
export class Product {
  private readonly _id?: ProductId;
  private readonly _title: ProductTitle;
  private readonly _price: Price;
  private readonly _category: string;
  private readonly _image: string;
  private readonly _description?: string;

  constructor(data: ProductData) {
    this._id = data.id ? new ProductId(data.id) : undefined;
    this._title = new ProductTitle(data.title);
    this._price = new Price(data.price);
    this._category = this.validateCategory(data.category);
    this._image = this.validateImageUrl(data.image);
    this._description = data.description?.trim() || undefined;
  }

  // Getters para acceso a las propiedades
  get id(): number | undefined {
    return this._id?.value;
  }

  get title(): string {
    return this._title.value;
  }

  get price(): number {
    return this._price.value;
  }

  get category(): string {
    return this._category;
  }

  get image(): string {
    return this._image;
  }

  get description(): string | undefined {
    return this._description;
  }

  // Getters para value objects (para lógica avanzada)
  get titleVO(): ProductTitle {
    return this._title;
  }

  get priceVO(): Price {
    return this._price;
  }

  get idVO(): ProductId | undefined {
    return this._id;
  }

  /**
   * Valida la categoría del producto
   */
  private validateCategory(category: string): string {
    const validCategories = ["men's clothing", 'jewelery', 'electronics', "women's clothing"];

    const normalizedCategory = category.toLowerCase().trim();

    if (!validCategories.includes(normalizedCategory)) {
      throw new Error(
        `Categoría inválida: ${category}. Categorías válidas: ${validCategories.join(', ')}`
      );
    }

    return normalizedCategory;
  }

  /**
   * Valida la URL de la imagen
   */
  private validateImageUrl(imageUrl: string): string {
    const trimmedUrl = imageUrl.trim();

    if (!trimmedUrl) {
      throw new Error('La URL de la imagen es requerida');
    }

    // Validación básica de URL
    try {
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch {
      throw new Error(`URL de imagen inválida: ${imageUrl}`);
    }
  }

  /**
   * Métodos de negocio
   */

  /**
   * Aplica un descuento al producto
   */
  applyDiscount(percentage: number): Product {
    const discountedPrice = this._price.applyDiscount(percentage);
    return new Product({
      id: this.id,
      title: this.title,
      price: discountedPrice.value,
      category: this.category,
      image: this.image,
      description: this.description,
    });
  }

  /**
   * Verifica si el producto es caro (precio > $100)
   */
  isExpensive(): boolean {
    return this._price.value > 100;
  }

  /**
   * Obtiene el slug SEO del producto
   */
  getSlug(): string {
    return this._title.toSlug();
  }

  /**
   * Verifica si el producto pertenece a una categoría específica
   */
  isInCategory(category: string): boolean {
    return this._category === category.toLowerCase().trim();
  }

  /**
   * Obtiene el título truncado
   */
  getTruncatedTitle(maxLength: number = 50): string {
    return this._title.truncate(maxLength);
  }

  /**
   * Convierte a formato de datos planos (para APIs, etc.)
   */
  toData(): ProductData {
    return {
      id: this.id,
      title: this.title,
      price: this.price,
      category: this.category,
      image: this.image,
      description: this.description,
    };
  }

  /**
   * Factory method para crear desde datos planos
   */
  static fromData(data: ProductData): Product {
    return new Product(data);
  }

  /**
   * Factory method para crear un producto temporal (sin ID)
   */
  static createNew(data: Omit<ProductData, 'id'>): Product {
    return new Product(data);
  }

  /**
   * Compara dos productos por ID
   */
  equals(other: Product): boolean {
    return this.id === other.id;
  }
}

/**
 * Interface para datos de producto (compatibilidad con código existente)
 *
 * Esta interface mantiene la compatibilidad con el código existente
 * mientras migramos gradualmente a usar la clase Product
 */
export interface ProductData {
  id?: number;
  title: string;
  price: number;
  category: string;
  image: string;
  description?: string;
}

/**
 * Type alias para mantener compatibilidad con código existente
 * @deprecated Usar la clase Product en su lugar
 */
export type ProductLegacy = ProductData;
