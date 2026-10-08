import { initializeApp } from 'firebase/app';
import { Database, get, getDatabase, ref } from 'firebase/database';
import { firebaseConfig } from '../app/config/firebase.config';
import { Notice } from '../app/models/notice';
import { Product } from '../app/models/product';
import { SLUG_PATTERN } from '../app/utils/slug.utils';

const CACHE_MS = 60_000;

export interface SiteData {
  /** All notices, newest first. */
  notices: Notice[];
  products: Product[];
  productsBySlug: Map<string, Product>;
}

let database: Database | null = null;
let cache: { fetchedAt: number; data: Promise<SiteData> } | null = null;

function getDb(): Database {
  // Use a named app so this never collides with the Angular app's default Firebase app
  database ??= getDatabase(initializeApp(firebaseConfig, 'server-feeds'));
  return database;
}

async function fetchSiteData(): Promise<SiteData> {
  const db = getDb();
  const [noticesSnapshot, productsSnapshot] = await Promise.all([
    get(ref(db, 'notices')),
    get(ref(db, 'products')),
  ]);

  const noticesData: Record<string, any> = noticesSnapshot.val() ?? {};
  const productsData: Record<string, any> = productsSnapshot.val() ?? {};

  const notices: Notice[] = Object.entries(noticesData)
    .map(([id, notice]) => ({
      ...notice,
      id,
      affectedProducts: notice.affectedProducts ?? [],
      createdAt: new Date(notice.createdAt),
      updatedAt: new Date(notice.updatedAt),
    }))
    .sort((a, b) => b.datetime.localeCompare(a.datetime));

  const products: Product[] = Object.entries(productsData).map(([id, product]) => ({
    ...product,
    id,
  }));

  return {
    notices,
    products,
    productsBySlug: new Map(products.map((product) => [product.slug, product])),
  };
}

/** Notices and products, cached in memory for a minute. */
export function getSiteData(): Promise<SiteData> {
  if (!cache || Date.now() - cache.fetchedAt > CACHE_MS) {
    const data = fetchSiteData();
    cache = { fetchedAt: Date.now(), data };
    // Don't keep a failed fetch cached
    data.catch(() => {
      if (cache?.data === data) cache = null;
    });
  }
  return cache.data;
}

/** Parses a comma-separated `products` query value into known products, ignoring invalid slugs. */
export function resolveProducts(data: SiteData, param: unknown): Product[] {
  if (typeof param !== 'string' || !param) return [];
  return param
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => SLUG_PATTERN.test(slug))
    .map((slug) => data.productsBySlug.get(slug))
    .filter((product): product is Product => !!product);
}

/** Notices affecting any of the given products (or all notices when none are given). */
export function noticesForProducts(data: SiteData, products: Product[]): Notice[] {
  if (products.length === 0) return data.notices;
  const ids = new Set(products.map((p) => p.id));
  return data.notices.filter((n) => n.affectedProducts.some((id) => ids.has(id)));
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
