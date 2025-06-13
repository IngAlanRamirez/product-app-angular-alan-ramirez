import {
  fakeAsync,
  tick,
  flushMicrotasks,
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
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
import { of, throwError } from 'rxjs';
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
    getProductsUseCaseSpy = jasmine.createSpyObj('GetProductsUseCase', [
      'execute',
    ]);
    addProductUseCaseSpy = jasmine.createSpyObj('AddProductUseCase', [
      'execute',
    ]);
    updateProductUseCaseSpy = jasmine.createSpyObj('UpdateProductUseCase', [
      'execute',
    ]);
    deleteProductUseCaseSpy = jasmine.createSpyObj('DeleteProductUseCase', [
      'execute',
    ]);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

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
        MatCardModule,
        MatSnackBarModule,
        MatDialogModule,
      ],
      providers: [
        { provide: GetProductsUseCase, useValue: getProductsUseCaseSpy },
        { provide: AddProductUseCase, useValue: addProductUseCaseSpy },
        { provide: UpdateProductUseCase, useValue: updateProductUseCaseSpy },
        { provide: DeleteProductUseCase, useValue: deleteProductUseCaseSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    component.autoLoad = false;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar productos correctamente', fakeAsync(() => {
    const productos: Product[] = [
      {
        id: 1,
        title: 'Prod',
        price: 10,
        description: '',
        category: '',
        image: '',
      },
    ];
    getProductsUseCaseSpy.execute.and.returnValue(of(productos));
    component.loadProducts();
    tick();
    expect(component.products).toEqual(productos);
    expect(component.loading).toBeFalse();
  }));

  it('debe manejar error al cargar productos', fakeAsync(() => {
    getProductsUseCaseSpy.execute.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.loadProducts();
    tick();
    expect(component.error).toContain('Error');
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  }));

  it('debe eliminar producto tras confirmación', fakeAsync(() => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    deleteProductUseCaseSpy.execute.and.returnValue(of(undefined));
    component.products = [producto];
    component.onDelete(producto);
    tick();
    expect(component.products.length).toBe(0);
    expect(snackBarSpy.open).toHaveBeenCalled();
  }));

  it('no elimina producto si no se confirma', fakeAsync(() => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
    component.products = [producto];
    component.onDelete(producto);
    tick();
    expect(component.products.length).toBe(1);
    expect(deleteProductUseCaseSpy.execute).not.toHaveBeenCalled();
  }));

  it('debe manejar error al eliminar producto', fakeAsync(() => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
    deleteProductUseCaseSpy.execute.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.products = [producto];
    component.onDelete(producto);
    tick();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.products.length).toBe(1);
  }));

  it('debe editar un producto', () => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    component.onEdit(producto);
    expect(component.editingProduct).toEqual(producto);
    expect(component.showForm).toBeTrue();
  });

  it('debe cancelar la edición', () => {
    component.editingProduct = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    component.showForm = true;
    component.onCancelForm();
    expect(component.editingProduct).toBeNull();
    expect(component.showForm).toBeFalse();
  });

  it('debe abrir formulario para agregar producto', () => {
    component.onAdd();
    expect(component.editingProduct).toBeNull();
    expect(component.showForm).toBeTrue();
  });

  it('debe guardar un producto nuevo', fakeAsync(() => {
    const producto: Product = {
      title: 'Nuevo',
      price: 10,
      description: '',
      category: '',
      image: '',
    } as Product;
    const productoConId = { ...producto, id: 2 };
    addProductUseCaseSpy.execute.and.returnValue(of(productoConId));
    component.editingProduct = null;
    component.onSave(producto);
    tick();
    expect(component.products.some((p) => p.title === 'Nuevo')).toBeTrue();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.showForm).toBeFalse();
    expect(component.editingProduct).toBeNull();
  }));

  it('debe manejar error al guardar producto nuevo', fakeAsync(() => {
    addProductUseCaseSpy.execute.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.editingProduct = null;
    component.onSave({
      title: 'Nuevo',
      price: 10,
      description: '',
      category: '',
      image: '',
    } as Product);
    tick();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.formLoading).toBeFalse();
  }));

  it('debe actualizar un producto existente', fakeAsync(() => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    const productoEditado = { ...producto, title: 'Editado' };
    updateProductUseCaseSpy.execute.and.returnValue(of(productoEditado));
    component.products = [producto];
    component.editingProduct = producto;
    component.onSave(productoEditado);
    tick();
    expect(component.products[0].title).toBe('Editado');
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.showForm).toBeFalse();
    expect(component.editingProduct).toBeNull();
  }));

  it('debe manejar error al actualizar producto', fakeAsync(() => {
    const producto: Product = {
      id: 1,
      title: 'Prod',
      price: 10,
      description: '',
      category: '',
      image: '',
    };
    updateProductUseCaseSpy.execute.and.returnValue(
      throwError(() => new Error('fail'))
    );
    component.products = [producto];
    component.editingProduct = producto;
    component.onSave(producto);
    tick();
    expect(snackBarSpy.open).toHaveBeenCalled();
    expect(component.formLoading).toBeFalse();
  }));

  it('debe abrir el modal de búsqueda', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
    component.onShowSearchModal();
    expect(dialogSpy.open).toHaveBeenCalledWith(ProductSearchModalComponent, {
      width: '400px',
      data: {},
      disableClose: false,
    });
  });

  it('no debe guardar si producto es nulo en onSave', () => {
    component.formLoading = true;
    component.onSave(null as any);
    expect(component.formLoading).toBeFalse();
    expect(addProductUseCaseSpy.execute).not.toHaveBeenCalled();
    expect(updateProductUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('no debe guardar si producto es objeto vacío', () => {
    component.formLoading = true;
    component.onSave({} as Product);
    expect(component.formLoading).toBeFalse();
    expect(addProductUseCaseSpy.execute).not.toHaveBeenCalled();
    expect(updateProductUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('no debe eliminar si producto es nulo', () => {
    component.onDelete(null as any);
    expect(dialogSpy.open).not.toHaveBeenCalled();
    expect(deleteProductUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('no debe eliminar si producto no tiene id', () => {
    const producto = { title: 'Test', price: 10 } as Product;
    component.onDelete(producto);
    expect(dialogSpy.open).not.toHaveBeenCalled();
    expect(deleteProductUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('no debe eliminar si id no es número', () => {
    const producto = { id: 'invalid', title: 'Test', price: 10 } as any;
    component.onDelete(producto);
    expect(dialogSpy.open).not.toHaveBeenCalled();
    expect(deleteProductUseCaseSpy.execute).not.toHaveBeenCalled();
  });

  it('debe inicializar con autoLoad true por defecto', () => {
    const newComponent = new ProductListComponent(
      getProductsUseCaseSpy,
      addProductUseCaseSpy,
      updateProductUseCaseSpy,
      deleteProductUseCaseSpy,
      snackBarSpy,
      dialogSpy
    );
    expect(newComponent.autoLoad).toBeTrue();
  });

  it('debe cargar productos automáticamente si autoLoad es true', () => {
    spyOn(ProductListComponent.prototype, 'loadProducts');
    new ProductListComponent(
      getProductsUseCaseSpy,
      addProductUseCaseSpy,
      updateProductUseCaseSpy,
      deleteProductUseCaseSpy,
      snackBarSpy,
      dialogSpy
    );
    expect(ProductListComponent.prototype.loadProducts).toHaveBeenCalled();
  });
});
