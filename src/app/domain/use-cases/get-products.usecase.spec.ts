import { GetProductsUseCase } from './get-products.usecase';
import { IProductRepository } from '../repositories/product.repository';
import { of, throwError } from 'rxjs';
import { Product } from '../models/product.model';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let repoSpy: jasmine.SpyObj<IProductRepository>;

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj('IProductRepository', ['getProducts']);
    useCase = new GetProductsUseCase(repoSpy);
  });

  it('debe retornar productos del repositorio', (done) => {
    const productos: Product[] = [{ id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' }];
    repoSpy.getProducts.and.returnValue(of(productos));
    useCase.execute().subscribe(res => {
      expect(res).toEqual(productos);
      done();
    });
  });

  it('debe propagar errores del repositorio', (done) => {
    repoSpy.getProducts.and.returnValue(throwError(() => new Error('fail')));
    useCase.execute().subscribe({
      next: () => {},
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });
});
