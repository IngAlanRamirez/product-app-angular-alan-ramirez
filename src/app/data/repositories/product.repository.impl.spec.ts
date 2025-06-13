import { TestBed } from '@angular/core/testing';
import { ProductRepositoryImpl } from './product.repository.impl';
import { HttpHelper } from '../../core/http-helper';
import { of } from 'rxjs';
import { Product } from '../../domain/models/product.model';

describe('ProductRepositoryImpl', () => {
  let repo: ProductRepositoryImpl;
  let httpHelperSpy: jasmine.SpyObj<HttpHelper>;

  beforeEach(() => {
    httpHelperSpy = jasmine.createSpyObj('HttpHelper', ['get', 'post', 'put', 'delete']);
    repo = new ProductRepositoryImpl(httpHelperSpy);
  });

  it('debe obtener productos', (done) => {
    const productos: Product[] = [{ id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' }];
    httpHelperSpy.get.and.returnValue(of(productos));
    repo.getProducts().subscribe(res => {
      expect(res).toEqual(productos);
      expect(httpHelperSpy.get).toHaveBeenCalledWith('https://fakestoreapi.com/products', undefined, undefined);
      done();
    });
  });

  it('debe obtener producto por ID', (done) => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    httpHelperSpy.get.and.returnValue(of(producto));
    repo.getProduct(1).subscribe(res => {
      expect(res).toEqual(producto);
      expect(httpHelperSpy.get).toHaveBeenCalledWith('https://fakestoreapi.com/products/1', undefined, undefined);
      done();
    });
  });

  it('debe agregar producto', (done) => {
    const producto: Product = { id: 1, title: 'Nuevo', price: 20, description: '', category: '', image: '' };
    httpHelperSpy.post.and.returnValue(of(producto));
    repo.addProduct(producto).subscribe(res => {
      expect(res).toEqual(producto);
      expect(httpHelperSpy.post).toHaveBeenCalledWith('https://fakestoreapi.com/products', producto, undefined);
      done();
    });
  });

  it('debe actualizar producto', (done) => {
    const producto: Product = { id: 1, title: 'Editado', price: 25, description: '', category: '', image: '' };
    httpHelperSpy.put.and.returnValue(of(producto));
    repo.updateProduct(1, producto).subscribe(res => {
      expect(res).toEqual(producto);
      expect(httpHelperSpy.put).toHaveBeenCalledWith('https://fakestoreapi.com/products/1', producto, undefined);
      done();
    });
  });

  it('debe eliminar producto', (done) => {
    httpHelperSpy.delete.and.returnValue(of({ ok: true }));
    repo.deleteProduct(1).subscribe(res => {
      expect(res).toEqual({ ok: true });
      expect(httpHelperSpy.delete).toHaveBeenCalledWith('https://fakestoreapi.com/products/1', undefined);
      done();
    });
  });
});
