import { customError, validate, FieldPath } from '@angular/forms/signals';

/**
 * Regular expression pattern for valid URL slugs.
 * Allows lowercase letters, numbers, and hyphens only.
 */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Validates that a slug field matches the required pattern.
 * Used with Angular signal forms validation.
 *
 * @param path The field path to validate
 */
export function validateSlugPattern(path: FieldPath<string>): void {
  validate(path, (ctx) => {
    const value = ctx.value();

    if (!SLUG_PATTERN.test(value)) {
      return customError({
        kind: 'pattern',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      });
    }

    return null;
  });
}

/**
 * Generates a URL-safe slug from a given name string.
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens.
 *
 * @param name The source string to convert to a slug
 * @returns A URL-safe slug string
 *
 * @example
 * generateSlug('My Product Name!') // Returns: 'my-product-name'
 * generateSlug('  Test-Product  ') // Returns: 'test-product'
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates if a string is a valid slug format.
 *
 * @param slug The string to validate
 * @returns True if the slug is valid, false otherwise
 *
 * @example
 * isValidSlug('my-product-name') // Returns: true
 * isValidSlug('My Product Name!') // Returns: false
 */
export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}
