import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firebaseConfig } from '../config/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private firebaseApp: any = null;
  private auth: any = null;
  private database: any = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {}

  private async initializeFirebase(): Promise<void> {
    // Return existing promise if initialization is already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.initialized) {
      return;
    }

    // Create and store the initialization promise
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } catch (error) {
      // Reset promise on failure so initialization can be retried
      this.initializationPromise = null;
      throw error;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getAuth } = await import('firebase/auth');
      const { getDatabase } = await import('firebase/database');

      this.firebaseApp = initializeApp(firebaseConfig);
      this.auth = getAuth(this.firebaseApp);
      this.database = getDatabase(this.firebaseApp);
      this.initialized = true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  async getAuth(): Promise<any> {
    if (!this.isBrowser) {
      return null;
    }

    await this.initializeFirebase();
    return this.auth;
  }

  async getDatabase(): Promise<any> {
    await this.initializeFirebase();
    return this.database;
  }

  async getApp(): Promise<any> {
    if (!this.isBrowser) {
      return null;
    }

    await this.initializeFirebase();
    return this.firebaseApp;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isBrowserEnvironment(): boolean {
    return this.isBrowser;
  }

  // Auth methods
  async getAuthMethods() {
    if (!this.isBrowser) {
      return null;
    }

    const authModule = await import('firebase/auth');
    return {
      onAuthStateChanged: authModule.onAuthStateChanged,
      GoogleAuthProvider: authModule.GoogleAuthProvider,
      signInWithPopup: authModule.signInWithPopup,
      signOut: authModule.signOut,
    };
  }

  // Database methods
  async getDatabaseMethods() {
    const {
      ref,
      get,
      query,
      orderByChild,
      limitToLast,
      limitToFirst,
      startAt,
      endAt,
      equalTo,
      push,
      update,
      set,
      remove,
      serverTimestamp,
    } = await import('firebase/database');

    return {
      ref,
      get,
      query,
      orderByChild,
      limitToLast,
      limitToFirst,
      startAt,
      endAt,
      equalTo,
      push,
      update,
      set,
      remove,
      serverTimestamp,
    };
  }
}
