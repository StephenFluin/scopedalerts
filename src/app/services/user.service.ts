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
      if (this.isBrowser) {
        const { initializeApp } = await import('firebase/app');
        const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } =
          await import('firebase/auth');
        const { getDatabase, ref, get } = await import('firebase/database');
        const { firebaseConfig } = await import('../config/firebase.config');

        const app = initializeApp(firebaseConfig);
        this.firebaseAuth = getAuth(app);
        this.firebaseDatabase = getDatabase(app);

        // Listen for auth state changes
        onAuthStateChanged(this.firebaseAuth, async (firebaseUser) => {
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
    } catch (error) {
      console.warn('Firebase not available, using mock data:', error);
      this.setMockUser('admin');
    }
  }

  async signInWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    try {
      if (this.firebaseAuth) {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        await signInWithPopup(this.firebaseAuth, provider);
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

  async signOut(): Promise<void> {
    this.isLoading.set(true);
    try {
      if (this.firebaseAuth) {
        const { signOut } = await import('firebase/auth');
        await signOut(this.firebaseAuth);
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
    try {
      if (this.firebaseDatabase) {
        const { ref, get } = await import('firebase/database');
        const adminRef = ref(this.firebaseDatabase, `admins/${uid}`);
        const snapshot = await get(adminRef);
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
