function formatSocial(value: string | null) {
  if (!value) return "Yok";
  if (value === "found") return "Var (Link Çıkarılamadı)";
  return value; // Returns the actual link
}

function parseReason(reason: string | null) {
  try {
    if (!reason) return null;
    return JSON.parse(reason);
  } catch (e) {
    return {
      summary: [reason],
      services: [],
      tags: ["RAW DATA"],
    };
  }
}

export function exportToCsv(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  // Map both Flat Orchestrator format and Nested Supabase Join format
  const mappedData = data.map(item => {
    const name = item.name || item.business_name || "";
    const category = item.category || "";
    const city = item.city || "";
    const phone = item.phone || "Yok";
    const email = item.email || "Yok";
    const website = item.website || "Yok";
    const mapsUrl = item.maps_url || "Yok";
    const instagram = item.instagram || null;
    const facebook = item.facebook || null;
    const twitter = item.twitter || null;
    const linkedin = item.linkedin || null;
    const rating = item.rating || "Yok";
    const reviewCount = item.review_count || 0;
    const trustScore = item.trust_score !== undefined && item.trust_score !== null ? `${item.trust_score}%` : "Yok";

    // Extract nested or flat analysis fields
    const ba = item.business_analysis || {};
    const aiScore = item.ai_score !== undefined && item.ai_score !== null ? item.ai_score : (ba.ai_score !== undefined && ba.ai_score !== null ? ba.ai_score : 0);
    const urgencyScore = item.urgency_score !== undefined && item.urgency_score !== null ? item.urgency_score : (ba.urgency_score !== undefined && ba.urgency_score !== null ? ba.urgency_score : 0);
    const salesReadiness = item.sales_readiness !== undefined && item.sales_readiness !== null ? item.sales_readiness : (ba.sales_readiness !== undefined && ba.sales_readiness !== null ? ba.sales_readiness : 0);
    const buyIntent = item.buy_intent || ba.buy_intent || "Low";
    
    const rawReason = item.opportunity_reason || ba.opportunity_reason || null;
    const parsed = parseReason(rawReason);
    
    const opportunitySummary = parsed?.summary ? parsed.summary.join(", ") : (rawReason || "Yok");
    const recommendedServices = parsed?.services ? parsed.services.join(", ") : "Yok";
    
    let whyNow = "Yok";
    if (ba.why_now_signals) {
      whyNow = Array.isArray(ba.why_now_signals) ? ba.why_now_signals.join(" | ") : JSON.stringify(ba.why_now_signals);
    } else if (item.why_now_signals) {
      whyNow = Array.isArray(item.why_now_signals) ? item.why_now_signals.join(" | ") : JSON.stringify(item.why_now_signals);
    }

    return {
      "İşletme Adı": name,
      "Kategori": category,
      "Şehir": city,
      "Telefon": phone,
      "E-posta": email,
      "Web Sitesi": website,
      "Google Haritalar": mapsUrl,
      "Instagram": formatSocial(instagram),
      "Facebook": formatSocial(facebook),
      "Twitter (X)": formatSocial(twitter),
      "LinkedIn": formatSocial(linkedin),
      // Excel'de "4.8" tarihe dönüşmesin diye noktayı virgüle çeviriyoruz
      "Google Puanı": rating !== "Yok" ? rating.toString().replace('.', ',') : "Yok",
      "Yorum Sayısı": reviewCount,
      "Güven Endeksi": trustScore,
      "Yapay Zeka Fırsat Puanı": aiScore,
      "Fırsat Analizi": opportunitySummary,
      "Aciliyet Puanı": urgencyScore,
      "Satışa Hazırlık": `${salesReadiness}%`,
      "Satın Alma Niyeti (Intent)": buyIntent,
      "Neden Şimdi (Why Now) Sinyalleri": whyNow,
      "Önerilen Hizmetler": recommendedServices
    };
  });

  const headers = Object.keys(mappedData[0]);
  const csvRows = [];
  
  // Add headers (Excel usually expects semicolon delimiter in European/Turkish locales)
  csvRows.push(headers.join(';'));

  // Add data
  for (const row of mappedData) {
    const values = headers.map(header => {
      const val = row[header as keyof typeof row];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(';'));
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly reads Turkish characters
  const csvContent = "\uFEFF" + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
