import { createReducer, on } from '@ngrx/store';
import * as ProductsActions from './products.actions';
import { Product } from '../products/product.service';

export interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

export const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  loaded: false,
};

export const productsReducer = createReducer(
  initialState,
  on(ProductsActions.loadProducts, (state) => ({ ...state, loading: true, error: null, loaded: false })),
  on(ProductsActions.loadProductsSuccess, (state, { products }) => ({ ...state, products, loading: false, loaded: true })),
  on(ProductsActions.loadProductsFailure, (state, { error }) => ({ ...state, loading: false, error, loaded: false })),

  on(ProductsActions.addProduct, (state) => ({ ...state, loading: true, error: null })),
  on(ProductsActions.addProductSuccess, (state, { product }) => ({ ...state, products: [...state.products, product], loading: false })),
  on(ProductsActions.addProductFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ProductsActions.updateProduct, (state) => ({ ...state, loading: true, error: null })),
  on(ProductsActions.updateProductSuccess, (state, { product }) => ({
    ...state,
    products: state.products.map(p => p.id === product.id ? product : p),
    loading: false,
  })),
  on(ProductsActions.updateProductFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ProductsActions.deleteProduct, (state) => ({ ...state, loading: true, error: null })),
  on(ProductsActions.deleteProductSuccess, (state, { id }) => ({
    ...state,
    products: state.products.filter(p => p.id !== id),
    loading: false,
  })),
  on(ProductsActions.deleteProductFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
