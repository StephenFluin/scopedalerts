import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'notifications/:slug',
    renderMode: RenderMode.Server,
    // Dynamic routes should use server-side rendering
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
