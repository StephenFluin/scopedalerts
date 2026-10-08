import { describe, expect, it } from 'vitest';
import { Notice } from '../models/notice';
import { markdownToText, productHealth, renderMarkdown, worstHealth } from './notice.utils';

function notice(overrides: Partial<Notice>): Notice {
  return {
    id: 'n1',
    title: 'Title',
    description: '',
    datetime: '2026-01-01T00:00:00.000Z',
    slug: 'title',
    affectedProducts: ['p1'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('productHealth', () => {
  it('is operational without ongoing notices', () => {
    expect(productHealth([notice({ severity: 'outage' })], 'p1')).toBe('operational');
  });

  it('uses the most severe ongoing notice for the product', () => {
    const notices = [
      notice({ id: 'a', severity: 'degraded', status: 'ongoing' }),
      notice({ id: 'b', severity: 'outage', status: 'ongoing' }),
      notice({ id: 'c', severity: 'outage', status: 'ongoing', affectedProducts: ['p2'] }),
    ];
    expect(productHealth(notices, 'p1')).toBe('outage');
    expect(productHealth([notices[0]], 'p1')).toBe('degraded');
  });

  it('treats a missing severity as info', () => {
    expect(productHealth([notice({ status: 'ongoing' })], 'p1')).toBe('info');
  });
});

describe('worstHealth', () => {
  it('prefers the more severe value', () => {
    expect(worstHealth('maintenance', 'degraded')).toBe('degraded');
    expect(worstHealth('outage', 'info')).toBe('outage');
  });
});

describe('markdown', () => {
  it('renders Markdown to HTML', () => {
    expect(renderMarkdown('**bold** [link](https://example.com)')).toContain(
      '<strong>bold</strong> <a href="https://example.com">link</a>'
    );
  });

  it('produces plain-text excerpts', () => {
    expect(markdownToText('# Heading\n\nSome *emphasis* & more')).toBe('Heading Some emphasis & more');
    expect(markdownToText('one two three four', 9)).toBe('one two…');
  });
});
