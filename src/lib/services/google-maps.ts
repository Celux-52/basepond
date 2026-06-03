export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string; // Maps URL
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  address_components?: any[];
}

// NOTE: You need GOOGLE_MAPS_API_KEY in .env
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export async function searchPlaces(query: string, maxResults: number = 20): Promise<GooglePlaceResult[]> {
  if (!GOOGLE_API_KEY) {
    console.warn("GOOGLE_MAPS_API_KEY is not set. Returning mock data.");
    return mockPlacesSearch(query, maxResults);
  }

  const allResults: GooglePlaceResult[] = [];
  const seenPlaceIds = new Set<string>();
  
  // Google'ın 60 limitini aşmak için kelime varyasyonları (Modifiers)
  // Kullanıcı "İstanbul Kuaför" dediğinde 100 istiyorsa, önce sade arar (60 çeker),
  // Sonra yetmezse "İstanbul Kuaför Merkez" diye arar (Kalan 40'ı çeker).
  const queryModifiers = ["", " Merkez", " En İyi", " Yakın", " Popüler", " Premium"];

  for (const modifier of queryModifiers) {
    if (allResults.length >= maxResults) break;

    const currentQuery = query + modifier;
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(currentQuery)}&key=${GOOGLE_API_KEY}`;
    let nextPageToken: string | null = null;
    let hasMorePages = true;

    while (hasMorePages && allResults.length < maxResults) {
      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_API_KEY}`;
        // Google, next_page_token üretildikten sonra aktifleşmesi için 2 saniye beklemeyi zorunlu tutar.
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`Google Maps API HTTP error: ${response.status}`);
          break;
        }

        const data = await response.json();

        // Token bazen geç aktifleşir ve INVALID_REQUEST döner. 
        if (data?.status === "INVALID_REQUEST" && nextPageToken) {
          // Biraz daha bekleyip tekrar denemek daha sağlıklı ama döngüyü bozmamak için şimdilik bir sonraki modifier'a geçiyoruz.
          break;
        }

        if (data?.status !== "OK" && data?.status !== "ZERO_RESULTS") {
          console.warn(`Google Maps API warning: ${data?.status}`);
          break;
        }

        if (data.results && Array.isArray(data.results)) {
          for (const place of data.results) {
            // Çift veri gelmesini Set ile engelliyoruz
            if (!seenPlaceIds.has(place.place_id)) {
              seenPlaceIds.add(place.place_id);
              allResults.push(place);
            }
          }
        }

        if (data.next_page_token) {
          nextPageToken = data.next_page_token;
        } else {
          hasMorePages = false;
          nextPageToken = null;
        }

      } catch (error) {
        console.error("Error searching places:", error);
        break;
      }
    }
  }

  // Kullanıcının tam istediği sayıda (Fazla çekildiyse kırparak) veriyi döndür
  return allResults.slice(0, maxResults);
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_API_KEY) {
    return mockPlaceDetails(placeId);
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,url,rating,user_ratings_total,business_status,address_components&key=${GOOGLE_API_KEY}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Maps API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data?.status !== "OK") {
      throw new Error(`Google Maps API error: ${data?.status}`);
    }

    const result = data?.result || {};
    return {
      place_id: placeId,
      name: result?.name ?? "Bilinmiyor",
      formatted_phone_number: result?.formatted_phone_number ?? undefined,
      website: result?.website ?? undefined,
      url: result?.url ?? undefined,
      rating: result?.rating ?? 0,
      user_ratings_total: result?.user_ratings_total ?? 0,
      business_status: result?.business_status ?? 'UNKNOWN',
      address_components: result?.address_components ?? []
    } as GooglePlaceDetails;
  } catch (error) {
    console.error(`Error fetching details for place ${placeId}:`, error);
    return null;
  }
}

// --- MOCK DATA FOR TESTING WITHOUT API KEY ---
function mockPlacesSearch(query: string, maxResults: number): GooglePlaceResult[] {
  const results = [];
  for (let i = 0; i < maxResults; i++) {
    results.push({
      place_id: `mock_place_${i}`,
      name: `Mock Business ${i} - ${query}`,
      formatted_address: "123 Mock Street, Istanbul",
      rating: 4.5,
      user_ratings_total: 100 + i,
      types: ["establishment"]
    });
  }
  return results;
}

function mockPlaceDetails(placeId: string): GooglePlaceDetails {
  return {
    place_id: placeId,
    name: `Mock Business Detail`,
    formatted_phone_number: "+90 555 123 4567",
    website: "https://example.com",
    url: "https://maps.google.com/?q=mock",
    rating: 4.5,
    user_ratings_total: 150,
    business_status: "OPERATIONAL"
  };
}
