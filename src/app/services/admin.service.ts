import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Admin } from '../models/admin';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private admins = signal<Admin[]>([]);
  private isLoading = signal(false);
  private platformId = inject(PLATFORM_ID);
  private firebaseService = inject(FirebaseService);

  readonly allAdmins = this.admins.asReadonly();
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    this.loadAdmins();
  }

  async loadAdmins(): Promise<Admin[]> {
    this.isLoading.set(true);
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, get } = databaseMethods;
        const adminsRef = ref(firebaseDatabase, 'admins');
        const snapshot = await get(adminsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const admins = Object.keys(data).map((key) => ({
            uid: key,
            ...data[key],
          }));
          this.admins.set(admins);
          return admins;
        }
      }

      const mockAdmins = this.getMockAdmins();
      this.admins.set(mockAdmins);
      return mockAdmins;
    } catch (error) {
      console.error('Error loading admins:', error);
      const mockAdmins = this.getMockAdmins();
      this.admins.set(mockAdmins);
      return mockAdmins;
    } finally {
      this.isLoading.set(false);
    }
  }

  async addAdmin(admin: Omit<Admin, 'uid'>): Promise<void> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, set } = databaseMethods;
        const newUid = `uid-${Date.now()}`;
        const adminRef = ref(firebaseDatabase, `admins/${newUid}`);
        await set(adminRef, admin);

        // Update local state
        const newAdmin: Admin = { ...admin, uid: newUid };
        this.admins.update((admins) => [...admins, newAdmin]);
        return;
      }

      const newAdmin: Admin = { ...admin, uid: `uid-${Date.now()}` };
      this.admins.update((admins) => [...admins, newAdmin]);
    } catch (error) {
      console.error('Error adding admin:', error);
      throw error;
    }
  }

  async removeAdmin(uid: string): Promise<void> {
    try {
      const firebaseDatabase = await this.firebaseService.getDatabase();
      const databaseMethods = await this.firebaseService.getDatabaseMethods();

      if (firebaseDatabase && databaseMethods) {
        const { ref, remove } = databaseMethods;
        const adminRef = ref(firebaseDatabase, `admins/${uid}`);
        await remove(adminRef);

        // Update local state
        this.admins.update((admins) => admins.filter((a) => a.uid !== uid));
        return;
      }

      this.admins.update((admins) => admins.filter((a) => a.uid !== uid));
    } catch (error) {
      console.error('Error removing admin:', error);
      throw error;
    }
  }

  isUserAdmin(uid: string): boolean {
    return this.admins().some((admin) => admin.uid === uid);
  }

  private getMockAdmins(): Admin[] {
    return [
      {
        uid: 'admin1',
        email: 'admin@example.com',
        displayName: 'System Administrator',
      },
    ];
  }
}
