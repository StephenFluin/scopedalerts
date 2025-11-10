import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { UserService } from '../services/user.service';
import { Admin as AdminModel } from '../models/admin';

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin.html',
  styles: `
    .admin-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 16px;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 16px;
      text-align: center;
      
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
    }

    .breadcrumb-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }

    .admin-header {
      margin-bottom: 32px;
      
      h1 {
        margin: 0 0 8px 0;
        font-size: 2rem;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.87);
      }
      
      .admin-description {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 1.125rem;
      }
    }

    :host-context(body.dark) .admin-header {
      h1 {
        color: rgba(255, 255, 255, 0.87);
      }
      
      .admin-description {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .admin-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .quick-actions-section,
    .admins-section {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      
      h2 {
        margin: 0 0 20px 0;
        font-size: 1.375rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .quick-actions-section,
    :host-context(body.dark) .admins-section {
      background-color: #1e1e1e;
      border-color: rgba(255, 255, 255, 0.12);
      
      h2 {
        color: rgba(255, 255, 255, 0.87);
      }
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .action-card {
      display: block;
      text-decoration: none;
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      
      &:hover {
        background-color: #eeeeee;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .action-icon {
        font-size: 2rem;
        margin-bottom: 12px;
      }
      
      h3 {
        margin: 0 0 8px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
      
      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.875rem;
      }
    }

    :host-context(body.dark) .action-card {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
      }
      
      h3 {
        color: rgba(255, 255, 255, 0.87);
      }
      
      p {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .add-admin-form {
      margin-bottom: 32px;
      
      h3 {
        margin: 0 0 16px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .add-admin-form h3 {
      color: rgba(255, 255, 255, 0.87);
    }

    .admin-form {
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 16px;
        align-items: end;
      }
    }

    .form-field {
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

    .form-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      background-color: white;
      color: rgba(0, 0, 0, 0.87);
      
      &:focus {
        outline: none;
        border-color: #3f51b5;
      }
      
      &::placeholder {
        color: rgba(0, 0, 0, 0.4);
      }
    }

    :host-context(body.dark) .form-input {
      background-color: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }

    .add-btn {
      background-color: #3f51b5;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      white-space: nowrap;
      
      &:hover:not(:disabled) {
        background-color: #303f9f;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .add-admin-note {
      margin-top: 16px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      
      p {
        margin: 0;
        font-size: 0.875rem;
        color: #1976d2;
      }
    }

    :host-context(body.dark) .add-admin-note {
      background-color: rgba(25, 118, 210, 0.1);
      
      p {
        color: #64b5f6;
      }
    }

    .admins-list {
      h3 {
        margin: 0 0 20px 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
    }

    :host-context(body.dark) .admins-list h3 {
      color: rgba(255, 255, 255, 0.87);
    }

    .admins-grid {
      display: grid;
      gap: 16px;
    }

    .admin-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      
      .admin-info {
        h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
        }
        
        .admin-email {
          margin: 0 0 4px 0;
          color: rgba(0, 0, 0, 0.7);
          font-size: 0.875rem;
        }
        
        .admin-id {
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.5);
          font-family: monospace;
        }
      }
    }

    :host-context(body.dark) .admin-card {
      background-color: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.12);
      
      .admin-info {
        h4 {
          color: rgba(255, 255, 255, 0.87);
        }
        
        .admin-email {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .admin-id {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .current-user-badge {
      background-color: #4caf50;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .remove-btn {
      background-color: #f44336;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      
      &:hover:not(:disabled) {
        background-color: #d32f2f;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .cancel-btn {
      background: none;
      border: 1px solid #e0e0e0;
      color: rgba(0, 0, 0, 0.87);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }

    :host-context(body.dark) .cancel-btn {
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
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

    .error-message {
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 4px;
    }

    .remove-modal-overlay {
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

    .remove-modal {
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
        margin: 0 0 12px 0;
        color: rgba(0, 0, 0, 0.7);
      }
      
      .warning-text {
        color: #f44336;
        font-weight: 500;
        margin-bottom: 24px !important;
      }
    }

    :host-context(body.dark) .remove-modal {
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
      .admin-container {
        padding: 8px;
      }
      
      .quick-actions-section,
      .admins-section {
        padding: 16px;
      }
      
      .admin-header h1 {
        font-size: 1.5rem;
      }
      
      .quick-actions {
        grid-template-columns: 1fr;
      }
      
      .admin-form .form-row {
        grid-template-columns: 1fr;
        gap: 16px;
        
        .add-btn {
          width: 100%;
        }
      }
      
      .admin-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        
        .admin-actions {
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }
      }
      
      .remove-modal {
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
export class AdminComponent implements OnInit {
  protected readonly adminService = inject(AdminService);
  protected readonly userService = inject(UserService);
  private formBuilder = inject(FormBuilder);

  protected readonly isAdding = signal(false);
  protected readonly isRemoving = signal(false);
  protected readonly showRemoveConfirm = signal(false);
  protected readonly adminToRemove = signal<AdminModel | null>(null);

  protected adminForm: FormGroup;

  constructor() {
    this.adminForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    // Ensure auth is initialized to check admin status
    await this.userService.ensureAuthInitialized();

    if (this.userService.isAdmin()) {
      this.loadAdmins();
    }
  }

  private async loadAdmins(): Promise<void> {
    try {
      await this.adminService.loadAdmins();
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  }

  protected async addAdmin(): Promise<void> {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    this.isAdding.set(true);

    try {
      const formValue = this.adminForm.value;
      await this.adminService.addAdmin({
        email: formValue.email,
        displayName: formValue.displayName,
      });

      this.adminForm.reset();
      // TODO: Show success message
    } catch (error) {
      console.error('Error adding admin:', error);
      // TODO: Show error message
    } finally {
      this.isAdding.set(false);
    }
  }

  protected confirmRemoveAdmin(admin: AdminModel): void {
    this.adminToRemove.set(admin);
    this.showRemoveConfirm.set(true);
  }

  protected cancelRemoveAdmin(): void {
    this.adminToRemove.set(null);
    this.showRemoveConfirm.set(false);
  }

  protected async removeAdmin(): Promise<void> {
    const admin = this.adminToRemove();
    if (!admin) return;

    this.isRemoving.set(true);

    try {
      await this.adminService.removeAdmin(admin.uid);
      this.cancelRemoveAdmin();
      // TODO: Show success message
    } catch (error) {
      console.error('Error removing admin:', error);
      // TODO: Show error message
    } finally {
      this.isRemoving.set(false);
    }
  }

  protected canRemoveAdmin(admin: AdminModel): boolean {
    // Don't allow removing yourself and ensure there's at least one admin
    const currentUser = this.userService.user();
    const totalAdmins = this.adminService.allAdmins().length;
    return currentUser?.uid !== admin.uid && totalAdmins > 1;
  }
}
