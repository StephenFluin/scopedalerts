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
    // Component-specific styles only - most styles moved to global
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
