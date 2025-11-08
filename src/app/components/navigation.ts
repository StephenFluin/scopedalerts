import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="navbar">
      <div class="nav-content">
        <div class="nav-brand">
          <a routerLink="/" class="brand-link">
            <h1>ScopedAlerts</h1>
          </a>
        </div>

        <div class="nav-actions">
          <button
            type="button"
            class="theme-toggle"
            (click)="toggleTheme()"
            [attr.aria-label]="
              themeService.darkMode() ? 'Switch to light mode' : 'Switch to dark mode'
            "
          >
            @if (themeService.darkMode()) { ☀️ } @else { 🌙 }
          </button>

          <div class="user-section">
            @if (userService.isGuest()) {
            <button
              type="button"
              class="login-btn"
              (click)="signIn()"
              [disabled]="userService.loading()"
            >
              @if (userService.loading()) { Signing in... } @else { Sign In }
            </button>
            } @else {
            <div class="user-info">
              <span class="user-name">{{ userService.user()?.displayName }}</span>
              @if (userService.isAdmin()) {
              <span class="admin-badge">Admin</span>
              }
              <button
                type="button"
                class="logout-btn"
                (click)="signOut()"
                [disabled]="userService.loading()"
              >
                Sign Out
              </button>
            </div>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: `
    .navbar {
      background-color: white;
      border-bottom: 1px solid #e0e0e0;
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    :host-context(body.dark) .navbar {
      background-color: #1e1e1e;
      border-bottom-color: rgba(255, 255, 255, 0.12);
    }

    .nav-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
    }

    .nav-brand {
      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #3f51b5;
      }
      
      .brand-link {
        text-decoration: none;
        color: inherit;
      }
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .theme-toggle {
      background: none;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 1.2rem;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }

    :host-context(body.dark) .theme-toggle {
      border-color: rgba(255, 255, 255, 0.12);
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    .user-section {
      display: flex;
      align-items: center;
    }

    .login-btn {
      background-color: #3f51b5;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s ease;
      
      &:hover:not(:disabled) {
        background-color: #303f9f;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-name {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    :host-context(body.dark) .user-name {
      color: rgba(255, 255, 255, 0.87);
    }

    .admin-badge {
      background-color: #ff4081;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .logout-btn {
      background: none;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.87);
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background-color: #f5f5f5;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    :host-context(body.dark) .logout-btn {
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
      
      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.05);
      }
    }

    @media (max-width: 768px) {
      .nav-content {
        padding: 0 8px;
      }
      
      .nav-brand h1 {
        font-size: 1.25rem;
      }
      
      .user-info {
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      
      .user-name {
        font-size: 0.875rem;
      }
    }
  `,
  imports: [RouterLink],
})
export class Navigation {
  protected readonly userService = inject(UserService);
  protected readonly themeService = inject(ThemeService);

  async signIn(): Promise<void> {
    try {
      await this.userService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      // TODO: Show error message to user
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.userService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      // TODO: Show error message to user
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
