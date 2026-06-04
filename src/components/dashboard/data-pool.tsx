"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Loader2, Download, Activity, RefreshCcw, Search, Filter, 
  MapPin, Briefcase, Phone, Globe, Mail, ExternalLink, Flame, 
  AlertTriangle, ShieldAlert, Sparkles, ChevronRight, X, ArrowUpRight, TrendingUp, Check, LayoutGrid, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToCsv } from "@/lib/export";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

function parseReason(reason: string | null) {
  try {
    if (!reason) return null;
    return JSON.parse(reason);
  } catch (e) {
    return {
      summary: [reason],
      services: [],
      tags: ["RAW DATA"],
    };
  }
}

// Custom simple Checkbox for this component to avoid radix ui dependency issues
const CustomCheckbox = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <div className="flex items-start space-x-3 py-1.5 cursor-pointer group" onClick={() => onChange(!checked)}>
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      className={`mt-0.5 w-4 h-4 flex shrink-0 items-center justify-center rounded border transition-colors ${checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white group-hover:border-emerald-400'}`}
    >
      {checked && <Check className="w-3 h-3" />}
    </button>
    <Label htmlFor={id} className="text-[13px] font-medium leading-tight cursor-pointer text-gray-700 group-hover:text-gray-900">
      {label}
    </Label>
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
  { id: "r_weak_digital", label: "Dijital Varlığı Zayıf İşletmeler" },
  { id: "r_low_rating", label: "Google Puanı Düşük İşletmeler" },
  { id: "r_call_now", label: "Hemen Aranabilecek İşletmeler" },
  { id: "r_high_potential", label: "Yüksek Potansiyelli Müşteriler" },
  { id: "r_website_renewal", label: "Web Sitesi Yenileme Fırsatları" },
  { id: "r_social_media", label: "Sosyal Medya Satılabilecekler" },
  { id: "r_google_ads", label: "Google Ads Satılabilecekler" }
];

