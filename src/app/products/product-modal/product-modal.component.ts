import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductFormComponent } from '../product-form/product-form.component';
import { Product } from '../product.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ProductFormComponent],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss']
})
export class ProductModalComponent {
  @Input() product: Product | null = null;
  @Input() loading = false;
  @Input() visible = false;
  @Output() save = new EventEmitter<Product>();
  @Output() cancel = new EventEmitter<void>();

  close() {
    this.cancel.emit();
  }
}
