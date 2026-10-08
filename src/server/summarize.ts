import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { firebaseConfig } from '../app/config/firebase.config';

const SummarySchema = z.object({
  summary: z.string(),
  suggestedProductIds: z.array(z.string()),
});

const RequestSchema = z.object({
  title: z.string().max(500),
  description: z.string().min(1).max(20_000),
  products: z
    .array(z.object({ id: z.string(), name: z.string(), description: z.string() }))
    .max(200),
});

const SYSTEM_PROMPT = `You help an admin publish product notifications on ScopedAlerts, a status and announcements site.
Given a notification and the list of products, return:
- summary: a one or two sentence plain-text TL;DR (no Markdown) telling a busy reader what happened and whether they need to act.
- suggestedProductIds: the ids of products the notification clearly affects, chosen only from the provided list. Return an empty list if none clearly apply.`;

let client: Anthropic | null = null;

/**
 * Verifies a Firebase ID token belongs to an admin by reading the admin list with it.
 * Database rules only let admins read /admins, so a successful read proves both.
 */
async function isAdminToken(idToken: string): Promise<boolean> {
  const url = `${firebaseConfig.databaseURL}/admins.json?shallow=true&auth=${encodeURIComponent(idToken)}`;
  const response = await fetch(url);
  return response.ok;
}

/** POST /api/summarize: drafts a TL;DR and suggested products for a notification (admins only). */
export async function summarizeHandler(req: Request, res: Response): Promise<void> {
  if (!process.env['ANTHROPIC_API_KEY']) {
    res.status(503).json({ error: 'AI summaries are not configured' });
    return;
  }

  const idToken = req.header('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!idToken || !(await isAdminToken(idToken))) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const { title, description, products } = parsed.data;

  client ??= new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: betaZodOutputFormat(SummarySchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ notification: { title, description }, products }),
        },
      ],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      res.status(422).json({ error: 'Could not generate a summary for this notification' });
      return;
    }

    const knownIds = new Set(products.map((p) => p.id));
    res.json({
      summary: response.parsed_output.summary,
      suggestedProductIds: response.parsed_output.suggestedProductIds.filter((id) =>
        knownIds.has(id)
      ),
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Too many requests, try again shortly' });
    } else {
      console.error('Summary generation failed:', error);
      res.status(502).json({ error: 'Summary generation failed' });
    }
  }
}
