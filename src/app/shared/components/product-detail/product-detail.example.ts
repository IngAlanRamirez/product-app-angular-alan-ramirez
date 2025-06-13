/**
 * Ejemplos de uso del ProductDetailComponent
 *
 * Este archivo contiene ejemplos prácticos de cómo implementar
 * el componente de detalle de producto en diferentes escenarios.
 */

import { Component } from '@angular/core';
import { Product } from '../../../domain/models/product.model';

// ===================================
// Ejemplo 1: Uso Básico
// ===================================

@Component({
  selector: 'app-basic-product-detail-example',
  template: `
    <app-product-detail
      [product]="selectedProduct"
      [relatedProducts]="relatedProducts"
      [isLoading]="isLoading"
      (onAddToCart)="handleAddToCart($event)"
      (onBuyNow)="handleBuyNow($event)"
      (onToggleFavorite)="handleToggleFavorite($event)"
      (onAddToComparison)="handleAddToComparison($event)"
      (onShare)="handleShare($event)"
      (onProductSelect)="handleProductSelect($event)"
      (onNavigate)="handleNavigate($event)"
    />
  `,
})
export class BasicProductDetailExample {
  selectedProduct: Product | null = null;
  relatedProducts: Product[] = [];
  isLoading = false;

  constructor() {
    this.loadProduct();
  }

  private loadProduct(): void {
    this.isLoading = true;

    // Simular carga de producto
    setTimeout(() => {
      this.selectedProduct = Product.fromData({
        id: 1,
        title: 'Smartphone Premium XYZ',
        price: 899.99,
        description:
          'Un smartphone de última generación con características premium y diseño elegante.',
        category: 'electronics',
        image: 'https://example.com/smartphone.jpg',
      });

      this.relatedProducts = [
        Product.fromData({
          id: 2,
          title: 'Funda Protectora',
          price: 29.99,
          description: 'Funda protectora de alta calidad',
          category: 'accessories',
          image: 'https://example.com/case.jpg',
        }),
        Product.fromData({
          id: 3,
          title: 'Cargador Inalámbrico',
          price: 49.99,
          description: 'Cargador inalámbrico rápido',
          category: 'accessories',
          image: 'https://example.com/charger.jpg',
        }),
      ];

      this.isLoading = false;
    }, 1000);
  }

  handleAddToCart(event: { product: Product; quantity: number }): void {
    console.log('Agregando al carrito:', event);
    // Implementar lógica de carrito
  }

  handleBuyNow(event: { product: Product; quantity: number }): void {
    console.log('Comprar ahora:', event);
    // Implementar lógica de compra directa
  }

  handleToggleFavorite(product: Product): void {
    console.log('Toggle favorito:', product);
    // Implementar lógica de favoritos
  }

  handleAddToComparison(product: Product): void {
    console.log('Agregar a comparación:', product);
    // Implementar lógica de comparación
  }

  handleShare(product: Product): void {
    console.log('Compartir producto:', product);
    // Implementar lógica de compartir
  }

  handleProductSelect(product: Product): void {
    console.log('Producto seleccionado:', product);
    // Navegar a otro producto
    this.selectedProduct = product;
  }

  handleNavigate(route: string): void {
    console.log('Navegar a:', route);
    // Implementar navegación
  }
}

// ===================================
// Ejemplo 2: Con Estado de Carga
// ===================================

@Component({
  selector: 'app-loading-product-detail-example',
  template: `
    <div class="product-detail-container">
      <h2>Producto con Estado de Carga</h2>

      <div class="controls">
        <button (click)="toggleLoading()">
          {{ isLoading ? 'Detener Carga' : 'Simular Carga' }}
        </button>
        <button (click)="loadRandomProduct()">Cargar Producto Aleatorio</button>
      </div>

      <app-product-detail
        [product]="currentProduct"
        [isLoading]="isLoading"
        (onAddToCart)="onAddToCart($event)"
        (onBuyNow)="onBuyNow($event)"
      />
    </div>
  `,
  styles: [
    `
      .product-detail-container {
        padding: 2rem;
      }

      .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .controls button {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
      }

      .controls button:hover {
        background: #f5f5f5;
      }
    `,
  ],
})
export class LoadingProductDetailExample {
  currentProduct: Product | null = null;
  isLoading = false;

