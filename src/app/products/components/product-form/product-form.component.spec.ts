import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Product } from '../../../domain/models/product.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductFormComponent,
        FormsModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe crear el formulario correctamente', () => {
    expect(component.productForm).toBeDefined();
    expect(component.productForm.get('title')).toBeTruthy();
    expect(component.productForm.get('price')).toBeTruthy();
    expect(component.productForm.get('description')).toBeTruthy();
    expect(component.productForm.get('category')).toBeTruthy();
    expect(component.productForm.get('image')).toBeTruthy();
  });

  it('debe inicializar con formulario vacío', () => {
    expect(component.productForm.get('title')?.value).toBe('');
    expect(component.productForm.get('price')?.value).toBeNull();
    expect(component.productForm.get('description')?.value).toBe('');
    expect(component.productForm.get('category')?.value).toBe('');
    expect(component.productForm.get('image')?.value).toBe('');
  });

  it('debe validar campos requeridos', () => {
    expect(component.productForm.get('title')?.hasError('required')).toBeTrue();
    expect(component.productForm.get('price')?.hasError('required')).toBeTrue();
    expect(component.productForm.invalid).toBeTrue();
  });

  it('debe validar precio mínimo', () => {
    component.productForm.get('price')?.setValue(-1);
    expect(component.productForm.get('price')?.hasError('min')).toBeTrue();
  });

  it('debe ser válido con datos correctos', () => {
    component.productForm.setValue({
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      category: 'Test Category',
      image: 'test.jpg',
    });
    expect(component.productForm.valid).toBeTrue();
  });

  it('debe emitir save con datos válidos', () => {
    spyOn(component.save, 'emit');
    const formData = {
      title: 'Prod',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img.png',
    };
    component.productForm.setValue(formData);
    component.onSubmit();
    expect(component.save.emit).toHaveBeenCalledWith(formData);
  });

  it('no debe emitir save si el formulario es inválido', () => {
    spyOn(component.save, 'emit');
    component.productForm.setValue({
      title: '',
      price: null,
      description: '',
      category: '',
      image: '',
    });
    component.onSubmit();
    expect(component.save.emit).not.toHaveBeenCalled();
  });

  it('debe cargar datos del producto cuando se proporciona', () => {
    const testProduct: Product = {
      id: 1,
      title: 'Test Product',
      price: 100,
      description: 'Test Description',
      category: 'Test Category',
      image: 'test.jpg',
    };

    component.product = testProduct;

    expect(component.productForm.get('title')?.value).toBe('Test Product');
    expect(component.productForm.get('price')?.value).toBe(100);
    expect(component.productForm.get('description')?.value).toBe(
      'Test Description'
    );
    expect(component.productForm.get('category')?.value).toBe('Test Category');
    expect(component.productForm.get('image')?.value).toBe('test.jpg');
  });

  it('no debe hacer nada si se proporciona producto null', () => {
    const initialValues = component.productForm.value;
    component.product = null;
    expect(component.productForm.value).toEqual(initialValues);
  });

  it('debe deshabilitar el botón cuando el formulario es inválido', () => {
    component.productForm.setValue({
      title: '',
      price: null,
      description: '',
      category: '',
      image: '',
    });
    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(
      By.css('button[type="submit"]')
    );
    expect(submitButton.nativeElement.disabled).toBeTrue();
  });

  it('debe habilitar el botón cuando el formulario es válido', () => {
    component.productForm.setValue({
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img.png',
    });
    fixture.detectChanges();

    const submitButton = fixture.debugElement.query(
      By.css('button[type="submit"]')
    );
    expect(submitButton.nativeElement.disabled).toBeFalse();
  });

  it('debe llamar onSubmit cuando se envía el formulario', () => {
    spyOn(component, 'onSubmit');
    component.productForm.setValue({
      title: 'Test',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img.png',
    });

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', null);

    expect(component.onSubmit).toHaveBeenCalled();
  });
});
