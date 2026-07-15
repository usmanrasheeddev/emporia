// ═══════════════════════════════════════════════════════════════
// Slug Utility
// Helper to generate unique slugs in database
// ═══════════════════════════════════════════════════════════════

import { slugify } from '@nexastore/shared';

/**
 * Generates a unique slug by checking database existence and adding a numeric suffix if needed.
 * @param text - Text to slugify
 * @param checkExists - Function that returns boolean based on whether the slug is already in use
 */
export async function generateUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(text) || 'item';
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
