import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
    title: 'ScopedAlerts - Product Notifications',
  },
  {
    path: 'status',
    loadComponent: () => import('./status/status').then((m) => m.StatusPage),
    title: 'Product Status - ScopedAlerts',
    data: { description: 'Current status and 90-day incident history for every product.' },
  },
  {
    path: 'subscribe',
    loadComponent: () => import('./subscribe/subscribe').then((m) => m.SubscribeComponent),
    title: 'Manage Subscriptions - ScopedAlerts',
    data: { noindex: true },
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
    data: { noindex: true },
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then((m) => m.AdminComponent),
    title: 'Admin Panel - ScopedAlerts',
    data: { noindex: true },
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./admin/products/products').then((m) => m.AdminProductsComponent),
    title: 'Product Management - ScopedAlerts',
    data: { noindex: true },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
