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
  validate,
  submit,
  Field,
  schema,
  customError,
  FieldPath,
  ValidationError,
} from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { Notice } from '../models/notice';
import { ValidationErrorsComponent } from '../components/validation-errors';

// Interface for the Signal Form
interface NotificationFormData {
  title: string;
  slug: string;
  description: string;
  datetime: string;
}

// Custom validators
function validateSlugPattern(path: FieldPath<string>): void {
  validate(path, (ctx) => {
    const value = ctx.value();
    const pattern = /^[a-z0-9-]+$/;

    if (!pattern.test(value)) {
      return customError({
        kind: 'pattern',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      });
    }

    return null;
  });
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
  styles: `
    .edit-notification-container {
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

    .breadcrumb-separator {
      color: var(--color-text-muted);
    }

    .form-header {
      margin-bottom: var(--spacing-3xl);
    }
    
    .form-header h1 {
      margin: 0;
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .notification-form {
      background-color: var(--card-background);
      border: var(--card-border);
      border-radius: var(--card-radius);
      padding: var(--card-padding-lg);
      box-shadow: var(--card-shadow);
    }

    .form-section {
      margin-bottom: var(--spacing-3xl);
    }

    .form-field {
      margin-bottom: var(--spacing-xl);
    }
    
    .form-field label {
      display: block;
      margin-bottom: var(--spacing-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
    }
    
    .form-field .field-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin-top: var(--spacing-xs);
    }
    
    .form-field .error-message {
      color: var(--color-error-600);
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: var(--form-field-padding);
      border: var(--form-field-border);
      border-radius: var(--form-field-radius);
      font-size: var(--font-size-base);
      font-family: inherit;
      background-color: var(--form-field-background);
      color: var(--color-text-primary);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }
    
    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: var(--focus-ring);
    }
    
    .form-input::placeholder,
    .form-textarea::placeholder {
      color: var(--color-text-placeholder);
    }
    
    .form-input:disabled,
    .form-textarea:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
      line-height: var(--line-height-relaxed);
    }

    .products-selection {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-surface-variant);
    }

    .product-checkbox {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      cursor: pointer;
      padding: var(--spacing-sm);
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
    }
    
    .product-checkbox:hover {
      background-color: var(--color-hover-light);
    }
    
    .product-checkbox:focus-within {
      background-color: var(--color-hover-light);
    }
    
    .product-checkbox input[type="checkbox"] {
      margin-top: 2px;
      flex-shrink: 0;
      cursor: pointer;
    }
    
    .product-checkbox input[type="checkbox"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .product-info {
      flex: 1;
    }

    .product-name {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-xs);
      font-size: var(--font-size-base);
    }

    .product-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: var(--line-height-base);
    }

    .error-message {
      color: var(--color-error-600);
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-lg);
      justify-content: flex-end;
      margin-top: var(--spacing-2xl);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--color-border);
    }

    .primary-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    .cancel-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--button-padding-md);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      background-color: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
    }
    
    .cancel-btn:hover:not(:disabled) {
      background-color: var(--color-hover-light);
      border-color: var(--color-border-focus);
    }
    
    .cancel-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .cancel-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    .save-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--button-padding-md);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      background-color: var(--color-primary-600);
      color: white;
    }
    
    .save-btn:hover:not(:disabled) {
      background-color: var(--color-primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    .save-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    .delete-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--button-padding-md);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      background-color: var(--color-error-600);
      color: white;
    }
    
    .delete-btn:hover:not(:disabled) {
      background-color: var(--color-error-700);
    }
    
    .delete-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .delete-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      color: var(--color-text-muted);
      text-decoration: none;
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      cursor: pointer;
      transition: all var(--transition-fast);
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

    .delete-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .delete-modal {
      background-color: var(--card-background);
      border: var(--card-border);
      border-radius: var(--card-radius);
      padding: var(--card-padding-lg);
      box-shadow: var(--card-shadow);
      max-width: 400px;
      width: 90%;
      margin: var(--spacing-lg);
    }
    
    .delete-modal h3 {
      margin: 0 0 var(--spacing-lg) 0;
      color: var(--color-error-600);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }
    
    .delete-modal p {
      margin: 0 0 var(--spacing-2xl) 0;
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
    }

    .modal-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .edit-notification-container {
        padding: var(--spacing-sm);
      }
      
      .form-header h1 {
        font-size: var(--font-size-2xl);
      }
      
      .form-actions {
        flex-direction: column;
        align-items: stretch;
        
        .primary-actions {
          order: 2;
          width: 100%;
        }
        
        .primary-actions .cancel-btn,
        .primary-actions .save-btn {
          flex: 1;
        }
        
        .dangerous-actions {
          order: 1;
          width: 100%;
          margin-bottom: var(--spacing-lg);
        }
        
        .dangerous-actions .delete-btn {
          width: 100%;
        }
      }
      
      .delete-modal {
        margin: var(--spacing-lg);
        
        .modal-actions {
          flex-direction: column;
        }
        
        .modal-actions .cancel-btn,
        .modal-actions .delete-btn {
          width: 100%;
        }
      }
    }
  `,
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
        const slug = this.generateSlug(title);
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
            this.populateForm(notification);
          } else {
            // Notification not found
            this.router.navigate(['/']);
            return;
          }
        }
      } else {
        // Set default datetime to now (in local timezone for the input)
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        this.notificationData.update(() => ({
          title: '',
          slug: '',
          description: '',
          datetime: localDateTime,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateForm(notification: Notice): void {
    // Convert UTC datetime to local datetime for the input
    // The datetime from the database is in UTC ISO string format
    const utcDate = new Date(notification.datetime);
    // Convert to local timezone for the datetime-local input
    const localDateTime = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.notificationData.update(() => ({
      title: notification.title,
      slug: notification.slug,
      description: notification.description,
      datetime: localDateTime,
    }));

    this.selectedProducts.set([...notification.affectedProducts]);
  }

  protected isProductSelected(productId: string): boolean {
    return this.selectedProducts().includes(productId);
  }

  protected toggleProduct(productId: string): void {
    this.selectedProducts.update((selected: string[]) => {
      if (selected.includes(productId)) {
        return selected.filter((id: string) => id !== productId);
      } else {
        return [...selected, productId];
      }
    });
  }

  protected async onSubmit(event: Event): Promise<void> {
    console.log('attempgint submit');
    event.preventDefault();
    // Validate products selection
    if (this.selectedProducts().length === 0) {
      return;
    }

    this.isSaving.set(true);

    submit(this.notificationForm, async (form) => {
      try {
        const formValue = form().value();
        console.log('form value:', formValue);

        // Convert local datetime input to UTC for storage
        // The datetime-local input value is in format "YYYY-MM-DDTHH:mm"
        // When we create a Date from this, it's interpreted as local time
        const localDate = new Date(formValue.datetime);
        // toISOString() automatically converts to UTC
        const utcDateTimeString = localDate.toISOString();

        const notificationData = {
          title: formValue.title,
          slug: formValue.slug,
          description: formValue.description,
          datetime: utcDateTimeString,
          affectedProducts: this.selectedProducts(),
        };

        if (this.isNewNotification()) {
          console.log('Creating notification with data:', notificationData);
          const id = await this.notificationService.createNotification(notificationData);
          this.router.navigate(['/notifications', formValue.slug]);
        } else {
          // Find the existing notification to get its ID
          const existingNotification = await this.notificationService.getNotificationBySlug(
            this.originalSlug()
          );
          if (existingNotification) {
            await this.notificationService.updateNotification(
              existingNotification.id,
              notificationData
            );
            this.router.navigate(['/notifications', formValue.slug]);
          }
        }

        return null; // No error
      } catch (error) {
        console.error('Error saving notification:', error);
        return {
          kind: 'processing_error',
          message: 'Failed to save notification. Please try again.',
        };
      } finally {
        this.isSaving.set(false);
      }
    });
  }

  protected confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected async deleteNotification(): Promise<void> {
    if (this.isNewNotification()) return;

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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
