'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Loader2, AlertTriangle, MapPin, Globe, Phone, Download, ArrowRight, TrendingUp,
  Star, Mail, Search, Smartphone, Lock, Instagram, CheckCircle2, Bookmark, BookmarkCheck, ExternalLink, Flame, Check
} from 'lucide-react';
import { toast } from 'sonner';

export default function ResultsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.jobId;
  const supabase = createClient();
  
  const [job, setJob] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    no_website: false,
    no_mobile: false,
    no_ssl: false,
    no_social: false,
    low_rating: false,
    has_phone: false,
    has_email: false,
  });

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('*, business_analysis(*)')
      .eq('crawl_job_id', jobId)
      .order('created_at', { ascending: false });
    if (data) setBusinesses(data);
  };

  useEffect(() => {
    if (!jobId) return;

    const fetchInitial = async () => {
      const { data: jobData } = await supabase.from('crawl_jobs').select('*').eq('id', jobId).single();
      if (jobData) {
        setJob(jobData);
        if (jobData.status === 'queued') {
          fetch('/api/cron/process-queue', { method: 'POST' }).catch(console.error);
        }
      }
      await fetchRecords();
      setLoading(false);
    };

    fetchInitial();

    const interval = setInterval(async () => {
      const { data: jobData } = await supabase.from('crawl_jobs').select('*').eq('id', jobId).single();
      if (jobData) {
        setJob(jobData);
        if (jobData.status === 'queued') {
          fetch('/api/cron/process-queue', { method: 'POST' }).catch(console.error);
        }
        if (jobData.status === 'completed' || jobData.status === 'failed') {
          await fetchRecords();
          clearInterval(interval);
          return;
        }
      }
      await fetchRecords();
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, supabase]);

  const handleExportCSV = () => {
    if (!businesses.length) return;
    const headers = ['Firma Adı', 'Kategori', 'Telefon', 'Web Sitesi', 'AI Skoru', 'Neden Fırsat?'];
    const csvRows = businesses.map(b => {
      const analysis = b.business_analysis;
      const aiScore = analysis?.ai_score || 0;
      let reasonText = '';
      try {
        const parsedReason = JSON.parse(analysis?.opportunity_reason || '{}');
        reasonText = Array.isArray(parsedReason.summary) ? parsedReason.summary.join(' - ') : analysis?.opportunity_reason;
      } catch (e) {
        reasonText = analysis?.opportunity_reason || '';
      }
      return [
        `"${b.business_name || ''}"`,
        `"${b.category || ''}"`,
        `"${b.phone || ''}"`,
        `"${b.website || ''}"`,
        aiScore,
        `"${reasonText}"`
      ].join(',');
    });
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `snaplead_export_${jobId.substring(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyQuickFilter = (type: string) => {
    const reset = {
      no_website: false, no_mobile: false, no_ssl: false,
      no_social: false, low_rating: false, has_phone: false, has_email: false,
    };
    if (type === 'seo') {
      setFilters({ ...reset, no_ssl: true, no_mobile: true });
    } else if (type === 'digital_weak') {
      setFilters({ ...reset, no_website: true, no_social: true });
    } else if (type === 'ready_to_call') {
      setFilters({ ...reset, has_phone: true, no_website: true });
    } else {
      setFilters(reset);
    }
  };

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const analysis = b.business_analysis;
      
      if (searchQuery && !b.business_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      if (filters.no_website && b.website) return false;
      if (filters.has_phone && !b.phone) return false;
      if (filters.has_email && !b.email) return false;
      if (filters.low_rating && (b.rating === null || b.rating >= 4.0)) return false;
      
      if (filters.no_ssl && analysis?.has_ssl) return false;
      if (filters.no_mobile && analysis?.mobile_responsive) return false;
      if (filters.no_social && analysis?.has_social_links) return false;

      return true;
    });
  }, [businesses, filters, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Tarama Bulunamadı</h2>
      </div>
    );
  }

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const progressPercent = isCompleted ? 100 : Math.min(((job.fetched_count || 0) / 10) * 100, 95);

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 bg-background min-h-screen">
      
      {/* SIDEBAR: SMART FILTERS (25%) */}
      <div className="w-full lg:w-1/4 shrink-0 space-y-6">
        <Card className="sticky top-6 shadow-sm border-border bg-card">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-card-foreground">
              <Search className="w-5 h-5 text-primary" /> Akıllı Filtreler
            </CardTitle>
            <CardDescription>Hedeflerinizi daraltın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Firma Ara..."
                className="pl-9 bg-background border-input text-foreground"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Web & Dijital Varlık</h3>
              
              <div className="flex items-center space-x-3">
                <Checkbox id="no_website" checked={filters.no_website} onCheckedChange={() => toggleFilter('no_website')} />
                <label htmlFor="no_website" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">Web Sitesi Yok</label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="no_mobile" checked={filters.no_mobile} onCheckedChange={() => toggleFilter('no_mobile')} />
                <label htmlFor="no_mobile" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">Mobil Uyumsuz</label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="no_ssl" checked={filters.no_ssl} onCheckedChange={() => toggleFilter('no_ssl')} />
                <label htmlFor="no_ssl" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">SSL Sertifikası Yok</label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="no_social" checked={filters.no_social} onCheckedChange={() => toggleFilter('no_social')} />
                <label htmlFor="no_social" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">Sosyal Medya Yok</label>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">İtibar & İletişim</h3>
              
              <div className="flex items-center space-x-3">
                <Checkbox id="low_rating" checked={filters.low_rating} onCheckedChange={() => toggleFilter('low_rating')} />
                <label htmlFor="low_rating" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">Google Puanı &lt; 4.0</label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="has_phone" checked={filters.has_phone} onCheckedChange={() => toggleFilter('has_phone')} />
                <label htmlFor="has_phone" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">Telefon Mevcut</label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox id="has_email" checked={filters.has_email} onCheckedChange={() => toggleFilter('has_email')} />
                <label htmlFor="has_email" className="text-sm font-medium leading-none cursor-pointer text-card-foreground">E-Posta Mevcut</label>
              </div>
            </div>

            <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-4 border border-input hover:bg-muted hover:text-foreground" onClick={() => applyQuickFilter('reset')}>
              Filtreleri Temizle
            </Button>

          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT (75%) */}
      <div className="w-full lg:w-3/4 space-y-6">
        
        {/* HEADER STATS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">İstihbarat Raporu</h1>
              {isCompleted ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Tamamlandı</Badge>
              ) : isFailed ? (
                <Badge variant="destructive">Hata Oluştu</Badge>
              ) : (
                <Badge className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Analiz Ediliyor
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-xs">JOB: {job.id}</p>
          </div>
          <div className="flex items-center gap-6 z-10">
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Eşleşen</p>
              <p className="text-3xl font-black text-card-foreground">{filteredBusinesses.length}</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleExportCSV} disabled={filteredBusinesses.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Dışa Aktar
            </Button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {!isCompleted && !isFailed && (
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-muted-foreground">Canlı İstihbarat Ağı Taranıyor...</span>
                <span className="font-mono text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* QUICK FILTERS */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => applyQuickFilter('seo')} className="rounded-full border border-border shadow-sm text-xs font-medium">
            🚀 SEO Sorunlu Siteler
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyQuickFilter('digital_weak')} className="rounded-full border border-border shadow-sm text-xs font-medium">
            👻 Dijital Varlığı Zayıf
          </Button>
          <Button variant="secondary" size="sm" onClick={() => applyQuickFilter('ready_to_call')} className="rounded-full border border-border shadow-sm text-xs font-medium">
            📞 Hemen Aranabilir (No Web)
          </Button>
        </div>

        {/* RESULTS GRID */}
        {filteredBusinesses.length === 0 && !loading && (
          <div className="text-center py-16 border border-border border-dashed rounded-2xl bg-muted/50 text-muted-foreground">
            {isCompleted ? 'Filtrelerinize uygun işletme bulunamadı.' : 'Hedefler aranıyor ve analiz ediliyor...'}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredBusinesses.map((business) => {
            const analysis = business.business_analysis;
            const aiScore = analysis?.ai_score || 0;
            const hasPhone = !!business.phone;
            const hasWebsite = !!business.website;
            
            let tags: string[] = [];
            let summary: string[] = [];
            try {
              const parsed = JSON.parse(analysis?.opportunity_reason || '{}');
              tags = parsed.tags || [];
              summary = parsed.summary || [];
            } catch(e) {}

            return (
              <Card key={business.id} className="border-border bg-card hover:border-primary/50 transition-all duration-300 group flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md">
                
                {/* CARD HEADER */}
                <CardHeader className="pb-4 border-b border-border bg-muted/30 relative">
                  <div className="flex justify-between items-start gap-4 pr-16">
                    <div>
                      <CardTitle className="text-lg font-bold line-clamp-1 leading-tight text-card-foreground group-hover:text-primary transition-colors">
                        {business.business_name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1.5">
                        <MapPin className="h-3 w-3" /> {business.city} <span className="text-border">•</span> {business.category}
                      </div>
                    </div>
                  </div>

                  {/* SCORE BADGE */}
                  {aiScore > 0 && (
                    <div className="absolute top-4 right-4 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 shadow-sm bg-background
                        ${aiScore >= 90 ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 
                          aiScore >= 70 ? 'text-amber-600 dark:text-amber-400 border-amber-500/30' : 
                          'text-muted-foreground border-border'}
                      `}>
                        {aiScore}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 font-bold">Skor</span>
                    </div>
                  )}

                  {/* MINI BADGES (RATING) */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {business.rating && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 text-[10px] px-1.5">
                        <Star className="w-3 h-3 mr-1 fill-amber-500 dark:fill-amber-400" /> {business.rating} ({business.review_count})
                      </Badge>
                    )}
                    {tags.slice(0, 2).map((tag: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[9px] bg-background text-muted-foreground border-border uppercase">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                {/* CARD BODY */}
                <CardContent className="space-y-4 pt-4 mt-auto">
                  
                  {/* CONTACT & DIGITAL ASSETS */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-2 text-xs p-2 rounded-md border bg-background ${hasPhone ? 'border-border text-foreground' : 'border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'}`}>
                      <Phone className="w-3.5 h-3.5" />
                      <span className="truncate">{hasPhone ? business.phone : 'Telefon Yok'}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs p-2 rounded-md border bg-background ${hasWebsite ? 'border-border text-foreground' : 'border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'}`}>
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate">{hasWebsite ? 'Web Var' : 'Web Yok'}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs p-2 rounded-md border bg-background ${analysis?.mobile_responsive ? 'border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground'}`}>
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="truncate">{analysis?.mobile_responsive ? 'Mobil Uyumlu' : 'Mobil Uyumsuz'}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-xs p-2 rounded-md border bg-background ${analysis?.has_ssl ? 'border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground'}`}>
                      <Lock className="w-3.5 h-3.5" />
                      <span className="truncate">{analysis?.has_ssl ? 'SSL Var' : 'SSL Yok'}</span>
                    </div>
                  </div>

                  {/* AI SUMMARY BOX */}
                  {summary.length > 0 && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 relative overflow-hidden">
                      <div className="font-bold text-primary mb-2 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5"/> Satış Fırsatı
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-foreground relative z-10">
                        {summary.slice(0, 2).map((line: string, i: number) => (
                          <li key={i} className="leading-relaxed flex items-start gap-1.5 font-medium">
                            <span className="text-primary mt-0.5"><Check className="w-3 h-3" /></span> <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    {business.phone ? (
                      <a href={`tel:${business.phone}`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs">
                          <Phone className="w-3.5 h-3.5 mr-1.5" /> Ara
                        </Button>
                      </a>
                    ) : (
                      <Button variant="default" size="sm" className="flex-1 bg-primary text-primary-foreground opacity-50 text-xs" disabled>
                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Tel Yok
                      </Button>
                    )}
                    <Link href={`/${locale}/dashboard/business/${business.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-background border-input hover:bg-muted text-foreground text-xs">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Detaylar
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`shrink-0 hover:bg-muted transition-colors ${savedIds.has(business.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      onClick={async () => {
                        const res = await fetch('/api/businesses/save', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ businessId: business.id })
                        });
                        const data = await res.json();
                        setSavedIds(prev => {
                          const next = new Set(prev);
                          if (data.saved) next.add(business.id); else next.delete(business.id);
                          return next;
                        });
                        toast.success(data.saved ? '✅ Kaydedildi!' : 'Kayıt silindi');
                      }}
                    >
                      {savedIds.has(business.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}
