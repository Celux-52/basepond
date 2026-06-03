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

    const safeSignals = Array.isArray(signals) ? signals : [];

    const prompt = `Sen piyasanın en kurnaz, en direkt ve en sonuç odaklı B2B satış stratejistisin. Görevin, karşıdaki işletme sahibini (patronu) anında etkileyecek, laf kalabalığı yapmayan, doğrudan "para kazandırma" veya "para kaybetmeyi önleme" odaklı mesajlar yazmaktır.

Hedef Müşteri: ${businessName || 'Belirtilmemiş'}
Sektör: ${category || 'Belirtilmemiş'}
Yapay Zeka Fırsat Analizi: ${opportunityAnalysis || 'Belirtilmemiş'}
Neden Şimdi Ulaşmalı?: ${whyNow || 'Belirtilmemiş'}
Eksiklikleri (Sinyaller): ${safeSignals.join(', ')}

KATI KURALLAR (BUNLARA UYMAZSAN ÇUVALLARIZ):
1. ASLA "Umarım bu e-posta sizi iyi bulur", "İyi günler dilerim", "Dijital varlıklarınızın önemi" gibi robotik, yapay zeka kokan kurumsal klişeler KULLANMA.
2. Esnaf/Patron ağzıyla, samimi ama son derece özgüvenli yaz. "Sitenizde şu eksik, rakipleriniz sizi eziyor, bunu hemen çözelim" tadında olsun.
3. WhatsApp mesajı en fazla 2-3 cümle olsun. Çok meşgul biri yolda yürürken tek eliyle yazmış gibi doğal dursun. (Örn: "Selamlar [İsim], sitenizi inceledim SSL sertifikası patlamış, müşteriler hata görüyor. Müsait bir ara görüşelim de şunu toparlayalım.")
4. E-posta şablonunun konu başlığı (Subject) merak uyandırıcı ve hafif kışkırtıcı olsun.
5. Emin olmadığın hiçbir teknik eksikliği (Sinyallerde yazmıyorsa) kafandan uydurma.

GÖREV: SADECE aşağıdaki JSON formatında cevap ver, dışına hiçbir şey yazma:
{
  "whatsapp": "...",
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

    let parsedContent;
    try {
      parsedContent = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', text);
      // Fallback response if the model didn't return valid JSON
      parsedContent = {
        whatsapp: "Merhaba, " + (businessName || 'işletme sahibi') + " olarak dijital varlıklarınızı inceledik. Size özel hazırladığımız fırsat raporunu iletmek istedik.",
        emailSubject: "Dijital Büyüme Fırsatlarınız Hakkında",
        emailBody: text // Put the raw text here so the user can at least see it
      };
    }

    return NextResponse.json(parsedContent);
  } catch (error: any) {
    console.error('Pitch generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
