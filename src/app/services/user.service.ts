import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private currentUser = signal<User | null>(null);
  private isLoading = signal(false);
  private firebaseAuth: any = null;
  private firebaseDatabase: any = null;

  readonly user = this.currentUser.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  readonly role = computed<UserRole>(() => {
    const user = this.currentUser();
    return user ? user.role : 'guest';
  });

  readonly isGuest = computed(() => this.role() === 'guest');
  readonly isUser = computed(() => this.role() === 'user');
  readonly isAdmin = computed(() => this.role() === 'admin');

  constructor() {
    if (this.isBrowser) {
      this.initializeFirebase();
    }
  }

  private async initializeFirebase(): Promise<void> {
    try {
      // For now, use mock authentication until Firebase is properly installed
      console.log('Firebase initialization would happen here when firebase packages are installed');

      // Initialize with mock admin user for testing
      this.setMockUser('admin');
    } catch (error) {
      console.warn('Firebase not available, using mock data:', error);
      this.setMockUser('admin');
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    try {
      // TODO: Replace with actual Firebase Google sign-in when Firebase is installed
      // Mock sign-in for development
      console.log('Mock Google sign-in');
      this.currentUser.set({
        uid: 'mock-admin-uid',
        email: 'admin@example.com',
        displayName: 'Mock Admin User',
        role: 'admin',
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.isLoading.set(true);
    try {
      // TODO: Replace with actual Firebase sign-out when Firebase is installed
      this.currentUser.set(null);
      console.log('Mock sign-out');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async checkUserRole(uid: string): Promise<UserRole> {
    try {
      // TODO: Replace with actual Firebase database check when Firebase is installed
      // For now, return admin for testing purposes
      return uid.includes('admin') ? 'admin' : 'user';
    } catch (error) {
      console.error('Error checking user role:', error);
      return 'user';
    }
  }

  // Development method to simulate user states
  setMockUser(role: UserRole): void {
    if (role === 'guest') {
      this.currentUser.set(null);
    } else {
      this.currentUser.set({
        uid: role === 'admin' ? 'mock-admin-uid' : 'mock-user-uid',
        email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
        displayName: role === 'admin' ? 'Mock Admin User' : 'Mock User',
        role,
      });
    }
  }
}
