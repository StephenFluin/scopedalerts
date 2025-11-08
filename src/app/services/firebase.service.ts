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

  constructor() {
    if (this.isBrowser) {
      this.initializeFirebase();
    }
  }

  private async initializeFirebase(): Promise<void> {
    try {
      // Dynamically import Firebase modules to avoid SSR issues
      const { initializeApp } = await import('firebase/app');
      const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
        await import('firebase/auth');
      const { getDatabase, ref, get, set, push, remove, onValue, off } = await import(
        'firebase/database'
      );

      this.firebaseApp = initializeApp(firebaseConfig);
      this.auth = getAuth(this.firebaseApp);
      this.database = getDatabase(this.firebaseApp);

      // Store Firebase methods for use by services
      (window as any).__firebase = {
        auth: this.auth,
        database: this.database,
        GoogleAuthProvider,
        signInWithPopup,
        signOut,
        onAuthStateChanged,
        ref,
        get,
        set,
        push,
        remove,
        onValue,
        off,
      };
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }

  getAuth() {
    return this.auth;
  }

  getDatabase() {
    return this.database;
  }

  isInitialized(): boolean {
    return this.auth !== null && this.database !== null;
  }
}