  private sampleProducts = [
    {
      id: 1,
      title: 'Laptop Gaming Pro',
      price: 1299.99,
      description: 'Laptop de alto rendimiento para gaming y trabajo profesional.',
      category: 'electronics',
      image: 'https://example.com/laptop.jpg',
    },
    {
      id: 2,
      title: 'Auriculares Bluetooth',
      price: 199.99,
      description: 'Auriculares inalámbricos con cancelación de ruido.',
      category: 'audio',
      image: 'https://example.com/headphones.jpg',
    },
    {
      id: 3,
      title: 'Smartwatch Deportivo',
      price: 299.99,
      description: 'Reloj inteligente con funciones deportivas avanzadas.',
      category: 'wearables',
      image: 'https://example.com/smartwatch.jpg',
    },
  ];

  toggleLoading(): void {
    this.isLoading = !this.isLoading;

    if (this.isLoading) {
      this.currentProduct = null;
    }
  }

  loadRandomProduct(): void {
    this.isLoading = true;
    this.currentProduct = null;

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * this.sampleProducts.length);
      const productData = this.sampleProducts[randomIndex];
      this.currentProduct = Product.fromData(productData);
      this.isLoading = false;
    }, 2000);
  }

  onAddToCart(event: { product: Product; quantity: number }): void {
    alert(`Agregado al carrito: ${event.product.title} (Cantidad: ${event.quantity})`);
  }

  onBuyNow(event: { product: Product; quantity: number }): void {
    alert(`Comprando: ${event.product.title} (Cantidad: ${event.quantity})`);
  }
}

// ===================================
// Ejemplo 3: Integración con Router
// ===================================

@Component({
  selector: 'app-routed-product-detail-example',
  template: `
    <app-product-detail
      [product]="product"
      [relatedProducts]="relatedProducts"
      (onNavigate)="handleNavigation($event)"
      (onProductSelect)="navigateToProduct($event)"
      (onAddToCart)="addToCart($event)"
      (onBuyNow)="proceedToCheckout($event)"
      (onToggleFavorite)="toggleFavorite($event)"
      (onShare)="shareProduct($event)"
    />
  `,
})
export class RoutedProductDetailExample {
  product: Product | null = null;
  relatedProducts: Product[] = [];

  constructor() // private productService: ProductService, // private router: Router, // private route: ActivatedRoute,
  // private cartService: CartService,
  // private favoritesService: FavoritesService
  {
    this.loadProductFromRoute();
  }

  private loadProductFromRoute(): void {
    // Ejemplo de carga desde parámetros de ruta
    // this.route.params.subscribe(params => {
    //   const productId = params['id'];
    //   this.loadProduct(productId);
    // });

    // Simulación para el ejemplo
    this.product = Product.fromData({
      id: 1,
      title: 'Producto desde Ruta',
      price: 599.99,
      description: 'Producto cargado desde parámetros de ruta',
      category: 'electronics',
      image: 'https://example.com/product.jpg',
    });
  }

  handleNavigation(route: string): void {
    switch (route) {
      case 'home':
        // this.router.navigate(['/']);
        console.log('Navegando a home');
        break;
      case 'products':
        // this.router.navigate(['/products']);
        console.log('Navegando a productos');
        break;
      case 'category':
        // this.router.navigate(['/category', this.product?.category]);
        console.log('Navegando a categoría');
        break;
    }
  }

  navigateToProduct(product: Product): void {
    // this.router.navigate(['/product', product.id]);
    console.log('Navegando a producto:', product.id);
  }

  addToCart(event: { product: Product; quantity: number }): void {
    // this.cartService.addItem(event.product, event.quantity);
    console.log('Agregado al carrito:', event);
  }

  proceedToCheckout(event: { product: Product; quantity: number }): void {
    // this.cartService.addItem(event.product, event.quantity);
    // this.router.navigate(['/checkout']);
    console.log('Procediendo al checkout:', event);
  }

