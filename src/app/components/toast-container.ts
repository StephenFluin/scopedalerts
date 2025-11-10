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
              @switch (toast.type) {
                @case ('success') { ✅ }
                @case ('error') { ❌ }
                @case ('warning') { ⚠️ }
                @default { ℹ️ }
              }
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
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease-out;
      min-width: 300px;
      backdrop-filter: blur(10px);
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
      gap: 8px;
      flex: 1;
    }

    .toast-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .toast-message {
      color: inherit;
      font-weight: 500;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 1.5rem;
      line-height: 1;
      padding: 0;
      margin-left: 8px;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      
      &:hover {
        opacity: 1;
      }
    }

    .toast-success {
      background-color: rgba(76, 175, 80, 0.9);
      color: white;
    }

    .toast-error {
      background-color: rgba(244, 67, 54, 0.9);
      color: white;
    }

    .toast-warning {
      background-color: rgba(255, 152, 0, 0.9);
      color: white;
    }

    .toast-info {
      background-color: rgba(33, 150, 243, 0.9);
      color: white;
    }

    :host-context(body.dark) .toast {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    @media (max-width: 768px) {
      .toast-container {
        bottom: 10px;
        left: 10px;
        right: 10px;
        transform: none;
        max-width: none;
      }

      .toast {
        min-width: auto;
        width: 100%;
      }
    }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}