export interface ApolloEnrichmentData {
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  primary_email?: string;
  estimated_employees?: number;
  industry?: string;
}

const APOLLO_API_KEY = process.env.APOLLO_API_KEY || "";

export async function enrichCompanyData(websiteUrl: string | undefined, companyName: string): Promise<ApolloEnrichmentData> {
  if (!APOLLO_API_KEY) {
    return mockApolloEnrichment();
  }

  // If no website, enrichment is much harder, but we can try domain search if possible.
  // For MVP, we require a website domain for Apollo to work effectively.
  if (!websiteUrl) {
    return {};
  }

  let domain = "";
  try {
    domain = new URL(websiteUrl).hostname.replace("www.", "");
  } catch (e) {
    return {};
  }

  const url = `https://api.apollo.io/v1/organizations/enrich?domain=${domain}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "api-key": APOLLO_API_KEY
      }
    });

    const data = await response.json();

    if (!data.organization) {
      return {};
    }

    const org = data.organization;
    return {
      linkedin_url: org.linkedin_url,
      facebook_url: org.facebook_url,
      twitter_url: org.twitter_url,
      primary_email: org.primary_email,
      estimated_employees: org.estimated_num_employees,
      industry: org.industry
    };
  } catch (error) {
    console.error(`Apollo Enrichment Error for ${domain}:`, error);
    return {};
  }
}

// --- MOCK DATA ---
function mockApolloEnrichment(): ApolloEnrichmentData {
  return {
    linkedin_url: "https://linkedin.com/company/mock",
    facebook_url: "https://facebook.com/mock",
    twitter_url: "https://twitter.com/mock",
    primary_email: "contact@mockcompany.com",
    estimated_employees: 15,
    industry: "Local Business"
  };
}
