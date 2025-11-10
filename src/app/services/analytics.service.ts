import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly GA_TRACKING_ID = 'G-NSGF40WT71';
  private isInitialized = false;

  constructor() {
    this.initializeGoogleAnalytics();
    this.trackRouteChanges();
  }

  private initializeGoogleAnalytics(): void {
    // Only initialize in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Create gtag function
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Configure Google Analytics
    script.onload = () => {
      window.gtag('js', new Date());
      window.gtag('config', this.GA_TRACKING_ID, {
        page_title: document.title,
        page_location: window.location.href,
      });
      this.isInitialized = true;
    };
  }

  private trackRouteChanges(): void {
    // Only track in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (this.isInitialized) {
          this.trackPageView(event.urlAfterRedirects);
        }
      });
  }

  trackPageView(url: string): void {
    if (typeof window === 'undefined' || !this.isInitialized) {
      return;
    }

    window.gtag('config', this.GA_TRACKING_ID, {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href,
    });
  }

  trackEvent(action: string, category: string, label?: string, value?: number): void {
    if (typeof window === 'undefined' || !this.isInitialized) {
      return;
    }

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  trackCustomEvent(eventName: string, parameters?: { [key: string]: any }): void {
    if (typeof window === 'undefined' || !this.isInitialized) {
      return;
    }

    window.gtag('event', eventName, parameters);
  }
}
