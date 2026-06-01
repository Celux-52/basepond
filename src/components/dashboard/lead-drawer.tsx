'use client';

import { useState } from 'react';
import { X, Lock, Phone, Globe, Star, MessageCircle, AlertCircle } from 'lucide-react';
import { unlockLeadPhone } from '@/app/actions/lead';

interface LeadDrawerProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (data: any) => void;
}

export function LeadDrawer({ lead, isOpen, onClose, onUnlocked }: LeadDrawerProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const reasons = Array.isArray(lead.opportunity_reasons) ? lead.opportunity_reasons : [];
  const services = Array.isArray(lead.recommended_services) ? lead.recommended_services : [];

  const handleUnlock = async () => {
    setIsUnlocking(true);
    setError(null);
    try {
      const updatedLead = await unlockLeadPhone(lead.id);
      if (updatedLead && updatedLead.is_unlocked) {
        onUnlocked(updatedLead);
      } else {
        setError('Bakiye yetersiz veya bir hata oluştu.');
      }
    } catch (e: any) {
      setError(e.message || 'Bir hata oluştu.');
    }
    setIsUnlocking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900 truncate pr-4">{lead.business_name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Unlock Section */}
          <div className="bg-neutral-900 rounded-2xl p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20" />
            
            {!lead.is_unlocked ? (
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-white/80" />
                </div>
                <h3 className="text-xl font-bold mb-2">Telefon Numarası Gizli</h3>
                <p className="text-sm text-neutral-400 mb-6 px-4">Numarayı görüntülemek ve WhatsApp'a gitmek için 1 kredi harcamanız gerekmektedir.</p>
                
                {error && (
                  <div className="bg-red-500/20 text-red-200 text-sm py-2 px-4 rounded-lg mb-4 w-full flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <button 
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                >
                  {isUnlocking ? 'Açılıyor...' : 'Kilidi Aç (1 Kredi)'}
                </button>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                  <Phone className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-3xl font-black text-green-400 tracking-wider mb-6">{lead.phone}</h3>
                <div className="flex gap-3 w-full">
                   <a href={`tel:${lead.phone}`} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                     <Phone className="w-4 h-4" /> Ara
                   </a>
                   <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`} target="_blank" className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                     <MessageCircle className="w-4 h-4" /> WhatsApp
                   </a>
                </div>
              </div>
            )}
          </div>

          {/* AI Score */}
          <div className="flex items-center gap-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <span className="text-2xl font-black text-white">{lead.business_analysis?.ai_score || lead.ai_score || 0}</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Yapay Zeka Fırsat Skoru</h4>
              <p className="text-sm text-blue-700/80 mt-1">Bu işletme, hizmet satabilmeniz için yüksek potansiyele sahiptir.</p>
            </div>
          </div>

          {/* Opportunity Reasons */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Neden Aramalıyım?</h4>
            <div className="space-y-3">
              {reasons.map((reason: string, i: number) => (
                <div key={i} className="flex gap-3 bg-neutral-50 p-3 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-green-700 text-xs font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-neutral-700 leading-relaxed mt-0.5">{reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Services */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Satılabilecek Hizmetler</h4>
            <div className="flex flex-wrap gap-2">
              {services.map((service: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-sm font-medium">
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">İşletme Detayları</h4>
            <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-100">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Kategori</span>
                <span className="font-medium text-neutral-900">{lead.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Konum</span>
                <span className="font-medium text-neutral-900">{lead.city}, {lead.district}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Google Puanı</span>
                <div className="flex items-center gap-1 font-medium text-amber-600">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {lead.google_rating || lead.rating || '-'} ({lead.review_count || 0})
                </div>
              </div>
              <div className="flex justify-between text-sm pt-3 border-t border-neutral-200">
                <span className="text-neutral-500">Web Sitesi</span>
                {lead.website ? (
                  <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" className="font-medium text-blue-600 flex items-center gap-1 hover:underline">
                    <Globe className="w-4 h-4" /> Ziyaret Et
                  </a>
                ) : (
                  <span className="font-medium text-neutral-400">Yok</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
