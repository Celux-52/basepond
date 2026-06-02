import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessName, category, signals, whyNow, opportunityAnalysis } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    const prompt = `Sen kıdemli bir B2B Satış Temsilcisisin. Mükemmel derecede ikna edici, kısa ve net satış mesajları yazarsın.

Hedef Müşteri: ${businessName}
Sektör: ${category}
Yapay Zeka Fırsat Analizi: ${opportunityAnalysis}
Neden Şimdi Ulaşmalı?: ${whyNow}
Eksiklikleri (Sinyaller): ${signals.join(', ')}

GÖREV:
Yukarıdaki verilere dayanarak, bu müşteriye göndermek üzere iki parça içerik üret:
1. "WhatsApp Mesajı": Samimi ama profesyonel, doğrudan eksikliğine (örneğin eski web sitesi, SSL eksikliği vs.) dikkat çekerek randevu koparmaya yönelik kısa bir mesaj.
2. "E-Posta Şablonu": Çarpıcı bir konu başlığı (Subject) olan, profesyonel bir B2B soğuk e-posta (Cold Email) metni.

Çıktıyı SADECE aşağıdaki JSON formatında ver, markdown veya ekstra metin ekleme:
{
  "whatsapp": "Merhaba...",
  "emailSubject": "...",
  "emailBody": "..."
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${apiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        models: [
          "meta-llama/llama-3.3-70b-instruct:free",
          "google/gemma-2-9b-it:free",
          "openai/gpt-4o-mini"
        ], 
        route: "fallback",
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Pitch generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
