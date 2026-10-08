import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function relativeTime(date: Date, now = Date.now()): string {
  const seconds = Math.round((date.getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return 'just now';
}

/** "3 hours ago", with the exact date and time on hover and for assistive tech. */
@Component({
  selector: 'app-relative-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `<time [attr.datetime]="iso()" [title]="iso() | date: 'full'">{{ relative() }}</time>`,
})
export class RelativeTime {
  readonly value = input.required<string>();

  protected readonly iso = computed(() => new Date(this.value()).toISOString());
  protected readonly relative = computed(() => relativeTime(new Date(this.value())));
}
