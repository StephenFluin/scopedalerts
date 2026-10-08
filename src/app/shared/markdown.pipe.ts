import { Pipe, PipeTransform } from '@angular/core';
import { markdownToText, renderMarkdown } from '../utils/notice.utils';

/**
 * Renders notice Markdown to HTML. Bind the result with [innerHTML] so Angular's
 * sanitizer strips anything unsafe (scripts, event handlers, javascript: URLs).
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(markdown: string | null | undefined): string {
    return renderMarkdown(markdown ?? '');
  }
}

/** Plain-text excerpt of notice Markdown. */
@Pipe({ name: 'markdownText' })
export class MarkdownTextPipe implements PipeTransform {
  transform(markdown: string | null | undefined, maxLength = Infinity): string {
    return markdownToText(markdown ?? '', maxLength);
  }
}
