import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductFormComponent } from './product-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent, FormsModule, ReactiveFormsModule]
    }).compileComponents();
    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el formulario correctamente', () => {
    expect(component).toBeTruthy();
    expect(component.productForm).toBeDefined();
  });

  it('debe emitir save con datos válidos', () => {
    spyOn(component.save, 'emit');
    component.productForm.setValue({
      title: 'Prod',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img.png'
    });
    component.onSubmit();
    expect(component.save.emit).toHaveBeenCalledWith({
      title: 'Prod',
      price: 10,
      description: 'desc',
      category: 'cat',
      image: 'img.png'
    });
  });

  it('no debe emitir save si el formulario es inválido', () => {
    spyOn(component.save, 'emit');
    component.productForm.setValue({
      title: '',
      price: null,
      description: '',
      category: '',
      image: ''
    });
    component.onSubmit();
    expect(component.save.emit).not.toHaveBeenCalled();
  });
});
