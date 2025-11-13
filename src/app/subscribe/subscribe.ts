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
      <div class="loading-spinner">
        @if (!authCheckComplete()) { Checking authentication... } @else { Loading products... }
      </div>
    </div>
    } @else if (!user()) {
    <div class="auth-error-section">
      <div class="auth-error-card">
        <div class="auth-error-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h2>Authentication Required</h2>
        <p>You need to sign in to manage your subscriptions.</p>
        <button class="sign-in-btn" (click)="onSignIn()">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
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

      .auth-error-section {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--spacing-4xl) var(--spacing-lg);
      }

      .auth-error-card {
        background-color: var(--color-surface);
        border: var(--card-border);
        border-radius: var(--card-radius);
        padding: var(--spacing-2xl);
        box-shadow: var(--shadow-sm);
        text-align: center;
        max-width: 400px;
        width: 100%;
      }

      .auth-error-icon {
        margin: 0 auto var(--spacing-lg);
        width: 64px;
        height: 64px;
        color: var(--color-text-muted);
      }

      .auth-error-icon svg {
        width: 100%;
        height: 100%;
      }

      .auth-error-card h2 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .auth-error-card p {
        margin: 0 0 var(--spacing-xl) 0;
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      .sign-in-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-xl);
        background-color: white;
        border: 1px solid #dadce0;
        border-radius: var(--radius-md);
        color: #3c4043;
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;
      }

      .sign-in-btn:hover {
        background-color: #f8f9fa;
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
      }

      .sign-in-btn:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
      }

      .google-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
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

        .auth-error-section {
          padding: var(--spacing-xl) var(--spacing-md);
        }

        .auth-error-card {
          padding: var(--spacing-xl);
        }

        .sign-in-btn {
          width: 100%;
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
  protected readonly authCheckComplete = signal(false);

  protected readonly user = computed(() => this.userService.user());
  protected readonly products = computed(() => this.productService.allProducts());
  protected readonly subscriptions = computed(() => this.subscriptionService.userSubscriptions());
  protected readonly loading = computed(
    () =>
      this.productService.loading() ||
      this.subscriptionService.isLoading() ||
      !this.authCheckComplete()
  );
  protected readonly saving = computed(() => this.subscriptionService.isSaving());

  async ngOnInit(): Promise<void> {
    try {
      // Ensure authentication is initialized first
      await this.userService.ensureAuthInitialized();

      // Wait a bit for Firebase auth state to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      this.authCheckComplete.set(true);

      // Load data if user is authenticated
      const user = this.user();
      if (user) {
        await this.loadData();
      }
      // If no user, the template will show the auth error
    } catch (error) {
      console.error('Error during component initialization:', error);
      this.authCheckComplete.set(true);
    }
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

  async onSignIn(): Promise<void> {
    try {
      await this.userService.signInWithGoogle();
      // After successful sign-in, load data
      if (this.user()) {
        await this.loadData();
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      this.toastService.error('Failed to sign in');
    }
  }
}
