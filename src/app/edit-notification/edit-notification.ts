import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { Notice } from '../models/notice';

@Component({
  selector: 'app-edit-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="edit-notification-container">
      @if (!userService.isAdmin()) {
      <div class="error-container">
        <h1>Access Denied</h1>
        <p>You don't have permission to edit notifications. Admin access is required.</p>
        <a routerLink="/" class="back-btn">← Back to Notifications</a>
      </div>
      } @else if (isLoading()) {
      <div class="loading-container">
        <div class="loading-spinner">Loading...</div>
      </div>
      } @else {
      <div class="form-header">
        <div class="breadcrumb">
          <a routerLink="/" class="breadcrumb-link">← Back to Notifications</a>
          @if (!isNewNotification()) {
          <span class="breadcrumb-separator">/</span>
          <a [routerLink]="['/notifications', originalSlug()]" class="breadcrumb-link">
            {{ notificationForm.get('title')?.value || 'Notification' }}
          </a>
          }
        </div>

        <h1>{{ isNewNotification() ? 'Create New Notification' : 'Edit Notification' }}</h1>
      </div>

      <form [formGroup]="notificationForm" (ngSubmit)="onSubmit()" class="notification-form">
        <div class="form-section">
          <div class="form-field">
            <label for="title">Title *</label>
            <input
              type="text"
              id="title"
              formControlName="title"
              class="form-input"
              placeholder="Enter notification title"
            />
            @if (notificationForm.get('title')?.invalid && notificationForm.get('title')?.touched) {
            <div class="error-message">Title is required</div>
            }
          </div>

          <div class="form-field">
            <label for="slug">URL Slug *</label>
            <input
              type="text"
              id="slug"
              formControlName="slug"
              class="form-input"
              placeholder="url-friendly-slug"
            />
            @if (notificationForm.get('slug')?.invalid && notificationForm.get('slug')?.touched) {
            <div class="error-message">
              @if (notificationForm.get('slug')?.errors?.['required']) { Slug is required } @if
              (notificationForm.get('slug')?.errors?.['pattern']) { Slug must contain only lowercase
              letters, numbers, and hyphens }
            </div>
            }
          </div>

          <div class="form-field">
            <label for="datetime">Date & Time *</label>
            <input
              type="datetime-local"
              id="datetime"
              formControlName="datetime"
              class="form-input"
            />
            @if (notificationForm.get('datetime')?.invalid &&
            notificationForm.get('datetime')?.touched) {
            <div class="error-message">Date and time are required</div>
            }
          </div>

          <div class="form-field">
            <label for="description">Description *</label>
            <textarea
              id="description"
              formControlName="description"
              class="form-textarea"
              rows="6"
              placeholder="Enter detailed description of the notification"
            ></textarea>
            @if (notificationForm.get('description')?.invalid &&
            notificationForm.get('description')?.touched) {
            <div class="error-message">Description is required</div>
            }
          </div>

          <div class="form-field">
            <label>Affected Products *</label>
            <div class="products-selection">
              @for (product of productService.allProducts(); track product.id) {
              <label class="product-checkbox">
                <input
                  type="checkbox"
                  [value]="product.id"
                  [checked]="isProductSelected(product.id)"
                  (change)="toggleProduct(product.id)"
                />
                <span class="product-name">{{ product.name }}</span>
                <span class="product-description">{{ product.description }}</span>
              </label>
              }
            </div>
            @if (selectedProducts().length === 0 && notificationForm.touched) {
            <div class="error-message">At least one product must be selected</div>
            }
          </div>
        </div>

        <div class="form-actions">
          <div class="primary-actions">
            <button type="button" (click)="goBack()" class="cancel-btn" [disabled]="isSaving()">
              Cancel
            </button>

            <button
              type="submit"
              class="save-btn"
              [disabled]="notificationForm.invalid || selectedProducts().length === 0 || isSaving()"
            >
              @if (isSaving()) {
              {{ isNewNotification() ? 'Creating...' : 'Saving...' }}
              } @else {
              {{ isNewNotification() ? 'Create Notification' : 'Save Changes' }}
              }
            </button>
          </div>

          @if (!isNewNotification()) {
          <div class="dangerous-actions">
            <button
              type="button"
              (click)="confirmDelete()"
              class="delete-btn"
              [disabled]="isSaving()"
            >
              Delete Notification
            </button>
          </div>
          }
        </div>
      </form>

      @if (showDeleteConfirm()) {
      <div class="delete-modal-overlay" (click)="cancelDelete()">
        <div class="delete-modal" (click)="$event.stopPropagation()">
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete this notification? This action cannot be undone.</p>
          <div class="modal-actions">
            <button type="button" (click)="cancelDelete()" class="cancel-btn">Cancel</button>
            <button type="button" (click)="deleteNotification()" class="delete-btn">Delete</button>
          </div>
        </div>
      </div>
      } }
    </div>
  `,
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
      transition: background-color 0.2s ease;
      
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
      transition: all 0.2s ease;
      
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
      transition: background-color 0.2s ease;
      
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
      transition: background-color 0.2s ease;
      
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
  imports: [RouterLink, ReactiveFormsModule],
})
export class EditNotification implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly showDeleteConfirm = signal(false);
  protected readonly selectedProducts = signal<string[]>([]);
  protected readonly originalSlug = signal<string>('');

  protected notificationForm: FormGroup;

  constructor() {
    this.notificationForm = this.formBuilder.group({
      title: ['', Validators.required],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: ['', Validators.required],
      datetime: ['', Validators.required],
    });

    // Auto-generate slug from title
    this.notificationForm.get('title')?.valueChanges.subscribe((title) => {
      if (title && this.isNewNotification()) {
        const slug = this.generateSlug(title);
        this.notificationForm.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
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
        this.notificationForm.patchValue({ datetime: localDateTime });
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

    this.notificationForm.patchValue({
      title: notification.title,
      slug: notification.slug,
      description: notification.description,
      datetime: localDateTime,
    });

    this.selectedProducts.set([...notification.affectedProducts]);
  }

  protected isProductSelected(productId: string): boolean {
    return this.selectedProducts().includes(productId);
  }

  protected toggleProduct(productId: string): void {
    this.selectedProducts.update((selected) => {
      if (selected.includes(productId)) {
        return selected.filter((id) => id !== productId);
      } else {
        return [...selected, productId];
      }
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.notificationForm.invalid || this.selectedProducts().length === 0) {
      this.notificationForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue = this.notificationForm.value;

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
    } catch (error) {
      console.error('Error saving notification:', error);
      // TODO: Show error message to user
    } finally {
      this.isSaving.set(false);
    }
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
