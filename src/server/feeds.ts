import { Notice } from '../app/models/notice';
import { Product } from '../app/models/product';
import { SITE_ORIGIN } from '../app/services/canonical.service';
import {
  HEALTH_LABELS,
  ProductHealth,
  SEVERITY_LABELS,
  markdownToText,
  productHealth,
  renderMarkdown,
  severityOf,
} from '../app/utils/notice.utils';
import { SiteData, escapeXml, noticesForProducts } from './site-data';

const RSS_ITEM_LIMIT = 50;

function productsQuery(products: Product[]): string {
  return products.length > 0 ? `?products=${products.map((p) => p.slug).join(',')}` : '';
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function renderRss(data: SiteData, products: Product[]): string {
  const names = products.map((p) => p.name).join(', ');
  const title = names ? `ScopedAlerts - ${names} Notifications` : 'ScopedAlerts - All Notifications';
  const description = names
    ? `Product notifications for ${names}`
    : 'All product notifications and updates';

  const items = noticesForProducts(data, products)
    .slice(0, RSS_ITEM_LIMIT)
    .map(
      (notice) => `
    <item>
      <title>${escapeXml(notice.title)}</title>
      <description>${cdata(renderMarkdown(notice.description))}</description>
      <link>${SITE_ORIGIN}/notifications/${escapeXml(notice.slug)}</link>
      <guid isPermaLink="false">${escapeXml(notice.slug)}</guid>
      <category>${SEVERITY_LABELS[severityOf(notice)]}</category>
      <pubDate>${new Date(notice.datetime).toUTCString()}</pubDate>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <link>${SITE_ORIGIN}</link>
    <atom:link href="${SITE_ORIGIN}/rss${escapeXml(productsQuery(products))}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>ScopedAlerts</generator>
    <webMaster>stephen@fluin.io (Stephen Fluin)</webMaster>
    <managingEditor>stephen@fluin.io (Stephen Fluin)</managingEditor>
    <category>Technology</category>
    <category>Notifications</category>
    <ttl>60</ttl>${items}
  </channel>
</rss>`;
}

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds content lines to 75 octets as required by RFC 5545. */
function icsFold(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    // Don't split a multi-byte character
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
  }
  return parts.join('\r\n ');
}

/** Calendar of maintenance windows and other scheduled notices (those with an end time). */
export function renderCalendar(data: SiteData, products: Product[]): string {
  const events = noticesForProducts(data, products)
    .filter((notice) => severityOf(notice) === 'maintenance' || notice.endsAt)
    .map((notice) => {
      const end = notice.endsAt ?? new Date(new Date(notice.datetime).getTime() + 3600_000).toISOString();
      return [
        'BEGIN:VEVENT',
        `UID:${notice.id}@alerts.fluin.io`,
        `DTSTAMP:${icsDate(isNaN(notice.updatedAt.getTime()) ? notice.datetime : notice.updatedAt.toISOString())}`,
        `DTSTART:${icsDate(notice.datetime)}`,
        `DTEND:${icsDate(end)}`,
        `SUMMARY:${icsText(`[${SEVERITY_LABELS[severityOf(notice)]}] ${notice.title}`)}`,
        `DESCRIPTION:${icsText(markdownToText(notice.description))}`,
        `URL:${SITE_ORIGIN}/notifications/${notice.slug}`,
        'END:VEVENT',
      ];
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScopedAlerts//alerts.fluin.io//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${icsText(
      products.length ? `ScopedAlerts - ${products.map((p) => p.name).join(', ')}` : 'ScopedAlerts'
    )}`,
    ...events.flat(),
    'END:VCALENDAR',
  ]
    .map(icsFold)
    .join('\r\n') + '\r\n';
}

export function renderSitemap(data: SiteData): string {
  const urls = [
    { loc: `${SITE_ORIGIN}/`, lastmod: data.notices[0]?.datetime },
    { loc: `${SITE_ORIGIN}/status`, lastmod: data.notices[0]?.datetime },
    ...data.notices.map((notice) => ({
      loc: `${SITE_ORIGIN}/notifications/${encodeURIComponent(notice.slug)}`,
      lastmod: isNaN(notice.updatedAt.getTime()) ? notice.datetime : notice.updatedAt.toISOString(),
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
  )
  .join('\n')}
</urlset>
`;
}

const HEALTH_COLORS: Record<ProductHealth, string> = {
  operational: '#2e7d32',
  info: '#1565c0',
  maintenance: '#6a1b9a',
  degraded: '#b26a00',
  outage: '#c62828',
};

/** Rough text width for the 11px Verdana used by the badge. */
function textWidth(text: string): number {
  return Math.round(text.length * 6.6) + 10;
}

/** A shields.io-style status badge for a product. */
export function renderBadge(label: string, health: ProductHealth | null): string {
  const value = health ? HEALTH_LABELS[health] : 'unknown';
  const color = health ? HEALTH_COLORS[health] : '#757575';
  const labelWidth = textWidth(label);
  const valueWidth = textWidth(value);
  const width = labelWidth + valueWidth;
  const safeLabel = escapeXml(label);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${safeLabel}: ${value}">
  <title>${safeLabel}: ${value}</title>
  <clipPath id="r"><rect width="${width}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${safeLabel}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

export function badgeHealth(data: SiteData, product: Product): ProductHealth {
  return productHealth(data.notices, product.id);
}

/** A small self-contained page meant to be embedded in an iframe on other sites. */
export function renderEmbed(data: SiteData, product: Product): string {
  const health = productHealth(data.notices, product.id);
  const latest: Notice | undefined = noticesForProducts(data, [product])[0];
  const latestHtml = latest
    ? `<a href="${SITE_ORIGIN}/notifications/${encodeURIComponent(latest.slug)}" target="_blank" rel="noopener">${escapeXml(latest.title)}</a>
    <time datetime="${escapeXml(latest.datetime)}">${new Date(latest.datetime).toUTCString().replace(/:\d\d GMT$/, ' UTC')}</time>`
    : '<span>No notifications yet.</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeXml(product.name)} status - ScopedAlerts</title>
<style>
  :root { color-scheme: light dark; --fg: #1f1f1f; --muted: #5f6368; --bg: #fff; --border: #dadce0; }
  @media (prefers-color-scheme: dark) { :root { --fg: #e8eaed; --muted: #9aa0a6; --bg: #202124; --border: #3c4043; } }
  body { margin: 0; font: 14px/1.4 system-ui, sans-serif; color: var(--fg); background: var(--bg); }
  .card { border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; display: grid; gap: 6px; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .name { font-weight: 600; }
  .pill { color: #fff; background: ${HEALTH_COLORS[health]}; border-radius: 999px; padding: 2px 10px; font-size: 12px; }
  .latest { display: grid; gap: 2px; }
  .latest a { color: inherit; font-weight: 500; }
  time, .footer { color: var(--muted); font-size: 12px; }
  .footer a { color: inherit; }
</style>
</head>
<body>
<div class="card">
  <div class="head">
    <span class="name">${escapeXml(product.name)}</span>
    <span class="pill">${HEALTH_LABELS[health]}</span>
  </div>
  <div class="latest">${latestHtml}</div>
  <div class="footer">via <a href="${SITE_ORIGIN}/?products=${encodeURIComponent(product.slug)}" target="_blank" rel="noopener">ScopedAlerts</a></div>
</div>
</body>
</html>`;
}
