import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { join } from 'node:path';
import { SITE_ORIGIN } from './app/services/canonical.service';
import { productHealth } from './app/utils/notice.utils';
import {
  badgeHealth,
  renderBadge,
  renderCalendar,
  renderEmbed,
  renderRss,
  renderSitemap,
} from './server/feeds';
import { getSiteData, resolveProducts } from './server/site-data';
import { summarizeHandler } from './server/summarize';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.disable('x-powered-by');

/**
 * Security headers for every response.
 */
app.use((req, res, next) => {
  res.set({
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    // Allow the Firebase sign-in popup to talk back to this window
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  });
  next();
});

/** Public, read-only feeds can be fetched cross-origin. */
function publicFeed(maxAgeSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': `public, max-age=${maxAgeSeconds}`,
    });
    next();
  };
}

/** Wraps an async route so failures become a 500 instead of an unhandled rejection. */
function route(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => handler(req, res).catch(next);
}

/**
 * RSS feed of notifications, optionally filtered with ?products=slug-a,slug-b
 */
app.get(
  '/rss',
  publicFeed(300),
  route(async (req, res) => {
    const data = await getSiteData();
    res.type('application/rss+xml; charset=utf-8').send(renderRss(data, resolveProducts(data, req.query['products'])));
  })
);

/**
 * iCalendar feed of maintenance windows, optionally filtered with ?products=slug-a,slug-b
 */
app.get(
  '/calendar.ics',
  publicFeed(300),
  route(async (req, res) => {
    const data = await getSiteData();
    res
      .type('text/calendar; charset=utf-8')
      .send(renderCalendar(data, resolveProducts(data, req.query['products'])));
  })
);

app.get(
  '/sitemap.xml',
  publicFeed(3600),
  route(async (req, res) => {
    res.type('application/xml; charset=utf-8').send(renderSitemap(await getSiteData()));
  })
);

/**
 * Status badge for a product, e.g. <img src="https://alerts.fluin.io/badge/my-product.svg">
 */
app.get(
  '/badge/:slug.svg',
  publicFeed(60),
  route(async (req, res) => {
    const data = await getSiteData();
    const product = data.productsBySlug.get(String(req.params['slug']));
    res
      .status(product ? 200 : 404)
      .type('image/svg+xml; charset=utf-8')
      .send(renderBadge(product?.name ?? 'ScopedAlerts', product ? badgeHealth(data, product) : null));
  })
);

/**
 * Embeddable status card for a product, meant for an <iframe>.
 */
app.get(
  '/embed/:slug',
  route(async (req, res) => {
    const data = await getSiteData();
    const product = data.productsBySlug.get(String(req.params['slug']));
    if (!product) {
      res.status(404).type('text/plain').send('Unknown product');
      return;
    }
    res.set({
      'Cache-Control': 'public, max-age=60',
      // This page is meant to be framed anywhere, and needs no scripts
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors *; base-uri 'none'",
    });
    res.type('text/html; charset=utf-8').send(renderEmbed(data, product));
  })
);

/**
 * Machine-readable status of every product.
 */
app.get(
  '/api/status.json',
  publicFeed(60),
  route(async (req, res) => {
    const data = await getSiteData();
    res.json({
      products: data.products.map((product) => ({
        slug: product.slug,
        name: product.name,
        status: productHealth(data.notices, product.id),
        url: `${SITE_ORIGIN}/?products=${product.slug}`,
      })),
    });
  })
);

/**
 * AI-drafted TL;DR and suggested products for a notification (admins only).
 */
app.post('/api/summarize', express.json({ limit: '64kb' }), summarizeHandler);

/**
 * Serve static files from /browser. Hashed build output is immutable; everything else
 * (logo, robots.txt, ...) may change between deploys.
 */
app.use(
  express.static(browserDistFolder, {
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      const hashed = /-[A-Za-z0-9_-]{8}\.(js|css)$/.test(filePath);
      res.setHeader(
        'Cache-Control',
        hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
      );
    },
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Plain error responses, without Express's default stack traces.
 */
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = Number(error?.status ?? error?.statusCode) || 500;
  if (status >= 500) console.error(error);
  if (res.headersSent) return next(error);
  res.status(status).type('text/plain').send(status >= 500 ? 'Internal Server Error' : 'Bad Request');
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
