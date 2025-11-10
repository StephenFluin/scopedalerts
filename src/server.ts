import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
const { firebaseConfig } = await import('./app/config/firebase.config');

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Enable trust proxy for proper IP detection
app.set('trust proxy', true);

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * RSS endpoint - generates RSS feed for notifications
 */
app.get('/rss', async (req, res) => {
  try {
    const productsParam = req.query['products'] as string;
    const productSlugs = productsParam ? productsParam.split(',').map((s) => s.trim()) : [];

    // Firebase data fetching
    let notifications: any[] = [];

    if (typeof window === 'undefined') {
      // Server-side Firebase initialization
      try {
        const { initializeApp } = await import('firebase/app');
        const { getDatabase, ref, get, query, orderByChild } = await import('firebase/database');

        // import firebaseConfig

        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        const noticesRef = ref(database, 'notices');
        const snapshot = await get(query(noticesRef, orderByChild('datetime')));

        if (snapshot.exists()) {
          const data = snapshot.val();
          notifications = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter((notification) => {
              if (productSlugs.length === 0) return true;
              return notification.affectedProducts?.some((product: string) =>
                productSlugs.includes(product)
              );
            })
            .map((notification) => ({
              title: notification.title,
              description: notification.description,
              link: `https://scopedalerts.example.com/notifications/${notification.slug}`,
              pubDate: new Date(notification.datetime),
              guid: notification.slug,
            }));
        }
      } catch (error) {
        console.warn('Firebase not available:', error);
      }
    }

    // Filter notifications based on products if specified
    let filteredNotifications = notifications;

    const rssXml = generateRSSFeed(filteredNotifications, productSlugs);

    res.set({
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    });
    res.send(rssXml);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

/**
 * Generate RSS XML from notifications
 */
function generateRSSFeed(notifications: any[], productSlugs: string[] = []): string {
  const baseUrl = 'https://scopedalerts.example.com'; // TODO: Make this configurable
  const title =
    productSlugs.length > 0
      ? `ScopedAlerts - ${productSlugs.join(', ')} Notifications`
      : 'ScopedAlerts - All Notifications';

  const description =
    productSlugs.length > 0
      ? `Product notifications for ${productSlugs.join(', ')}`
      : 'All product notifications and updates';

  let rssItems = '';

  notifications.forEach((notification) => {
    rssItems += `
    <item>
      <title><![CDATA[${notification.title}]]></title>
      <description><![CDATA[${notification.description}]]></description>
      <link>${notification.link}</link>
      <guid isPermaLink="false">${notification.guid}</guid>
      <pubDate>${notification.pubDate.toUTCString()}</pubDate>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss${
    productSlugs.length > 0 ? '?products=' + productSlugs.join(',') : ''
  }" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>ScopedAlerts</generator>
    <webMaster>stephen@fluin.io (Stephen Fluin)</webMaster>
    <managingEditor>stephen@fluin.io (Stephen Fluin)</managingEditor>
    <category>Technology</category>
    <category>Notifications</category>
    <ttl>60</ttl>${rssItems}
  </channel>
</rss>`;
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
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
