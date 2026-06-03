export interface WebsiteAnalysis {
  status: "active" | "error" | "no_website";
  has_ssl: boolean;
  mobile_responsive: boolean;
  has_social_links: boolean;
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
      detected_socials: {}
    };
  }

  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    
    // GÜVENLİK (Rezil Olmamak İçin): SSL ve Mobil Uyum testleri basit bir fetch ile %100 doğrulanamaz.
    // Eğer bunlara false dersek ve yapay zeka müşteriyi eleştirirse, müşteri kanıt sunduğunda rezil oluruz.
    // Bu yüzden yapay zekanın bu konularda "eminmiş gibi" atıp tutmasını engellemek için varsayılan olarak TRUE gönderiyoruz.
    const has_ssl = true; 
    const mobile_responsive = true;

    // We do a simple GET request with a short timeout to see if it's alive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(formattedUrl, { 
      signal: controller.signal,
      headers: { "User-Agent": "Basepound-Analyzer/1.0" }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Not OK");
    }

    const html = await response.text();
    
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
      detected_socials
    };
  } catch (error) {
    return {
      status: "error",
      has_ssl: url.startsWith("https"),
      mobile_responsive: false,
      has_social_links: false,
      detected_socials: {}
    };
  }
}
