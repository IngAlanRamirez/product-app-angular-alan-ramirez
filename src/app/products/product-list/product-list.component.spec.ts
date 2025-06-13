import { fakeAsync, tick, flush, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ProductSearchModalComponent } from '../product-search-modal/product-search-modal.component';
import { ProductListComponent } from './product-list.component';
import { GetProductsUseCase } from '../../domain/use-cases/get-products.usecase';
import { AddProductUseCase } from '../../domain/use-cases/add-product.usecase';
import { UpdateProductUseCase } from '../../domain/use-cases/update-product.usecase';
import { DeleteProductUseCase } from '../../domain/use-cases/delete-product.usecase';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, defer } from 'rxjs';
import { Product } from '../../domain/models/product.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let getProductsUseCaseSpy: jasmine.SpyObj<GetProductsUseCase>;
  let addProductUseCaseSpy: jasmine.SpyObj<AddProductUseCase>;
  let updateProductUseCaseSpy: jasmine.SpyObj<UpdateProductUseCase>;
  let deleteProductUseCaseSpy: jasmine.SpyObj<DeleteProductUseCase>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    // Configuración de spies
    getProductsUseCaseSpy = jasmine.createSpyObj('GetProductsUseCase', ['execute']);
    addProductUseCaseSpy = jasmine.createSpyObj('AddProductUseCase', ['execute']);
    updateProductUseCaseSpy = jasmine.createSpyObj('UpdateProductUseCase', ['execute']);
    deleteProductUseCaseSpy = jasmine.createSpyObj('DeleteProductUseCase', ['execute']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Configuración de mocks por defecto
    getProductsUseCaseSpy.execute.and.returnValue(of([]));
    snackBarSpy.open.and.returnValue({} as any);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    TestBed.configureTestingModule({
      imports: [
        ProductListComponent,
        ProductModalComponent,
        ConfirmDialogComponent,
        ProductSearchModalComponent,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule
      ],
      providers: [
        { provide: GetProductsUseCase, useValue: getProductsUseCaseSpy },
        { provide: AddProductUseCase, useValue: addProductUseCaseSpy },
        { provide: UpdateProductUseCase, useValue: updateProductUseCaseSpy },
        { provide: DeleteProductUseCase, useValue: deleteProductUseCaseSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
      // imports: [ ... any required modules ... ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    component.autoLoad = false; // Desactiva la carga automática para pruebas
  });

  it('debe cargar productos correctamente', fakeAsync(() => {
    const productos: Product[] = [{ id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' }];
    getProductsUseCaseSpy.execute.and.returnValue(of(productos));
    component.loadProducts();
    tick();
    expect(component.products).toEqual(productos);
    expect(component.loading).toBeFalse();
  }));

  it('debe manejar error al cargar productos', fakeAsync(() => {
    getProductsUseCaseSpy.execute.and.returnValue(defer(() => Promise.reject(new Error('fail'))));
    component.loadProducts();
    flush();
    fixture.detectChanges();
    expect(component.error).toContain('Error');
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  }));

  it('debe eliminar producto tras confirmación', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    deleteProductUseCaseSpy.execute.and.returnValue(defer(() => Promise.resolve(undefined)));
    component.products = [producto];
    component.onDelete(producto);
    flush();
    fixture.detectChanges();
    expect(component.products.length).toBe(0);
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('no elimina producto si no se confirma', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
    component.products = [producto];
    component.onDelete(producto);
    tick();
    expect(component.products.length).toBe(1);
    expect(deleteProductUseCaseSpy.execute).not.toHaveBeenCalled();
  }));

  it('debe manejar error al eliminar producto', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    deleteProductUseCaseSpy.execute.and.returnValue(defer(() => Promise.reject(new Error('fail'))));
    component.products = [producto];
    component.onDelete(producto);
    flush();
    fixture.detectChanges();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.products.length).toBe(1);
  }));

  it('debe editar un producto', () => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    component.onEdit(producto);
    expect(component.editingProduct).toEqual(producto);
  });

  it('debe cancelar la edición', () => {
    component.editingProduct = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    component.onCancelForm();
    expect(component.editingProduct).toBeNull();
  });

  it('debe guardar un producto nuevo', fakeAsync(() => {
    const producto: Product = { title: 'Nuevo', price: 10, description: '', category: '', image: '' } as Product;
    addProductUseCaseSpy.execute.and.returnValue(defer(() => Promise.resolve({ ...producto, id: 2 })));
    component.editingProduct = null;
    component.onSave(producto);
    flush();
    fixture.detectChanges();
    expect(component.products.some(p => p.title === 'Nuevo')).toBeTrue();
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('debe manejar error al guardar producto nuevo', fakeAsync(() => {
    addProductUseCaseSpy.execute.and.returnValue(defer(() => Promise.reject(new Error('fail'))));
    component.editingProduct = null;
    component.onSave({ title: 'Nuevo', price: 10, description: '', category: '', image: '' } as Product);
    flush();
    fixture.detectChanges();
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('debe actualizar un producto existente', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    updateProductUseCaseSpy.execute.and.returnValue(defer(() => Promise.resolve({ ...producto, title: 'Editado' })));
    component.products = [producto];
    component.editingProduct = producto;
    component.onSave({ ...producto, title: 'Editado' });
    flush();
    fixture.detectChanges();
    expect(component.products[0].title).toBe('Editado');
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('debe manejar error al actualizar producto', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    updateProductUseCaseSpy.execute.and.returnValue(defer(() => Promise.reject(new Error('fail'))));
    component.products = [producto];
    component.editingProduct = producto;
    component.onSave(producto);
    flush();
    fixture.detectChanges();
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('debe abrir el modal de búsqueda', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.onShowSearchModal();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('debe manejar resultado del modal de búsqueda', fakeAsync(() => {
    const producto: Product = { id: 1, title: 'Prod', price: 10, description: '', category: '', image: '' };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(producto) } as any);
    component.products = [producto];
    // No hay afterClosed manejado en el método real, así que solo comprobamos que el diálogo se abra
    component.onShowSearchModal();
    expect(dialogSpy.open).toHaveBeenCalled();
  }));

  it('no debe guardar si producto es nulo en onSave', () => {
    spyOn(component, 'loadProducts');
    // Defensa: no debe arrojar excepción ni hacer nada
    expect(() => component.onSave(null as any)).not.toThrow();
    expect(component.loadProducts).not.toHaveBeenCalled();
    // No esperamos llamada a snackBar.open
  });

  it('no debe eliminar si id es inválido', () => {
    expect(() => component.onDelete({} as Product)).not.toThrow();
    // No debe llamar a deleteProductUseCase ni abrir diálogo
    expect(deleteProductUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('debe manejar error si id es inválido en onDelete tras confirmación', fakeAsync(() => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    expect(() => component.onDelete({} as Product)).not.toThrow();
    tick();
  }));

});
