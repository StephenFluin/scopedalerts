import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
    title: 'ScopedAlerts - Product Notifications',
  },
  {
    path: 'subscribe',
    loadComponent: () => import('./subscribe/subscribe').then((m) => m.SubscribeComponent),
    title: 'Manage Subscriptions - ScopedAlerts',
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
    title: 'Edit Notification - ScopedAlerts',
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then((m) => m.AdminComponent),
    title: 'Admin Panel - ScopedAlerts',
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./admin/products/products').then((m) => m.AdminProductsComponent),
    title: 'Product Management - ScopedAlerts',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
