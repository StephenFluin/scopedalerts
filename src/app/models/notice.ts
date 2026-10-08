export type NoticeSeverity = 'info' | 'maintenance' | 'degraded' | 'outage';
export type NoticeStatus = 'ongoing' | 'resolved';

export interface Notice {
  id: string;
  title: string;
  description: string; // Markdown
  datetime: string; // ISO string in UTC
  slug: string;
  affectedProducts: string[]; // Array of product IDs
  severity?: NoticeSeverity; // Defaults to 'info'
  status?: NoticeStatus; // Defaults to 'resolved'
  endsAt?: string; // ISO string in UTC, e.g. end of a maintenance window
  summary?: string; // Short TL;DR shown above the description
  createdAt: Date;
  updatedAt: Date;
}
