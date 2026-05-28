import { GooglePlaceDetails } from "./google-maps";
import { ApolloEnrichmentData } from "./apollo";
import { WebsiteAnalysis } from "./analysis";

export interface AIScoreResult {
  ai_score: number;
  opportunity_reason: string;
  growth_potential: "High" | "Medium" | "Low";
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

export async function generateAIScore(
  business: { name: string; category: string; rating?: number; review_count?: number },
  analysis: WebsiteAnalysis,
  enrichment: ApolloEnrichmentData
): Promise<AIScoreResult> {
  if (!OPENROUTER_API_KEY) {
    return mockAIScore();
  }

  const prompt = `
    Analyze this local business and determine its digital marketing opportunity score (0-100).
    Business Name: ${business.name}
    Category: ${business.category}
    Google Rating: ${business.rating || "N/A"} (${business.review_count || 0} reviews)
    Website Status: ${analysis.status}
    Mobile Responsive: ${analysis.mobile_responsive}
    Has Social Links: ${analysis.has_social_links}
    Enriched Email Found: ${enrichment.primary_email ? "Yes" : "No"}

    Task:
    1. Calculate a score from 0-100. (High score = BIG opportunity for an agency to sell them a website, SEO, or social media management). 
       - No website or broken website = HIGH opportunity.
       - Bad reviews = MEDIUM opportunity.
       - No social links = HIGH opportunity.
    2. Provide a SHORT opportunity_reason (max 10 words, e.g. "outdated website, weak social presence").
    3. Provide growth_potential ("High", "Medium", or "Low").

    Return EXACTLY a JSON string with keys: "ai_score" (number), "opportunity_reason" (string), "growth_potential" (string).
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://snaplead.com", 
        "X-Title": "SnapLead"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // fast, cheap model
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      ai_score: typeof parsed.ai_score === "number" ? parsed.ai_score : 50,
      opportunity_reason: parsed.opportunity_reason || "Needs digital improvement",
      growth_potential: parsed.growth_potential || "Medium"
    };
  } catch (error) {
    console.error("AI Scorer Error:", error);
    return mockAIScore();
  }
}

function mockAIScore(): AIScoreResult {
  return {
    ai_score: Math.floor(Math.random() * 40) + 60, // 60-100
    opportunity_reason: "Website is outdated, needs SEO",
    growth_potential: "High"
  };
}
