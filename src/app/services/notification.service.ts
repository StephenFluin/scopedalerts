import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Notice } from '../models/notice';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private firebaseService = inject(FirebaseService);

  private notifications = signal<Notice[]>([]);
  private isLoading = signal(false);

  readonly allNotifications = this.notifications.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    // Initialize with empty notifications
  }

  async loadNotifications(limit = 20, startAfter?: string): Promise<Notice[]> {
    this.isLoading.set(true);
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, get, query, orderByChild, limitToLast } = databaseMethods;
        const noticesRef = ref(firebaseDatabase, 'notices');
        const noticesQuery = query(noticesRef, orderByChild('datetime'), limitToLast(limit));
        const snapshot = await get(noticesQuery);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const notifications = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
              createdAt: new Date(data[key].createdAt),
              updatedAt: new Date(data[key].updatedAt),
            }))
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

          this.notifications.set(notifications);
          return notifications;
        }
      }

      // No fallback data - return empty array if Firebase is not available
      this.notifications.set([]);
      return [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Return empty array on error instead of mock data
      this.notifications.set([]);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async getNotificationBySlug(slug: string): Promise<Notice | null> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, get, query, orderByChild, equalTo } = databaseMethods;
        const noticesRef = ref(firebaseDatabase, 'notices');
        const queryRef = query(noticesRef, orderByChild('slug'), equalTo(slug));
        const snapshot = await get(queryRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const key = Object.keys(data)[0];
          return {
            id: key,
            ...data[key],
            createdAt: new Date(data[key].createdAt),
            updatedAt: new Date(data[key].updatedAt),
          };
        }
        return null;
      }

      const notifications = this.notifications();
      return notifications.find((n) => n.slug === slug) || null;
    } catch (error) {
      console.error('Error getting notification by slug:', error);
      return null;
    }
  }

  async createNotification(
    notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Notice> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, push, serverTimestamp } = databaseMethods;
        const noticesRef = ref(firebaseDatabase, 'notices');
        const newNotice = {
          ...notice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const result = await push(noticesRef, newNotice);
        const createdNotice = {
          id: result.key!,
          ...notice,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update local state
        this.notifications.update((notifications) => [...notifications, createdNotice]);
        return createdNotice;
      }

      const newNotice: Notice = {
        ...notice,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.notifications.update((notifications) => [...notifications, newNotice]);
      return newNotice;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async updateNotification(id: string, updates: Partial<Notice>): Promise<Notice | null> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, get, update, serverTimestamp } = databaseMethods;
        const noticeRef = ref(firebaseDatabase, `notices/${id}`);
        const snapshot = await get(noticeRef);

        if (!snapshot.exists()) {
          throw new Error('Notification not found');
        }

        const updatedData = {
          ...updates,
          updatedAt: serverTimestamp(),
        };

        await update(noticeRef, updatedData);
        const updatedSnapshot = await get(noticeRef);
        const updatedNotice = {
          id,
          ...updatedSnapshot.val(),
          createdAt: new Date(updatedSnapshot.val().createdAt),
          updatedAt: new Date(),
        };

        // Update local state
        this.notifications.update((notifications) => {
          const index = notifications.findIndex((n) => n.id === id);
          if (index !== -1) {
            const newNotifications = [...notifications];
            newNotifications[index] = updatedNotice;
            return newNotifications;
          }
          return notifications;
        });

        return updatedNotice;
      }

      const notifications = this.notifications();
      const index = notifications.findIndex((n) => n.id === id);

      if (index === -1) {
        return null;
      }

      const updatedNotice: Notice = {
        ...notifications[index],
        ...updates,
        updatedAt: new Date(),
      };

      this.notifications.update((notifications) => {
        const newNotifications = [...notifications];
        newNotifications[index] = updatedNotice;
        return newNotifications;
      });

      return updatedNotice;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, remove } = databaseMethods;
        const noticeRef = ref(firebaseDatabase, `notices/${id}`);
        await remove(noticeRef);

        // Update local state
        this.notifications.update((notifications) => notifications.filter((n) => n.id !== id));
        return true;
      }

      this.notifications.update((notifications) => notifications.filter((n) => n.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  getNotificationsByProducts(productIds: string[]): Notice[] {
    if (productIds.length === 0) return this.notifications();

    return this.notifications().filter((notice) =>
      notice.affectedProducts.some((productId) => productIds.includes(productId))
    );
  }
}
