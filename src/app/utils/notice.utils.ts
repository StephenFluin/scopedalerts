import { marked } from 'marked';
import { Notice, NoticeSeverity } from '../models/notice';

export type ProductHealth = 'operational' | NoticeSeverity;

export const SEVERITY_LABELS: Record<NoticeSeverity, string> = {
  info: 'Info',
  maintenance: 'Maintenance',
  degraded: 'Degraded',
  outage: 'Outage',
};

export const HEALTH_LABELS: Record<ProductHealth, string> = {
  operational: 'Operational',
  ...SEVERITY_LABELS,
};

const SEVERITY_RANK: Record<ProductHealth, number> = {
  operational: 0,
  info: 1,
  maintenance: 2,
  degraded: 3,
  outage: 4,
};

export function severityOf(notice: Pick<Notice, 'severity'>): NoticeSeverity {
  return notice.severity ?? 'info';
}

export function isOngoing(notice: Pick<Notice, 'status'>): boolean {
  return notice.status === 'ongoing';
}

/** Returns whichever of two health values is more severe. */
export function worstHealth(a: ProductHealth, b: ProductHealth): ProductHealth {
  return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a;
}

/** Current health of a product: the most severe ongoing notice affecting it, if any. */
export function productHealth(notices: Notice[], productId: string): ProductHealth {
  return notices
    .filter((n) => isOngoing(n) && n.affectedProducts?.includes(productId))
    .reduce<ProductHealth>((health, n) => worstHealth(health, severityOf(n)), 'operational');
}

/** Renders notice Markdown to HTML. Callers must still sanitize before inserting into a page. */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown ?? '', { async: false, gfm: true, breaks: true });
}

/** Plain-text version of notice Markdown, for excerpts and meta descriptions. */
export function markdownToText(markdown: string, maxLength = Infinity): string {
  const text = renderMarkdown(markdown)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? text.slice(0, maxLength - 1).trimEnd() + '…' : text;
}
