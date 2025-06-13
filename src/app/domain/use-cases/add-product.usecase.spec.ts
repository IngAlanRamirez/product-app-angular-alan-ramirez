import { AddProductUseCase } from './add-product.usecase';
import { IProductRepository } from '../repositories/product.repository';
import { of, throwError } from 'rxjs';
import { Product } from '../models/product.model';

describe('AddProductUseCase', () => {
  let useCase: AddProductUseCase;
  let repoSpy: jasmine.SpyObj<IProductRepository>;

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj('IProductRepository', ['addProduct']);
    useCase = new AddProductUseCase(repoSpy);
  });

  it('debe agregar un producto correctamente', (done) => {
    const producto: Product = { id: 1, title: 'Nuevo', price: 20, description: '', category: '', image: '' };
    repoSpy.addProduct.and.returnValue(of(producto));
    useCase.execute(producto).subscribe(res => {
      expect(res).toEqual(producto);
      done();
    });
  });

  it('debe propagar errores del repositorio', (done) => {
    repoSpy.addProduct.and.returnValue(throwError(() => new Error('fail')));
    useCase.execute({} as Product).subscribe({
      next: () => {},
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });
});
