import type { MetadataRoute } from 'next';
import { publicPrograms } from '@/lib/programs';
import { getSiteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: 'weekly', priority: 1 },
    ...publicPrograms().map((program) => ({
      url: `${base}${program.href}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    {
      url: `${base}/register`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/privacy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
