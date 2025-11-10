import {
  Injectable,
  signal,
  effect,
  Renderer2,
  RendererFactory2,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private rendererFactory = inject(RendererFactory2);
  private renderer: Renderer2;
  private isBrowser = isPlatformBrowser(this.platformId);

  private isDarkMode = signal<boolean>(false);

  readonly darkMode = this.isDarkMode.asReadonly();

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    if (this.isBrowser) {
      // Check for saved theme preference or default to system preference
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

      // Sync with any theme already applied in index.html
      this.isDarkMode.set(shouldUseDark);

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.isDarkMode.set(e.matches);
        }
      });
    }

    // React to theme changes
    effect(() => {
      this.applyTheme();
    });
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkMode();
    this.isDarkMode.set(newTheme);

    if (this.isBrowser) {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);

    if (this.isBrowser) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }

  private applyTheme(): void {
    // Only apply theme changes on the client side
    if (!this.isBrowser) {
      return;
    }

    const body = this.document.body;
    const html = this.document.documentElement;

    // Apply .dark class to both html and body elements
    if (this.isDarkMode()) {
      this.renderer.addClass(html, 'dark');
      this.renderer.addClass(body, 'dark');
    } else {
      this.renderer.removeClass(html, 'dark');
      this.renderer.removeClass(body, 'dark');
    }
  }
}
