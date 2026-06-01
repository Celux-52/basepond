'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Briefcase, Target, Zap, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function SearchPage() {
  const router = useRouter();
  const locale = useLocale();
  
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalQuery = [city, district, sector, keyword].filter(Boolean).join(' ');
    
    if (!finalQuery) {
      toast.error('Lütfen arama yapmak için en az bir kriter belirleyin.');
      return;
    }

    setLoading(true);

    try {
      const region = [city, district].filter(Boolean).join(' ');
      
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, region, sector, limit })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Insufficient scans remaining' || res.status === 403) {
          toast.error('Krediniz bitti! İşleme devam etmek için Premium plana geçmelisiniz.');
          router.push('/pricing');
          return;
        }
        throw new Error(data.error || 'Arama başlatılamadı');
      }

      toast.success('İstihbarat motoru başarıyla tetiklendi!');
      router.push(`/${locale}/dashboard/results/${data.jobId}`);
      
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[85vh] relative text-zinc-100">
      
      {/* BACKGROUND GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
      
      {/* HERO SECTION */}
      <div className="relative pt-20 pb-12 text-center px-4">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-4 py-1.5 rounded-full mb-6 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Yapay Zeka Destekli Büyüme Motoru</span>
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Sektörünüzdeki <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">Gizli Fırsatları</span> Keşfedin
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Sadece şehir ve sektör girin. Gelişmiş botlarımız Google Maps'i tarasın, web sitelerini analiz etsin ve size en sıcak satış fırsatlarını getirsin.
        </p>
      </div>

      {/* SEARCH CONSOLE */}
      <div className="relative max-w-4xl mx-auto w-full px-4 z-10">
        <Card className="border-zinc-800/50 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden">
          <CardContent className="p-2 md:p-4">
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              
              {/* TOP ROW: INPUTS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="İl (Örn: İstanbul)"
                    className="pl-11 h-14 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 text-base"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="relative group">
                  <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="İlçe (Örn: Kadıköy)"
                    className="pl-11 h-14 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 text-base"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="relative group">
                  <Briefcase className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Sektör (Örn: Diş Kliniği)"
                    className="pl-11 h-14 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 text-base"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="relative group">
                  <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Anahtar Kelime"
                    className="pl-11 h-14 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 text-base"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* BOTTOM ROW: LIMIT & SUBMIT */}
              <div className="flex flex-col md:flex-row gap-3 items-center mt-2">
                <div className="relative w-full md:w-1/3">
                  <Target className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500 pointer-events-none" />
                  <select 
                    className="w-full h-14 pl-11 pr-10 text-base text-zinc-300 bg-zinc-900/80 border border-zinc-800 rounded-lg focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    disabled={loading}
                  >
                    <option value={10}>10 İşletme Hedefle (1 Kredi)</option>
                    <option value={30}>30 İşletme Hedefle (3 Kredi)</option>
                    <option value={50}>50 İşletme Hedefle (5 Kredi)</option>
                    <option value={100}>100 İşletme Hedefle (10 Kredi)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full md:w-2/3 h-14 text-lg font-bold relative overflow-hidden group bg-primary hover:bg-primary/90 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Radar Taranıyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full h-full relative z-10">
                      <Zap className="h-5 w-5 fill-current" />
                      <span>İstihbarat Başlat</span>
                    </div>
                  )}
                  {/* Hover Shimmer Effect */}
                  {!loading && <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* QUICK STATS / TRUST INDICATORS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-center">
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
            <div className="text-3xl font-black text-white mb-1">2M+</div>
            <div className="text-sm text-zinc-500 font-medium">Taranan İşletme</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
            <div className="text-3xl font-black text-white mb-1">%92</div>
            <div className="text-sm text-zinc-500 font-medium">Satış Kapatma Oranı</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
            <div className="text-3xl font-black text-white mb-1">0 sn</div>
            <div className="text-sm text-zinc-500 font-medium">Akıllı Önbellek Hızı</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
            <div className="text-3xl font-black text-primary mb-1">100%</div>
            <div className="text-sm text-zinc-500 font-medium">Büyüme Garantisi</div>
          </div>
        </div>

      </div>
    </div>
  );
}
