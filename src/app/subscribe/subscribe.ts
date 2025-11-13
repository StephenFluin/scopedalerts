import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { SubscriptionService } from '../services/subscription.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { Product } from '../models/product';

@Component({
  selector: 'app-subscribe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="subscribe-container">
    <div class="header-section">
      <div class="header-content">
        <button class="back-btn" (click)="onBack()" aria-label="Go back">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 12H5m7-7l-7 7 7 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Back
        </button>
        <div class="header-text">
          <h1>Manage Subscriptions</h1>
          <p>Select the products you want to receive notifications for.</p>
        </div>
      </div>
    </div>

    @if (loading()) {
    <div class="loading-container">
      <div class="loading-spinner">Loading products...</div>
    </div>
    } @else {
    <div class="content-section">
      <form class="subscription-form" (ngSubmit)="onSave()">
        @if (products().length === 0) {
        <div class="empty-state">
          <p>No products available for subscription.</p>
        </div>
        } @else {
        <div class="products-list">
          @for (product of products(); track product.id) {
          <label class="product-item">
            <input
              type="checkbox"
              [checked]="isProductSelected(product.id)"
              (change)="onProductToggle(product.id, $any($event.target).checked)"
              [disabled]="saving()"
              class="product-checkbox"
            />
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-description">{{ product.description }}</p>
            </div>
          </label>
          }
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="cancel-btn"
            (click)="onCancel()"
            [disabled]="!hasChanges() || saving()"
          >
            Cancel
          </button>
          <button type="submit" class="save-btn" [disabled]="!hasChanges() || saving()">
            @if (saving()) {
            <span class="btn-spinner">Saving...</span>
            } @else { Save Changes }
          </button>
        </div>
        }
      </form>
    </div>
    }
  </div>`,
  styles: [
    `
      .subscribe-container {
        max-width: var(--max-width-content);
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .header-section {
        margin-bottom: var(--spacing-2xl);
      }

      .header-content {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-lg);
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        background: none;
        border: var(--card-border);
        border-radius: var(--radius-md);
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .back-btn:hover {
        background-color: var(--color-hover-light);
        color: var(--color-text-primary);
      }

      .back-btn:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
      }

      .back-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .header-text {
        flex: 1;
      }

      .header-text h1 {
        margin: 0 0 var(--spacing-sm) 0;
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .header-text p {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--font-size-base);
      }

      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--spacing-4xl) var(--spacing-lg);
        text-align: center;
      }

      .loading-spinner {
        color: var(--color-text-muted);
        font-size: var(--font-size-lg);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .loading-spinner::before {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid var(--color-text-muted);
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .content-section {
        background-color: var(--color-surface);
        border: var(--card-border);
        border-radius: var(--card-radius);
        padding: var(--card-padding);
        box-shadow: var(--shadow-sm);
      }

      .subscription-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
      }

      .products-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .product-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border: var(--card-border);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .product-item:hover {
        background-color: var(--color-hover-light);
      }

      .product-item:focus-within {
        box-shadow: var(--focus-ring);
      }

      .product-checkbox {
        margin: 0;
        cursor: pointer;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .product-checkbox:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .product-info {
        flex: 1;
        min-width: 0;
      }

      .product-name {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .product-description {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--color-border-light);
      }

      .cancel-btn,
      .save-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
        min-width: 100px;
      }

      .cancel-btn {
        background-color: var(--color-surface);
        color: var(--color-text-secondary);
        border: var(--card-border);
      }

      .cancel-btn:hover:not(:disabled) {
        background-color: var(--color-hover-light);
        color: var(--color-text-primary);
      }

      .cancel-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .save-btn {
        background-color: var(--color-primary);
        color: white;
      }

      .save-btn:hover:not(:disabled) {
        background-color: var(--color-primary-hover);
      }

      .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .save-btn:focus-visible,
      .cancel-btn:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
      }

      .btn-spinner {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .btn-spinner::before {
        content: '';
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        opacity: 0.8;
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-2xl) var(--spacing-lg);
        color: var(--color-text-muted);
      }

      .empty-state p {
        margin: 0;
        font-size: var(--font-size-lg);
      }

      @media (max-width: 768px) {
        .subscribe-container {
          padding: var(--spacing-sm);
        }

        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-md);
        }

        .back-btn {
          align-self: flex-start;
        }

        .header-text h1 {
          font-size: var(--font-size-xl);
        }

        .product-item {
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .product-checkbox {
          align-self: flex-start;
          margin-top: 0;
        }

        .form-actions {
          flex-direction: column;
        }

        .cancel-btn,
        .save-btn {
          width: 100%;
        }
      }

      @media (max-width: 480px) {
        .product-item {
          padding: var(--spacing-sm);
        }

        .header-text h1 {
          font-size: var(--font-size-lg);
        }
      }
    `,
  ],
  imports: [CommonModule, FormsModule],
})
export class SubscribeComponent implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  private subscriptionService = inject(SubscriptionService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  protected readonly selectedProductIds = signal<Set<string>>(new Set());
  protected readonly hasChanges = signal(false);

  protected readonly user = computed(() => this.userService.user());
  protected readonly products = computed(() => this.productService.allProducts());
  protected readonly subscriptions = computed(() => this.subscriptionService.userSubscriptions());
  protected readonly loading = computed(
    () => this.productService.loading() || this.subscriptionService.isLoading()
  );
  protected readonly saving = computed(() => this.subscriptionService.isSaving());

  ngOnInit(): void {
    // Redirect if not logged in
    const user = this.user();
    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.productService.loadProducts(),
        this.subscriptionService.loadSubscriptions(),
      ]);

      // Initialize selected product IDs from current subscriptions
      const subscribedIds = this.subscriptionService.subscribedProductIds();
      this.selectedProductIds.set(new Set(subscribedIds));
      this.hasChanges.set(false);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      this.toastService.error('Failed to load subscription data');
    }
  }

  onProductToggle(productId: string, isChecked: boolean): void {
    const currentSet = new Set(this.selectedProductIds());

    if (isChecked) {
      currentSet.add(productId);
    } else {
      currentSet.delete(productId);
    }

    this.selectedProductIds.set(currentSet);

    // Check if there are changes compared to original subscriptions
    const originalIds = new Set(this.subscriptionService.subscribedProductIds());
    const hasChanges = !this.setsEqual(currentSet, originalIds);
    this.hasChanges.set(hasChanges);
  }

  private setsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  async onSave(): Promise<void> {
    if (!this.hasChanges() || this.saving()) {
      return;
    }

    try {
      const selectedIds = Array.from(this.selectedProductIds());
      await this.subscriptionService.saveSubscriptions(selectedIds);

      this.hasChanges.set(false);
      this.toastService.success('Subscriptions saved successfully!');
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      this.toastService.error('Failed to save subscriptions');
    }
  }

  onCancel(): void {
    // Reset to original subscriptions
    const originalIds = this.subscriptionService.subscribedProductIds();
    this.selectedProductIds.set(new Set(originalIds));
    this.hasChanges.set(false);
  }

  onBack(): void {
    this.router.navigate(['/']);
  }
}
