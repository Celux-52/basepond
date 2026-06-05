import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ShieldAlert } from "lucide-react";

interface Props {
  params: {
    locale: string;
    city: string;
    sector: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = decodeURIComponent(params.city);
  const sector = decodeURIComponent(params.sector);
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const capitalizedSector = sector.charAt(0).toUpperCase() + sector.slice(1);

  return {
    title: `${capitalizedCity} ${capitalizedSector} - İşletme ve Dijital Fırsat Raporu | Basepound`,
    description: `${capitalizedCity} bölgesindeki ${capitalizedSector} işletmelerinin dijital zayıflıkları, SEO analizleri ve pazar fırsatları. Basepound ile işletmeleri keşfedin.`,
  };
}

export default async function SectorIntelligencePage({ params }: Props) {
  const city = decodeURIComponent(params.city);
  const sector = decodeURIComponent(params.sector);
  const supabase = await createClient();

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*, business_analysis(*)")
    .ilike("city", `%${city}%`)
    .ilike("category", `%${sector}%`)
    .order("rating", { ascending: false })
    .limit(50);

  if (error || !businesses || businesses.length === 0) {
    notFound();
  }

  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const capitalizedSector = sector.charAt(0).toUpperCase() + sector.slice(1);

  // Aggregated intelligence
  const totalBusinesses = businesses.length;
  const avgTrustScore = Math.round(businesses.reduce((acc, b) => acc + (b.trust_score || 0), 0) / totalBusinesses);
  const avgAiScore = Math.round(businesses.reduce((acc, b) => acc + (b.business_analysis?.ai_score || 0), 0) / totalBusinesses);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-200">
      <div className="max-w-6xl mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="space-y-4 mb-12 border-b border-border/20 pb-8">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 uppercase tracking-widest font-mono text-xs">
            Sector Intelligence Report
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            {capitalizedCity} - {capitalizedSector}
          </h1>
          <p className="text-xl text-zinc-400 font-medium">
            {capitalizedCity} bölgesindeki {capitalizedSector} sektörü için yapay zeka destekli dijital fırsat ve büyüme analizi.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="bg-[#111] border border-border/20 p-4 rounded-lg">
              <div className="text-xs text-zinc-500 uppercase font-mono mb-1">Total Analyzed</div>
              <div className="text-3xl font-bold">{totalBusinesses}</div>
            </div>
            <div className="bg-[#111] border border-border/20 p-4 rounded-lg">
              <div className="text-xs text-zinc-500 uppercase font-mono mb-1">Market Trust</div>
              <div className="text-3xl font-bold text-blue-400">{avgTrustScore}%</div>
            </div>
            <div className="bg-[#111] border border-border/20 p-4 rounded-lg">
              <div className="text-xs text-zinc-500 uppercase font-mono mb-1">Avg AI Score</div>
              <div className="text-3xl font-bold text-emerald-400">{avgAiScore}</div>
            </div>
            <div className="bg-[#111] border border-border/20 p-4 rounded-lg">
              <div className="text-xs text-zinc-500 uppercase font-mono mb-1">Vulnerability</div>
              <div className="text-3xl font-bold text-rose-400">High</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-6">Top Entities in {capitalizedCity}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <div key={business.id} className="bg-[#111] border border-border/20 p-6 rounded-xl hover:border-emerald-500/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white truncate pr-4">{business.business_name}</h3>
                  <Badge variant="outline" className={`font-mono ${(business.business_analysis?.ai_score || 0) >= 80 ? 'text-emerald-400 border-emerald-500/30' : 'text-zinc-400'}`}>
                    {business.business_analysis?.ai_score || 0}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-zinc-400 font-mono mb-6">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {business.city}</div>
                  <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> {business.rating} ({business.review_count} reviews)</div>
                </div>

                {(business.business_analysis?.urgency_score || 0) > 75 && (
                  <div className="bg-rose-500/10 text-rose-400 text-xs font-mono p-2 rounded flex items-center gap-2 border border-rose-500/20">
                    <ShieldAlert className="w-3 h-3" /> URGENT ACTION REQUIRED
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
