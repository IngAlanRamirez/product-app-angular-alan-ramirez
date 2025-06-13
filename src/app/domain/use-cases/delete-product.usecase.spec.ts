import { DeleteProductUseCase } from './delete-product.usecase';
import { IProductRepository } from '../repositories/product.repository';
import { of, throwError } from 'rxjs';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let repoSpy: jasmine.SpyObj<IProductRepository>;

  beforeEach(() => {
    repoSpy = jasmine.createSpyObj('IProductRepository', ['deleteProduct']);
    useCase = new DeleteProductUseCase(repoSpy);
  });

  it('debe eliminar un producto correctamente', (done) => {
    repoSpy.deleteProduct.and.returnValue(of({ ok: true }));
    useCase.execute(1).subscribe(res => {
      expect(res).toEqual({ ok: true });
      done();
    });
  });

  it('debe propagar errores del repositorio', (done) => {
    repoSpy.deleteProduct.and.returnValue(throwError(() => new Error('fail')));
    useCase.execute(1).subscribe({
      next: () => {},
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });
});
