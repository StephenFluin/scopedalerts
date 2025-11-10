import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { Notice } from '../models/notice';
import { Product } from '../models/product';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styles: `
    .home-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 16px;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h1 {
        margin: 0;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .header-section h1 {
      color: rgba(255, 255, 255, 0.87);
    }

    .admin-actions {
      display: flex;
      gap: 12px;
    }

    .header-btn {
      background-color: #3f51b5;
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      
      &:hover {
        background-color: #303f9f;
      }
    }

    .filter-section {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    :host-context(body.dark) .filter-section {
      background-color: #1e1e1e;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .product-filter h3 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: rgba(0, 0, 0, 0.87);
    }

    :host-context(body.dark) .product-filter h3 {
      color: rgba(255, 255, 255, 0.87);
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.87);
      
      input[type="checkbox"] {
        margin: 0;
      }
    }

    :host-context(body.dark) .filter-option {
      color: rgba(255, 255, 255, 0.87);
    }

    .rss-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #dc2626;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(220, 38, 38, 0.1);
        color: #b91c1c;
      }
    }

    :host-context(body.dark) .rss-link {
      color: #f87171;
      
      &:hover {
        background-color: rgba(248, 113, 113, 0.1);
        color: #fca5a5;
      }
    }

    .rss-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notification-card {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      
      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    :host-context(body.dark) .notification-card {
      background-color: #1e1e1e;
      border-color: rgba(255, 255, 255, 0.12);
      
      &:hover {
        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
      }
    }

    .notification-header {
      margin-bottom: 12px;
    }

    .notification-title {
      margin: 0 0 8px 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
      cursor: pointer;
      transition: color 0.2s ease;
      
      &:hover {
        color: #3f51b5;
      }
      
      &.expanded {
        color: #3f51b5;
      }
    }

    :host-context(body.dark) .notification-title {
      color: rgba(255, 255, 255, 0.87);
      
      &:hover,
      &.expanded {
        color: #7986cb;
      }
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .notification-date {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    :host-context(body.dark) .notification-date {
      color: rgba(255, 255, 255, 0.6);
    }

    .affected-products {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .product-tag {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    :host-context(body.dark) .product-tag {
      background-color: rgba(25, 118, 210, 0.2);
      color: #64b5f6;
    }

    .notification-preview,
    .notification-description {
      margin: 0 0 12px 0;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.5;
    }

    :host-context(body.dark) .notification-preview,
    :host-context(body.dark) .notification-description {
      color: rgba(255, 255, 255, 0.7);
    }

    .notification-preview {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-actions {
      display: flex;
      gap: 12px;
    }

    .view-link,
    .edit-link {
      color: #3f51b5;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .edit-link {
      color: #ff4081;
    }

    .fab-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      background-color: #3f51b5;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-size: 24px;
      font-weight: 500;
      box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2);
      z-index: 10;
      
      &:hover {
        background-color: #303f9f;
        box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.2);
        transform: scale(1.05);
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 32px;
    }

    .loading-spinner {
      color: rgba(0, 0, 0, 0.6);
    }

    :host-context(body.dark) .loading-spinner {
      color: rgba(255, 255, 255, 0.6);
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      color: rgba(0, 0, 0, 0.6);
    }

    :host-context(body.dark) .empty-state {
      color: rgba(255, 255, 255, 0.6);
    }

    @media (max-width: 768px) {
      .home-container {
        padding: 8px;
      }
      
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .admin-actions {
        width: 100%;
        justify-content: flex-end;
      }
      
      .notification-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .filter-options {
        flex-direction: column;
        gap: 8px;
      }

      .filter-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .rss-link {
        align-self: flex-end;
      }
    }
  `,
  imports: [RouterLink, DatePipe],
})
export class Home implements OnInit {
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  protected readonly selectedProductIds = signal<string[]>([]);
  protected readonly expandedNotifications = signal<string[]>([]);

  protected readonly filteredNotifications = computed(() => {
    const selectedIds = this.selectedProductIds();
    if (selectedIds.length === 0) {
      return this.notificationService.allNotifications();
    }
    return this.notificationService.getNotificationsByProducts(selectedIds);
  });

  protected readonly showAllProducts = computed(() => this.selectedProductIds().length === 0);

  protected readonly rssUrl = computed(() => {
    const selectedIds = this.selectedProductIds();
    if (selectedIds.length === 0) {
      return '/rss';
    }
    const productSlugs = selectedIds.map((id) => this.getProductById(id)?.slug).filter(Boolean);
    return `/rss?products=${productSlugs.join(',')}`;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    await Promise.all([
      this.notificationService.loadNotifications(),
      this.productService.loadProducts(),
    ]);
  }

  toggleAllProducts(): void {
    this.selectedProductIds.set([]);
  }

  toggleProduct(productId: string): void {
    this.selectedProductIds.update((ids) => {
      if (ids.includes(productId)) {
        return ids.filter((id) => id !== productId);
      } else {
        return [...ids, productId];
      }
    });
  }

  toggleExpanded(notificationId: string): void {
    this.expandedNotifications.update((ids) => {
      if (ids.includes(notificationId)) {
        return ids.filter((id) => id !== notificationId);
      } else {
        return [...ids, notificationId];
      }
    });
  }

  getProductById(id: string): Product | undefined {
    return this.productService.allProducts().find((p) => p.id === id);
  }

  getPreview(description: string): string {
    return description.length > 150 ? description.substring(0, 150) + '...' : description;
  }
}
