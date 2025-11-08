import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styles: `
    .footer {
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      padding: 24px 16px;
      margin-top: auto;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    :host-context(body.dark) .footer {
      background-color: #1e1e1e;
      border-top-color: rgba(255, 255, 255, 0.12);
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    .attribution {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }

    :host-context(body.dark) .attribution {
      color: rgba(255, 255, 255, 0.6);
    }

    .copyright {
      margin: 0;
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.4);
    }

    :host-context(body.dark) .copyright {
      color: rgba(255, 255, 255, 0.4);
    }

    .creator-link,
    .github-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
      
      &:hover {
        color: #303f9f;
        text-decoration: underline;
      }
    }

    :host-context(body.dark) .creator-link,
    :host-context(body.dark) .github-link {
      color: #7986cb;
      
      &:hover {
        color: #9fa8da;
      }
    }

    @media (max-width: 768px) {
      .footer {
        padding: 16px 8px;
      }
      
      .attribution {
        font-size: 0.8rem;
      }
      
      .copyright {
        font-size: 0.7rem;
      }
    }
  `,
})
export class Footer {
  protected readonly currentYear = new Date().getFullYear();
}
