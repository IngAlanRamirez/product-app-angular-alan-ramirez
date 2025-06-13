import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ProductSearchModalComponent } from './product-search-modal.component';
import { GetProductByIdUseCase } from '../../domain/use-cases/get-product-by-id.usecase';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { Product } from '../../domain/models/product.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Pruebas unitarias para el modal de búsqueda de productos por ID

describe('ProductSearchModalComponent', () => {
  let component: ProductSearchModalComponent;
  let fixture: ComponentFixture<ProductSearchModalComponent>;
  let getProductByIdUseCaseSpy: jasmine.SpyObj<GetProductByIdUseCase>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProductSearchModalComponent>>;

  beforeEach(async () => {
    getProductByIdUseCaseSpy = jasmine.createSpyObj('GetProductByIdUseCase', [
      'execute',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ProductSearchModalComponent, NoopAnimationsModule],
      providers: [
        { provide: GetProductByIdUseCase, useValue: getProductByIdUseCaseSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar con valores por defecto', () => {
    expect(component.productId).toBe('');
    expect(component.loading).toBeFalse();
    expect(component.product).toBeNull();
    expect(component.error).toBeNull();
    expect(component.searched).toBeFalse();
  });

  it('no debe buscar si productId está vacío', () => {
    component.productId = '';
    component.onSearch();
    expect(getProductByIdUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('debe buscar un producto por ID exitosamente', fakeAsync(() => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    component.productId = '1';
    getProductByIdUseCaseSpy.execute.and.returnValue(of(producto));

    component.onSearch();
    tick();

    // Verificar estado final después del tick
    expect(component.product).toEqual(producto);
    expect(component.error).toBeNull();
    expect(component.loading).toBeFalse();
    expect(component.searched).toBeTrue();
    expect(getProductByIdUseCaseSpy.execute).toHaveBeenCalledWith(1);
  }));

  it('debe manejar error al buscar producto por ID', fakeAsync(() => {
    component.productId = '999';
    getProductByIdUseCaseSpy.execute.and.returnValue(
      throwError(() => new Error('No encontrado'))
    );

    component.onSearch();
    tick();

    // Verificar estado final después del tick
    expect(component.product).toBeNull();
    expect(component.error).toBe(
      'No se encontraron coincidencias para el ID ingresado'
    );
    expect(component.loading).toBeFalse();
    expect(component.searched).toBeTrue();
    expect(getProductByIdUseCaseSpy.execute).toHaveBeenCalledWith(999);
  }));

  it('debe limpiar estado antes de nueva búsqueda', fakeAsync(() => {
    // Establecer estado previo
    component.product = {
      id: 1,
      title: 'Old',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    component.error = 'Old error';
    component.searched = true;
    component.productId = '2';

    const newProduct = {
      id: 2,
      title: 'New',
      price: 20,
      description: '',
      category: '',
      image: '',
    };

    getProductByIdUseCaseSpy.execute.and.returnValue(of(newProduct));

    component.onSearch();
    tick();

    // Después del tick, debe tener el nuevo producto y el estado debe estar limpio
    expect(component.product).toEqual(newProduct);
    expect(component.error).toBeNull();
    expect(component.searched).toBeTrue();
    expect(component.loading).toBeFalse();
  }));

  it('debe cerrar el modal y limpiar productId', () => {
    component.productId = '123';
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
    expect(component.productId).toBe('');
  });

  it('debe convertir productId string a número correctamente', fakeAsync(() => {
    const producto: Product = {
      id: 42,
      title: 'Test',
      price: 100,
      description: '',
      category: '',
      image: '',
    };
    component.productId = '42';
    getProductByIdUseCaseSpy.execute.and.returnValue(of(producto));

    component.onSearch();
    tick();

    expect(getProductByIdUseCaseSpy.execute).toHaveBeenCalledWith(42);
  }));
});
