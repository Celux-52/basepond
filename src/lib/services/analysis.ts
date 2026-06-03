export interface WebsiteAnalysis {
  status: "active" | "error" | "no_website";
  has_ssl: boolean;
  mobile_responsive: boolean;
  has_social_links: boolean;
  is_slow: boolean; // Yeni eklendi
  detected_socials: {
    instagram?: boolean;
    facebook?: boolean;
    linkedin?: boolean;
    twitter?: boolean;
  };
}

export async function analyzeWebsite(url: string | null | undefined): Promise<WebsiteAnalysis> {
  if (!url) {
    return {
      status: "no_website",
      has_ssl: false,
      mobile_responsive: false,
      has_social_links: false,
      is_slow: false,
      detected_socials: {}
    };
  }

  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 sec timeout
    
    let has_ssl = formattedUrl.startsWith("https");
    let response;
    
    try {
      response = await fetch(formattedUrl, { 
        signal: controller.signal,
        headers: { "User-Agent": "Basepound-Analyzer/1.0" }
      });
    } catch (httpsError) {
      // If HTTPS fails, and it wasn't explicitly http, maybe they don't have SSL.
      if (formattedUrl.startsWith("https")) {
        has_ssl = false; // Gerçek kanıt: HTTPS reddedildi veya zaman aşımı
        // HTTP ile tekrar deneyelim (Gerçekten site var mı?)
        const httpUrl = formattedUrl.replace("https://", "http://");
        response = await fetch(httpUrl, { 
          signal: controller.signal,
          headers: { "User-Agent": "Basepound-Analyzer/1.0" }
        });
      } else {
        throw httpsError;
      }
    }
    
    clearTimeout(timeoutId);

    if (!response || !response.ok) {
      throw new Error("Not OK");
    }

    const duration = Date.now() - startTime;
    let is_slow = duration > 2500; 

    // Google PageSpeed API Entegrasyonu (Eğer API anahtarı varsa)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const psController = new AbortController();
        const psTimeoutId = setTimeout(() => psController.abort(), 8000); // 8 saniye bekle, olmazsa vazgeç
        const psRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${formattedUrl}&strategy=mobile&key=${apiKey}`, {
          signal: psController.signal
        });
        clearTimeout(psTimeoutId);
        
        if (psRes.ok) {
          const psData = await psRes.json();
          const score = psData?.lighthouseResult?.categories?.performance?.score;
          if (typeof score === 'number') {
            is_slow = (score * 100) < 60; // Google skoru 60'ın altındaysa yavaş
          }
        }
      } catch (err) {
        // PageSpeed API zaman aşımına uğrarsa veya hata verirse, kendi ölçümümüzü (duration) kullanırız.
        console.warn("PageSpeed API Hatası, varsayılan hız testine dönüldü.");
      }
    }
    
    const html = await response.text();
    
    // Gerçek bir SEO/UX metrisi:
    const mobile_responsive = html.includes("viewport"); // Eğer viewport meta tag yoksa KESİNLİKLE mobilde patlar.
    
    const detected_socials = {
      instagram: html.includes("instagram.com"),
      facebook: html.includes("facebook.com"),
      linkedin: html.includes("linkedin.com"),
      twitter: html.includes("twitter.com") || html.includes("x.com")
    };

    const has_social_links = Object.values(detected_socials).some(Boolean);

    return {
      status: "active",
      has_ssl,
      mobile_responsive,
      has_social_links,
      is_slow,
      detected_socials
    };
  } catch (error) {
    return {
      status: "error",
      has_ssl: url.startsWith("https"),
      mobile_responsive: false,
      has_social_links: false,
      is_slow: false, // Error olunca hız önemsiz
      detected_socials: {}
    };
  }
}
