import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ProductService } from '../products/product.service';
import * as ProductsActions from './products.actions';
import { catchError, map, mergeMap, of } from 'rxjs';

@Injectable()
export class ProductsEffects {
  constructor(private actions$: Actions, private productService: ProductService, private store: Store) {}

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.loadProducts),
      withLatestFrom(this.store.select(ProductsSelectors.selectProductsLoaded)),
      filter(([action, loaded]) => !loaded),
      switchMap(() =>
        this.productService.getProducts().pipe(
          map(products => ProductsActions.loadProductsSuccess({ products })),
          catchError(error => of(ProductsActions.loadProductsFailure({ error: error.message || 'Error cargando productos' })))
        )
      )
    )
  );

  addProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.addProduct),
      mergeMap(action =>
        this.productService.addProduct(action.product).pipe(
          map(product => ProductsActions.addProductSuccess({ product })),
          catchError(error => of(ProductsActions.addProductFailure({ error: error.message || 'Error agregando producto' })))
        )
      )
    )
  );

  updateProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.updateProduct),
      mergeMap(action =>
        this.productService.updateProduct(action.id, action.product).pipe(
          map(product => ProductsActions.updateProductSuccess({ product })),
          catchError(error => of(ProductsActions.updateProductFailure({ error: error.message || 'Error actualizando producto' })))
        )
      )
    )
  );

  deleteProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductsActions.deleteProduct),
      mergeMap(action =>
        this.productService.deleteProduct(action.id).pipe(
          map(() => ProductsActions.deleteProductSuccess({ id: action.id })),
          catchError(error => of(ProductsActions.deleteProductFailure({ error: error.message || 'Error eliminando producto' })))
        )
      )
    )
  );
}