  toggleFavorite(product: Product): void {
    // this.favoritesService.toggle(product);
    console.log('Toggle favorito:', product);
  }

  shareProduct(product: Product): void {
    const url = `${window.location.origin}/product/${product.id}`;

    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description || '',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      console.log('URL copiada al portapapeles');
    }
  }
}

// ===================================
// Ejemplo 4: Con Datos Reactivos
// ===================================

@Component({
  selector: 'app-reactive-product-detail-example',
  template: `
    <div class="reactive-example">
      <h2>Producto con Datos Reactivos</h2>

      <div class="product-selector">
        <label for="product-select">Seleccionar Producto:</label>
        <select id="product-select" (change)="onProductChange($event)">
          <option value="">-- Seleccionar --</option>
          @for (product of availableProducts; track product.id) {
            <option [value]="product.id">{{ product.title }}</option>
          }
        </select>
      </div>

      <app-product-detail
        [product]="selectedProduct"
        [relatedProducts]="getRelatedProducts()"
        (onAddToCart)="handleAddToCart($event)"
        (onToggleFavorite)="handleToggleFavorite($event)"
      />
    </div>
  `,
  styles: [
    `
      .reactive-example {
        padding: 2rem;
      }

      .product-selector {
        margin-bottom: 2rem;
      }

      .product-selector label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      .product-selector select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
      }
    `,
  ],
})
export class ReactiveProductDetailExample {
  selectedProduct: Product | null = null;

  availableProducts: Product[] = [
    Product.fromData({
      id: 1,
      title: 'Tablet Pro 12"',
      price: 799.99,
      description: 'Tablet profesional con pantalla de 12 pulgadas',
      category: 'electronics',
      image: 'https://example.com/tablet.jpg',
    }),
    Product.fromData({
      id: 2,
      title: 'Teclado Mecánico',
      price: 149.99,
      description: 'Teclado mecánico para gaming y productividad',
      category: 'accessories',
      image: 'https://example.com/keyboard.jpg',
    }),
    Product.fromData({
      id: 3,
      title: 'Monitor 4K 27"',
      price: 449.99,
      description: 'Monitor 4K de 27 pulgadas para profesionales',
      category: 'electronics',
      image: 'https://example.com/monitor.jpg',
    }),
  ];

  onProductChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const productId = parseInt(select.value);

    if (productId) {
      this.selectedProduct = this.availableProducts.find(p => p.id === productId) || null;
    } else {
      this.selectedProduct = null;
    }
  }

  getRelatedProducts(): Product[] {
    if (!this.selectedProduct) return [];

    return this.availableProducts
      .filter(
        p => p.id !== this.selectedProduct!.id && p.category === this.selectedProduct!.category
      )
      .slice(0, 3);
  }

  handleAddToCart(event: { product: Product; quantity: number }): void {
    console.log('Producto agregado al carrito:', {
      product: event.product.title,
      quantity: event.quantity,
      total: event.product.price * event.quantity,
    });
  }

  handleToggleFavorite(product: Product): void {
    console.log('Favorito toggled:', product.title);
  }
}

// ===================================
// Patrones de Uso Recomendados
// ===================================

/**
 * 1. CARGA DE DATOS
 *
 * - Usar el estado isLoading mientras se cargan los datos
 * - Manejar errores de carga apropiadamente
 * - Implementar retry logic si es necesario
 */

/**
 * 2. GESTIÓN DE ESTADO
 *
 * - Usar signals para estado reactivo
 * - Implementar estado global para carrito y favoritos
 * - Mantener sincronización entre componentes
 */

/**
 * 3. NAVEGACIÓN
 *
 * - Implementar navegación programática
 * - Manejar parámetros de ruta correctamente
 * - Usar breadcrumbs para mejor UX
 */

/**
 * 4. ACCESIBILIDAD
 *
 * - Asegurar navegación por teclado
 * - Usar ARIA labels apropiados
 * - Implementar focus management
 */

/**
 * 5. PERFORMANCE
 *
 * - Usar OnPush change detection
 * - Implementar lazy loading para imágenes
 * - Optimizar re-renders con trackBy
 */

// Las clases ya están exportadas individualmente arriba
