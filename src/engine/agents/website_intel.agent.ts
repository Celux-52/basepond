import { BaseAgent } from '../core/base.agent';

export interface WebsiteOutput {
  website_status: 'Active' | 'Broken' | 'Unknown';
  seo_score: number;
  mobile_score: number;
}

export class WebsiteIntelligenceAgent extends BaseAgent<string | null, WebsiteOutput> {
  constructor() {
    super('WebsiteIntelligenceAgent');
  }

  async execute(website: string | null): Promise<WebsiteOutput> {
    if (!website || website === 'Yok') {
      return { website_status: 'Unknown', seo_score: 0, mobile_score: 0 };
    }

    let status: 'Active' | 'Broken' = 'Active';
    let seo = 50;
    let mobile = 50;

    try {
      // In a real implementation, we would fetch the site and run Lighthouse or similar.
      // Here we just do a simple ping check (mocked for speed in local testing).
      if (website.includes('business.site') || website.includes('wixsite')) {
        seo = 30; // Free builders usually have lower custom SEO
        mobile = 80; // But they are usually mobile friendly
      } else {
        seo = 70;
        mobile = 70;
      }
    } catch (e) {
      status = 'Broken';
      seo = 0;
      mobile = 0;
    }

    return {
      website_status: status,
      seo_score: seo,
      mobile_score: mobile
    };
  }
}
