import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { SubscriptionService } from '../services/subscription.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';
import { SITE_ORIGIN } from '../services/canonical.service';

@Component({
  selector: 'app-subscribe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscribe.html',
  styleUrl: './subscribe.scss',
})
export class SubscribeComponent implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  private subscriptionService = inject(SubscriptionService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  protected readonly selectedProductIds = signal<Set<string>>(new Set());
  protected readonly authCheckComplete = signal(false);
  protected readonly lastSaved = signal<'saved' | 'error' | null>(null);
  private initializedFromSubscriptions = false;

  protected readonly user = computed(() => this.userService.user());
  protected readonly products = computed(() => this.productService.allProducts());
  protected readonly loading = computed(
    () =>
      this.productService.loading() ||
      this.subscriptionService.isLoading() ||
      !this.authCheckComplete()
  );
  protected readonly saving = computed(() => this.subscriptionService.isSaving());

  /** Feeds scoped to the user's saved subscriptions. */
  private readonly feedQuery = computed(() => {
    const ids = new Set(this.subscriptionService.subscribedProductIds());
    const slugs = this.products()
      .filter((product) => ids.has(product.id))
      .map((product) => product.slug);
    return slugs.length > 0 ? `?products=${slugs.join(',')}` : '';
  });
  protected readonly hasSubscriptions = computed(() => this.feedQuery() !== '');
  protected readonly rssUrl = computed(() => `${SITE_ORIGIN}/rss${this.feedQuery()}`);
  protected readonly calendarUrl = computed(() => `${SITE_ORIGIN}/calendar.ics${this.feedQuery()}`);

  constructor() {
    // Sync selected checkboxes with subscriptions once they have finished loading
    effect(() => {
      const user = this.user();
      const loaded = this.subscriptionService.isLoaded();

      if (!user) {
        // Reset when user logs out
        this.selectedProductIds.set(new Set());
        this.initializedFromSubscriptions = false;
        return;
      }

      if (loaded && !this.initializedFromSubscriptions) {
        this.selectedProductIds.set(new Set(this.subscriptionService.subscribedProductIds()));
        this.initializedFromSubscriptions = true;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      // Resolves once Firebase has restored any existing session
      await this.userService.ensureAuthInitialized();
      this.authCheckComplete.set(true);

      // Load data if user is authenticated; otherwise the template shows a sign-in prompt
      if (this.user()) {
        await this.loadData();
      }
    } catch (error) {
      console.error('Error during component initialization:', error);
      this.authCheckComplete.set(true);
    }
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.productService.loadProducts(),
        this.subscriptionService.loadSubscriptions(),
      ]);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      this.toastService.error('Failed to load subscription data');
    }
  }

  isProductSelected(productId: string): boolean {
    return this.selectedProductIds().has(productId);
  }

  /** Saves immediately on every change, with an undo in the confirmation toast. */
  async onProductToggle(productId: string, isChecked: boolean): Promise<void> {
    const previous = new Set(this.selectedProductIds());
    const next = new Set(previous);
    if (isChecked) {
      next.add(productId);
    } else {
      next.delete(productId);
    }

    const name = this.products().find((p) => p.id === productId)?.name ?? 'product';
    const saved = await this.save(next);
    if (saved) {
      this.toastService.success(
        isChecked ? `Subscribed to ${name}` : `Unsubscribed from ${name}`,
        6000,
        { label: 'Undo', callback: () => this.save(previous) }
      );
    }
  }

  private async save(productIds: Set<string>): Promise<boolean> {
    const before = this.selectedProductIds();
    this.selectedProductIds.set(productIds);
    try {
      await this.subscriptionService.saveSubscriptions([...productIds]);
      this.lastSaved.set('saved');
      return true;
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      this.selectedProductIds.set(before);
      this.lastSaved.set('error');
      this.toastService.error('Failed to save subscriptions');
      return false;
    }
  }

  protected async copy(text: string, event: Event): Promise<void> {
    const button = event.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied!';
      setTimeout(() => (button.textContent = 'Copy'), 1500);
    } catch {
      this.toastService.error('Could not copy to clipboard');
    }
  }

  onBack(): void {
    this.router.navigate(['/']);
  }

  async onSignIn(): Promise<void> {
    try {
      // Reset initialization flag before signing in
      this.initializedFromSubscriptions = false;

      await this.userService.signInWithGoogle();
      // After successful sign-in, load data
      if (this.user()) {
        await this.loadData();
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      this.toastService.error('Failed to sign in');
    }
  }
}
