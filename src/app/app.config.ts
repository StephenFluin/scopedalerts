import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AnalyticsService } from './services/analytics.service';
import { ThemeService } from './services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideEnvironmentInitializer(() => {
      // Initialize analytics service at startup
      inject(AnalyticsService);
      inject(ThemeService);
    }),
  ],
};
