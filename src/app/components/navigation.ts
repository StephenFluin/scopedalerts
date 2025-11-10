import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { ThemeService } from '../services/theme.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navigation.html',
  styles: `
    .navbar {
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      padding: 0 var(--spacing-lg);
      position: sticky;
      top: 0;
      z-index: 100;
      transition: background-color var(--transition-normal), border-color var(--transition-normal);
    }

    .nav-content {
      max-width: var(--max-width-page);
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: var(--navbar-height);
    }

    .nav-brand h1 {
      margin: 0;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary-600);
    }
    
    .nav-brand .brand-link {
      text-decoration: none;
      color: inherit;
    }
    
    .nav-brand .brand-link:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
      border-radius: var(--radius-sm);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--font-size-xl);
      font-weight: var(--button-font-weight);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      background-color: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
      min-width: auto;
    }
    
    .theme-toggle:hover:not(:disabled) {
      background-color: var(--color-hover-light);
      border-color: var(--color-border-focus);
    }
    
    .theme-toggle:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .user-section {
      display: flex;
      align-items: center;
    }

    .login-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--button-padding-md);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      background-color: var(--color-primary-600);
      color: white;
    }
    
    .login-btn:hover:not(:disabled) {
      background-color: var(--color-primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    .login-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .user-name {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      cursor: pointer;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-sm);
      user-select: none;
      transition: background-color var(--transition-fast);
    }
    
    .user-name:hover {
      background-color: var(--color-hover-light);
    }
    
    .user-name:active {
      background-color: var(--color-active-light);
    }
    
    .user-name:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .logout-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-md);
      border: none;
      border-radius: var(--button-radius);
      font-size: var(--font-size-base);
      font-weight: var(--button-font-weight);
      text-decoration: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
      background-color: transparent;
      color: var(--color-text-primary);
      border: 1px solid var(--color-border-strong);
    }
    
    .logout-btn:hover:not(:disabled) {
      background-color: var(--color-hover-light);
      border-color: var(--color-border-focus);
    }
    
    .logout-btn:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
    
    .logout-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .nav-content {
        padding: 0 var(--spacing-sm);
      }
      
      .nav-brand h1 {
        font-size: var(--font-size-xl);
      }
      
      .user-info {
        flex-direction: column;
        align-items: flex-end;
        gap: var(--spacing-xs);
      }
      
      .user-name {
        font-size: var(--font-size-sm);
      }
      
      .nav-actions {
        gap: var(--spacing-md);
      }
    }
  `,
  imports: [RouterLink],
})
export class Navigation {
  protected readonly userService = inject(UserService);
  protected readonly themeService = inject(ThemeService);
  protected readonly toastService = inject(ToastService);

  async copyUidToClipboard(): Promise<void> {
    const user = this.userService.user();
    if (!user?.uid) {
      this.toastService.error('No user ID available');
      return;
    }

    try {
      await navigator.clipboard.writeText(user.uid);
      this.toastService.success('User ID copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy UID to clipboard:', error);
      this.toastService.error('Failed to copy User ID');
    }
  }

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
