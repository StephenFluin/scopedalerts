import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Notice } from '../models/notice';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private notifications = signal<Notice[]>([]);
  private isLoading = signal(false);
  private firebaseDatabase: any = null;

  readonly allNotifications = this.notifications.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    this.loadMockData();
    if (this.isBrowser) {
      this.initializeFirebase();
    }
  }

  private async initializeFirebase(): Promise<void> {
    try {
      // TODO: Initialize Firebase when packages are installed
      console.log('Firebase Database initialization would happen here');
    } catch (error) {
      console.warn('Firebase Database not available, using mock data:', error);
    }
  }

  async loadNotifications(limit = 20, startAfter?: string): Promise<Notice[]> {
    this.isLoading.set(true);
    try {
      // TODO: Replace with Firebase query when installed
      /*
      if (this.firebaseDatabase) {
        const noticesRef = ref(this.firebaseDatabase, 'notices');
        const query = orderByChild('datetime');
        const snapshot = await get(child(noticesRef, query));
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const notifications = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          this.notifications.set(notifications);
          return notifications;
        }
      }
      */

      // For now, return mock data
      const mockNotifications = this.getMockNotifications();
      this.notifications.set(mockNotifications);
      return mockNotifications;
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async getNotificationBySlug(slug: string): Promise<Notice | null> {
    try {
      // TODO: Replace with Firebase query when installed
      /*
      if (this.firebaseDatabase) {
        const noticesRef = ref(this.firebaseDatabase, 'notices');
        const queryRef = query(noticesRef, orderByChild('slug'), equalTo(slug));
        const snapshot = await get(queryRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const key = Object.keys(data)[0];
          return { id: key, ...data[key] };
        }
        return null;
      }
      */

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
      // TODO: Replace with Firebase operation when packages are installed
      /*
      if (this.firebaseDatabase) {
        const noticesRef = ref(this.firebaseDatabase, 'notices');
        const newNotice = {
          ...notice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const result = await push(noticesRef, newNotice);
        return { id: result.key!, ...newNotice, createdAt: new Date(), updatedAt: new Date() };
      }
      */

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
      // TODO: Replace with Firebase operation when packages are installed
      /*
      if (this.firebaseDatabase) {
        const noticeRef = ref(this.firebaseDatabase, `notices/${id}`);
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
        return { id, ...updatedSnapshot.val() };
      }
      */

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
      // TODO: Replace with Firebase operation when packages are installed
      /*
      if (this.firebaseDatabase) {
        const noticeRef = ref(this.firebaseDatabase, `notices/${id}`);
        await remove(noticeRef);
        
        // Update local state
        this.notifications.update((notifications) =>
          notifications.filter((n) => n.id !== id)
        );
        return true;
      }
      */

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

  private loadMockData(): void {
    const mockNotifications = this.getMockNotifications();
    this.notifications.set(mockNotifications);
  }

  private getMockNotifications(): Notice[] {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'Blanket Service Maintenance',
        description:
          'Scheduled maintenance will occur on the blanket service platform from 2:00 AM to 4:00 AM UTC. Users may experience temporary service interruptions during this window.',
        datetime: new Date('2024-11-07T02:00:00Z').toISOString(),
        slug: 'blanket-service-maintenance',
        affectedProducts: ['blanket-eol'],
        createdAt: new Date('2024-11-06T10:00:00Z'),
        updatedAt: new Date('2024-11-06T10:00:00Z'),
      },
      {
        id: '2',
        title: 'Portal Security Update',
        description:
          'A critical security update will be deployed to the portal system. All users will be automatically logged out and required to sign in again.',
        datetime: new Date('2024-11-06T15:30:00Z').toISOString(),
        slug: 'portal-security-update',
        affectedProducts: ['portal'],
        createdAt: new Date('2024-11-05T14:00:00Z'),
        updatedAt: new Date('2024-11-05T14:00:00Z'),
      },
      {
        id: '3',
        title: 'EOLDs System Deprecation Notice',
        description:
          'The EOLDs system will be deprecated on December 31, 2024. Users are advised to migrate their data to the new platform before this date.',
        datetime: new Date('2024-11-05T09:00:00Z').toISOString(),
        slug: 'eolds-system-deprecation',
        affectedProducts: ['eolds'],
        createdAt: new Date('2024-11-04T16:00:00Z'),
        updatedAt: new Date('2024-11-04T16:00:00Z'),
      },
    ];
  }
}
