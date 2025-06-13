import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { Product } from '../../domain/models/product.model';
import { ProductsStore } from '../../shared/store/products.store';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { ProductModalComponent } from '../product-modal/product-modal.component';
import { ProductSearchModalComponent } from '../product-search-modal/product-search-modal.component';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productsStoreSpy: jasmine.SpyObj<ProductsStore>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    // Crear mocks
    productsStoreSpy = jasmine.createSpyObj('ProductsStore', ['loadProducts'], {
      products: signal([]),
      isLoading: signal(false),
      error: signal(null),
    });

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Configurar valores por defecto
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
        { provide: ProductsStore, useValue: productsStoreSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe llamar a loadProducts en el constructor', () => {
    expect(productsStoreSpy.loadProducts).toHaveBeenCalled();
  });

  it('debe llamar a loadProducts con refresh en loadProducts()', () => {
    component.loadProducts();
    expect(productsStoreSpy.loadProducts).toHaveBeenCalledWith(true);
  });

  it('debe abrir formulario para agregar producto', () => {
    component.onAdd();
    expect(component.editingProduct).toBeNull();
    expect(component.showForm).toBeTrue();
  });

  it('debe configurar producto para edición', () => {
    const producto = Product.fromData({
      id: 1,
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img',
    });
    component.onEdit(producto);
    expect(component.editingProduct).toBeTruthy();
    expect(component.showForm).toBeTrue();
  });

  it('debe cancelar la edición', () => {
    component.editingProduct = Product.fromData({
      id: 1,
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img',
    });
    component.showForm = true;
    component.onCancelForm();
    expect(component.editingProduct).toBeNull();
    expect(component.showForm).toBeFalse();
  });

  it('debe mostrar mensaje de función pendiente al guardar producto nuevo', () => {
    const producto = Product.fromData({
      id: 0,
      title: 'Nuevo',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img',
    });
    component.editingProduct = null;
    component.onSave(producto);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Función de creación pendiente de implementar',
      'Cerrar',
      { duration: 3000, panelClass: 'snackbar-info' }
    );
    expect(component.showForm).toBeFalse();
    expect(component.editingProduct).toBeNull();
  });

  it('debe mostrar mensaje de función pendiente al editar producto', () => {
    const producto = Product.fromData({
      id: 1,
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img',
    });
    component.editingProduct = producto;
    component.onSave(producto);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Función de edición pendiente de implementar',
      'Cerrar',
      { duration: 3000, panelClass: 'snackbar-info' }
    );
    expect(component.showForm).toBeFalse();
    expect(component.editingProduct).toBeNull();
  });

  it('debe abrir diálogo de confirmación para eliminar', fakeAsync(() => {
    const producto = Product.fromData({
      id: 1,
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img',
    });
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

    component.onDelete(producto);
    tick();

    expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Eliminar producto',
        message: `¿Seguro que deseas eliminar el producto "${producto.title}"?`,
      },
    });
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Función de eliminación pendiente de implementar',
      'Cerrar',
      { duration: 3000, panelClass: 'snackbar-info' }
    );
  }));

  it('no debe eliminar si no se confirma', fakeAsync(() => {
    const producto = Product.fromData({
      id: 1,
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img',
    });
    dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

    component.onDelete(producto);
    tick();

    expect(dialogSpy.open).toHaveBeenCalled();
    // No debe mostrar el snackbar de eliminación
    expect(snackBarSpy.open).not.toHaveBeenCalled();
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

  it('no debe guardar si producto es nulo', () => {
    component.formLoading = true;
    component.onSave(null as any);
    expect(component.formLoading).toBeFalse();
  });

  it('no debe guardar si producto es objeto vacío', () => {
    component.formLoading = true;
    component.onSave({} as Product);
    expect(component.formLoading).toBeFalse();
  });

  it('no debe eliminar si producto es nulo', () => {
    component.onDelete(null as any);
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('no debe eliminar si producto no tiene id', () => {
    const producto = { title: 'Test', price: 10 } as Product;
    component.onDelete(producto);
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('no debe eliminar si id no es número', () => {
    const producto = { id: 'invalid', title: 'Test', price: 10 } as any;
    component.onDelete(producto);
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('debe exponer signals del store', () => {
    expect(component.products).toBeDefined();
    expect(component.loading).toBeDefined();
    expect(component.error).toBeDefined();
  });
});
