import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aivo.edu'
  
  const routes = [
    '',
    '/features',
    '/features/ai-tutoring',
    '/features/parents',
    '/features/teachers',
    '/features/schools',
    '/features/accessibility',
    '/features/progress',
    '/pricing',
    '/demo',
    '/blog',
    '/contact',
    '/privacy',
    '/terms',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/features') ? 0.8 : 0.6,
  }))
}
