'use client';

import { CheckCircle2, Lock, ArrowRight, ShieldCheck, Phone, Target, Flame, Zap, Activity, Mail, Globe, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeadCardProps {
  lead: any;
  activeFilter?: string;
  onClick: () => void;
}

export function LeadCard({ lead, activeFilter, onClick }: LeadCardProps) {
  // Parsing the opportunity reasons and services
  const reasons = Array.isArray(lead.opportunity_reasons) ? lead.opportunity_reasons : [];
  const services = Array.isArray(lead.recommended_services) ? lead.recommended_services : [];
  
  const calculateDaysAgo = (dateStr: string) => {
    if (!dateStr) return 'Yeni';
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    return diff === 0 ? 'Bugün' : `${diff} gün önce`;
  };
  const verifiedText = calculateDaysAgo(lead.last_verified_at || lead.created_at);

  const getSmartBadge = () => {
    if (lead.ai_score >= 80) {
      return (
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md text-[10px] font-black tracking-wide shadow-sm">
          <Flame className="w-3.5 h-3.5" />
          <span>YÜKSEK POTANSİYEL</span>
          <span className="opacity-40 mx-0.5">|</span>
          <span>{lead.ai_score}</span>
        </div>
      );
    }
    if (lead.ai_score >= 50) {
      return (
        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-md text-[10px] font-black tracking-wide shadow-sm">
          <Zap className="w-3.5 h-3.5" />
          <span>ORTA FIRSAT</span>
          <span className="opacity-40 mx-0.5">|</span>
          <span>{lead.ai_score}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-100 px-2 py-1 rounded-md text-[10px] font-black tracking-wide shadow-sm">
        <Activity className="w-3.5 h-3.5" />
        <span>DÜŞÜK POTANSİYEL</span>
        <span className="opacity-40 mx-0.5">|</span>
        <span>{lead.ai_score}</span>
      </div>
    );
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

  return (
    <div 
      onClick={onClick}
      className="bg-card text-card-foreground rounded-xl p-5 border border-border hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between h-full relative"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="pr-2 flex-1">
            <h3 className="text-base font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-1.5">
              {lead.business_name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-[10px] uppercase tracking-wider">{lead.category}</span>
              <span>•</span>
              <span className="truncate max-w-[100px]">{lead.city}</span>
            </div>
          </div>
        </div>

        {/* AI Recommendations View / Neden Fırsat */}
        {reasons.length > 0 && (
          <div className="bg-blue-50/50 rounded-lg p-3 mb-4 border border-blue-100/50">
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Neden Fırsat?</h4>
            <ul className="space-y-1.5">
              {reasons.slice(0, 2).map((reason: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-foreground leading-snug">
                  <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact Grid Area (Hidden if locked, except for general indicators) */}
        {lead.is_unlocked ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-6 h-6 rounded bg-muted border border-border flex items-center justify-center">
                <Phone className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="text-foreground truncate">{lead.phone || <span className="text-neutral-400 italic">Yok</span>}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-6 h-6 rounded bg-muted border border-border flex items-center justify-center">
                <Globe className="w-3 h-3 text-muted-foreground" />
              </div>
              {lead.website ? <span className="text-blue-600 hover:underline truncate" onClick={(e) => { e.stopPropagation(); window.open(lead.website, '_blank'); }}>Siteye Git</span> : <span className="text-neutral-400 italic">Yok</span>}
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-center py-2 bg-muted border border-dashed border-border rounded-lg">
             <span className="text-xs font-semibold text-neutral-400 flex items-center gap-2">
               <Lock className="w-3.5 h-3.5" /> İletişim bilgileri kilitli
             </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            {getSmartBadge()}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            {verifiedText}
          </div>
          
          {lead.is_unlocked ? (
            isWhatsApp(lead.phone) ? (
              <Button 
                size="sm" 
                className="h-7 px-3 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex items-center gap-1.5 rounded-md"
                onClick={(e) => { e.stopPropagation(); window.open(getWhatsAppLink(lead.phone), '_blank'); }}
              >
                <MessageSquare className="w-3 h-3" /> WhatsApp
              </Button>
            ) : (
              <span className="text-[10px] text-neutral-400 font-medium px-2">Detayları Gör →</span>
            )
          ) : (
            <div className="flex items-center gap-1.5 text-foreground font-bold text-[11px] group-hover:text-blue-600 transition-colors uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5" />
              <span>Kilidi Aç</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
