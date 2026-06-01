import { MetadataRoute } from 'next'
import { createClient } from "@/lib/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // Base URL
  const baseUrl = "https://basepound.com"

  // Core static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  ]

  // Dynamic SEO Routes (City/Sector combinations based on database)
  const { data: businesses } = await supabase
    .from("businesses")
    .select("city, category")
    
  if (businesses) {
    // Extract unique city-category combinations
    const uniquePairs = new Set<string>()
    businesses.forEach(b => {
      if (b.city && b.category) {
        uniquePairs.add(`${b.city.toLowerCase()}|${b.category.toLowerCase()}`)
      }
    })

    uniquePairs.forEach(pair => {
      const [city, category] = pair.split('|')
      routes.push({
        url: `${baseUrl}/tr/seo/${encodeURIComponent(city)}/${encodeURIComponent(category)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    })
  }

  return routes
}
