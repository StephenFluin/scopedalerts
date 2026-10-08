import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_ORIGIN } from './canonical.service';

export const DEFAULT_DESCRIPTION =
  'Stay updated with product notifications and alerts for your essential services.';

export interface PageMeta {
  title: string;
  description: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Manages the page's description, Open Graph / Twitter tags and robots directives.
 * Every navigation resets them to the route's defaults; pages with richer content
 * (like a notification) call setPage() once their data loads.
 */
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const route = this.deepestChild(this.router.routerState.snapshot.root);
        this.setRobots(route.data['noindex'] ? 'noindex, nofollow' : 'index, follow');
        this.applyMeta(
          {
            title: route.title ?? 'ScopedAlerts',
            description: route.data['description'] ?? DEFAULT_DESCRIPTION,
          },
          event.urlAfterRedirects
        );
      });
  }

  setPage(page: PageMeta): void {
    this.title.setTitle(`${page.title} - ScopedAlerts`);
    this.applyMeta(page, this.router.url);
  }

  private applyMeta(page: PageMeta, url: string): void {
    const pageUrl = SITE_ORIGIN + (url.split(/[?#]/)[0] || '/');
    const tags: Record<string, string> = {
      'og:title': page.title,
      'og:description': page.description,
      'og:type': page.type ?? 'website',
      'og:url': pageUrl,
      'og:site_name': 'ScopedAlerts',
      'og:image': `${SITE_ORIGIN}/og-image.png`,
      'twitter:card': 'summary_large_image',
      'twitter:title': page.title,
      'twitter:description': page.description,
    };

    this.meta.updateTag({ name: 'description', content: page.description });
    for (const [property, content] of Object.entries(tags)) {
      const attr = property.startsWith('twitter:') ? 'name' : 'property';
      this.meta.updateTag({ [attr]: property, content });
    }

    for (const property of ['article:published_time', 'article:modified_time']) {
      this.meta.removeTag(`property="${property}"`);
    }
    if (page.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: page.publishedTime });
    }
    if (page.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: page.modifiedTime });
    }
  }

  private setRobots(content: string): void {
    this.meta.updateTag({ name: 'robots', content });
  }

  private deepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    while (route.firstChild) route = route.firstChild;
    return route;
  }
}
