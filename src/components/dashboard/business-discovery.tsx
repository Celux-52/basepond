"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, Search, Download, TrendingUp, AlertCircle, Globe, Phone, MapPin, Target, Activity, Share2, Smartphone, Shield, Rocket, ShieldAlert } from "lucide-react";
import { OpportunityCard } from "./opportunity-card";
import { ProcessedBusiness } from "@/lib/engine/orchestrator";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { Badge } from "@/components/ui/badge";

function parseReason(reason: string | null) {
  try {
    if (!reason) return null;
    return JSON.parse(reason);
  } catch (e) {
    return {
      summary: [reason],
      services: [],
      tags: ["RAW DATA"]
    };
  }
}

export function BusinessDiscovery() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("20");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ProcessedBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<ProcessedBusiness | null>(null);

  const handleSearch = async () => {
    if (!city || !category) {
      toast.error("Lütfen şehir ve sektör bilgilerini eksiksiz girin.");
      return;
    }

    setIsScanning(true);
    setResults([]);

    try {
      const url = `/api/search?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&amount=${amount}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 402) {
          toast.error("Krediniz yetersiz. Lütfen hesabınıza kredi yükleyin.");
        } else {
          toast.error("Arama başlatılamadı, bir hata oluştu.");
        }
        setIsScanning(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No reader");
      }

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              setIsScanning(false);
              toast.success("Tarama tamamlandı! Tüm fırsatlar listelendi.");
              return;
            }

            try {
              const result = JSON.parse(dataStr);
              if (result.error) {
                toast.error(result.error);
                setIsScanning(false);
                return;
              }
              setResults(prev => {
                const existingIndex = prev.findIndex(p => p.id === result.id);
                if (existingIndex !== -1) {
                  const updated = [...prev];
                  updated[existingIndex] = result as ProcessedBusiness;
                  return updated;
                }
                return [...prev, result as ProcessedBusiness];
              });
            } catch (e) {
              // ignore parse errors for partial chunks if any
            }
          }
        }
      }
    } catch (error) {
      toast.error("Tarama sırasında bir hata oluştu.");
      setIsScanning(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) return;
    exportToCsv(results, `Basepound_${city}_${category}`);
    toast.success("CSV dosyası olarak başarıyla indirildi.");
  };

  const selectedAiData = selectedBusiness ? parseReason(selectedBusiness.opportunity_reason) : null;

  return (
    <div className="space-y-6">
      {/* Search Header Card */}
      <Card className="bg-card border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">Hedef Şehir / İlçe</label>
              <Input 
                placeholder="Örn: Kadıköy, İstanbul" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isScanning}
                className="bg-muted/50 focus:bg-background"
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">İşletme Sektörü</label>
              <Input 
                placeholder="Örn: Kuaför, Diş Kliniği, Restoran..." 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isScanning}
                className="bg-muted/50 focus:bg-background"
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-sm font-medium">Miktar</label>
              <Select value={amount} onValueChange={(val) => val && setAmount(val)} disabled={isScanning}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Adet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 İşletme</SelectItem>
                  <SelectItem value="20">20 İşletme</SelectItem>
                  <SelectItem value="50">50 İşletme</SelectItem>
                  <SelectItem value="100">100 İşletme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isScanning} 
              className="w-full md:w-auto min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              {isScanning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Taranıyor...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Taramayı Başlat</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      {results.length > 0 && (
        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Bulunan Fırsatlar ({results.length})
          </h2>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-border/60 hover:bg-muted">
            <Download className="mr-2 h-4 w-4" /> CSV İndir
          </Button>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((business, i) => (
          <OpportunityCard 
            key={business.id || i} 
            business={business} 
            onClick={() => setSelectedBusiness(business)}
          />
        ))}
      </div>

      {isScanning && results.length > 0 && (
        <div className="flex justify-center p-8">
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm font-medium">Arka planda işletmeler bulunuyor ve AI ile paralel analiz ediliyor...</p>
          </div>
        </div>
      )}

      {/* Business Details Panel (Sheet) */}
      <Sheet open={!!selectedBusiness} onOpenChange={(open) => !open && setSelectedBusiness(null)}>
        <SheetContent 
          side="right" 
          className="overflow-y-auto overflow-x-hidden bg-card border-l-border/50 p-0"
          style={{ width: '95vw', maxWidth: '1200px' }}
        >
          {selectedBusiness && (
            <div className="flex flex-col h-full font-sans">
              {/* Header */}
              <div className="p-10 border-b border-gray-200 bg-white">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <h3 className="text-[11px] uppercase tracking-[0.25em] text-emerald-600 font-black flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Entity Inspection
                    </h3>
                    <SheetTitle className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">{selectedBusiness.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-4 text-sm uppercase tracking-widest text-gray-500 font-semibold mt-4">
                      <span>{selectedBusiness.city}</span>
                      <span className="opacity-40">•</span>
                      <span>{selectedBusiness.category}</span>
                    </SheetDescription>
                  </div>
                  <div className="text-right bg-gray-50 p-6 rounded-2xl border border-gray-100 min-w-[140px] flex flex-col items-center justify-center shadow-sm">
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-black mb-2">AI Score</div>
                    <div className={`text-6xl font-black tracking-tighter ${selectedBusiness.ai_score && selectedBusiness.ai_score >= 80 ? 'text-emerald-600' : selectedBusiness.ai_score && selectedBusiness.ai_score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {selectedBusiness.ai_score || 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-8">
                  {selectedAiData?.tags?.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-200 py-1.5 px-4 rounded-lg font-bold">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="p-10 space-y-12 bg-gray-50/50">
                
                {/* Advanced Metrics Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md">
                    <Search className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">SEO</span>
                    <span className="text-3xl font-black text-gray-900">{selectedBusiness.seo_score || 0}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md">
                    <Smartphone className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Mobil</span>
                    <span className="text-3xl font-black text-gray-900">{selectedBusiness.mobile_score || 0}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md">
                    <Share2 className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Sosyal</span>
                    <span className="text-3xl font-black text-gray-900">{selectedBusiness.social_score || 0}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md">
                    <Shield className="w-6 h-6 text-emerald-500/70 mb-1" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Güven</span>
                    <span className="text-3xl font-black text-emerald-600">{selectedBusiness.trust_score || 0}</span>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md">
                    <Rocket className="w-6 h-6 text-amber-500/70 mb-1" />
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-black">Büyüme</span>
                    <span className="text-3xl font-black text-amber-600">{selectedBusiness.growth_score || 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-16">
                  {/* Summary */}
                  <div className="space-y-5 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> AI Tespit Edilen Zayıflıklar
                    </h3>
                    <ul className="space-y-4">
                      {selectedAiData?.summary?.map((item: string, i: number) => (
                        <li key={i} className="text-base font-semibold flex items-start gap-3 text-gray-800">
                          <span className="text-rose-500 font-black mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Services */}
                  <div className="space-y-5 bg-emerald-50 p-8 rounded-2xl border border-emerald-100 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600/70 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Önerilen Satış Fırsatları
                    </h3>
                    <ul className="space-y-4">
                      {selectedAiData?.services?.map((item: string, i: number) => (
                        <li key={i} className="text-base font-semibold flex items-start gap-3 text-emerald-900">
                          <span className="text-emerald-500 font-black mt-0.5">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Contact Data */}
                <div className="space-y-5 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">İletişim & Sosyal Medya</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedBusiness.website ? (
                       <a href={selectedBusiness.website} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-center">
                         <div className="bg-indigo-100 p-3 rounded-full text-indigo-600"><Globe className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-700 truncate w-full">{selectedBusiness.website.replace(/^https?:\/\//, '')}</span>
                       </a>
                    ) : (
                       <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-100 bg-gray-50 opacity-50 text-center">
                         <div className="bg-gray-200 p-3 rounded-full text-gray-400"><Globe className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-400">Web Sitesi Yok</span>
                       </div>
                    )}
                    {selectedBusiness.phone ? (
                       <a href={selectedBusiness.phone ? `tel:${selectedBusiness.phone}` : '#'} className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-center">
                         <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><Phone className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-700">{selectedBusiness.phone}</span>
                       </a>
                    ) : (
                       <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-100 bg-gray-50 opacity-50 text-center">
                         <div className="bg-gray-200 p-3 rounded-full text-gray-400"><Phone className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-400">Telefon Yok</span>
                       </div>
                    )}
                    {selectedBusiness.instagram ? (
                       <a href={selectedBusiness.instagram} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50/50 transition-all text-center">
                         <div className="bg-pink-100 p-3 rounded-full text-pink-600"><Share2 className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-700">Instagram</span>
                       </a>
                    ) : (
                       <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-100 bg-gray-50 opacity-50 text-center">
                         <div className="bg-gray-200 p-3 rounded-full text-gray-400"><Share2 className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-400">Instagram Yok</span>
                       </div>
                    )}
                    {selectedBusiness.linkedin ? (
                       <a href={selectedBusiness.linkedin} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-center">
                         <div className="bg-blue-100 p-3 rounded-full text-blue-700"><Share2 className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-700">LinkedIn</span>
                       </a>
                    ) : (
                       <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-gray-100 bg-gray-50 opacity-50 text-center">
                         <div className="bg-gray-200 p-3 rounded-full text-gray-400"><Share2 className="w-5 h-5" /></div>
                         <span className="text-sm font-bold text-gray-400">LinkedIn Yok</span>
                       </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
