import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, DollarSign, Search, Zap, ShieldCheck } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow admin email (can be customized, or we check a specific flag)
  // For demo purposes, we will just allow any authenticated user to see this since it's a personal app,
  // but we will add a badge to show it's an admin view.

  let totalBusinesses = 0;
  let totalSearches = 0;
  let totalApiCost = 0;
  let totalCacheHits = 0;
  let googleCost = 0;
  let apolloCost = 0;
  let aiCost = 0;

  let totalRevenue = 0;

  try {
    // 1. Total Businesses
    const { count: bCount } = await supabase.from("businesses").select("*", { count: 'exact', head: true });
    totalBusinesses = bCount || 0;

    // 2. Total Searches
    const { count: sCount } = await supabase.from("searches").select("*", { count: 'exact', head: true });
    totalSearches = sCount || 0;

    // 3. Usage & Profitability (table may not exist yet)
    const { data: logs } = await (supabase as any).from("usage_logs").select("*");
    
    if (logs && logs.length > 0) {
      logs.forEach((log: any) => {
        totalApiCost += log.api_calls || 0;
        totalCacheHits += log.cache_hits || 0;
        googleCost += log.google_cost || 0;
        apolloCost += log.apollo_cost || 0;
        aiCost += log.ai_cost || 0;
      });
    }

    // 4. Revenue (MRR) (table may not exist yet)
    const { data: payments } = await (supabase as any).from("payments").select("*");
    if (payments && payments.length > 0) {
      payments.forEach((p: any) => {
        totalRevenue += p.amount_usd || 0;
      });
    }
  } catch (error) {
    // Fails safely if tables are not created yet
    console.error("Admin stats error:", error);
  }

  // Calculate Cache Hit Rate
  const totalQueries = totalApiCost + totalCacheHits;
  const cacheHitRate = totalQueries > 0 ? Math.round((totalCacheHits / totalQueries) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Platform karlılığı, veri havuzu ve API maliyet takibi.</p>
        </div>
      </div>

      {/* Top Revenue Card */}
      <div className="grid grid-cols-1 mb-6">
        <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold text-foreground">Aylık Toplam Ciro (MRR)</CardTitle>
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-emerald-500">${totalRevenue}</div>
            <p className="text-sm text-muted-foreground mt-2">Ödeme planları ve pay-as-you-go satışlarından elde edilen toplam gelir.</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Veritabanı Büyüklüğü</CardTitle>
            <Database className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalBusinesses}</div>
            <p className="text-xs text-muted-foreground mt-1">Önbelleğe alınmış işletme</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">İç API Maliyeti</CardTitle>
            <Activity className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalApiCost}</div>
            <p className="text-xs text-muted-foreground mt-1">İç kredi tüketimi</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Önbellek (Cache) İsabeti</CardTitle>
            <Zap className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">%{cacheHitRate}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalCacheHits} sorgu ücretsiz çekildi</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Arama</CardTitle>
            <Search className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalSearches}</div>
            <p className="text-xs text-muted-foreground mt-1">Kullanıcı arama isteği</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <Card className="bg-muted/20 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> API Maliyet Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>Harita Veri Sağlayıcı</span>
                <span>{googleCost} Kredi</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: totalApiCost ? `${(googleCost/totalApiCost)*100}%` : '0%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>Veri Zenginleştirme</span>
                <span>{apolloCost} Kredi</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: totalApiCost ? `${(apolloCost/totalApiCost)*100}%` : '0%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span>Yapay Zeka Motoru</span>
                <span>{aiCost} Kredi</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: totalApiCost ? `${(aiCost/totalApiCost)*100}%` : '0%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
