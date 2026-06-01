import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { ProcessedBusiness } from "@/lib/engine/orchestrator";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

export const revalidate = 86400; // Cache the SEO page for 24 hours

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slugParts = params.slug.split("-");
  const city = slugParts[0]?.charAt(0).toUpperCase() + slugParts[0]?.slice(1) || "Türkiye";
  const category = slugParts.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "İşletmeler";

  return {
    title: `${city} En İyi ${category} Fırsatları | Basepound`,
    description: `${city} bölgesindeki ${category} sektörüne ait yapay zeka analizli en iyi dijital fırsatlar, SEO ve web tasarım potansiyelleri.`
  };
}

export default async function SEODiscoveryPage({ params }: { params: { slug: string } }) {
  // Simple basic parser for slug e.g. "istanbul-kuaforler" -> city: istanbul, category: kuaforler
  const slugParts = params.slug.split("-");
  if (slugParts.length < 2) return notFound();

  const cityParam = slugParts[0];
  const categoryParam = slugParts.slice(1).join(" ");
  
  const supabase = await createClient();

  // Try to find cached businesses matching the pattern (case insensitive via ilike)
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*, business_analysis(*)")
    .ilike("city", `%${cityParam}%`)
    .ilike("category", `%${categoryParam}%`)
    .order("rating", { ascending: false })
    .limit(30);

  if (!businesses || businesses.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Henüz Bu Bölgede Analiz Yapılmadı</h1>
        <p className="text-muted-foreground text-center max-w-md">
          {cityParam} bölgesindeki {categoryParam} sektörü için henüz yapay zeka analizimiz bulunmuyor. Basepound platformuna giriş yaparak hemen ücretsiz tarama başlatabilirsiniz.
        </p>
      </div>
    );
  }

  // Map DB data to ProcessedBusiness format so we can use OpportunityCard
  const mappedResults: ProcessedBusiness[] = businesses.map(b => ({
    id: b.id,
    name: b.business_name,
    category: b.category,
    city: b.city,
    phone: b.phone,
    email: b.email,
    website: b.website,
    instagram: b.instagram,
    facebook: b.facebook,
    twitter: b.twitter,
    linkedin: b.linkedin,
    maps_url: b.maps_url,
    rating: b.rating,
    review_count: b.review_count,
    ai_score: b.business_analysis?.ai_score || 0,
    seo_score: b.business_analysis?.seo_score || 0,
    mobile_score: b.business_analysis?.mobile_score || 0,
    social_score: b.business_analysis?.social_score || 0,
    trust_score: 50,
    growth_score: Number(b.business_analysis?.growth_potential) || 50,
    opportunity_reason: b.business_analysis?.opportunity_reason || "",
    cached: true
  }));

  const displayCity = cityParam.charAt(0).toUpperCase() + cityParam.slice(1);
  const displayCategory = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Header */}
      <div className="bg-muted/30 border-b border-border/50 py-16 px-6 sm:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <Badge className="bg-primary/10 text-primary border-primary/30 uppercase tracking-widest text-xs px-3 py-1">
            Yapay Zeka Analiz Raporu
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            {displayCity} <span className="text-primary">{displayCategory}</span> Dijital Fırsat Analizi
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            Basepound yapay zekası, bölgedeki işletmelerin SEO, mobil uyum ve sosyal medya varlığını analiz ederek en kârlı dijital dönüşüm fırsatlarını sıraladı.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 sm:p-12 space-y-8">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> En Yüksek Fırsat Skorlu İşletmeler
          </h2>
          <span className="text-sm font-semibold text-muted-foreground">{mappedResults.length} Sonuç</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mappedResults.map((business, i) => (
            <OpportunityCard key={business.id || i} business={business} />
          ))}
        </div>
      </div>
    </div>
  );
}
