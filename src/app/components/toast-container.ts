import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (toast of toastService.activeToasts(); track toast.id) {
      <div
        class="toast"
        [class]="'toast-' + toast.type"
        [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
        role="alert"
      >
        <div class="toast-content">
          <span class="toast-icon">
            @switch (toast.type) { @case ('success') { ✅ } @case ('error') { ❌ } @case ('warning')
            { ⚠️ } @default { ℹ️ } }
          </span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button
          type="button"
          class="toast-close"
          (click)="toastService.remove(toast.id)"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      }
    </div>
  `,
  styles: `
    .toast-container {
      position: fixed;
      bottom: var(--spacing-xl);
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      animation: slideUp var(--transition-slow) ease-out;
      min-width: 300px;
      backdrop-filter: blur(10px);
      pointer-events: auto;
      border: 1px solid transparent;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex: 1;
    }

    .toast-icon {
      font-size: var(--font-size-lg);
      flex-shrink: 0;
    }

    .toast-message {
      color: inherit;
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-base);
      line-height: var(--line-height-base);
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: var(--font-size-2xl);
      line-height: 1;
      padding: var(--spacing-xs);
      margin-left: var(--spacing-sm);
      opacity: 0.8;
      transition: opacity var(--transition-fast);
      border-radius: var(--radius-sm);
      
      &:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
        outline-color: currentColor;
      }
    }

    .toast-success {
      background-color: var(--color-success-600);
      color: white;
      border-color: var(--color-success-700);
    }

    .toast-error {
      background-color: var(--color-error-600);
      color: white;
      border-color: var(--color-error-700);
    }

    .toast-warning {
      background-color: var(--color-warning-600);
      color: white;
      border-color: var(--color-warning-700);
    }

    .toast-info {
      background-color: var(--color-primary-600);
      color: white;
      border-color: var(--color-primary-700);
    }

    /* Enhanced shadow for dark theme */
    html.dark .toast {
      box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .toast-container {
        bottom: var(--spacing-lg);
        left: var(--spacing-lg);
        right: var(--spacing-lg);
        transform: none;
        max-width: none;
      }

      .toast {
        min-width: auto;
        width: 100%;
      }
    }
    
    @media (prefers-reduced-motion: reduce) {
      .toast {
        animation: none;
      }
    }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
