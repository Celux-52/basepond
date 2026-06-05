"use client";
import { useState } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, MapPin, Phone, Star, TrendingUp, AlertCircle, ChevronRight, Activity, Smartphone, Share2, Search, Shield, Rocket } from "lucide-react";
import { ProcessedBusiness } from "@/lib/engine/orchestrator";

// Helper to safely parse the JSON stored in opportunity_reason
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

// Circular Progress Component for AI Score
function CircularScore({ score, label }: { score: number, label?: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-500 stroke-emerald-500";
    if (s >= 50) return "text-amber-500 stroke-amber-500";
    return "text-rose-500 stroke-rose-500";
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg className="transform -rotate-90 w-16 h-16">
        {/* Background Circle */}
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
        {/* Progress Circle */}
        <circle 
          cx="32" cy="32" r={radius} 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="transparent" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${getColor(score)} drop-shadow-md transition-all duration-1000 ease-out`} 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${getColor(score).split(' ')[0]}`}>{score}</span>
      </div>
      {label && <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase mt-1">{label}</span>}
    </div>
  );
}

// Mini Score Bar for Breakdowns
function MiniScore({ label, score, icon: Icon }: { label: string, score: number, icon: any }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-emerald-500";
    if (s >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };
  
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground">
        <span className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</span>
        <span>{score}/100</span>
      </div>
      <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full ${getColor(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function OpportunityCard({ business, onClick }: { business: ProcessedBusiness, onClick?: () => void }) {
  const [script, setScript] = useState<any>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const aiData = parseReason(business.opportunity_reason);
  const score = business.ai_score || 0;

  const handleGenerateScript = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (script) {
      setIsDialogOpen(true);
      return;
    }
    
    setIsLoadingScript(true);
    setIsDialogOpen(true);
    
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          business: {
            name: business.name,
            category: business.category,
            city: business.city,
            rating: business.rating,
            review_count: business.review_count,
            ai_score: score,
            weaknesses: aiData?.summary || [],
            services: aiData?.services || []
          } 
        })
      });
      const data = await response.json();
      if (data.script) setScript(data.script);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingScript(false);
    }
  };
  
  const getBorderColor = (s: number) => {
    if (s >= 80) return "border-emerald-500/30 hover:border-emerald-500/70 shadow-emerald-900/10";
    if (s >= 50) return "border-amber-500/30 hover:border-amber-500/70 shadow-amber-900/10";
    return "border-rose-500/30 hover:border-rose-500/70 shadow-rose-900/10";
  };

  return (
    <Card 
      onClick={onClick}
      className={`group relative overflow-hidden transition-all duration-300 bg-card hover:shadow-xl cursor-pointer border-y-0 border-r-0 border-l-4 ${getBorderColor(score)}`}
    >
      
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/10 z-0 pointer-events-none" />

      <CardHeader className="relative z-10 pb-2 px-5 pt-5">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg font-extrabold tracking-tight text-foreground line-clamp-1">{business.name}</CardTitle>
              {business.cached && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-muted">CACHED</Badge>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {business.city}</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {business.category}</span>
              {business.rating && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" /> {business.rating} ({business.review_count})
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center">
            <CircularScore score={score} label="FIRSAT" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-5 px-5 pb-4">
        
        {/* Score Breakdowns Grid */}
        <div className="grid grid-cols-5 gap-2 py-3 border-y border-border/40">
          <MiniScore label="SEO" score={business.seo_score || 0} icon={Search} />
          <MiniScore label="Mobil" score={business.mobile_score || 0} icon={Smartphone} />
          <MiniScore label="Sosyal" score={business.social_score || 0} icon={Share2} />
          <MiniScore label="Güven" score={business.trust_score || 0} icon={Shield} />
          <MiniScore label="Büyüme" score={business.growth_score || 0} icon={Rocket} />
        </div>

        {/* AI Tags */}
        <div className="flex flex-wrap gap-1.5">
          {aiData?.tags?.map((tag: string, i: number) => (
             <Badge key={i} variant="outline" className="text-[9px] uppercase tracking-wider font-bold bg-primary/5 text-primary border-primary/20">{tag}</Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opportunity Summary */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-destructive" /> Zayıflıklar
            </p>
            <ul className="space-y-1.5">
              {aiData?.summary?.map((item: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <span className="text-destructive mt-0.5">•</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Services */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-emerald-500" /> Satış Fırsatları
            </p>
            <ul className="space-y-1.5">
              {aiData?.services?.map((item: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 p-3 px-5 border-t border-border/40 flex justify-between items-center bg-muted/20">
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {business.website ? (
            <a href={business.website} target="_blank" rel="noreferrer" title="Website" className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-background border border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
              <Globe className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full border border-border/50 opacity-30"><Globe className="w-3.5 h-3.5" /></span>
          )}
          
          {business.phone ? (
            <a href={business.phone ? `tel:${business.phone}` : '#'} title={business.phone} className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-background border border-border/50 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-colors">
              <Phone className="w-3.5 h-3.5" />
            </a>
          ) : null}

          {business.instagram && (
            <a href={business.instagram} target="_blank" rel="noreferrer" title="Instagram" className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-background border border-border/50 hover:bg-pink-500/10 hover:text-pink-600 hover:border-pink-500/30 transition-colors">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          )}

          {business.linkedin && (
            <a href={business.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-background border border-border/50 hover:bg-blue-600/10 hover:text-blue-700 hover:border-blue-600/30 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          )}
        </div>
        
        <Button onClick={handleGenerateScript} variant="default" size="sm" className="h-8 text-xs font-bold shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 transition-all hover:scale-105">
          <Rocket className="w-3.5 h-3.5" /> Senaryo Üret
        </Button>
      </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/50 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> {business.name} - Satış Senaryosu
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingScript ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <p className="text-muted-foreground font-medium animate-pulse">Yapay Zeka Satış Senaryosunu Üretiyor...</p>
            </div>
          ) : script ? (
            <div className="space-y-6 mt-4">
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Satış Özeti</p>
                <p className="text-sm font-medium text-foreground">{script.summary}</p>
              </div>

              <div className="p-4 bg-primary/10 rounded-xl border-l-4 border-primary">
                <p className="text-[10px] uppercase font-bold tracking-wider text-primary mb-1">İlk İletişim Cümlesi (Opener)</p>
                <p className="text-base font-bold text-foreground italic">"{script.opener}"</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Kişisel Teklif Mesajı (Pitch)</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => navigator.clipboard.writeText(script.pitch)}>Kopyala</Button>
                </p>
                <div className="p-4 bg-card border border-border/50 rounded-xl shadow-sm whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                  {script.pitch}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-amber-600 mb-1">Follow Up (3 Gün Sonra)</p>
                  <p className="text-sm text-foreground">{script.follow_up}</p>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 mb-1">Neden Şimdi Ulaşmalıyız?</p>
                  <p className="text-sm font-medium text-foreground">{script.reason_to_contact}</p>
                </div>
              </div>

              <div className="p-4 bg-background rounded-xl border-2 border-dashed border-border/50 text-center">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Kapanış Çağrısı (CTA)</p>
                <p className="text-lg font-black text-foreground">{script.cta}</p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">Senaryo üretilemedi. Lütfen tekrar deneyin.</div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
