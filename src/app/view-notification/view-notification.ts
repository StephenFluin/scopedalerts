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
  styleUrls: ['./view-notification.scss'],
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

  async ngOnInit(): Promise<void> {
    // Ensure auth is initialized to check admin status
    await this.userService.ensureAuthInitialized();

    this.loadNotification();
  }

  private async loadNotification(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.isLoading.set(false);
      return;
    }

    try {
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
