import { UpdateProductUseCase } from './update-product.usecase';
import { IProductRepository } from '../repositories/product.repository';
import { of, throwError } from 'rxjs';
import { Product } from '../models/product.model';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let repoSpy: jasmine.SpyObj<IProductRepository>;

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj('IProductRepository', ['updateProduct']);
    useCase = new UpdateProductUseCase(repoSpy);
  });

  it('debe actualizar un producto correctamente', (done) => {
    const producto: Product = { id: 1, title: 'Editado', price: 25, description: '', category: '', image: '' };
    repoSpy.updateProduct.and.returnValue(of(producto));
    useCase.execute(1, producto).subscribe(res => {
      expect(res).toEqual(producto);
      done();
    });
  });

  it('debe propagar errores del repositorio', (done) => {
    repoSpy.updateProduct.and.returnValue(throwError(() => new Error('fail')));
    useCase.execute(1, {} as Product).subscribe({
      next: () => {},
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });
});
