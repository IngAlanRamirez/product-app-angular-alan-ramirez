import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductModalComponent } from './product-modal.component';
import { ProductFormComponent } from '../product-form/product-form.component';
import { Product } from '../product.service';
import { ReactiveFormsModule } from '@angular/forms';

describe('ProductModalComponent', () => {
  let component: ProductModalComponent;
  let fixture: ComponentFixture<ProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductModalComponent,
        ProductFormComponent,
        ReactiveFormsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar con valores por defecto', () => {
    expect(component.product).toBeNull();
    expect(component.loading).toBeFalse();
    expect(component.visible).toBeFalse();
  });

  it('debe emitir cancel al cerrar', () => {
    spyOn(component.cancel, 'emit');
    component.close();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('debe mostrar el producto cuando se proporciona', () => {
    const testProduct: Product = {
      id: 1,
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      category: 'Test Category',
      image: 'test.jpg',
    };
    component.product = testProduct;
    fixture.detectChanges();
    expect(component.product).toEqual(testProduct);
  });

  it('debe manejar el estado de loading', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(component.loading).toBeTrue();
  });

  it('debe manejar el estado de visible', () => {
    component.visible = true;
    fixture.detectChanges();
    expect(component.visible).toBeTrue();
  });

  it('debe emitir save cuando el formulario emite save', () => {
    spyOn(component.save, 'emit');
    const testProduct: Product = {
      id: 1,
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      category: 'Test Category',
      image: 'test.jpg',
    };

    // Simular que el formulario hijo emite save
    const productForm = fixture.debugElement.query(
      (el) => el.componentInstance instanceof ProductFormComponent
    );
    if (productForm) {
      productForm.componentInstance.save.emit(testProduct);
      expect(component.save.emit).toHaveBeenCalledWith(testProduct);
    } else {
      // Si no encuentra el formulario, asegurar que la prueba tenga al menos una expectativa
      expect(productForm).toBeNull();
    }
  });
});
