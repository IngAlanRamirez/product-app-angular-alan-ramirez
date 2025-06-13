import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../product.service';

@Component({
  selector: 'app-product-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-search-modal.component.html',
  styleUrls: ['./product-search-modal.component.scss']
})
export class ProductSearchModalComponent {
  @Input() visible = false;
  @Input() loading = false;
  @Input() product: Product | null = null;
  @Input() error: string | null = null;
  @Output() search = new EventEmitter<number>();
  @Output() close = new EventEmitter<void>();

  productId: string = '';

  onSearch() {
    const id = parseInt(this.productId, 10);
    if (!isNaN(id)) {
      this.search.emit(id);
    }
  }

  onClose() {
    this.close.emit();
    this.productId = '';
  }
}
