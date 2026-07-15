// ═══════════════════════════════════════════════════════════════
// Next.js Dynamic XML Sitemap Generator
// Exports sitemap entries for public shop routing indexations
// ═══════════════════════════════════════════════════════════════

import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexastore.com';

  const routes = [
    '',
    '/products',
    '/cart',
    '/login',
    '/register',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));
}
