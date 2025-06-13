import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductSearchModalComponent } from './product-search-modal.component';
import { GetProductByIdUseCase } from '../../domain/use-cases/get-product-by-id.usecase';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { Product } from '../../domain/models/product.model';

// Pruebas unitarias para el modal de búsqueda de productos por ID

describe('ProductSearchModalComponent', () => {
  let component: ProductSearchModalComponent;
  let fixture: ComponentFixture<ProductSearchModalComponent>;
  let getProductByIdUseCaseSpy: jasmine.SpyObj<GetProductByIdUseCase>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProductSearchModalComponent>>;

  beforeEach(async () => {
    getProductByIdUseCaseSpy = jasmine.createSpyObj('GetProductByIdUseCase', ['execute']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ProductSearchModalComponent],
      providers: [
        { provide: GetProductByIdUseCase, useValue: getProductByIdUseCaseSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductSearchModalComponent);
    component = fixture.componentInstance;
  });

  it('debe buscar un producto por ID exitosamente', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    component.productId = '1';
    getProductByIdUseCaseSpy.execute.and.returnValue(of(producto));
    component.onSearch();
    tick();
    expect(component.product).toEqual(producto);
    expect(component.error).toBeNull();
  }));

  it('debe manejar error al buscar producto por ID', fakeAsync(() => {
    component.productId = '999';
    getProductByIdUseCaseSpy.execute.and.returnValue(throwError(() => new Error('No encontrado')));
    component.onSearch();
    tick();
    expect(component.product).toBeNull();
    expect(component.error).toBe('No se encontraron coincidencias para el ID ingresado');
  }));


  it('debe cerrar el modal sin seleccionar producto', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });
});
