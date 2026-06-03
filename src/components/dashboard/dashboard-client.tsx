'use client';

import { useState, useEffect, useCallback } from 'react';
import { AiLeadCard as LeadCard } from './AiLeadCard';
import { LeadDrawer } from './lead-drawer';
import { CreditIndicator } from './credit-indicator';
import { getDashboardLeads, getDashboardStats, getSectorsWithCounts } from '@/app/actions/lead';
import { initiateOnDemandCrawl, checkCrawlJobStatus } from '@/app/actions/crawl';
import { Search, Star, Target, Clock, Unlock, Zap, TrendingUp, Phone, Activity, SearchX, Loader2, Bot, Filter, MapPin, Briefcase, Map, Flame, Check, Sparkles, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Custom Checkbox
const CustomCheckbox = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <div className="flex items-start space-x-3 py-1.5 cursor-pointer group" onClick={() => onChange(!checked)}>
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      className={`mt-0.5 w-4 h-4 flex shrink-0 items-center justify-center rounded border transition-colors ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-neutral-300 bg-white group-hover:border-blue-400'}`}
    >
      {checked && <Check className="w-3 h-3" />}
    </button>
    <label htmlFor={id} className="text-[13px] font-medium leading-tight cursor-pointer text-neutral-700 group-hover:text-neutral-900 pointer-events-none">
      {label}
    </label>
  </div>
);

const SMART_FILTERS = [
  { id: "no_website", label: "Web sitesi yok" },
  { id: "website_down", label: "Web sitesi çalışmıyor" },
  { id: "mobile_unfriendly", label: "Mobil uyumsuz web sitesi" },
  { id: "no_ssl", label: "SSL sertifikası yok" },
  { id: "no_instagram", label: "Instagram hesabı yok" },
  { id: "no_facebook", label: "Facebook hesabı yok" },
  { id: "rating_below_4", label: "Google puanı 4'ün altında" },
  { id: "recent_reviews", label: "Son 90 günde yorum almış" },
  { id: "has_phone", label: "Telefon numarası mevcut" },
  { id: "has_email", label: "E-posta mevcut" },
  { id: "has_whatsapp", label: "WhatsApp mevcut" },
  { id: "has_maps", label: "Google Business kaydı mevcut" },
  { id: "reviews_below_50", label: "Google yorumu 50'nin altında" },
  { id: "reviews_below_10", label: "Google yorumu 10'un altında" },
  { id: "old_website", label: "Web sitesi eski tasarım" },
  { id: "seo_issues", label: "SEO sorunları mevcut" },
  { id: "no_contact_form", label: "İletişim formu yok" },
  { id: "missing_socials", label: "Sosyal medya bağlantıları eksik" },
  { id: "high_potential", label: "Yüksek satış potansiyeli" }
];

const READY_FILTERS = [
  { id: "r_no_website", label: "Web Sitesi Olmayanlar" },
  { id: "r_website_down", label: "Web Sitesi Çalışmayanlar" },
  { id: "r_mobile_unfriendly", label: "Mobil Uyumsuz Siteler" },
  { id: "r_no_ssl", label: "SSL Olmayan Siteler" },
  { id: "r_seo_issues", label: "SEO Sorunlu Siteler" },
  { id: "r_weak_digital", label: "Dijital Varlığı Zayıf" },
  { id: "r_low_rating", label: "Google Puanı Düşük" },
  { id: "r_call_now", label: "Hemen Aranabilecekler" },
  { id: "r_high_potential", label: "Yüksek Potansiyelliler" },
  { id: "r_website_renewal", label: "Web Site Yenileme" },
  { id: "r_social_media", label: "Sosyal Medya Fırsatı" },
  { id: "r_google_ads", label: "Google Ads Fırsatı" }
];

