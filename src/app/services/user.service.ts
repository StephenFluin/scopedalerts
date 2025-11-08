import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUser = signal<User | null>(null);
  private isLoading = signal(false);

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
    // TODO: Initialize Firebase Auth and listen to auth state changes
    // This will be implemented once Firebase is properly configured
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase Google sign-in
      // Placeholder implementation
      console.log('Sign in with Google - Firebase implementation needed');
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
      // TODO: Implement Firebase sign out
      this.currentUser.set(null);
      console.log('Sign out - Firebase implementation needed');
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async checkUserRole(uid: string): Promise<UserRole> {
    try {
      // TODO: Check Firebase database for admin role
      // Placeholder implementation
      return 'user';
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
        uid: 'mock-uid',
        email: 'user@example.com',
        displayName: 'Mock User',
        role,
      });
    }
  }
}
