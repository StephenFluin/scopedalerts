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

  constructor() {}

  private async initializeFirebase(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const { initializeApp } = await import('firebase/app');
      const { getAuth } = await import('firebase/auth');
      const { getDatabase } = await import('firebase/database');

      this.firebaseApp = initializeApp(firebaseConfig);
      this.auth = getAuth(this.firebaseApp);
      this.database = getDatabase(this.firebaseApp);
      this.initialized = true;

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
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
    if (!this.isBrowser) {
      return null;
    }

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
}
