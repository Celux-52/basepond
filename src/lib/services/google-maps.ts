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

  const encodedQuery = encodeURIComponent(query);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== "OK") {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    return data.results.slice(0, maxResults) as GooglePlaceResult[];
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_API_KEY) {
    return mockPlaceDetails(placeId);
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_phone_number,website,url,rating,user_ratings_total,business_status,address_components&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== "OK") {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    return data.result as GooglePlaceDetails;
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