export function DataPool() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  
  // Smart Filters State
  const [activeSmartFilters, setActiveSmartFilters] = useState<Set<string>>(new Set());
  const [activeReadyFilter, setActiveReadyFilter] = useState<string | null>(null);

  const fetchPool = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pool?limit=10000&t=" + new Date().getTime());
      if (res.ok) {
        const data = await res.json();
        const seen = new Set<string>();
        const unique = data.filter((b: any) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
        setBusinesses(unique);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  const toggleSmartFilter = (id: string) => {
    setActiveReadyFilter(null);
    setActiveSmartFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReadyFilterClick = (id: string) => {
    setActiveSmartFilters(new Set()); // Reset smart filters
    if (activeReadyFilter === id) {
      setActiveReadyFilter(null); // Toggle off
    } else {
      setActiveReadyFilter(id);
    }
  };

  const handleExport = () => {
    if (filteredBusinesses.length === 0) return;
    exportToCsv(filteredBusinesses, `Basepound_SmartSearch_Export`);
  };

  const isWhatsApp = (phone: string | null) => {
    if (!phone) return false;
    return !!phone.replace(/\s+/g, '').match(/^(\+90|0)?5/);
  };

  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return "#";
    const cleanNum = phone.replace(/[^0-9]/g, '');
    let finalNum = cleanNum;
    if (cleanNum.startsWith('0')) finalNum = '9' + cleanNum;
    if (!finalNum.startsWith('90')) finalNum = '90' + finalNum;
    return `https://wa.me/${finalNum}`;
  };

  // FILTERING ENGINE
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
      const ba = b.business_analysis || {};
      
      // Basic Search
      if (searchQuery && !b.business_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (cityFilter && !b.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      // Mock district filtering by checking the address or city again
      if (districtFilter && !b.city?.toLowerCase().includes(districtFilter.toLowerCase())) return false;
      if (sectorFilter && !b.category?.toLowerCase().includes(sectorFilter.toLowerCase())) return false;

      // Smart Filters
      if (activeSmartFilters.has("no_website") && !!b.website) return false;
      if (activeSmartFilters.has("website_down") && ba.website_status !== 'down') return false;
      if (activeSmartFilters.has("mobile_unfriendly") && (ba.mobile_score || 100) >= 50) return false;
      if (activeSmartFilters.has("no_ssl") && (ba.seo_score || 100) >= 40) return false;
      if (activeSmartFilters.has("no_instagram") && !!b.instagram) return false;
      if (activeSmartFilters.has("no_facebook") && !!b.facebook) return false;
      if (activeSmartFilters.has("rating_below_4") && (b.rating === null || b.rating >= 4)) return false;
      if (activeSmartFilters.has("recent_reviews") && (b.data_freshness || 0) < 80) return false;
      if (activeSmartFilters.has("has_phone") && !b.phone) return false;
      if (activeSmartFilters.has("has_email") && !b.email) return false;
      if (activeSmartFilters.has("has_whatsapp") && !isWhatsApp(b.phone)) return false;
      if (activeSmartFilters.has("has_maps") && !b.maps_url) return false;
      if (activeSmartFilters.has("reviews_below_50") && (b.review_count === null || b.review_count >= 50)) return false;
      if (activeSmartFilters.has("reviews_below_10") && (b.review_count === null || b.review_count >= 10)) return false;
      if (activeSmartFilters.has("old_website") && (ba.seo_score || 100) >= 30) return false;
      if (activeSmartFilters.has("seo_issues") && (ba.seo_score || 100) >= 50) return false;
      if (activeSmartFilters.has("no_contact_form") && (!!b.email || !b.website)) return false;
      if (activeSmartFilters.has("missing_socials") && (!!b.instagram && !!b.facebook)) return false;
      if (activeSmartFilters.has("high_potential") && (ba.ai_score || 0) < 80) return false;

      // Ready Filters
      if (activeReadyFilter === "r_no_website" && !!b.website) return false;
      if (activeReadyFilter === "r_website_down" && ba.website_status !== 'down') return false;
      if (activeReadyFilter === "r_mobile_unfriendly" && (ba.mobile_score || 100) >= 50) return false;
      if (activeReadyFilter === "r_no_ssl" && (ba.seo_score || 100) >= 40) return false;
      if (activeReadyFilter === "r_seo_issues" && (ba.seo_score || 100) >= 50) return false;
      if (activeReadyFilter === "r_weak_digital" && (!!b.website && !!b.instagram)) return false;
      if (activeReadyFilter === "r_low_rating" && (b.rating === null || b.rating >= 4)) return false;
      if (activeReadyFilter === "r_call_now" && (!b.phone || (ba.urgency_score || 0) < 80)) return false;
      if (activeReadyFilter === "r_high_potential" && (ba.ai_score || 0) < 90) return false;
      if (activeReadyFilter === "r_website_renewal" && (!b.website || (ba.mobile_score || 100) >= 50)) return false;
      if (activeReadyFilter === "r_social_media" && (!!b.instagram || !!b.facebook)) return false;
      if (activeReadyFilter === "r_google_ads" && (!!b.website || (b.rating || 5) < 4)) return false;

      return true;
    });
  }, [businesses, searchQuery, cityFilter, districtFilter, sectorFilter, activeSmartFilters, activeReadyFilter]);

  const stats = useMemo(() => {
    let noWeb = 0, mobileUnfriendly = 0, sslIssues = 0, highPot = 0, hasPhone = 0;
    for (const b of filteredBusinesses) {
      if (!b.website) noWeb++;
      if ((b.business_analysis?.mobile_score || 100) < 50) mobileUnfriendly++;
      if ((b.business_analysis?.seo_score || 100) < 40) sslIssues++;
      if ((b.business_analysis?.ai_score || 0) >= 80) highPot++;
      if (!!b.phone) hasPhone++;
    }
    return { total: filteredBusinesses.length, noWeb, mobileUnfriendly, sslIssues, highPot, hasPhone };
  }, [filteredBusinesses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 min-h-[50vh] bg-white rounded-xl border border-gray-200 shadow-sm">
        <Activity className="w-12 h-12 animate-pulse text-emerald-600 mb-6" />
        <p className="text-emerald-700 font-mono text-sm tracking-widest uppercase font-semibold">İstihbarat Havuzu Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <span className="tracking-tight">Akıllı Arama ve Satış Fırsatı</span>
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            İşletmeleri analiz edin, en karlı satış fırsatlarını anında yakalayın.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPool} disabled={loading} className="h-9 font-medium text-xs border-gray-300 hover:bg-gray-50 shadow-sm">
            <RefreshCcw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 font-medium text-xs border-gray-300 hover:bg-gray-50 shadow-sm">
            <Download className="mr-2 h-3.5 w-3.5" /> CSV İndir
          </Button>
        </div>
      </div>

      {/* TOP DASHBOARD SUMMARIES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Toplam Bulunan</span>
          <span className="text-2xl font-black text-gray-900 mt-1">{stats.total.toLocaleString()}</span>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Web Sitesi Yok</span>
          <span className="text-2xl font-black text-rose-700 mt-1">{stats.noWeb.toLocaleString()}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Mobil Uyumsuz</span>
          <span className="text-2xl font-black text-amber-700 mt-1">{stats.mobileUnfriendly.toLocaleString()}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">SSL Sorunu</span>
          <span className="text-2xl font-black text-blue-700 mt-1">{stats.sslIssues.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Yüksek Potansiyel</span>
          <span className="text-2xl font-black text-emerald-700 mt-1">{stats.highPot.toLocaleString()}</span>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Telefon Onaylı</span>
          <span className="text-2xl font-black text-indigo-700 mt-1">{stats.hasPhone.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* SIDEBAR: SEARCH & FILTERS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Temel Arama */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" /> Temel Arama
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select 
                  value={cityFilter} 
                  onChange={e => {
                    setCityFilter(e.target.value);
                    setDistrictFilter(''); // reset district
                  }} 
                  className="flex h-10 w-full rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 bg-gray-50 border-gray-200 appearance-none cursor-pointer border"
                >
                  <option value="">İl Seçiniz</option>
                  {Object.keys(turkeyData).sort().map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="relative">
                <Map className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select 
                  value={districtFilter} 
                  onChange={e => setDistrictFilter(e.target.value)} 
                  disabled={!cityFilter}
                  className="flex h-10 w-full rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 bg-gray-50 border-gray-200 appearance-none cursor-pointer border"
                >
                  <option value="">İlçe Seçiniz</option>
                  {cityFilter && (turkeyData as Record<string, string[]>)[cityFilter]?.sort().map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Sektör (Örn: Kuaför)" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="pl-9 bg-gray-50 border-gray-200" />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Firma Adı Ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-gray-50 border-gray-200" />
              </div>
            </div>
          </div>

          {/* 2. Hazır Filtreler */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Hazır Filtreler
            </h3>
            <div className="flex flex-wrap gap-2">
              {READY_FILTERS.map(rf => {
                const isActive = activeReadyFilter === rf.id;
                return (
                  <button
                    key={rf.id}
                    onClick={() => handleReadyFilterClick(rf.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5
                      ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                  >
                    🔥 {rf.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Akıllı Filtreler */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> Akıllı Filtreler
              </h3>
              {activeSmartFilters.size > 0 && (
                <button onClick={() => setActiveSmartFilters(new Set())} className="text-[10px] font-bold text-rose-500 hover:underline uppercase">
                  Temizle
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {SMART_FILTERS.map(filter => (
                <CustomCheckbox 
                  key={filter.id} 
                  id={filter.id} 
                  label={filter.label} 
                  checked={activeSmartFilters.has(filter.id)} 
                  onChange={() => toggleSmartFilter(filter.id)} 
                />
              ))}
            </div>
          </div>

        </div>

        {/* MAIN: RESULT CARDS */}
        <div className="lg:col-span-3">
          {filteredBusinesses.length === 0 ? (
            <div className="text-center p-16 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center">
              <Search className="w-10 h-10 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sonuç Bulunamadı</h3>
              <p className="text-gray-500 text-sm">Filtrelerinizi esnetmeyi veya farklı anahtar kelimeler denemeyi unutmayın.</p>
              <Button variant="outline" className="mt-6" onClick={() => {
                setActiveReadyFilter(null);
                setActiveSmartFilters(new Set());
                setSearchQuery(""); setCityFilter(""); setSectorFilter(""); setDistrictFilter("");
              }}>Tüm Filtreleri Temizle</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBusinesses.map((b) => {
                const ba = b.business_analysis || {};
                const aiScore = ba.ai_score || 0;
                const hasWhatsApp = isWhatsApp(b.phone);
                
                // Neden? (Why Now)
                let reasons: string[] = [];
                if (ba.why_now_signals && ba.why_now_signals.length > 0) {
                  reasons = ba.why_now_signals.slice(0, 3);
                } else if (ba.opportunity_reason) {
                  const parsed = parseReason(ba.opportunity_reason);
                  if (parsed && parsed.summary) {
                    reasons = parsed.summary.slice(0, 2);
                  }
                }
                
                // Generate a smart summary of why this is an opportunity based on filters if no reasons exist
                if (reasons.length === 0) {
                  if (!b.website) reasons.push("Web sitesi bulunmuyor.");
                  if (!b.instagram && !b.facebook) reasons.push("Sosyal medya hesapları eksik.");
                  if ((ba.mobile_score || 100) < 50) reasons.push("Mevcut web sitesi mobil uyumlu değil.");
                  if (b.rating && b.rating < 4) reasons.push("Google puanı düşük, itibar yönetimine ihtiyacı var.");
                  if (reasons.length === 0) reasons.push("Satış ve büyüme potansiyeli yüksek.");
                }

                return (
                  <div key={b.id} className="bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all rounded-xl p-5 flex flex-col group cursor-pointer" onClick={() => setSelectedBusiness(b)}>
                    {/* Header: Score & Trust */}
                    <div className="flex justify-between items-start mb-3">
                      <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border font-bold text-xs shadow-sm
                        ${aiScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          aiScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        <TrendingUp className="w-3.5 h-3.5" />
                        Satış Potansiyeli: {aiScore}/100
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-mono text-[10px] uppercase">
                        Güven: %{b.trust_score || 50}
                      </Badge>
                    </div>

                    {/* Business Info */}
                    <h3 className="font-bold text-base text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {b.business_name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mb-4 flex items-center gap-2">
                      <span className="truncate max-w-[120px]">{b.category}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{b.city}</span>
                    </p>

                    {/* Why Now Box */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-4 flex-1">
                      <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-2 block">Neden Fırsat?</span>
                      <ul className="space-y-1.5">
                        {reasons.slice(0,2).map((r, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5 leading-snug">
                            <span className="text-blue-500 mt-0.5">•</span> <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {/* Phone */}
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                          <Phone className="w-3 h-3 text-gray-500" />
                        </div>
                        {b.phone ? <span className="text-gray-800 truncate">{b.phone}</span> : <span className="text-gray-400 italic">Yok</span>}
                      </div>
                      
                      {/* Email */}
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                          <Mail className="w-3 h-3 text-gray-500" />
                        </div>
                        {b.email ? <span className="text-gray-800 truncate">{b.email}</span> : <span className="text-gray-400 italic">Yok</span>}
                      </div>

                      {/* Website */}
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center">
                          <Globe className="w-3 h-3 text-gray-500" />
                        </div>
                        {b.website ? <span className="text-blue-600 truncate hover:underline" onClick={(e)=>{e.stopPropagation(); window.open(b.website, '_blank')}}>Siteye Git</span> : <span className="text-gray-400 italic">Yok</span>}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-6 h-6 rounded bg-amber-50 border border-amber-100 flex items-center justify-center">
                          <StarIcon className="w-3 h-3 text-amber-500" />
                        </div>
                        {b.rating ? <span className="text-gray-800">{b.rating} ({b.review_count})</span> : <span className="text-gray-400 italic">Yok</span>}
                      </div>
                    </div>

                    {/* Actions Bottom Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {b.instagram && <Badge variant="outline" className="bg-pink-50 border-pink-100 text-pink-600 px-1.5 py-0">IG</Badge>}
                        {b.facebook && <Badge variant="outline" className="bg-blue-50 border-blue-100 text-blue-600 px-1.5 py-0">FB</Badge>}
                      </div>
                      
                      {hasWhatsApp ? (
                        <Button 
                          size="sm" 
                          className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                          onClick={(e) => { e.stopPropagation(); window.open(getWhatsAppLink(b.phone), '_blank'); }}
                        >
                          WhatsApp'tan Yaz
                        </Button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium px-2">Detayları Gör →</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Light Theme Inspector Sheet (Keeping the existing one as requested or just minor styling tweaks) */}
      <Sheet open={!!selectedBusiness} onOpenChange={(open) => {
        if (!open) {
          setSelectedBusiness(null);
        }
      }}>
        <SheetContent 
          side="right" 
          className="overflow-y-auto overflow-x-hidden bg-gray-50 border-l border-gray-200 p-0 shadow-2xl"
          style={{ width: '95vw', maxWidth: '1200px' }}
        >
          {selectedBusiness && (
            <div className="flex flex-col h-full font-sans">
              <div className="p-10 border-b border-gray-200 bg-white">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <h3 className="text-[11px] uppercase tracking-[0.25em] text-emerald-600 font-black flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Satış Fırsatı Detayı
                    </h3>
                    <SheetTitle className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">{selectedBusiness.business_name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-4 text-sm uppercase tracking-widest text-gray-500 font-semibold mt-4">
                      <span>UUID: {selectedBusiness.id.split('-')[0]}</span>
                      <span className="opacity-40">•</span>
                      <span>{selectedBusiness.city}</span>
                      <span className="opacity-40">•</span>
                      <span>{selectedBusiness.category}</span>
                    </SheetDescription>
                  </div>
                  <div className="text-right bg-gray-50 p-6 rounded-2xl border border-gray-100 min-w-[140px] flex flex-col items-center justify-center shadow-sm">
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-black mb-2">Satış Potansiyeli</div>
                    <div className={`text-6xl font-black tracking-tighter ${selectedBusiness.business_analysis?.ai_score >= 80 ? 'text-emerald-600' : selectedBusiness.business_analysis?.ai_score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {selectedBusiness.business_analysis?.ai_score || 0}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-10 space-y-12 bg-gray-50/50 flex-1">
                 {/* Reusing existing sheet content but it can be customized further */}
                 <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600" /> İletişim Bilgileri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Telefon Numarası</span>
                          {selectedBusiness.phone ? (
                            <a href={`tel:${selectedBusiness.phone}`} className="text-sm font-bold text-blue-600 hover:underline">{selectedBusiness.phone}</a>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Veritabanında Yok</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <Mail className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">E-posta Adresi</span>
                          {selectedBusiness.email ? (
                            <a href={`mailto:${selectedBusiness.email}`} className="text-sm font-bold text-emerald-600 hover:underline truncate">{selectedBusiness.email}</a>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Veritabanında Yok</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <Globe className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Web Sitesi</span>
                          {selectedBusiness.website ? (
                            <a href={selectedBusiness.website} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline truncate">{selectedBusiness.website}</a>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Veritabanında Yok</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Google Haritalar</span>
                          {selectedBusiness.maps_url ? (
                            <a href={selectedBusiness.maps_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-rose-600 hover:underline truncate">Haritada Gör</a>
                          ) : (
                            <span className="text-sm font-medium text-gray-400">Veritabanında Yok</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why Now Signals from analysis */}
                {selectedBusiness.business_analysis?.why_now_signals && selectedBusiness.business_analysis.why_now_signals.length > 0 && (
                  <div className="space-y-5 bg-rose-50/80 p-8 rounded-2xl border border-rose-100 shadow-sm">
                    <h3 className="text-base font-black uppercase tracking-widest text-rose-600 flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6" /> Neden Şimdi Aranmalı? (Satış Fırsatları)
                    </h3>
                    <ul className="space-y-4">
                      {selectedBusiness.business_analysis.why_now_signals.map((signal: string, i: number) => (
                        <li key={i} className="text-base font-medium flex items-start gap-4 text-gray-800 leading-relaxed">
                          <span className="text-rose-500 mt-1">►</span> {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Quick inline Star Icon for rating
function StarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
