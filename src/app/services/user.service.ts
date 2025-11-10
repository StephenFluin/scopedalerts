import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '../models/user';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private firebaseService = inject(FirebaseService);

  private currentUser = signal<User | null>(null);
  private isLoading = signal(false);
  private authInitialized = false;

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
    // Only initialize auth if user has previously attempted to login
    if (this.isBrowser && this.hasUserTriedLogin()) {
      this.initializeAuth();
    }
  }

  private hasUserTriedLogin(): boolean {
    try {
      return localStorage.getItem('scopedalerts_has_tried_login') === 'true';
    } catch {
      // If localStorage is not available (SSR), return false
      return false;
    }
  }

  private markUserHasTriedLogin(): void {
    try {
      localStorage.setItem('scopedalerts_has_tried_login', 'true');
    } catch {
      // Ignore if localStorage is not available
    }
  }

  private async initializeAuth(): Promise<void> {
    if (this.authInitialized) {
      return;
    }

    try {
      if (this.firebaseService.isBrowserEnvironment()) {
        const firebaseAuth = await this.firebaseService.getAuth();
        const authMethods = await this.firebaseService.getAuthMethods();

        if (firebaseAuth && authMethods) {
          // Listen for auth state changes
          authMethods.onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            if (firebaseUser) {
              const role = await this.checkUserRole(firebaseUser.uid);
              this.currentUser.set({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                role,
              });
            } else {
              this.currentUser.set(null);
            }
          });
        }
        this.authInitialized = true;
      }
    } catch (error) {
      console.warn('Firebase not available, using mock data:', error);
      this.setMockUser('admin');
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading.set(true);

    // Mark that user has attempted login
    this.markUserHasTriedLogin();

    // Initialize auth if not already done
    if (!this.authInitialized && this.isBrowser) {
      await this.initializeAuth();
    }

    try {
      const firebaseAuth = await this.firebaseService.getAuth();
      const authMethods = await this.firebaseService.getAuthMethods();

      if (firebaseAuth && authMethods) {
        const provider = new authMethods.GoogleAuthProvider();
        await authMethods.signInWithPopup(firebaseAuth, provider);
        // User state will be updated via onAuthStateChanged listener
      } else {
        // Fallback to mock sign-in for development
        console.log('Mock Google sign-in');
        this.currentUser.set({
          uid: 'mock-admin-uid',
          email: 'admin@example.com',
          displayName: 'Mock Admin User',
          role: 'admin',
        });
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Manually initialize auth (e.g., when checking auth state for admin features)
   * This will mark the user as having tried login and initialize Firebase auth
   */
  async ensureAuthInitialized(): Promise<void> {
    if (!this.authInitialized && this.isBrowser) {
      this.markUserHasTriedLogin();
      await this.initializeAuth();
    }
  }

  async signOut(): Promise<void> {
    this.isLoading.set(true);
    try {
      const firebaseAuth = await this.firebaseService.getAuth();
      const authMethods = await this.firebaseService.getAuthMethods();

      if (firebaseAuth && authMethods) {
        await authMethods.signOut(firebaseAuth);
        // User state will be updated via onAuthStateChanged listener
      } else {
        // Fallback to mock sign-out for development
        this.currentUser.set(null);
        console.log('Mock sign-out');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private async checkUserRole(uid: string): Promise<UserRole> {
    console.log('Checking role for UID:', uid);
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const dbMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && dbMethods) {
        const adminRef = dbMethods.ref(firebaseDatabase, `admins/${uid}`);
        const snapshot = await dbMethods.get(adminRef);
        return snapshot.exists() ? 'admin' : 'user';
      } else {
        // Fallback to mock role checking for development
        return uid.includes('admin') ? 'admin' : 'user';
      }
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
