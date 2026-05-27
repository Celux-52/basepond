'use server';

import { createClient } from '@/lib/supabase/server';
import { triggerN8nWebhook } from '@/lib/n8n';

export async function sendLeadToAutomation(leadId: string) {
  const supabase = await createClient();
  
  // 1. Lead verisini çek
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return { error: 'Lead bulunamadı.' };
  }

  // 2. n8n servisine gönder
  const result = await triggerN8nWebhook(lead);

  if (!result.success) {
    return { error: result.error || 'n8n bağlantısında hata oluştu.' };
  }

  return { success: true };
}
