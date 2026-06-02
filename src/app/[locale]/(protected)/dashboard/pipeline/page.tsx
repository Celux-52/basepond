'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BusinessRecord } from '@/engine/types/business';
import { updatePipelineStage } from '@/app/actions/lead';
import { Loader2, Zap, Phone, Mail, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STAGES = ['YENİ', 'ARANDI', 'GÖRÜŞÜLDÜ', 'KAZANILDI', 'KAYBEDİLDİ'];
const STAGE_COLORS: Record<string, string> = {
  'YENİ': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'ARANDI': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'GÖRÜŞÜLDÜ': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'KAZANILDI': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'KAYBEDİLDİ': 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function PipelinePage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*, business_analysis(ai_score, opportunity_reasons)')
      .eq('status', 'APPROVED')
      .order('ai_score', { ascending: false })
      .limit(100);
      
    if (data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, pipeline_stage: newStage } : l));

    try {
      await updatePipelineStage(id, newStage);
      toast.success(`Aşama güncellendi: ${newStage}`);
    } catch (err) {
      toast.error('Güncelleme başarısız oldu');
      loadPipeline(); // revert
    }
  };

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-8 h-full">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          Satış Hunisi (Kanban)
        </h1>
        <p className="text-zinc-400 mt-2">
          Müşterilerinizi sürükle-bırak yöntemiyle satış aşamalarında ilerletin.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] custom-scrollbar">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => (l.pipeline_stage || 'YENİ') === stage);
          
          return (
            <div 
              key={stage}
              className="flex-shrink-0 w-80 flex flex-col bg-zinc-950/40 border border-zinc-800/50 rounded-2xl overflow-hidden"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{stage}</h3>
                <Badge variant="outline" className="bg-zinc-800 text-zinc-300">{stageLeads.length}</Badge>
              </div>

              {/* Cards List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                {stageLeads.map(lead => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', lead.id)}
                    className="p-4 cursor-grab active:cursor-grabbing border-zinc-800/60 bg-zinc-900/80 hover:border-primary/50 transition-colors shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={STAGE_COLORS[stage] || STAGE_COLORS['YENİ']}>
                        {lead.ai_score || 0} Puan
                      </Badge>
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <h4 className="font-bold text-foreground mb-1 truncate" title={lead.business_name}>
                      {lead.business_name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3 truncate">
                      {lead.category} • {lead.city}
                    </p>
                    <div className="flex gap-2">
                      {lead.phone && <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-emerald-400"><Phone className="w-3.5 h-3.5" /></div>}
                      {lead.website && <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-blue-400"><Globe className="w-3.5 h-3.5" /></div>}
                      {lead.email && <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-purple-400"><Mail className="w-3.5 h-3.5" /></div>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
