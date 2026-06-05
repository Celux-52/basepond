'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { 
  ArrowLeft, Phone, Globe, Mail, MapPin, Star, Shield, Smartphone, 
  Camera, Facebook, Linkedin, TrendingUp, Bookmark, BookmarkCheck,
  CheckCircle2, XCircle, Loader2, ExternalLink, Copy, CheckCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();

  const [business, setBusiness] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: b } = await supabase
        .from('businesses')
        .select('*, business_analysis(*)')
        .eq('id', id)
        .single();

      if (!b) { setLoading(false); return; }
      setBusiness(b);
      setAnalysis((b.business_analysis as any)?.[0] || b.business_analysis || null);

      // Check saved status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sv } = await supabase
          .from('saved_businesses')
          .select('id')
          .eq('user_id', user.id)
          .eq('business_id', id)
          .maybeSingle();
        setSaved(!!sv);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleToggleSave = async () => {
    setSavingLoading(true);
    try {
      const res = await fetch('/api/businesses/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: id })
      });
      const data = await res.json();
      setSaved(data.saved);
      toast.success(data.saved ? '✅ Kaydedildi!' : 'Kayıt silindi');
    } catch {
      toast.error('İşlem başarısız');
    }
    setSavingLoading(false);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Kopyalandı!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (!business) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <XCircle className="w-16 h-16 text-destructive" />
      <p className="text-xl font-semibold text-foreground">İşletme bulunamadı</p>
      <Button variant="outline" onClick={() => router.back()}>Geri Dön</Button>
    </div>
  );

  const aiScore = analysis?.ai_score || 0;
  let summary: string[] = [];
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(analysis?.opportunity_reason || '{}');
    summary = parsed.summary || [];
    tags = parsed.tags || [];
  } catch {}

  const scoreColor = aiScore >= 90 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : aiScore >= 70 ? 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-muted-foreground border-border bg-muted';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 bg-background min-h-screen">
      
      {/* BACK + ACTIONS */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Geri
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`gap-2 ${saved ? 'text-primary border-primary' : ''}`}
            onClick={handleToggleSave}
            disabled={savingLoading}
          >
            {savingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> 
              : saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* HERO CARD */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 items-start z-10 relative">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-card-foreground">{business.business_name}</h1>
              {business.rating && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
                  <Star className="w-3 h-3 mr-1 fill-amber-500" /> {business.rating} ({business.review_count} yorum)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{business.city} • {business.category}</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((t: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs uppercase border-border text-muted-foreground">{t}</Badge>
                ))}
              </div>
            )}
          </div>
          
          {aiScore > 0 && (
            <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 ${scoreColor} shrink-0`}>
              <span className="text-4xl font-black">{aiScore}</span>
              <span className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">AI Skoru</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CONTACT INFO */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-card-foreground text-lg border-b border-border pb-3">İletişim Bilgileri</h2>
          
          {business.phone ? (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-card-foreground">{business.phone}</span>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(business.phone, 'phone')}>
                {copiedField === 'phone' ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Telefon bulunamadı</span>
            </div>
          )}

          {business.email ? (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-card-foreground">{business.email}</span>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => copyToClipboard(business.email, 'email')}>
                {copiedField === 'email' ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">E-posta bulunamadı</span>
            </div>
          )}

          {business.website ? (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                   target="_blank" rel="noopener noreferrer"
                   className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate max-w-[180px]">
                  {business.website} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-50">
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground font-semibold text-red-500 dark:text-red-400 opacity-100">Web Sitesi Yok — Fırsat!</span>
            </div>
          )}
        </div>

        {/* DIGITAL HEALTH */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-card-foreground text-lg border-b border-border pb-3">Dijital Sağlık Raporu</h2>
          
          {[
            { label: 'SSL Sertifikası', value: analysis?.has_ssl, icon: Shield, good: 'Güvenli', bad: 'SSL Yok — Güvensiz' },
            { label: 'Mobil Uyumluluk', value: analysis?.mobile_responsive, icon: Smartphone, good: 'Mobil Uyumlu', bad: 'Mobil Uyumsuz' },
            { label: 'Sosyal Medya Varlığı', value: analysis?.has_social_links, icon: Camera, good: 'Sosyal Hesap Var', bad: 'Sosyal Medya Yok' },
            { label: 'Web Sitesi', value: !!business.website, icon: Globe, good: 'Web Sitesi Var', bad: 'Web Sitesi Yok' },
          ].map(({ label, value, icon: Icon, good, bad }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${value ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <Icon className={`w-4 h-4 ${value ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`} />
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {value 
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />}
                <span className={`text-xs font-semibold ${value ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {value ? good : bad}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* AI OPPORTUNITY */}
        {summary.length > 0 && (
          <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-bold text-card-foreground text-lg">Yapay Zeka Fırsat Analizi</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.map((line: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-black">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-4 pb-8">
        {business.phone && (
          <a href={`tel:${business.phone}`} className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base font-bold gap-2">
              <Phone className="w-5 h-5" /> Hemen Ara: {business.phone}
            </Button>
          </a>
        )}
        {business.email && (
          <a href={`mailto:${business.email}`} className="flex-1">
            <Button variant="outline" className="w-full h-14 text-base font-bold gap-2">
              <Mail className="w-5 h-5" /> E-Posta Gönder
            </Button>
          </a>
        )}
        {business.website && (
          <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
             target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full h-14 text-base font-bold gap-2">
              <Globe className="w-5 h-5" /> Web Sitesini Ziyaret Et
            </Button>
          </a>
        )}
      </div>

    </div>
  );
}
