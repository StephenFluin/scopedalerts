import { Injectable, signal, inject, PLATFORM_ID, PendingTasks } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Notice } from '../models/notice';
import { FirebaseService } from './firebase.service';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private firebaseService = inject(FirebaseService);
  private pendingTasks = inject(PendingTasks);

  private notifications = signal<Notice[]>([]);
  private isLoading = signal(false);
  private hasMore = signal(true);
  private lastLoadedNotificationDate: string | null = null;

  readonly allNotifications = this.notifications.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly hasMoreNotifications = this.hasMore.asReadonly();

  constructor() {
    // Initialize with empty notifications
  }

  async loadNotifications(limit = 20, append = false): Promise<Notice[]> {
    // Add a pending task to ensure SSR waits for this operation
    const taskCleanup = this.pendingTasks.add();
    this.isLoading.set(true);

    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, get, query, orderByChild, limitToLast, endAt } = databaseMethods;
        const noticesRef = ref(firebaseDatabase, 'notices');

        let noticesQuery;
        if (append && this.lastLoadedNotificationDate) {
          // Load older notifications for infinite scroll
          // Use endAt to get notifications older than the last loaded one
          noticesQuery = query(
            noticesRef,
            orderByChild('datetime'),
            endAt(this.lastLoadedNotificationDate),
            limitToLast(limit + 1) // +1 to check if there are more
          );
        } else {
          // Initial load - get the most recent notifications
          noticesQuery = query(noticesRef, orderByChild('datetime'), limitToLast(limit + 1));
        }

        const snapshot = await get(noticesQuery);

        if (snapshot.exists()) {
          const data = snapshot.val();
          let notifications = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
              createdAt: new Date(data[key].createdAt),
              updatedAt: new Date(data[key].updatedAt),
            }))
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

          // If we're appending and we got the same notification as the last one, remove it
          if (append && this.lastLoadedNotificationDate) {
            notifications = notifications.filter(
              (n) => n.datetime < this.lastLoadedNotificationDate!
            );
          }

          // Check if there are more notifications
          const hasMore = notifications.length > limit;
          if (hasMore) {
            notifications = notifications.slice(0, limit);
          }
          this.hasMore.set(hasMore);

          // Update lastLoadedNotificationDate
          if (notifications.length > 0) {
            this.lastLoadedNotificationDate = notifications[notifications.length - 1].datetime;
          }

          if (append) {
            this.notifications.update((current) => [...current, ...notifications]);
          } else {
            this.notifications.set(notifications);
            this.lastLoadedNotificationDate =
              notifications.length > 0 ? notifications[notifications.length - 1].datetime : null;
          }

          return notifications;
        } else {
          this.hasMore.set(false);
        }
      }

      // No fallback data - return empty array if Firebase is not available
      if (!append) {
        this.notifications.set([]);
      }
      this.hasMore.set(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Return empty array on error instead of mock data
      if (!append) {
        this.notifications.set([]);
      }
      this.hasMore.set(false);
    } finally {
      this.isLoading.set(false);
      taskCleanup();
    }
    return [];
  }

  async loadMoreNotifications(limit = 20): Promise<Notice[]> {
    if (this.isLoading() || !this.hasMore()) {
      return [];
    }
    return this.loadNotifications(limit, true);
  }

  resetNotifications(): void {
    this.notifications.set([]);
    this.hasMore.set(true);
    this.lastLoadedNotificationDate = null;
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
