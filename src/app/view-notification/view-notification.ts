import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { Notice } from '../models/notice';
import { Product } from '../models/product';

@Component({
  selector: 'app-view-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-notification.html',
  styles: `
    .view-notification-container {
      max-width: var(--max-width-content);
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4xl) var(--spacing-lg);
      text-align: center;
    }

    .error-container h1 {
      color: var(--color-error-600);
      margin-bottom: var(--spacing-lg);
    }
    
    .error-container p {
      color: var(--color-text-muted);
      margin-bottom: var(--spacing-xl);
    }

    .loading-spinner {
      color: var(--color-text-muted);
      font-size: var(--font-size-lg);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-sm);
    }
    
    .breadcrumb .separator {
      color: var(--color-text-muted);
    }

    .breadcrumb-link {
      color: var(--color-link);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
    }
    
    .breadcrumb-link:hover {
      text-decoration: underline;
    }
    
    .breadcrumb-link:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .title-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }
    
    .title-section h1 {
      margin: 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .admin-actions {
      display: flex;
      gap: var(--spacing-md);
      flex-shrink: 0;
    }

    .notification-meta {
      background-color: var(--color-surface);
      border: var(--card-border);
      border-radius: var(--card-radius);
      padding: var(--card-padding);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-2xl);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }
    
    .meta-item:last-child {
      margin-bottom: 0;
    }
    
    .meta-item strong {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
    }
    
    .meta-item span {
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }

    .affected-products {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .product-tag {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      line-height: 1;
      background-color: var(--color-gray-100);
      color: var(--color-text-secondary);
    }

    .notification-content {
      margin-bottom: var(--spacing-3xl);
    }

    .description-section,
    .products-section {
      background-color: var(--color-surface);
      border: var(--card-border);
      border-radius: var(--card-radius);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-2xl);
    }
    
    .description-section h2,
    .products-section h2 {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .description-text {
      font-size: var(--font-size-base);
      line-height: var(--line-height-relaxed);
      color: var(--color-text-secondary);
      white-space: pre-wrap;
    }

    .products-list {
      display: grid;
      gap: var(--spacing-lg);
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .product-card {
      background-color: var(--color-surface-variant);
      border-radius: var(--radius-md);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-border);
    }
    
    .product-card h3 {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
    
    .product-card p {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-base);
    }

    .actions-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-lg);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--color-border);
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    
    .back-btn:hover:not(:disabled) {
      color: var(--color-link);
      text-decoration: underline;
    }
    
    .back-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .edit-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: 10px 20px;
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      background-color: var(--color-secondary);
      color: white;
    }
    
    .edit-btn:hover:not(:disabled) {
      background-color: var(--color-secondary-hover);
    }
    
    .edit-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .edit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .view-notification-container {
        padding: var(--spacing-sm);
      }
      
      .title-section {
        flex-direction: column;
        align-items: flex-start;
        
        h1 {
          font-size: var(--font-size-2xl);
        }
      }
      
      .description-section,
      .products-section {
        padding: var(--card-padding);
      }
      
      .products-list {
        grid-template-columns: 1fr;
      }
      
      .actions-section {
        flex-direction: column;
        align-items: stretch;
        
        .edit-btn {
          text-align: center;
        }
      }
      
      .meta-item strong, 
      .meta-item span {
        font-size: var(--font-size-sm);
      }
    }

    html.dark .product-tag {
      background-color: rgba(63, 81, 181, 0.2);
      color: var(--color-primary-500);
    }
  `,
  imports: [RouterLink, DatePipe],
})
export class ViewNotification implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  protected readonly notification = signal<Notice | null>(null);
  protected readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadNotification();
  }

  private async loadNotification(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/']);
      return;
    }

    this.isLoading.set(true);

    try {
      // Ensure products are loaded
      await this.productService.loadProducts();

      const notice = await this.notificationService.getNotificationBySlug(slug);
      this.notification.set(notice);

      if (!notice) {
        // Notification not found, could redirect or show error
        console.warn(`Notification with slug "${slug}" not found`);
      }
    } catch (error) {
      console.error('Error loading notification:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected getProductById(id: string): Product | undefined {
    return this.productService.allProducts().find((p) => p.id === id);
  }
}