export function DashboardClient({ initialLeads, initialBalance, isAdmin = false }: { initialLeads: any[], initialBalance: number, isAdmin?: boolean }) {
  // Advanced Filter States
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' or Ready Filters ID
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [smartFilters, setSmartFilters] = useState<Set<string>>(new Set());

  // Debounced Values for Backend Fetch
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');
  const [debouncedDistrict, setDebouncedDistrict] = useState('');
  const [debouncedSector, setDebouncedSector] = useState('');

  // General State
  const [leads, setLeads] = useState(initialLeads);
  const [stats, setStats] = useState<any>(null);
  const [sectors, setSectors] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialLeads.length === 50);
  const [balance, setBalance] = useState(initialBalance);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Crawl State
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  // Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(1);

  useEffect(() => {
    // Check if user has seen welcome tour
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('hasSeenWelcomeTour');
      if (!hasSeen) {
        setShowWelcome(true);
      }
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcomeTour', 'true');
    }
  };

  const handleAddCredits = async (amount: number) => {
    setIsAddingCredits(true);
    try {
      const res = await fetch('/api/credits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setBalance(data.credits);
      toast.success(`✅ ${amount} kredi başarıyla eklendi! Yeni bakiye: ${data.credits}`);
    } catch (err: any) {
      toast.error('Kredi eklenemedi: ' + err.message);
    } finally {
      setIsAddingCredits(false);
    }
  };

  // Debounce inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDebouncedCity(cityFilter);
      setDebouncedDistrict(districtFilter);
      setDebouncedSector(sectorFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, cityFilter, districtFilter, sectorFilter]);

  // Load stats
  useEffect(() => {
    getDashboardStats().then(s => {
      if(s) setStats(s);
    });
    getSectorsWithCounts().then(s => {
      if(s) setSectors(s);
    });
  }, []);

  // Fetch Logic
  useEffect(() => {
    loadLeads(true);

    // Otomatik Anlık Yenileme (Real-time background polling)
    const interval = setInterval(async () => {
      try {
        const activeSmartFiltersArray = Array.from(smartFilters);
        const data = await getDashboardLeads(
          filterMode, 
          debouncedSearch, 
          0,
          activeSmartFiltersArray,
          debouncedCity,
          debouncedSector,
          debouncedDistrict
        );
        setLeads(prev => {
          if (prev.length > 50) return prev;
          const prevStr = JSON.stringify(prev);
          const dataStr = JSON.stringify(data);
          if (prevStr !== dataStr) {
            return data;
          }
          return prev;
        });
      } catch (e) {
        // Sessiz hata
      }
    }, 15000); // 5 saniye sunucuyu kilitliyordu, 15 saniyeye çıkarıldı

    // AI İşlemlerini tetikleyen ayrı ve daha yavaş bir döngü
    // Eğer bekleyen AI analiz işi varsa onu da arka planda tetikle
    const aiInterval = setInterval(() => {
      fetch('/api/cron/process-queue', { method: 'POST' }).catch(() => {});
    }, 60000); // Sadece dakikada bir kontrol et (Sunucu çökmesini önler)

    return () => {
      clearInterval(interval);
      clearInterval(aiInterval);
    };
  }, [filterMode, debouncedSearch, debouncedCity, debouncedDistrict, debouncedSector, smartFilters]);

  const loadLeads = async (reset = false) => {
    if (!reset && !hasMore) return;
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    const nextPage = reset ? 0 : page;
    try {
      const activeSmartFiltersArray = Array.from(smartFilters);
      const data = await getDashboardLeads(
        filterMode, 
        debouncedSearch, 
        nextPage,
        activeSmartFiltersArray,
        debouncedCity,
        debouncedSector,
        debouncedDistrict
      );
      
      if (reset) {
        setLeads(data);
      } else {
        setLeads(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 50);
      setPage(reset ? 1 : nextPage + 1);
    } catch (e) {
      console.error(e);
      toast.error('Veriler yüklenirken hata oluştu.');
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  // Filter Handlers
  const toggleSmartFilter = (id: string) => {
    setFilterMode('ALL'); // Reset ready filter when manual filters change
    setSmartFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReadyFilterClick = (id: string) => {
    setSmartFilters(new Set()); // Reset smart filters
    if (filterMode === id) {
      setFilterMode('ALL'); // Toggle off
    } else {
      setFilterMode(id);
    }
  };

  const handleClearFilters = () => {
    setFilterMode('ALL');
    setSmartFilters(new Set());
    setSearchQuery('');
    setCityFilter('');
    setDistrictFilter('');
    setSectorFilter('');
  };

  // Poll Crawl Status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId && isCrawling) {
      interval = setInterval(async () => {
        try {
          const job = await checkCrawlJobStatus(activeJobId);
          setCrawlStatus(job.status);
          
          if (job.status === 'completed' || job.status === 'failed') {
            setIsCrawling(false);
            setActiveJobId(null);
            if (job.status === 'completed') {
               toast.success(`Tarama tamamlandı! ${job.published_count} yeni fırsat eklendi.`);
               handleClearFilters();
            } else {
               toast.error('Tarama başarısız oldu.');
            }
          }
        } catch (e) {
          // ignore
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeJobId, isCrawling]);

  const handleStartCrawl = async () => {
    if (!debouncedSearch) return;
    try {
      const { jobId } = await initiateOnDemandCrawl(debouncedSearch);
      setIsCrawling(true);
      setActiveJobId(jobId);
      setCrawlStatus('queued');
      toast.success('Bölge taraması başlatıldı!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUnlocked = useCallback((updatedLead: any) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
    setBalance(b => Math.max(0, b - 1));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-credits', { detail: -1 }));
    }
  }, []);

  const onActionStart = useCallback((cost: number) => {
    setBalance(prev => Math.max(0, prev - cost));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-credits', { detail: -cost }));
    }
  }, []);

  const onActionError = useCallback((cost: number) => {
    setBalance(prev => prev + cost);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-credits', { detail: cost }));
    }
  }, []);

  const onActionSuccess = useCallback((businessId: string, actionType: 'steal' | 'unlock') => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === businessId) {
        return { 
          ...lead, 
          is_unlocked: true,
          is_stolen: false, 
          claimed_at: new Date().toISOString()
        };
      }
      return lead;
    }));
  }, []);

  const handleCardClick = useCallback((lead: any) => {
    setSelectedLead(lead);
  }, []);

  const activeFiltersCount = smartFilters.size + (filterMode !== 'ALL' ? 1 : 0) + (debouncedCity ? 1 : 0) + (debouncedSector ? 1 : 0) + (debouncedDistrict ? 1 : 0) + (debouncedSearch ? 1 : 0);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-neutral-50/50 overflow-hidden">
      
      {/* Header Area */}
      <div className="bg-white border-b border-neutral-200 shrink-0 z-10 relative">
        <div className="p-6 max-w-[1600px] mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Akıllı Arama ve Fırsat Tespit Motoru</h1>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  AI Algoritmaları Aktif
                </div>
              </div>
              <p className="text-neutral-500 text-sm max-w-xl leading-relaxed">
                İşletmeleri analiz edin, filtreleri kullanarak en karlı satış fırsatlarını anında yakalayın.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/tr/dashboard/search" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <Zap className="w-5 h-5 fill-current" /> Yeni İstihbarat Başlat
              </Link>
              <div className="flex items-center gap-2">
                <CreditIndicator balance={balance} isAdmin={isAdmin} />
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleAddCredits(100)}
                      disabled={isAddingCredits}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      title="100 Kredi Ekle"
                    >
                      {isAddingCredits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>+100</span>}
                    </button>
                    <button
                      onClick={() => handleAddCredits(500)}
                      disabled={isAddingCredits}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      title="500 Kredi Ekle"
                    >
                      {isAddingCredits ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>+500</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Premium Fırsat</span>
                </div>
                <div className="text-2xl font-black text-neutral-900">{stats.premium_count.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-neutral-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Yüksek Fırsat</span>
                </div>
                <div className="text-2xl font-black text-neutral-900">{stats.high_opportunity_count.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-neutral-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Açılan Lead</span>
                </div>
                <div className="text-2xl font-black text-neutral-900">{stats.opened_leads.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-neutral-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Dönüşüm Oranı</span>
                </div>
                <div className="text-2xl font-black text-green-600">%{stats.conversion_rate}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto overflow-hidden">
        
        {/* SIDEBAR: Search & Filters */}
        <div className="w-full lg:w-80 lg:shrink-0 bg-white border-r border-neutral-200 overflow-y-auto hidden lg:flex flex-col custom-scrollbar">
          <div className="p-5 space-y-6">
            
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                 <Filter className="w-4 h-4 text-blue-600" /> Filtreler
               </h3>
               {activeFiltersCount > 0 && (
                 <button onClick={handleClearFilters} className="text-[10px] font-bold text-red-500 hover:underline uppercase">Temizle</button>
               )}
            </div>

            {/* Basic Search */}
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input type="text" placeholder="İl (Örn: İstanbul)" value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-all" />
              </div>
              <div className="relative">
                <Map className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input type="text" placeholder="İlçe (Örn: Pendik)" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-all" />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <select 
                  value={sectorFilter} 
                  onChange={e => setSectorFilter(e.target.value)} 
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Tüm Sektörler</option>
                  {sectors.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.count})</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input type="text" placeholder="Firma Adı Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-blue-400 transition-all" />
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Ready Filters */}
            <div className="space-y-3">
               <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                 <Flame className="w-3.5 h-3.5 text-orange-500" /> Hazır Filtreler
               </h4>
               <div className="flex flex-wrap gap-1.5">
                 {READY_FILTERS.map(rf => {
                   const isActive = filterMode === rf.id;
                   return (
                     <button
                       key={rf.id}
                       onClick={() => handleReadyFilterClick(rf.id)}
                       className={`text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100'}`}
                     >
                       {rf.label}
                     </button>
                   );
                 })}
               </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Smart Filters Checkboxes */}
            <div className="space-y-3">
               <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                 Detaylı Filtreler
               </h4>
               <div className="space-y-1">
                 {SMART_FILTERS.map(filter => (
                   <CustomCheckbox 
                     key={filter.id} 
                     id={filter.id} 
                     label={filter.label} 
                     checked={smartFilters.has(filter.id)} 
                     onChange={() => toggleSmartFilter(filter.id)} 
                   />
                 ))}
               </div>
            </div>

          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50 custom-scrollbar relative">
          {isLoading && !isCrawling ? (
            <div className="absolute inset-0 z-10 bg-neutral-50/50 flex items-center justify-center backdrop-blur-[1px]">
               <div className="bg-white p-4 rounded-full shadow-lg">
                 <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
               </div>
            </div>
          ) : null}
          
          <div className="pb-12">
            {/* Empty State / Crawl Prompt */}
            {leads.length === 0 && !isLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                {isCrawling ? (
                   <div className="bg-white border border-blue-100 p-8 rounded-2xl shadow-xl max-w-md w-full flex flex-col items-center">
                     <div className="relative">
                       <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                       <Bot className="w-16 h-16 text-blue-600 relative z-10 animate-bounce" />
                     </div>
                     <h3 className="text-xl font-black text-neutral-900 mt-6 mb-2">Yapay Zeka Taramada...</h3>
                     <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
                       Durum: {crawlStatus.toUpperCase()}
                     </div>
                     <p className="text-sm text-neutral-500">Robotlarımız web sitelerini ve haritaları analiz ediyor. Lütfen sayfadan ayrılmayın.</p>
                   </div>
                ) : (debouncedSearch || debouncedCity || debouncedSector) ? (
                   <div className="bg-white border border-dashed border-neutral-300 p-10 rounded-2xl max-w-lg w-full shadow-sm">
                     <SearchX className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                     <h3 className="text-lg font-bold text-neutral-900 mb-2">Bu Filtrelere Uygun Kayıt Yok</h3>
                     <p className="text-sm text-neutral-500 mb-6">
                       Aradığınız kriterlerde havuzumuzda eşleşme bulunamadı. Yapay zeka robotlarımızı şu an bu kelimelerle arama yapmaya gönderebiliriz.
                     </p>
                     <button 
                       onClick={handleStartCrawl}
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                     >
                       <Zap className="w-5 h-5" />
                       10 Kredi Harca ve Taramayı Başlat
                     </button>
                     <button onClick={handleClearFilters} className="mt-4 text-sm text-neutral-500 font-semibold hover:text-neutral-900">
                       Veya filtreleri temizle
                     </button>
                   </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white border border-neutral-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <Search className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900">Kayıt Bulunamadı</h3>
                    <p className="text-neutral-500">Lütfen filtreleri değiştirin.</p>
                  </>
                )}
              </div>
            )}

            {/* Leads Grid */}
            {leads.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {leads.map((lead, i) => (
                  <LeadCard 
                    key={`${lead.id}-${i}`} 
                    business={lead} 
                    activeFilter={filterMode} // we pass it just in case lead-card uses it
                    onClick={handleCardClick}
                    onActionStart={onActionStart}
                    onActionError={onActionError}
                    onActionSuccess={onActionSuccess}
                  />
                ))}
              </div>
            )}
            
            {hasMore && leads.length > 0 && !isCrawling && (
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => loadLeads(false)}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoadingMore ? <Loader2 className="animate-spin w-4 h-4 text-neutral-600" /> : <Activity className="w-4 h-4" />}
                  Daha Fazla Yükle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LeadDrawer  
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUnlocked={handleUnlocked}
      />

      {/* Onboarding Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2">Sisteme Hoş Geldiniz!</h2>
              <p className="text-blue-100 font-medium">Satışları 10'a katlayacak yapay zeka gücü elinizde.</p>
            </div>
            
            <div className="p-6">
              {welcomeStep === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-500" /> 1. Yeni Fırsatlar Bulun
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    Sol üstteki <strong>"Yeni İstihbarat Başlat"</strong> butonuna tıklayarak hedeflediğiniz şehir ve sektörü yazın. Yapay zeka sizin için internetin altını üstüne getirip potansiyel müşterileri bulsun.
                  </p>
                </div>
              )}
              {welcomeStep === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> 2. Sihirli Satış Mesajları
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    İşletme kartlarında yer alan <strong>"Sihirli Satış Mesajı Üret"</strong> butonuna basarak, o firmanın web sitesindeki eksiklere özel vurucu bir WhatsApp mesajı veya E-posta şablonu oluşturun.
                  </p>
                </div>
              )}
              {welcomeStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-8">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-emerald-500" /> 3. Kanban Panosu
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    Sol menüden <strong>"Satış Hunisi"</strong>ne girerek görüştüğünüz müşterileri Trello gibi sürükleyip bırakarak harika bir düzende takip edin.
                  </p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {[1,2,3].map(step => (
                    <div key={step} className={`w-2 h-2 rounded-full transition-colors ${welcomeStep === step ? 'bg-blue-600' : 'bg-neutral-200'}`} />
                  ))}
                </div>
                <div className="flex gap-3">
                  {welcomeStep < 3 ? (
                    <button onClick={() => setWelcomeStep(w => w + 1)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors">
                      Sonraki
                    </button>
                  ) : (
                    <button onClick={closeWelcome} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl transition-colors flex items-center gap-2">
                      <Check className="w-4 h-4" /> Başlayalım!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
