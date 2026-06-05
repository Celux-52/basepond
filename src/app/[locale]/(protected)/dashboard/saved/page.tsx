'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bookmark, BookmarkX, Phone, Globe, MapPin, Star, TrendingUp, 
  Loader2, ExternalLink, Search, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SavedPage() {
  const supabase = createClient();
  const locale = useLocale();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('saved_businesses')
      .select('id, created_at, businesses(*, business_analysis(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setSaved(data || []);
    setLoading(false);
  };

  useEffect(() => { loadSaved(); }, []);

  const handleUnsave = async (savedId: string, businessName: string) => {
    await supabase.from('saved_businesses').delete().eq('id', savedId);
    setSaved(prev => prev.filter(s => s.id !== savedId));
    toast.success(`"${businessName}" kayıtlardan silindi`);
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-background min-h-screen">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Kaydedilenler</h1>
          <p className="text-muted-foreground mt-1">Kaydettiğiniz {saved.length} işletme</p>
        </div>
        <Link href={`/${locale}/dashboard/search`}>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Search className="w-4 h-4" /> Yeni Arama
          </Button>
        </Link>
      </div>

      {/* EMPTY STATE */}
      {saved.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-border border-dashed rounded-2xl">
          <Bookmark className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Henüz kaydedilen işletme yok</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">Arama sonuçlarındaki işletme kartlarında yer bookmarkalan ikonuna tıklayarak kayıt ekleyebilirsiniz.</p>
          <Link href={`/${locale}/dashboard/search`}>
            <Button>Arama Yap</Button>
          </Link>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {saved.map((item) => {
          const business = item.businesses;
          if (!business) return null;
          const analysis = business.business_analysis?.[0] || business.business_analysis;
          const aiScore = analysis?.ai_score || 0;

          let summary: string[] = [];
          try {
            const parsed = JSON.parse(analysis?.opportunity_reason || '{}');
            summary = parsed.summary || [];
          } catch {}

          return (
            <Card key={item.id} className="border-border bg-card hover:border-primary/50 transition-all duration-300 flex flex-col shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-muted/30 relative">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-card-foreground line-clamp-1">
                      {business.business_name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" /> {business.city} • {business.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {aiScore > 0 && (
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-black text-sm bg-background
                        ${aiScore >= 90 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                          : aiScore >= 70 ? 'text-amber-600 dark:text-amber-400 border-amber-500/30' 
                          : 'text-muted-foreground border-border'}
                      `}>
                        {aiScore}
                      </div>
                    )}
                  </div>
                </div>
                {business.rating && (
                  <Badge className="mt-2 w-fit bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 text-[10px]">
                    <Star className="w-2.5 h-2.5 mr-1 fill-amber-500" /> {business.rating} ({business.review_count})
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-4 flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> {business.phone}
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2 text-sm text-primary truncate">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                         target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                        {business.website}
                      </a>
                    </div>
                  )}
                  {summary.length > 0 && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 mt-2">
                      <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wide mb-1.5">
                        <TrendingUp className="w-3 h-3" /> Fırsat
                      </div>
                      <p className="text-xs text-foreground line-clamp-2">{summary[0]}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-border mt-auto">
                  {business.phone && (
                    <a href={business.phone ? `tel:${business.phone}` : '#'} className="flex-1">
                      <Button size="sm" className="w-full bg-primary text-primary-foreground text-xs">
                        <Phone className="w-3.5 h-3.5 mr-1" /> Ara
                      </Button>
                    </a>
                  )}
                  <Link href={`/${locale}/dashboard/business/${business.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Detay
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" size="icon" 
                    className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    onClick={() => handleUnsave(item.id, business.business_name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
