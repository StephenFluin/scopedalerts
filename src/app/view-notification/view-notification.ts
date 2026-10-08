import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  ChangeDetectionStrategy,
  PendingTasks,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import { UserService } from '../services/user.service';
import { ReactionService } from '../services/reaction.service';
import { SeoService } from '../services/seo.service';
import { ToastService } from '../services/toast.service';
import { Notice } from '../models/notice';
import { Product } from '../models/product';
import { MarkdownPipe } from '../shared/markdown.pipe';
import { HealthPill } from '../shared/health-pill';
import { RelativeTime } from '../shared/relative-time';
import { isOngoing, markdownToText, severityOf } from '../utils/notice.utils';

@Component({
  selector: 'app-view-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-notification.html',
  styleUrls: ['./view-notification.scss'],
  imports: [RouterLink, DatePipe, MarkdownPipe, HealthPill, RelativeTime],
})
export class ViewNotification implements OnInit {
  private route = inject(ActivatedRoute);
  private pendingTasks = inject(PendingTasks);
  private seo = inject(SeoService);
  private toast = inject(ToastService);
  private reactionService = inject(ReactionService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);

  protected readonly notification = signal<Notice | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly reactions = signal({ count: 0, reacted: false });
  protected readonly reacting = signal(false);

  protected readonly severity = computed(() => {
    const notice = this.notification();
    return notice ? severityOf(notice) : 'info';
  });
  protected readonly ongoing = computed(() => {
    const notice = this.notification();
    return !!notice && isOngoing(notice);
  });
  protected readonly affectedProducts = computed(() =>
    (this.notification()?.affectedProducts ?? [])
      .map((id) => this.getProductById(id))
      .filter((product): product is Product => !!product)
  );

  constructor() {
    // Refresh whether the current user has reacted once auth settles
    effect(() => {
      const notice = this.notification();
      const uid = this.userService.user()?.uid ?? null;
      if (notice) {
        this.reactionService
          .load(notice.id, uid)
          .then((state) => this.reactions.set(state))
          .catch(() => {});
      }
    });
  }

  ngOnInit(): void {
    // Render the notification on the server too: SSR waits for this pending task
    this.pendingTasks.run(() => this.loadNotification());
    // Auth only affects admin actions, so it doesn't need to block the content
    this.userService.ensureAuthInitialized();
  }

  private async loadNotification(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.isLoading.set(false);
      return;
    }

    try {
      const [, notice] = await Promise.all([
        this.productService.loadProducts(),
        this.notificationService.getNotificationBySlug(slug),
      ]);
      this.notification.set(notice);

      if (notice) {
        this.seo.setPage({
          title: notice.title,
          description: notice.summary || markdownToText(notice.description, 160),
          type: 'article',
          publishedTime: notice.datetime,
          modifiedTime: isNaN(notice.updatedAt.getTime()) ? undefined : notice.updatedAt.toISOString(),
        });
      } else {
        this.seo.setPage({ title: 'Notification Not Found', description: 'This notification does not exist.' });
      }
    } catch (error) {
      console.error('Error loading notification:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async toggleReaction(): Promise<void> {
    const notice = this.notification();
    const user = this.userService.user();
    if (!notice) return;
    if (!user) {
      try {
        await this.userService.signInWithGoogle();
      } catch {
        this.toast.error('Sign in to mark yourself as affected');
      }
      return;
    }

    const { count, reacted } = this.reactions();
    // Optimistic update
    this.reactions.set({ count: count + (reacted ? -1 : 1), reacted: !reacted });
    this.reacting.set(true);
    try {
      await this.reactionService.setReacted(notice.id, user.uid, !reacted);
    } catch {
      this.reactions.set({ count, reacted });
      this.toast.error('Could not save your reaction');
    } finally {
      this.reacting.set(false);
    }
  }

  protected getProductById(id: string): Product | undefined {
    return this.productService.allProducts().find((p) => p.id === id);
  }
}
