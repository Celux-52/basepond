import { BaseAgent } from '../core/base.agent';
import { scrapeBusinessWebsite } from '../../lib/services/native-scraper';
import { enrichCompanyData } from '../../lib/services/apollo';

export interface EnrichmentInput {
  businessName: string;
  website: string | null;
  rating: number;
}

export interface EnrichmentOutput {
  phone: string | null;
  email: string | null;
  socials: {
    instagram: string | null;
    facebook: string | null;
    linkedin: string | null;
    twitter: string | null;
  };
}

export class EnrichmentAgent extends BaseAgent<EnrichmentInput, EnrichmentOutput> {
  constructor() {
    super('EnrichmentAgent');
  }

  async execute(input: EnrichmentInput): Promise<EnrichmentOutput> {
    const output: EnrichmentOutput = {
      phone: null,
      email: null,
      socials: { instagram: null, facebook: null, linkedin: null, twitter: null }
    };

    if (!input.website || input.website === 'Yok') return output;

    // 1. Native Scraping
    try {
      this.log(`🌐 Scraping website: ${input.website}`);
      const nativeData = await scrapeBusinessWebsite(input.website);
      
      if (nativeData.phones?.length > 0) output.phone = nativeData.phones[0];
      if (nativeData.emails?.length > 0) output.email = nativeData.emails[0];
      
      if (nativeData.socials) {
        output.socials.instagram = nativeData.socials.instagram || null;
        output.socials.facebook = nativeData.socials.facebook || null;
        output.socials.linkedin = nativeData.socials.linkedin || null;
        output.socials.twitter = nativeData.socials.twitter || null;
      }
    } catch (e) {
      this.log(`Scraping failed for ${input.website}`);
    }

    // 2. Apollo Enrichment (only if rating > 4.0 and email is still missing)
    if (!output.email && input.rating >= 4.0) {
      try {
        this.log(`🚀 Apollo enriching: ${input.businessName}`);
        const apollo = await enrichCompanyData(input.website, input.businessName);
        if (apollo.phone && !output.phone) output.phone = apollo.phone;
        if (apollo.primary_email && !output.email) output.email = apollo.primary_email;
      } catch (e) {}
    }

    return output;
  }
}
