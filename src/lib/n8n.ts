import { Database } from '@/types/supabase';

type Lead = Database['public']['Tables']['leads']['Row'];

export async function triggerN8nWebhook(lead: Lead) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error("N8N_WEBHOOK_URL is not defined in .env.local");
    return { success: false, error: "N8N Webhook URL is missing." };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'new_lead_ai_trigger',
        lead: {
          id: lead.id,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          company: lead.company,
          job_title: lead.job_title,
          linkedin_url: lead.linkedin_url,
          score: lead.score,
          status: lead.status
        },
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      return { success: false, error: `n8n responded with status: ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error triggering n8n:", error);
    return { success: false, error: error.message };
  }
}
