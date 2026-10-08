import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { SITE_ORIGIN } from '../services/canonical.service';
import { Notice } from '../models/notice';
import { Product } from '../models/product';
import { HealthPill } from '../shared/health-pill';
import {
  HEALTH_LABELS,
  ProductHealth,
  isOngoing,
  productHealth,
  severityOf,
  worstHealth,
} from '../utils/notice.utils';

const HISTORY_DAYS = 90;
const DAY_MS = 24 * 3600 * 1000;

interface DayCell {
  date: string; // YYYY-MM-DD (UTC)
  health: ProductHealth;
  label: string;
}

interface ProductRow {
  product: Product;
  health: ProductHealth;
  days: DayCell[];
  incidentDays: number;
  badgeSnippet: string;
  embedSnippet: string;
}

/** Midnight UTC of the given time. */
function startOfUtcDay(time: number): number {
  return Math.floor(time / DAY_MS) * DAY_MS;
}

/** The time range a notice covers, for coloring history days. */
function noticeSpan(notice: Notice, now: number): [number, number] {
  const start = new Date(notice.datetime).getTime();
  const end = notice.endsAt
    ? new Date(notice.endsAt).getTime()
    : isOngoing(notice)
      ? now
      : start;
  return [start, Math.max(start, end)];
}

@Component({
  selector: 'app-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status.html',
  styleUrl: './status.scss',
  imports: [RouterLink, HealthPill],
})
export class StatusPage implements OnInit {
  private notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);

  protected readonly notices = signal<Notice[]>([]);
  protected readonly loading = signal(true);

  protected readonly rows = computed<ProductRow[]>(() => {
    const notices = this.notices();
    const now = Date.now();
    const today = startOfUtcDay(now);

    return this.productService.allProducts().map((product) => {
      const spans = notices
        .filter((n) => n.affectedProducts.includes(product.id))
        .map((n) => ({ health: severityOf(n) as ProductHealth, span: noticeSpan(n, now) }));

      const days: DayCell[] = [];
      for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
        const dayStart = today - i * DAY_MS;
        const dayEnd = dayStart + DAY_MS;
        const health = spans
          .filter(({ span: [start, end] }) => start < dayEnd && end >= dayStart)
          .reduce<ProductHealth>((worst, { health }) => worstHealth(worst, health), 'operational');
        const date = new Date(dayStart).toISOString().slice(0, 10);
        days.push({ date, health, label: `${date}: ${HEALTH_LABELS[health]}` });
      }

      return {
        product,
        health: productHealth(notices, product.id),
        days,
        incidentDays: days.filter((d) => d.health === 'degraded' || d.health === 'outage').length,
        badgeSnippet: `[![${product.name} status](${SITE_ORIGIN}/badge/${product.slug}.svg)](${SITE_ORIGIN}/status)`,
        embedSnippet: `<iframe src="${SITE_ORIGIN}/embed/${product.slug}" title="${product.name} status" width="360" height="130" style="border:0"></iframe>`,
      };
    });
  });

  protected readonly overall = computed<ProductHealth>(() =>
    this.rows().reduce<ProductHealth>((worst, row) => worstHealth(worst, row.health), 'operational')
  );

  protected readonly overallLabel = computed(() => {
    switch (this.overall()) {
      case 'operational':
      case 'info':
        return 'All products operational';
      case 'maintenance':
        return 'Scheduled maintenance in progress';
      case 'degraded':
        return 'Some products are degraded';
      case 'outage':
        return 'Some products are experiencing an outage';
    }
  });

  async ngOnInit(): Promise<void> {
    const since = new Date(startOfUtcDay(Date.now()) - (HISTORY_DAYS - 1) * DAY_MS).toISOString();
    const [notices] = await Promise.all([
      this.notificationService.loadNoticesSince(since),
      this.productService.loadProducts(),
    ]);
    this.notices.set(notices);
    this.loading.set(false);
  }

  protected historySummary(row: ProductRow): string {
    return row.incidentDays === 0
      ? `No incidents in the last ${HISTORY_DAYS} days`
      : `${row.incidentDays} ${row.incidentDays === 1 ? 'day' : 'days'} with incidents in the last ${HISTORY_DAYS} days`;
  }

  protected async copy(text: string, event: Event): Promise<void> {
    const button = event.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied!';
      setTimeout(() => (button.textContent = 'Copy'), 1500);
    } catch {
      button.textContent = 'Copy failed';
    }
  }
}
