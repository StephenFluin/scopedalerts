import {
  Component,
  inject,
  signal,
  OnInit,
  ChangeDetectionStrategy,
  linkedSignal,
  computed,
  effect,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  form,
  required,
  minLength,
  submit,
  Field,
  schema,
  ValidationError,
} from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { Notice } from '../models/notice';
import { ValidationErrorsComponent } from '../components/validation-errors';
import { validateSlugPattern, generateSlug } from '../utils';

// Interface for the Signal Form
interface NotificationFormData {
  title: string;
  slug: string;
  description: string;
  datetime: string;
}

// Notification form schema
const notificationSchema = schema<NotificationFormData>((path) => {
  required(path.title, { message: 'Title is required' });
  required(path.slug, { message: 'Slug is required' });
  required(path.description, { message: 'Description is required' });
  required(path.datetime, { message: 'Date and time are required' });

  validateSlugPattern(path.slug);
});

@Component({
  selector: 'app-edit-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-notification.html',
  styleUrls: ['./edit-notification.scss'],
  imports: [RouterLink, Field, ValidationErrorsComponent],
})
export class EditNotification implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly selectedProducts = signal<string[]>([]);
  protected readonly originalSlug = signal<string>('');

  // Signal Form setup
  protected notificationData = linkedSignal<NotificationFormData>(() => ({
    title: '',
    slug: '',
    description: '',
    datetime: '',
  }));

  protected notificationForm = form(this.notificationData, notificationSchema);

  // Computed signal to check for products validation
  protected hasProductsError = computed(
    () => this.selectedProducts().length === 0 && this.notificationForm().touched()
  );

  constructor() {
    // Auto-generate slug from title for new notifications
    effect(() => {
      const title = this.notificationForm.title().value();
      if (title && this.isNewNotification()) {
        const slug = generateSlug(title);
        const currentSlug = this.notificationData().slug;
        // Only update if the slug is actually different to prevent infinite loops
        if (slug !== currentSlug) {
          this.notificationData.update((data: NotificationFormData) => ({ ...data, slug }));
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Ensure auth is initialized to check admin status
    await this.userService.ensureAuthInitialized();

    if (!this.userService.isAdmin()) {
      return;
    }

    this.loadData();
  }

  protected isNewNotification(): boolean {
    return this.route.snapshot.paramMap.get('slug') === 'new';
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      await this.productService.loadProducts();

      if (!this.isNewNotification()) {
        const slug = this.route.snapshot.paramMap.get('slug');
        if (slug) {
          this.originalSlug.set(slug);
          const notification = await this.notificationService.getNotificationBySlug(slug);

          if (notification) {
            // Format datetime for datetime-local input
            const datetime = new Date(notification.datetime);
            const formattedDatetime = new DatePipe('en-US').transform(datetime, 'yyyy-MM-ddTHH:mm');

            this.notificationData.update(() => ({
              title: notification.title,
              slug: notification.slug,
              description: notification.description,
              datetime: formattedDatetime || '',
            }));

            this.selectedProducts.set(notification.affectedProducts);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.selectedProducts().length === 0) {
      return;
    }

    this.isSaving.set(true);

    submit(this.notificationForm, async (form) => {
      try {
        const formValue = form().value();
        const isNew = this.isNewNotification();

        // Check if slug is unique (excluding current notification for edits)
        if (isNew || formValue.slug !== this.originalSlug()) {
          const existingNotification = await this.notificationService.getNotificationBySlug(
            formValue.slug
          );
          if (existingNotification && (!isNew || existingNotification.id !== this.originalSlug())) {
            this.isSaving.set(false);
            return {
              kind: 'duplicate_slug',
              message: 'This slug is already in use',
            };
          }
        }

        const noticeData = {
          title: formValue.title,
          slug: formValue.slug,
          description: formValue.description,
          datetime: new Date(formValue.datetime).toISOString(),
          affectedProducts: this.selectedProducts(),
        };

        if (isNew) {
          await this.notificationService.createNotification(noticeData);
        } else {
          const existingNotification = await this.notificationService.getNotificationBySlug(
            this.originalSlug()
          );
          if (existingNotification) {
            await this.notificationService.updateNotification(existingNotification.id, noticeData);
          }
        }

        this.router.navigate(['/notifications', formValue.slug]);
        return null; // No error
      } catch (error) {
        console.error('Error saving notification:', error);
        this.isSaving.set(false);
        return {
          kind: 'save_error',
          message: 'Failed to save notification. Please try again.',
        };
      }
    });
  }

  protected toggleProduct(productId: string): void {
    this.selectedProducts.update((products) => {
      if (products.includes(productId)) {
        return products.filter((id) => id !== productId);
      } else {
        return [...products, productId];
      }
    });
  }

  protected isProductSelected(productId: string): boolean {
    return this.selectedProducts().includes(productId);
  }

  protected confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected async deleteNotification(): Promise<void> {
    try {
      const existingNotification = await this.notificationService.getNotificationBySlug(
        this.originalSlug()
      );
      if (existingNotification) {
        await this.notificationService.deleteNotification(existingNotification.id);
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // TODO: Show error message to user
    }
  }

  protected goBack(): void {
    if (this.isNewNotification()) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/notifications', this.originalSlug()]);
    }
  }
}
