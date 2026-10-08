import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const SITE_ORIGIN = 'https://alerts.fluin.io';

/**
 * Keeps a <link rel="canonical"> in the document head pointing at the
 * production URL for the current route (without query params or fragment).
 */
@Injectable({
  providedIn: 'root',
})
export class CanonicalService {
  private document = inject(DOCUMENT);
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.setCanonical(event.urlAfterRedirects));
  }

  private setCanonical(url: string): void {
    const path = url.split(/[?#]/)[0] || '/';
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', SITE_ORIGIN + path);
  }
}
