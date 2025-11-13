import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseService } from './firebase.service';
import { UserService } from './user.service';

export interface Subscription {
  productId: string;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private firebaseService = inject(FirebaseService);
  private userService = inject(UserService);

  private subscriptions = signal<Subscription[]>([]);
  private loading = signal(false);
  private saveLoading = signal(false);

  readonly userSubscriptions = this.subscriptions.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isSaving = this.saveLoading.asReadonly();

  readonly subscribedProductIds = computed(() => this.subscriptions().map((sub) => sub.productId));

  /**
   * Get localStorage key for user subscriptions
   */
  private getLocalStorageKey(): string | null {
    const user = this.userService.user();
    return user ? `scopedalerts_subscriptions_${user.uid}` : null;
  }

  /**
   * Load subscriptions from localStorage as a fallback
   */
  private loadFromLocalStorage(): void {
    if (!this.isBrowser) return;

    const key = this.getLocalStorageKey();
    if (!key) return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const productIds: string[] = JSON.parse(stored);
        const subscriptions: Subscription[] = productIds.map((productId) => ({ productId }));
        this.subscriptions.set(subscriptions);
        console.log('Loaded subscriptions from localStorage:', productIds);
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
  }

  /**
   * Save subscriptions to localStorage as a fallback
   */
  private saveToLocalStorage(productIds: string[]): void {
    if (!this.isBrowser) return;

    const key = this.getLocalStorageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(productIds));
      console.log('Saved subscriptions to localStorage:', productIds);
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
  }

  /**
   * Load user subscriptions from Firebase
   */
  async loadSubscriptions(): Promise<void> {
    const user = this.userService.user();
    if (!user) {
      console.warn('No user found, cannot load subscriptions');
      this.subscriptions.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const database = await this.firebaseService.getDatabase();
      const dbMethods = await this.firebaseService.getDatabaseMethods();

      if (database && dbMethods) {
        const subscriptionsRef = dbMethods.ref(database, `users/${user.uid}/subscriptions`);
        const snapshot = await dbMethods.get(subscriptionsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          // Convert Firebase object to array of subscriptions
          const subscriptionArray: Subscription[] = Object.keys(data).map((productId) => ({
            productId,
          }));
          this.subscriptions.set(subscriptionArray);
        } else {
          this.subscriptions.set([]);
        }
      } else {
        // Fallback for development
        console.log('Using mock subscription data');
        this.subscriptions.set([]);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);

      // If it's a permission error, this is likely because the database rules haven't been deployed yet
      if (error instanceof Error && error.message.includes('Permission denied')) {
        console.warn(
          'Permission denied when loading subscriptions. This may be because the database rules need to be deployed.'
        );
        console.warn('Please deploy the database rules using: firebase deploy --only database');
        // For now, start with empty subscriptions
        this.subscriptions.set([]);
      } else {
        // For other errors, still set empty array but log the error
        this.subscriptions.set([]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Save subscriptions to Firebase
   */
  async saveSubscriptions(productIds: string[]): Promise<void> {
    const user = this.userService.user();
    if (!user) {
      console.warn('No user found, cannot save subscriptions');
      return;
    }

    this.saveLoading.set(true);
    try {
      const database = await this.firebaseService.getDatabase();
      const dbMethods = await this.firebaseService.getDatabaseMethods();

      if (database && dbMethods) {
        const subscriptionsRef = dbMethods.ref(database, `users/${user.uid}/subscriptions`);

        // Convert array to Firebase object format
        const subscriptionsData: { [productId: string]: boolean } = {};
        productIds.forEach((productId) => {
          subscriptionsData[productId] = true;
        });

        await dbMethods.set(subscriptionsRef, subscriptionsData);

        // Update local state
        const subscriptionArray: Subscription[] = productIds.map((productId) => ({
          productId,
        }));
        this.subscriptions.set(subscriptionArray);
      } else {
        // Fallback for development
        console.log('Mock save subscriptions:', productIds);
        const subscriptionArray: Subscription[] = productIds.map((productId) => ({
          productId,
        }));
        this.subscriptions.set(subscriptionArray);
      }
    } catch (error) {
      console.error('Error saving subscriptions:', error);

      // If it's a permission error, provide a helpful message
      if (error instanceof Error && error.message.includes('Permission denied')) {
        console.warn(
          'Permission denied when saving subscriptions. Database rules need to be deployed.'
        );
        console.warn('Please deploy the database rules using: firebase deploy --only database');
        throw new Error('Unable to save subscriptions. Please try again later or contact support.');
      } else {
        throw error;
      }
    } finally {
      this.saveLoading.set(false);
    }
  }

  /**
   * Check if user is subscribed to a specific product
   */
  isSubscribedToProduct(productId: string): boolean {
    return this.subscribedProductIds().includes(productId);
  }

  /**
   * Toggle subscription for a product
   */
  async toggleSubscription(productId: string): Promise<void> {
    const currentProductIds = this.subscribedProductIds();
    let updatedProductIds: string[];

    if (currentProductIds.includes(productId)) {
      updatedProductIds = currentProductIds.filter((id) => id !== productId);
    } else {
      updatedProductIds = [...currentProductIds, productId];
    }

    await this.saveSubscriptions(updatedProductIds);
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.set([]);
  }
}
