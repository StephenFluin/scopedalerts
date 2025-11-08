import { Injectable, signal } from '@angular/core';
import { Admin } from '../models/admin';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private admins = signal<Admin[]>([]);
  private isLoading = signal(false);

  readonly allAdmins = this.admins.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    // TODO: Initialize Firebase Realtime Database connection
    this.loadMockData();
  }

  async loadAdmins(): Promise<Admin[]> {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase database query
      // For now, return mock data
      const mockAdmins = this.getMockAdmins();
      this.admins.set(mockAdmins);
      return mockAdmins;
    } catch (error) {
      console.error('Error loading admins:', error);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async addAdmin(admin: Omit<Admin, 'uid'>): Promise<void> {
    try {
      // TODO: Add to Firebase
      const newAdmin: Admin = { ...admin, uid: `uid-${Date.now()}` };
      this.admins.update((admins) => [...admins, newAdmin]);
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  }

  async removeAdmin(uid: string): Promise<void> {
    try {
      // TODO: Remove from Firebase
      this.admins.update((admins) => admins.filter((a) => a.uid !== uid));
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
    }
  }

  isUserAdmin(uid: string): boolean {
    return this.admins().some((admin) => admin.uid === uid);
  }

  private loadMockData(): void {
    const mockAdmins = this.getMockAdmins();
    this.admins.set(mockAdmins);
  }

  private getMockAdmins(): Admin[] {
    return [
      {
        uid: 'admin1',
        email: 'admin@example.com',
        displayName: 'System Administrator',
      },
    ];
  }
}
