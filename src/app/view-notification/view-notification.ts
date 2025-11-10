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
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 16px;
      text-align: center;
    }

    .loading-spinner {
      color: rgba(0, 0, 0, 0.6);
      font-size: 1.125rem;
    }

    :host-context(body.dark) .loading-spinner {
      color: rgba(255, 255, 255, 0.6);
    }

    .breadcrumb {
      margin-bottom: 16px;
    }

    .breadcrumb-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .title-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      
      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.87);
        line-height: 1.2;
      }
    }

    :host-context(body.dark) .title-section h1 {
      color: rgba(255, 255, 255, 0.87);
    }

    .admin-actions {
      flex-shrink: 0;
    }

    .notification-meta {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    :host-context(body.dark) .notification-meta {
      background-color: #1e1e1e;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      strong {
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
      
      span {
        color: rgba(0, 0, 0, 0.7);
      }
    }

    :host-context(body.dark) .meta-item {
      strong {
        color: rgba(255, 255, 255, 0.87);
      }
      
      span {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .affected-products {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .product-tag {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    :host-context(body.dark) .product-tag {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }

    .notification-content {
      margin-bottom: 32px;
    }

    .description-section,
    .products-section {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      
      h2 {
        margin: 0 0 16px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .description-section,
    :host-context(body.dark) .products-section {
      background-color: #1e1e1e;
      border-color: rgba(255, 255, 255, 0.12);
      
      h2 {
        color: rgba(255, 255, 255, 0.87);
      }
    }

    .description-text {
      font-size: 1rem;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.7);
      white-space: pre-wrap;
    }

    :host-context(body.dark) .description-text {
      color: rgba(255, 255, 255, 0.7);
    }

    .products-list {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .product-card {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      
      h3 {
        margin: 0 0 8px 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
      
      p {
        margin: 0;
        font-size: 0.875rem;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.4;
      }
    }

    :host-context(body.dark) .product-card {
      background-color: rgba(255, 255, 255, 0.05);
      
      h3 {
        color: rgba(255, 255, 255, 0.87);
      }
      
      p {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .actions-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    :host-context(body.dark) .actions-section {
      border-top-color: rgba(255, 255, 255, 0.12);
    }

    .back-btn {
      color: #666;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        color: #3f51b5;
        text-decoration: underline;
      }
    }

    .edit-btn {
      background-color: #ff4081;
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      
      &:hover {
        background-color: #e91e63;
      }
    }

    .error-container {
      h1 {
        color: #f44336;
        margin-bottom: 16px;
      }
      
      p {
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 24px;
      }
    }

    :host-context(body.dark) .error-container {
      p {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    @media (max-width: 768px) {
      .view-notification-container {
        padding: 8px;
      }
      
      .title-section {
        flex-direction: column;
        align-items: flex-start;
        
        h1 {
          font-size: 1.5rem;
        }
      }
      
      .description-section,
      .products-section {
        padding: 16px;
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
      
      .meta-item {
        strong, span {
          font-size: 0.875rem;
        }
      }
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
