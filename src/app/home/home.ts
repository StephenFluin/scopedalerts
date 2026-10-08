import {
  Component,
  inject,
  signal,
  computed,
  effect,
  untracked,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { SubscriptionService } from '../services/subscription.service';
import { Notice } from '../models/notice';
import { Product } from '../models/product';
import { MarkdownTextPipe } from '../shared/markdown.pipe';
import { HealthPill } from '../shared/health-pill';
import { RelativeTime } from '../shared/relative-time';
import {
  HEALTH_LABELS,
  isOngoing,
  markdownToText,
  productHealth,
  severityOf,
} from '../utils/notice.utils';

const DAY_MS = 24 * 3600 * 1000;

interface DayGroup {
  key: string; // YYYY-MM-DD (UTC)
  label: string;
  notices: Notice[];
}

/** Groups notices by UTC day so server and browser render identical structure. */
function groupByDay(notices: Notice[], now = Date.now()): DayGroup[] {
  const today = new Date(now).toISOString().slice(0, 10);
  const yesterday = new Date(now - DAY_MS).toISOString().slice(0, 10);
  const groups: DayGroup[] = [];

  for (const notice of notices) {
    const key = notice.datetime.slice(0, 10);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      const label =
        key === today
          ? 'Today'
          : key === yesterday
            ? 'Yesterday'
            : new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              });
      group = { key, label, notices: [] };
      groups.push(group);
    }
    group.notices.push(notice);
  }
  return groups;
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [RouterLink, MarkdownTextPipe, HealthPill, RelativeTime],
})
export class Home implements OnInit, OnDestroy, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);

  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  @ViewChild('loadMoreTrigger', { static: false }) loadMoreTrigger?: ElementRef<HTMLDivElement>;

  private intersectionObserver?: IntersectionObserver;
  private isLoadingMore = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** Product filter, kept in the URL (?products=slug-a,slug-b) so views can be shared. */
  protected readonly selectedSlugs = computed(() =>
    (this.queryParams().get('products') ?? '')
      .split(',')
      .map((slug) => slug.trim())
      .filter(Boolean)
  );

  protected readonly selectedProductIds = computed(() => {
    const slugs = new Set(this.selectedSlugs());
    return this.productService
      .allProducts()
      .filter((product) => slugs.has(product.slug))
      .map((product) => product.id);
  });

  /** Search text, also kept in the URL (?q=...). */
  protected readonly searchQuery = computed(() => (this.queryParams().get('q') ?? '').trim());

  /** Every notice, loaded on demand the first time someone searches. */
  private readonly allNotices = signal<Notice[] | null>(null);
  protected readonly searching = computed(() => this.searchQuery().length > 0);

  protected readonly filteredNotifications = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const source =
      query && this.allNotices() ? this.allNotices()! : this.notificationService.allNotifications();
    const selectedIds = new Set(this.selectedProductIds());

    return source.filter((notice) => {
      if (selectedIds.size > 0 && !notice.affectedProducts.some((id) => selectedIds.has(id))) {
        return false;
      }
      if (query) {
        const haystack = `${notice.title} ${markdownToText(notice.description)}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  });

  protected readonly groupedNotifications = computed(() =>
    groupByDay(this.filteredNotifications())
  );

  protected readonly showAllProducts = computed(() => this.selectedProductIds().length === 0);

  protected readonly ongoingNotices = computed(() =>
    this.notificationService.allNotifications().filter(isOngoing)
  );

  protected readonly productStatuses = computed(() =>
    this.productService.allProducts().map((product) => ({
      product,
      health: productHealth(this.notificationService.allNotifications(), product.id),
    }))
  );

  protected readonly subscribedProductIds = computed(() =>
    this.userService.user() ? this.subscriptionService.subscribedProductIds() : []
  );

  protected readonly showingSubscriptions = computed(() => {
    const subscribed = this.subscribedProductIds();
    const selected = this.selectedProductIds();
    return (
      subscribed.length > 0 &&
      subscribed.length === selected.length &&
      subscribed.every((id) => selected.includes(id))
    );
  });

  private readonly feedQuery = computed(() => {
    const slugs = this.selectedProductIds()
      .map((id) => this.getProductById(id)?.slug)
      .filter(Boolean);
    return slugs.length > 0 ? `?products=${slugs.join(',')}` : '';
  });

  protected readonly rssUrl = computed(() => `/rss${this.feedQuery()}`);
  protected readonly calendarUrl = computed(() => `/calendar.ics${this.feedQuery()}`);

  protected readonly resultsAnnouncement = computed(() => {
    if (this.notificationService.loading()) return '';
    const count = this.filteredNotifications().length;
    const noun = count === 1 ? 'notification' : 'notifications';
    if (!this.searching()) return `Showing ${count} ${noun}`;
    return `${count} ${noun} ${count === 1 ? 'matches' : 'match'} "${this.searchQuery()}"`;
  });

  constructor() {
    // Load all notices the first time a search is made
    effect(() => {
      if (this.searching() && this.allNotices() === null) {
        untracked(() => {
          this.allNotices.set([]);
          this.notificationService
            .loadNoticesSince(null)
            .then((notices) => this.allNotices.set(notices));
        });
      }
    });

    // Load the user's subscriptions so they can filter to "My products"
    effect(() => {
      if (this.userService.user() && !this.subscriptionService.isLoaded()) {
        untracked(() => this.subscriptionService.loadSubscriptions());
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Delay setup to ensure the view is fully initialized
    setTimeout(() => {
      this.setupIntersectionObserver();
    }, 100);
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    clearTimeout(this.searchDebounce);
  }

  private async loadData(): Promise<void> {
    // Reset notifications when loading fresh data
    this.notificationService.resetNotifications();
    await Promise.all([
      this.notificationService.loadNotifications(),
      this.productService.loadProducts(),
    ]);
    // Re-setup observer after loading data (only in browser)
    if (this.isBrowser) {
      this.setupIntersectionObserver();
    }
  }

  private setupIntersectionObserver(): void {
    // Only setup intersection observer in browser environment
    if (!this.isBrowser) return;

    this.intersectionObserver?.disconnect();

    // Wait for the loadMoreTrigger to be available
    setTimeout(() => {
      if (!this.loadMoreTrigger?.nativeElement || !this.isBrowser) return;

      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (
            entry.isIntersecting &&
            !this.searching() &&
            this.notificationService.hasMoreNotifications() &&
            !this.notificationService.loading() &&
            !this.isLoadingMore
          ) {
            this.loadMoreNotifications();
          }
        },
        {
          rootMargin: '200px', // Trigger 200px before the element comes into view
          threshold: 0.1,
        }
      );

      this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
    }, 0);
  }

  private async loadMoreNotifications(): Promise<void> {
    if (this.isLoadingMore) return;

    this.isLoadingMore = true;
    try {
      await this.notificationService.loadMoreNotifications();
      // Re-setup observer after loading more content
      setTimeout(() => {
        this.setupIntersectionObserver();
      }, 100);
    } finally {
      this.isLoadingMore = false;
    }
  }

  private updateQuery(params: { products?: string[]; q?: string }): void {
    const queryParams: Record<string, string | null> = {};
    if (params.products) queryParams['products'] = params.products.join(',') || null;
    if (params.q !== undefined) queryParams['q'] = params.q || null;
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private slugsFor(ids: string[]): string[] {
    return ids.map((id) => this.getProductById(id)?.slug).filter((slug): slug is string => !!slug);
  }

  toggleAllProducts(): void {
    this.updateQuery({ products: [] });
  }

  toggleProduct(productId: string): void {
    const ids = this.selectedProductIds();
    const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId];
    this.updateQuery({ products: this.slugsFor(next) });
  }

  showMyProducts(): void {
    this.updateQuery({ products: this.slugsFor(this.subscribedProductIds()) });
  }

  onSearchInput(value: string): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.updateQuery({ q: value.trim() }), 250);
  }

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    clearTimeout(this.searchDebounce);
    this.updateQuery({ q: '' });
    input.focus();
  }

  getProductById(id: string): Product | undefined {
    return this.productService.allProducts().find((p) => p.id === id);
  }

  protected readonly healthLabels = HEALTH_LABELS;
  protected readonly severityOf = severityOf;
  protected readonly isOngoing = isOngoing;
}
