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
import { form, required, maxLength, submit, FormField, schema } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { Notice, NoticeSeverity, NoticeStatus } from '../models/notice';
import { ToastService } from '../services/toast.service';
import { ValidationErrorsComponent } from '../components/validation-errors';
import { MarkdownPipe } from '../shared/markdown.pipe';
import { validateSlugPattern, generateSlug, SEVERITY_LABELS } from '../utils';

// Interface for the Signal Form
interface NotificationFormData {
  title: string;
  slug: string;
  description: string;
  datetime: string;
  severity: NoticeSeverity;
  status: NoticeStatus;
  endsAt: string;
  summary: string;
}

// Notification form schema
const notificationSchema = schema<NotificationFormData>((path) => {
  required(path.title, { message: 'Title is required' });
  required(path.slug, { message: 'Slug is required' });
  required(path.description, { message: 'Description is required' });
  required(path.datetime, { message: 'Date and time are required' });
  maxLength(path.summary, 1000, { message: 'Summary must be no more than 1000 characters' });

  validateSlugPattern(path.slug);
});

@Component({
  selector: 'app-edit-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-notification.html',
  styleUrls: ['./edit-notification.scss'],
  imports: [RouterLink, FormField, ValidationErrorsComponent, MarkdownPipe],
})
export class EditNotification implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);
  private toast = inject(ToastService);

  protected readonly severityOptions = Object.entries(SEVERITY_LABELS) as [NoticeSeverity, string][];
  protected readonly showPreview = signal(false);
  protected readonly drafting = signal(false);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly selectedProducts = signal<string[]>([]);
  protected readonly originalSlug = signal<string>('');

  // Track form submission for validation
  protected readonly formSubmitted = signal(false);

  // Signal Form setup
  protected notificationData = linkedSignal<NotificationFormData>(() => ({
    title: '',
    slug: '',
    description: '',
    datetime: '',
    severity: 'info',
    status: 'resolved',
    endsAt: '',
    summary: '',
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
              severity: notification.severity ?? 'info',
              status: notification.status ?? 'resolved',
              endsAt: notification.endsAt
                ? new DatePipe('en-US').transform(new Date(notification.endsAt), 'yyyy-MM-ddTHH:mm') || ''
                : '',
              summary: notification.summary ?? '',
            }));

            this.selectedProducts.set(notification.affectedProducts);
          }
        }
      } else {
        // Set default datetime to current time for new notifications
        const now = new Date();
        const defaultDatetime = new DatePipe('en-US').transform(now, 'yyyy-MM-ddTHH:mm') || '';

        this.notificationData.update((data) => ({
          ...data,
          datetime: defaultDatetime,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    // Mark form as submitted for validation display
    this.formSubmitted.set(true);

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
          severity: formValue.severity,
          status: formValue.status,
        };
        // Optional fields: omitted on create, cleared (null) on update when left empty
        const endsAt = formValue.endsAt ? new Date(formValue.endsAt).toISOString() : null;
        const summary = formValue.summary.trim() || null;

        if (isNew) {
          await this.notificationService.createNotification({
            ...noticeData,
            ...(endsAt && { endsAt }),
            ...(summary && { summary }),
          });
        } else {
          const existingNotification = await this.notificationService.getNotificationBySlug(
            this.originalSlug()
          );
          if (existingNotification) {
            await this.notificationService.updateNotification(existingNotification.id, {
              ...noticeData,
              endsAt,
              summary,
            } as Partial<Notice>);
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

  /** Asks the server (Claude) to draft a TL;DR and suggest affected products. */
  protected async draftSummary(): Promise<void> {
    const { title, description } = this.notificationData();
    if (!description.trim()) {
      this.toast.info('Write a description first');
      return;
    }

    this.drafting.set(true);
    try {
      const idToken = await this.userService.getIdToken();
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          title,
          description,
          products: this.productService
            .allProducts()
            .map(({ id, name, description }) => ({ id, name, description })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? 'Summary generation failed');
      }

      this.notificationData.update((data) => ({ ...data, summary: result.summary }));

      const suggested: string[] = result.suggestedProductIds ?? [];
      const missing = suggested.filter((id) => !this.selectedProducts().includes(id));
      if (this.selectedProducts().length === 0) {
        this.selectedProducts.set(suggested);
      } else if (missing.length > 0) {
        const names = missing
          .map((id) => this.productService.allProducts().find((p) => p.id === id)?.name)
          .join(', ');
        this.toast.show(`Also affects ${names}?`, 'info', 8000, {
          label: 'Add',
          callback: () => this.selectedProducts.update((ids) => [...ids, ...missing]),
        });
      }
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Summary generation failed');
    } finally {
      this.drafting.set(false);
    }
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
