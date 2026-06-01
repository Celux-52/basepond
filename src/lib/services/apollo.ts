export interface ApolloEnrichmentData {
  website_url?: string;
  phone?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  primary_email?: string;
  estimated_employees?: number;
  industry?: string;
}

const APOLLO_API_KEY = process.env.APOLLO_API_KEY || "";

export async function searchApolloByName(companyName: string, city: string): Promise<ApolloEnrichmentData> {
  if (!APOLLO_API_KEY) {
    return mockApolloEnrichment();
  }

  const url = `https://api.apollo.io/v1/organizations/search`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "api-key": APOLLO_API_KEY
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        organization_locations: [city, "Turkey"]
      })
    });

    const data = await response.json();

    if (!data.organizations || data.organizations.length === 0) {
      return {};
    }

    // Get the best match (first one)
    const org = data.organizations[0];
    return {
      website_url: org.website_url || org.primary_domain ? `https://${org.primary_domain}` : undefined,
      phone: org.primary_phone?.number,
      linkedin_url: org.linkedin_url,
      facebook_url: org.facebook_url,
      twitter_url: org.twitter_url,
      primary_email: org.primary_email,
      estimated_employees: org.estimated_num_employees,
      industry: org.industry
    };
  } catch (error) {
    console.error(`Apollo Search Error for ${companyName}:`, error);
    return {};
  }
}

export async function enrichCompanyData(websiteUrl: string | undefined, companyName: string): Promise<ApolloEnrichmentData> {
  if (!APOLLO_API_KEY) {
    return mockApolloEnrichment();
  }

  // If no website, fallback to search by name immediately
  if (!websiteUrl) {
    return searchApolloByName(companyName, "Turkey");
  }

  let domain = "";
  try {
    domain = new URL(websiteUrl).hostname.replace("www.", "");
  } catch (e) {
    return searchApolloByName(companyName, "Turkey");
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
      // Fallback to name search if enrich fails
      return searchApolloByName(companyName, "Turkey");
    }

    const org = data.organization;
    return {
      website_url: org.website_url || (org.primary_domain ? `https://${org.primary_domain}` : undefined),
      phone: org.primary_phone?.number,
      linkedin_url: org.linkedin_url,
      facebook_url: org.facebook_url,
      twitter_url: org.twitter_url,
      primary_email: org.primary_email,
      estimated_employees: org.estimated_num_employees,
      industry: org.industry
    };
  } catch (error) {
    console.error(`Apollo Enrichment Error for ${domain}:`, error);
    return searchApolloByName(companyName, "Turkey");
  }
}

// --- MOCK DATA ---
function mockApolloEnrichment(): ApolloEnrichmentData {
  return {
    website_url: "https://mockcompany.com",
    phone: "+905551234567",
    linkedin_url: "https://linkedin.com/company/mock",
    facebook_url: "https://facebook.com/mock",
    twitter_url: "https://twitter.com/mock",
    primary_email: "contact@mockcompany.com",
    estimated_employees: 15,
    industry: "Local Business"
  };
}
