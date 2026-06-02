'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AiLeadCard } from '@/components/dashboard/AiLeadCard';
import { BusinessRecord } from '@/engine/types/business';
import { Loader2, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_SIGNALS = [
  "Web sitesi yok",
  "Web sitesi çalışmıyor",
  "Mobil uyumsuz web sitesi",
  "SSL sertifikası yok",
  "Web sitesi eski tasarım",
  "SEO sorunları mevcut",
  "İletişim formu yok",
  "Sosyal medya bağlantıları eksik",
  "Instagram hesabı yok",
  "Facebook hesabı yok",
  "Google puanı 4'ün altında",
  "Google yorumu 50'nin altında",
  "Google yorumu 10'un altında",
  "Google Business kaydı mevcut",
  "Son 90 günde yorum almış",
  "Telefon numarası mevcut",
  "E-posta mevcut",
  "WhatsApp mevcut",
  "Yüksek satış potansiyeli"
];

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<BusinessRecord[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'APPROVED')
      .order('ai_score', { ascending: false })
      .limit(200);
      
    if (data) {
      setLeads(data as BusinessRecord[]);
      setFilteredLeads(data as BusinessRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    let result = leads;

    // 1. Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => 
        l.business_name.toLowerCase().includes(q) || 
        l.category.toLowerCase().includes(q) || 
        l.district.toLowerCase().includes(q)
      );
    }

    // 2. Signal Filters (AND logic: must have all selected signals)
    if (selectedSignals.length > 0) {
      result = result.filter(l => {
        const leadSignals = l.signals || [];
        return selectedSignals.every(sig => leadSignals.includes(sig));
      });
    }

    setFilteredLeads(result);
  }, [search, selectedSignals, leads]);

  const toggleSignal = (signal: string) => {
    setSelectedSignals(prev => 
      prev.includes(signal) ? prev.filter(s => s !== signal) : [...prev, signal]
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          Satış İstihbarat Havuzu
        </h1>
        <p className="text-zinc-400 mt-2">
          Yapay zekanın analiz edip onayladığı hedefler. Satış kozlarına göre filtreleyin.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT SIDEBAR: FILTERS */}
        <div className={`lg:w-1/4 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Satış Kozları
              </h3>
              {selectedSignals.length > 0 && (
                <button onClick={() => setSelectedSignals([])} className="text-xs text-red-400 hover:underline">
                  Temizle
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {ALL_SIGNALS.map(signal => {
                const isActive = selectedSignals.includes(signal);
                return (
                  <div 
                    key={signal}
                    onClick={() => toggleSignal(signal)}
                    className={`text-sm px-3 py-2 rounded-lg cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-primary/20 border-primary/50 text-primary font-medium' 
                        : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                    }`}
                  >
                    {signal}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT: LEADS */}
        <div className="flex-1">
          
          {/* Search Bar & Export */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-500" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="İşletme adı, sektör veya ilçe ara..." 
                className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 focus:border-primary/50"
              />
            </div>
            <Button 
              className="hidden lg:flex h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 gap-2"
              onClick={() => {
                window.location.href = '/api/export-leads';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Excel'e Aktar
            </Button>
            <Button 
              className="lg:hidden h-12 bg-zinc-800" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Leads Grid */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl">
              <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Eşleşen Hedef Bulunamadı</h3>
              <p className="text-zinc-500">Seçtiğiniz sinyallere uygun bir işletme havuzda yok.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSelectedSignals([])}>
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <div className="mb-4 text-sm text-zinc-400 font-medium">
              Toplam <span className="text-white">{filteredLeads.length}</span> fırsat bulundu.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence>
              {filteredLeads.map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <AiLeadCard business={lead} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
