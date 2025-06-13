import { Product, ProductData } from '../../domain/models/product.model';
import {
  CreateProductDto,
  ProductApiDto,
  ProductListItemDto,
  ProductStatsDto,
  UpdateProductDto,
} from '../dtos/product.dto';

/**
 * Mapper para transformar entre DTOs de infraestructura y modelos de dominio
 *
 * Estas transformaciones mantienen la separación entre capas y permiten
 * que la capa de dominio sea independiente de la API externa
 */
export class ProductMapper {
  /**
   * Convierte un DTO de la API a modelo de dominio
   */
  static fromApiDto(dto: ProductApiDto): Product {
    const productData: ProductData = {
      id: dto.id,
      title: dto.title,
      price: dto.price,
      category: dto.category,
      image: dto.image,
      description: dto.description,
    };

    return Product.fromData(productData);
  }

  /**
   * Convierte múltiples DTOs de la API a modelos de dominio
   */
  static fromApiDtoList(dtos: ProductApiDto[]): Product[] {
    return dtos.map(dto => this.fromApiDto(dto));
  }

  /**
   * Convierte un modelo de dominio a DTO para crear en la API
   */
  static toCreateDto(product: Product): CreateProductDto {
    const data = product.toData();

    return {
      title: data.title,
      price: data.price,
      category: data.category,
      image: data.image,
      description: data.description || '',
    };
  }

  /**
   * Convierte un modelo de dominio a DTO para actualizar en la API
   */
  static toUpdateDto(product: Product): UpdateProductDto {
    const data = product.toData();

    if (!data.id) {
      throw new Error('No se puede crear UpdateDto de un producto sin ID');
    }

    return {
      id: data.id,
      title: data.title,
      price: data.price,
      category: data.category,
      image: data.image,
      description: data.description,
    };
  }

  /**
   * Convierte un modelo de dominio a DTO de item de lista (optimizado)
   */
  static toListItemDto(product: Product): ProductListItemDto {
    const data = product.toData();

    if (!data.id) {
      throw new Error('No se puede crear ListItemDto de un producto sin ID');
    }

    return {
      id: data.id,
      title: data.title,
      price: data.price,
      category: data.category,
      image: data.image,
    };
  }

  /**
   * Convierte múltiples modelos de dominio a DTOs de lista
   */
  static toListItemDtoList(products: Product[]): ProductListItemDto[] {
    return products.map(product => this.toListItemDto(product));
  }

  /**
   * Convierte datos planos (ProductData) a modelo de dominio
   * Útil para migraciones y compatibilidad
   */
  static fromProductData(data: ProductData): Product {
    return Product.fromData(data);
  }

  /**
   * Convierte modelo de dominio a datos planos
   * Útil para almacenamiento y serialización
   */
  static toProductData(product: Product): ProductData {
    return product.toData();
  }

  /**
   * Crea estadísticas de una lista de productos
   */
  static generateStats(products: Product[]): ProductStatsDto {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        averagePrice: 0,
        categoriesCount: {},
        priceRange: { min: 0, max: 0 },
      };
    }

    const prices = products.map(p => p.price);
    const categories = products.reduce(
      (acc, product) => {
        const category = product.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalProducts: products.length,
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      categoriesCount: categories,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
    };
  }

  /**
   * Valida que un DTO de la API tenga la estructura correcta
   */
  static validateApiDto(dto: any): dto is ProductApiDto {
    return (
      typeof dto === 'object' &&
      dto !== null &&
      typeof dto.id === 'number' &&
      typeof dto.title === 'string' &&
      typeof dto.price === 'number' &&
      typeof dto.description === 'string' &&
      typeof dto.category === 'string' &&
      typeof dto.image === 'string' &&
      typeof dto.rating === 'object' &&
      typeof dto.rating.rate === 'number' &&
      typeof dto.rating.count === 'number'
    );
  }

  /**
   * Filtra productos que no pueden ser convertidos a modelos de dominio
   */
  static filterValidApiDtos(dtos: any[]): ProductApiDto[] {
    return dtos.filter(dto => this.validateApiDto(dto));
  }

  /**
   * Convierte DTOs con manejo de errores
   */
  static safeFromApiDto(dto: any): Product | null {
    try {
      if (!this.validateApiDto(dto)) {
        console.warn('DTO inválido encontrado:', dto);
        return null;
      }
      return this.fromApiDto(dto);
    } catch (error) {
      console.error('Error al convertir DTO a modelo de dominio:', error, dto);
      return null;
    }
  }

  /**
   * Convierte lista de DTOs con manejo de errores
   */
  static safeFromApiDtoList(dtos: any[]): Product[] {
    return dtos
      .map(dto => this.safeFromApiDto(dto))
      .filter((product): product is Product => product !== null);
  }
}
