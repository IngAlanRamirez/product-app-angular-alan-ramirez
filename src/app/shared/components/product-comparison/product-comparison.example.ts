/**
 * Ejemplo de uso del ProductComparisonComponent
 *
 * Este archivo muestra cómo integrar el componente de comparación
 * en una aplicación Angular 19 con signals
 */

import { Component, signal } from '@angular/core';
import { Product } from '../../../domain/models/product.model';
import { ProductComparisonComponent } from './product-comparison.component';

@Component({
  selector: 'app-comparison-example',
  standalone: true,
  imports: [ProductComparisonComponent],
  template: `
    <div class="example-container">
      <h1>Ejemplo de Comparación de Productos</h1>

      <!-- Botones para agregar productos de ejemplo -->
      <div class="example-controls">
        @for (product of availableProducts(); track product.id) {
          <button
            (click)="addToComparison(product)"
            [disabled]="isInComparison(product) || comparisonProducts().length >= 4"
          >
            Agregar {{ product.getTruncatedTitle(15) }}
          </button>
        }
      </div>

      <!-- Componente de comparación -->
      <app-product-comparison
        [products]="comparisonProducts()"
        [maxProducts]="4"
        (onAddProducts)="handleAddProducts()"
        (onRemoveProduct)="removeFromComparison($event)"
        (onToggleFavorite)="handleToggleFavorite($event)"
        (onAddToCart)="handleAddToCart($event)"
        (onExport)="handleExport($event)"
        (onShare)="handleShare($event)"
      />
    </div>
  `,
  styles: [
    `
      .example-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .example-controls {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .example-controls button {
        padding: 8px 16px;
        border: 1px solid #1976d2;
        background: white;
        color: #1976d2;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .example-controls button:hover:not(:disabled) {
        background: #1976d2;
        color: white;
      }

      .example-controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ProductComparisonExampleComponent {
  // Productos disponibles para comparar
  readonly availableProducts = signal<Product[]>([
    Product.fromData({
      id: 1,
      title: 'iPhone 15 Pro',
      price: 999.99,
      description: 'El iPhone más avanzado con chip A17 Pro y cámara de 48MP',
      category: 'smartphones',
      image: 'https://via.placeholder.com/300x300/1976d2/white?text=iPhone+15',
    }),
    Product.fromData({
      id: 2,
      title: 'Samsung Galaxy S24 Ultra',
      price: 1199.99,
      description: 'Smartphone premium con S Pen y cámara de 200MP',
      category: 'smartphones',
      image: 'https://via.placeholder.com/300x300/4caf50/white?text=Galaxy+S24',
    }),
    Product.fromData({
      id: 3,
      title: 'Google Pixel 8 Pro',
      price: 899.99,
      description: 'Smartphone con IA avanzada y fotografía computacional',
      category: 'smartphones',
      image: 'https://via.placeholder.com/300x300/ff9800/white?text=Pixel+8',
    }),
    Product.fromData({
      id: 4,
      title: 'OnePlus 12',
      price: 799.99,
      description: 'Smartphone flagship con carga rápida de 100W',
      category: 'smartphones',
      image: 'https://via.placeholder.com/300x300/e91e63/white?text=OnePlus+12',
    }),
    Product.fromData({
      id: 5,
      title: 'Xiaomi 14 Ultra',
      price: 1099.99,
      description: 'Smartphone con cámara Leica y pantalla AMOLED 2K',
      category: 'smartphones',
      image: 'https://via.placeholder.com/300x300/9c27b0/white?text=Xiaomi+14',
    }),
  ]);

  // Productos en comparación
  readonly comparisonProducts = signal<Product[]>([]);

  /**
   * Agregar producto a la comparación
   */
  addToComparison(product: Product): void {
    const current = this.comparisonProducts();
    if (current.length < 4 && !this.isInComparison(product)) {
      this.comparisonProducts.set([...current, product]);
    }
  }

  /**
   * Remover producto de la comparación
   */
  removeFromComparison(product: Product): void {
    const current = this.comparisonProducts();
    this.comparisonProducts.set(current.filter(p => p.id !== product.id));
  }

  /**
   * Verificar si producto está en comparación
   */
  isInComparison(product: Product): boolean {
    return this.comparisonProducts().some(p => p.id === product.id);
  }

  /**
   * Manejar solicitud de agregar productos
   */
  handleAddProducts(): void {
    console.log('Usuario solicitó agregar productos');
    // Aquí podrías abrir un modal o navegar a la lista de productos
  }

  /**
   * Manejar toggle de favorito
   */
  handleToggleFavorite(product: Product): void {
    console.log('Toggle favorito para:', product.title);
    // Aquí implementarías la lógica de favoritos
  }

  /**
   * Manejar agregar al carrito
   */
  handleAddToCart(product: Product): void {
    console.log('Agregar al carrito:', product.title);
    // Aquí implementarías la lógica del carrito
  }

  /**
   * Manejar exportación
   */
  handleExport(format: 'image' | 'pdf'): void {
    console.log('Exportar como:', format);
    // Aquí implementarías la lógica de exportación
  }

  /**
   * Manejar compartir
   */
  handleShare(shareData: string): void {
    console.log('Compartir:', shareData);
    // Aquí implementarías la lógica de compartir
  }
}

/**
 * Ejemplo de integración en un container component
 */
@Component({
  selector: 'app-product-comparison-container',
  standalone: true,
  imports: [ProductComparisonComponent],
  template: `
    <app-product-comparison
      [products]="selectedProducts()"
      [maxProducts]="maxComparisons"
      (onAddProducts)="openProductSelector()"
      (onRemoveProduct)="removeProduct($event)"
      (onToggleFavorite)="toggleFavorite($event)"
      (onAddToCart)="addToCart($event)"
      (onExport)="exportComparison($event)"
      (onShare)="shareComparison($event)"
    />
  `,
})
export class ProductComparisonContainerComponent {
  readonly selectedProducts = signal<Product[]>([]);
  readonly maxComparisons = 4;

  openProductSelector(): void {
    // Implementar apertura de selector de productos
  }

  removeProduct(product: Product): void {
    // Implementar remoción de producto
  }

  toggleFavorite(product: Product): void {
    // Implementar toggle de favorito
  }

  addToCart(product: Product): void {
    // Implementar agregar al carrito
  }

  exportComparison(format: 'image' | 'pdf'): void {
    // Implementar exportación
  }

  shareComparison(shareData: string): void {
    // Implementar compartir
  }
}
