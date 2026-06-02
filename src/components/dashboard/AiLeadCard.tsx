'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Phone, Globe, Star, Mail, Instagram, Facebook, Twitter, Linkedin, 
  ChevronDown, Flame, Snowflake, Target, Zap, AlertTriangle
} from 'lucide-react';
import { BusinessRecord } from '@/engine/types/business';

interface AiLeadCardProps {
  business: BusinessRecord;
  onClick?: () => void;
  activeFilter?: string; // To match LeadCard signature
}

export function AiLeadCard({ business, onClick }: AiLeadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState<{whatsapp: string, emailSubject: string, emailBody: string} | null>(null);
  
  if (!business) return null;

  const score = business.ai_score || 0;
  const isHot = business.sales_readiness === 'Sıcak';
  const signals = business.signals || [];
  
  const recServices = typeof business.recommended_services === 'string' 
    ? business.recommended_services.split(',').map(s => s.trim()).filter(Boolean)
    : (Array.isArray(business.recommended_services) ? business.recommended_services : []);

  return (
    <Card 
      onClick={onClick}
      className={`relative overflow-hidden border border-border/60 dark:border-zinc-800/60 bg-card/40 dark:bg-zinc-950/40 backdrop-blur-xl shadow-xl transition-all duration-500 hover:border-primary/50 group ${onClick ? 'cursor-pointer' : ''}`}
    >
      
      {/* Background Glow */}
      <div className={`absolute -inset-[100px] opacity-15 dark:opacity-20 blur-3xl rounded-full pointer-events-none transition-all duration-700
        ${score >= 80 ? 'bg-emerald-500/30 group-hover:bg-emerald-400/40' : 
          score >= 50 ? 'bg-amber-500/20 group-hover:bg-amber-400/30' : 
          'bg-red-500/10 group-hover:bg-red-400/20'}
      `} />

      <div className="relative z-10 p-5">
        {/* Top Header Row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="bg-background/50 dark:bg-zinc-900/50 border-border/50 text-muted-foreground">
                {business.category}
              </Badge>
              {isHot && (
                <Badge className="bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/20 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Yüksek İhtimal
                </Badge>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-1.5 truncate pr-4 group-hover:text-primary transition-colors">
              {business.business_name}
            </h3>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-muted-foreground/70" />
                {business.district}, {business.city}
              </div>
              
              {business.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400/90">
                  <Star className="w-4 h-4 fill-current" />
                  {business.rating} <span className="text-muted-foreground/70">({business.review_count})</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Score Ring */}
          <div className="shrink-0 flex flex-col items-center">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] bg-background dark:bg-transparent
              ${score >= 80 ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20' : 
                score >= 50 ? 'border-amber-500 text-amber-600 dark:text-amber-400 shadow-amber-500/20' : 
                'border-red-500 text-red-600 dark:text-red-400 shadow-red-500/20'}
            `}>
              <span className="text-xl font-black">{score}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
              Yapay Zeka Skoru
            </span>
          </div>
        </div>

        {/* Signals (Pain Points) Bubbles */}
        {signals.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-muted-foreground uppercase">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> Tespit Edilen Sinyaller (Satış Kozları)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {signals.map((signal, idx) => (
                <Badge key={idx} variant="secondary" className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 font-medium">
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar (Expand + Socials) */}
        <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
          
          <div className="flex gap-2">
            {business.phone && (
              <a href={`tel:${business.phone}`} title="Ara" onClick={e => e.stopPropagation()}>
                <div className="w-8 h-8 rounded bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
              </a>
            )}
            {business.website && (
              <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noreferrer" title="Website" onClick={e => e.stopPropagation()}>
                <div className="w-8 h-8 rounded bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors">
                  <Globe className="w-4 h-4" />
                </div>
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} title="E-Posta" onClick={e => e.stopPropagation()}>
                <div className="w-8 h-8 rounded bg-muted dark:bg-zinc-900 border border-border dark:border-zinc-800 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
              </a>
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          >
            <Target className="w-4 h-4" />
            Fırsat Detayı
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>

        </div>

        {/* Expandable AI Analysis */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-4 border-t border-border/50 space-y-4 cursor-default" onClick={e => e.stopPropagation()}>
                
                {/* AI Opportunity Analysis */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-primary text-sm uppercase tracking-wide">Yapay Zeka Analizi</h4>
                  </div>
                  <p className="text-sm text-foreground/90 dark:text-zinc-300 leading-relaxed">
                    {business.opportunity_analysis}
                  </p>
                </div>

                {/* Why Now */}
                <div className="bg-muted/50 dark:bg-zinc-900/50 border border-border/50 dark:border-zinc-800 rounded-xl p-4">
                  <h4 className="font-bold text-muted-foreground dark:text-zinc-400 text-sm mb-1.5">Neden Şimdi Ulaşmalı?</h4>
                  <p className="text-sm text-foreground/80 dark:text-zinc-300">
                    {business.why_now}
                  </p>
                </div>

                {/* Recommended Services */}
                {recServices && recServices.length > 0 && (
                  <div>
                    <h4 className="font-bold text-muted-foreground dark:text-zinc-500 text-xs mb-2 uppercase">Önerilen Hizmetler</h4>
                    <div className="flex flex-wrap gap-2">
                      {recServices.map((srv, idx) => (
                        <Badge key={idx} variant="outline" className="border-primary/30 text-primary bg-primary/5">
                          {srv}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Pitch Generator Section */}
                <div className="pt-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold shadow-lg shadow-primary/25 border-0"
                    disabled={isGeneratingPitch}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsGeneratingPitch(true);
                      try {
                        const res = await fetch('/api/generate-pitch', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            businessName: business.business_name,
                            category: business.category,
                            signals: business.signals || [],
                            whyNow: business.why_now || '',
                            opportunityAnalysis: business.opportunity_analysis || ''
                          })
                        });
                        const data = await res.json();
                        if (data.whatsapp) {
                          setGeneratedPitch(data);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsGeneratingPitch(false);
                      }
                    }}
                  >
                    {isGeneratingPitch ? (
                      <span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-pulse" /> Üretiliyor...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Sihirli Satış Mesajı Üret (AI)</span>
                    )}
                  </Button>

                  {/* Generated Pitch Display */}
                  {generatedPitch && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5"><Phone className="w-4 h-4" /> WhatsApp Mesajı</h4>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(generatedPitch.whatsapp); }}>
                            <span className="text-xs">Kopyala</span>
                          </Button>
                        </div>
                        <p className="text-sm text-foreground/80 dark:text-zinc-300 whitespace-pre-wrap">{generatedPitch.whatsapp}</p>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1.5"><Mail className="w-4 h-4" /> Soğuk E-Posta</h4>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`Konu: ${generatedPitch.emailSubject}\n\n${generatedPitch.emailBody}`); }}>
                            <span className="text-xs">Kopyala</span>
                          </Button>
                        </div>
                        <div className="mb-2 pb-2 border-b border-blue-500/20">
                          <span className="text-xs font-bold text-blue-500/70">Konu:</span> <span className="text-sm font-semibold text-foreground/90 dark:text-zinc-200">{generatedPitch.emailSubject}</span>
                        </div>
                        <p className="text-sm text-foreground/80 dark:text-zinc-300 whitespace-pre-wrap">{generatedPitch.emailBody}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </Card>
  );
}
