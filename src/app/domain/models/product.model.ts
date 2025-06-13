/**
 * Modelo de dominio para Producto.
 * Esta clase/interface representa la estructura de un producto en el sistema,
 * independiente de cómo se obtenga o almacene (API, base de datos, etc).
 */
export interface Product {
  id?: number;
  title: string;
  price: number;
  category: string;
  image: string;
  description?: string;
}
