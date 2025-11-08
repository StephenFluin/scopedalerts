import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
    title: 'ScopedAlerts - Product Notifications',
  },
  {
    path: 'notifications/:slug',
    loadComponent: () =>
      import('./view-notification/view-notification').then((m) => m.ViewNotification),
    title: 'Notification Details - ScopedAlerts',
  },
  {
    path: 'notifications/:slug/edit',
    loadComponent: () =>
      import('./edit-notification/edit-notification').then((m) => m.EditNotification),
    canActivate: [adminGuard],
    title: 'Edit Notification - ScopedAlerts',
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then((m) => m.AdminComponent),
    canActivate: [adminGuard],
    title: 'Admin Panel - ScopedAlerts',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
