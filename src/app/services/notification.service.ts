import { Injectable, signal } from '@angular/core';
import { Notice } from '../models/notice';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = signal<Notice[]>([]);
  private isLoading = signal(false);

  readonly allNotifications = this.notifications.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    // TODO: Initialize Firebase Realtime Database connection
    this.loadMockData();
  }

  async loadNotifications(limit = 20, startAfter?: string): Promise<Notice[]> {
    this.isLoading.set(true);
    try {
      // TODO: Implement Firebase database query
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
      // TODO: Query Firebase by slug
      const notifications = this.notifications();
      return notifications.find((n) => n.slug === slug) || null;
    } catch (error) {
      console.error('Error getting notification by slug:', error);
      return null;
    }
  }

  async createNotification(notification: Omit<Notice, 'id'>): Promise<string> {
    try {
      // TODO: Create in Firebase
      const id = `notice-${Date.now()}`;
      const newNotification: Notice = { ...notification, id };
      this.notifications.update((notices) => [...notices, newNotification]);
      return id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async updateNotification(id: string, updates: Partial<Notice>): Promise<void> {
    try {
      // TODO: Update in Firebase
      this.notifications.update((notices) =>
        notices.map((n) => (n.id === id ? { ...n, ...updates } : n))
      );
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      // TODO: Delete from Firebase
      this.notifications.update((notices) => notices.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
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
    return [
      {
        id: '1',
        title: 'Blanket Service Maintenance',
        description:
          'Scheduled maintenance will occur on the blanket service platform from 2:00 AM to 4:00 AM UTC. Users may experience temporary service interruptions during this window.',
        datetime: new Date('2024-11-07T02:00:00Z').toISOString(),
        slug: 'blanket-service-maintenance',
        affectedProducts: ['blanket-eol'],
      },
      {
        id: '2',
        title: 'Portal Security Update',
        description:
          'A critical security update will be deployed to the portal system. All users will be automatically logged out and required to sign in again.',
        datetime: new Date('2024-11-06T15:30:00Z').toISOString(),
        slug: 'portal-security-update',
        affectedProducts: ['portal'],
      },
      {
        id: '3',
        title: 'EOLDs System Deprecation Notice',
        description:
          'The EOLDs system will be deprecated on December 31, 2024. Users are advised to migrate their data to the new platform before this date.',
        datetime: new Date('2024-11-05T09:00:00Z').toISOString(),
        slug: 'eolds-system-deprecation',
        affectedProducts: ['eolds'],
      },
    ];
  }
}
