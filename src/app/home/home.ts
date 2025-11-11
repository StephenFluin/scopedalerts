import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  PendingTasks,
  ElementRef,
  ViewChild,
  AfterViewInit,
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
      max-width: var(--max-width-content);
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }
    
    .header-section h1 {
      margin: 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      line-height: var(--line-height-tight);
    }

    .header-btn {
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
      background-color: var(--color-primary);
      color: white;
    }
    
    .header-btn:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }
    
    .header-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .filter-section {
      background-color: var(--color-surface);
      border: var(--card-border);
      border-radius: var(--card-radius);
      padding: var(--card-padding);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-2xl);
    }

    .product-filter h3 {
      margin: 0 0 var(--spacing-md) 0;
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      font-weight: var(--font-weight-medium);
    }

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      padding: var(--spacing-xs);
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
    }
    
    .filter-option:hover {
      background-color: var(--color-hover-light);
    }
    
    .filter-option:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .filter-option input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }

    .rss-link {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--color-rss-500);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    
    .rss-link:hover {
      background-color: rgba(220, 38, 38, 0.1);
      color: var(--color-rss-600);
    }
    
    .rss-link:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .rss-link .rss-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .notification-card {
      background-color: var(--color-surface);
      border: var(--card-border);
      border-radius: var(--card-radius);
      padding: var(--card-padding);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-lg);
    }

    .notification-header {
      margin-bottom: var(--spacing-md);
    }

    .notification-title-link {
      text-decoration: none;
      color: inherit;
      display: block;
    }
    
    .notification-title-link:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
      border-radius: var(--radius-sm);
    }

    .notification-title {
      margin: 0 0 var(--spacing-sm) 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
    
    .notification-title-link:hover .notification-title {
      color: var(--color-link);
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-md);
    }

    .notification-date {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .affected-products {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .notification-description {
      color: var(--color-text-secondary);
      line-height: var(--line-height-base);
      margin-bottom: var(--spacing-md);
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-actions {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
    }

    .view-link,
    .edit-link {
      display: inline-flex;
      align-items: center;
      color: var(--color-link);
      text-decoration: none;
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      cursor: pointer;
      transition: all var(--transition-fast);
      padding: var(--spacing-xs) 0;
    }
    
    .view-link:hover:not(:disabled),
    .edit-link:hover:not(:disabled) {
      color: var(--color-link-hover);
      text-decoration: underline;
    }

    .edit-link {
      color: var(--color-secondary-600);
    }
    
    .edit-link:hover:not(:disabled) {
      color: var(--color-secondary-700);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4xl) var(--spacing-lg);
      text-align: center;
    }
    
    .loading-container .loading-spinner {
      color: var(--color-text-muted);
      font-size: var(--font-size-lg);
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--spacing-xl) var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }

    .load-more-container .loading-spinner {
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .load-more-container .loading-spinner::before {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid var(--color-text-muted);
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-4xl) var(--spacing-lg);
      color: var(--color-text-muted);
    }

    .end-of-list {
      text-align: center;
      padding: var(--spacing-xl) var(--spacing-lg);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      border-top: 1px solid var(--color-border-light);
      margin-top: var(--spacing-lg);
    }

    .end-of-list p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: var(--spacing-sm);
      }
      
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        
        h1 {
          font-size: var(--font-size-2xl);
        }
        
        .admin-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
      
      .filter-options {
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .filter-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }

      .rss-link {
        align-self: flex-end;
      }

      .notification-description {
        -webkit-line-clamp: 3;
      }
      
      .notification-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
      }
    }

    @media (min-width: 1200px) {
      .notification-description {
        -webkit-line-clamp: 5;
      }
    }

    html.dark .product-tag {
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--color-text-secondary);
    }
  `,
  imports: [RouterLink, DatePipe],
})
export class Home implements OnInit, OnDestroy, AfterViewInit {
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  @ViewChild('loadMoreTrigger', { static: false }) loadMoreTrigger?: ElementRef<HTMLDivElement>;

  protected readonly selectedProductIds = signal<string[]>([]);
  private intersectionObserver?: IntersectionObserver;
  private isLoadingMore = false;

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

  ngAfterViewInit(): void {
    // Delay setup to ensure the view is fully initialized
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private async loadData(): Promise<void> {
    // Reset notifications when loading fresh data
    this.notificationService.resetNotifications();
    await Promise.all([
      this.notificationService.loadNotifications(),
      this.productService.loadProducts(),
    ]);
    // Re-setup observer after loading data
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    // Disconnect existing observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Wait for the loadMoreTrigger to be available
    setTimeout(() => {
      if (!this.loadMoreTrigger?.nativeElement) return;

      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (
            entry.isIntersecting &&
            this.notificationService.hasMoreNotifications() &&
            !this.notificationService.loading() &&
            !this.isLoadingMore
          ) {
            this.loadMoreNotifications();
          }
        },
        {
          rootMargin: '200px', // Trigger 200px before the element comes into view
          threshold: 0.1,
        }
      );

      this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
    }, 0);
  }

  private async loadMoreNotifications(): Promise<void> {
    if (this.isLoadingMore) return;

    this.isLoadingMore = true;
    try {
      await this.notificationService.loadMoreNotifications();
      // Re-setup observer after loading more content
      setTimeout(() => {
        this.setupIntersectionObserver();
      }, 100);
    } finally {
      this.isLoadingMore = false;
    }
  }

  toggleAllProducts(): void {
    this.selectedProductIds.set([]);
    // Don't reload data for filter changes - just use the computed filtered notifications
  }

  toggleProduct(productId: string): void {
    this.selectedProductIds.update((ids) => {
      if (ids.includes(productId)) {
        return ids.filter((id) => id !== productId);
      } else {
        return [...ids, productId];
      }
    });
    // Don't reload data for filter changes - just use the computed filtered notifications
  }

  getProductById(id: string): Product | undefined {
    return this.productService.allProducts().find((p) => p.id === id);
  }
}
