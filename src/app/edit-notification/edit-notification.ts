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

    :host-context(body.dark) .error-container p {
      color: rgba(255, 255, 255, 0.6);
    }

    .breadcrumb {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breadcrumb-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .breadcrumb-separator {
      color: rgba(0, 0, 0, 0.4);
    }

    :host-context(body.dark) .breadcrumb-separator {
      color: rgba(255, 255, 255, 0.4);
    }

    .form-header {
      margin-bottom: 32px;
      
      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .form-header h1 {
      color: rgba(255, 255, 255, 0.87);
    }

    .notification-form {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
    }

    :host-context(body.dark) .notification-form {
      background-color: #1e1e1e;
      border-color: rgba(255, 255, 255, 0.12);
    }

    .form-section {
      margin-bottom: 32px;
    }

    .form-field {
      margin-bottom: 24px;
      
      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .form-field label {
      color: rgba(255, 255, 255, 0.87);
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      font-family: inherit;
      background-color: white;
      color: rgba(0, 0, 0, 0.87);
      transition: border-color 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: #3f51b5;
      }
      
      &::placeholder {
        color: rgba(0, 0, 0, 0.4);
      }
    }

    :host-context(body.dark) .form-input,
    :host-context(body.dark) .form-textarea {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .products-selection {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background-color: #f9f9f9;
    }

    :host-context(body.dark) .products-selection {
      background-color: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .product-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
      
      input[type="checkbox"] {
        margin-top: 2px;
        flex-shrink: 0;
      }
    }

    :host-context(body.dark) .product-checkbox {
      &:hover {
        background-color: rgba(255, 255, 255, 0.02);
      }
    }

    .product-name {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
      margin-bottom: 2px;
    }

    .product-description {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }

    :host-context(body.dark) .product-name {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(body.dark) .product-description {
      color: rgba(255, 255, 255, 0.6);
    }

    .error-message {
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    :host-context(body.dark) .form-actions {
      border-top-color: rgba(255, 255, 255, 0.12);
    }

    .primary-actions {
      display: flex;
      gap: 12px;
    }

    .cancel-btn {
      background: none;
      border: 1px solid #e0e0e0;
      color: rgba(0, 0, 0, 0.87);
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      
      &:hover:not(:disabled) {
        background-color: #f5f5f5;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    :host-context(body.dark) .cancel-btn {
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
      
      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    .save-btn {
      background-color: #3f51b5;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      
      &:hover:not(:disabled) {
        background-color: #303f9f;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .delete-btn {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      
      &:hover:not(:disabled) {
        background-color: #d32f2f;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
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
    }

    .delete-modal {
      background-color: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      
      h3 {
        margin: 0 0 16px 0;
        color: #f44336;
      }
      
      p {
        margin: 0 0 24px 0;
        color: rgba(0, 0, 0, 0.7);
      }
    }

    :host-context(body.dark) .delete-modal {
      background-color: #1e1e1e;
      
      p {
        color: rgba(255, 255, 255, 0.7);
      }
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .edit-notification-container {
        padding: 8px;
      }
      
      .notification-form {
        padding: 16px;
      }
      
      .form-header h1 {
        font-size: 1.5rem;
      }
      
      .form-actions {
        flex-direction: column;
        align-items: stretch;
        
        .primary-actions {
          order: 2;
          width: 100%;
          
          button {
            flex: 1;
          }
        }
        
        .dangerous-actions {
          order: 1;
          width: 100%;
          margin-bottom: 16px;
          
          button {
            width: 100%;
          }
        }
      }
      
      .delete-modal {
        margin: 16px;
        
        .modal-actions {
          flex-direction: column;
          
          button {
            width: 100%;
          }
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
        // Set default datetime to now
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
    const utcDate = new Date(notification.datetime);
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

        // Convert local datetime to UTC
        const localDate = new Date(formValue.datetime);
        const utcDateTime = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

        const notificationData = {
          title: formValue.title,
          slug: formValue.slug,
          description: formValue.description,
          datetime: utcDateTime.toISOString(),
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
