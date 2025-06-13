import { GetProductByIdUseCase } from './get-product-by-id.usecase';
import { IProductRepository } from '../repositories/product.repository';
import { of, throwError } from 'rxjs';
import { Product } from '../models/product.model';

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let repoSpy: jasmine.SpyObj<IProductRepository>;

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj('IProductRepository', ['getProduct']);
    useCase = new GetProductByIdUseCase(repoSpy);
  });

  it('debe retornar el producto correcto', (done) => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    repoSpy.getProduct.and.returnValue(of(producto));
    useCase.execute(1).subscribe(res => {
      expect(res).toEqual(producto);
      done();
    });
  });

  it('debe propagar errores del repositorio', (done) => {
    repoSpy.getProduct.and.returnValue(throwError(() => new Error('fail')));
    useCase.execute(1).subscribe({
      next: () => {},
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });
});
