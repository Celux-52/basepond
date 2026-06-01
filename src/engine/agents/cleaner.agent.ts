import { BaseAgent } from '../core/base.agent';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { PhoneValidationAgent } from './phone_validation.agent';
import { AIOpportunityAgent } from './ai_opportunity.agent';
import { SocialIntelligenceAgent } from './social_intel.agent';
import { WebsiteIntelligenceAgent } from './website_intel.agent';
import { SupplierMatchingAgent } from './supplier_matching.agent';
import { CONFIG } from '../config';

export class DatabaseCleanerAgent extends BaseAgent<void, void> {
  private storage: IStorageAdapter;
  private phoneAgent: PhoneValidationAgent;
  private aiAgent: AIOpportunityAgent;
  private socialAgent: SocialIntelligenceAgent;
  private webAgent: WebsiteIntelligenceAgent;
  private supplierAgent: SupplierMatchingAgent;

  constructor(storage: IStorageAdapter) {
    super('DatabaseCleanerAgent');
    this.storage = storage;
    this.phoneAgent = new PhoneValidationAgent();
    this.aiAgent = new AIOpportunityAgent();
    this.socialAgent = new SocialIntelligenceAgent();
    this.webAgent = new WebsiteIntelligenceAgent();
    this.supplierAgent = new SupplierMatchingAgent();
  }

  async execute(): Promise<void> {
    this.log('🧽 Starting Database Cleanup & Enrichment...');
    
    const allLeads = await this.storage.getAllLeads();
    this.log(`Found ${allLeads.length} total records to check.`);

    let deleted = 0;
    let aiAdded = 0;
    let updated = 0;

    for (const lead of allLeads) {
      // 1. Phone Validation
      const validPhone = await this.phoneAgent.execute(lead.phone);
      if (!validPhone) {
        this.log(`🗑️ Deleting invalid record: ${lead.business_name} (Phone: ${lead.phone})`);
        await this.storage.deleteBusiness(lead.id);
        deleted++;
        continue; // Skip further processing
      }

      let needsUpdate = false;
      const updateData: any = {};

      // 2. Fix Phone format if needed
      if (lead.phone !== validPhone) {
        updateData.phone = validPhone;
        needsUpdate = true;
      }

      // 3. AI Analysis Check
      const hasAnalysis = lead.business_analysis && lead.business_analysis.length > 0;
      
      let finalAiScore = lead.ai_score || 0;
      let finalTrustScore = lead.trust_score || 40;

      if (!hasAnalysis) {
        this.log(`🤖 Generating missing AI analysis for: ${lead.business_name}`);
        
        // Use new intelligences
        const webIntel = await this.webAgent.execute(lead.website);
        const socialIntel = await this.socialAgent.execute({
          instagram: lead.instagram,
          facebook: lead.facebook,
          tiktok: lead.tiktok
        });
        const supplierIntel = await this.supplierAgent.execute(lead.category);

        const aiData = await this.aiAgent.execute({
          businessName: lead.business_name,
          category: lead.category,
          rating: lead.rating || 0,
          hasWebsite: webIntel.website_status === 'Active',
          hasSocial: socialIntel.is_active,
          hasEmail: !!lead.email
        });

        await this.storage.upsertAnalysis(lead.id, {
          ai_score: aiData.ai_score,
          opportunity_reason: aiData.opportunity_analysis,
          seo_score: webIntel.seo_score,
          mobile_score: webIntel.mobile_score,
          social_score: socialIntel.social_score
        });



        finalAiScore = aiData.ai_score;
        needsUpdate = true;
        aiAdded++;
      } else {
        finalAiScore = lead.business_analysis[0].ai_score || finalAiScore;
      }

      // 5. Save updates
      if (Object.keys(updateData).length > 0) {
        this.log(`💾 Updating record: ${lead.business_name}`);
        await this.storage.updateBusiness(lead.id, updateData);
        updated++;
      }
      
      // Throttle to avoid rate limits
      if (!hasAnalysis) {
        await new Promise(r => setTimeout(r, CONFIG.REQUEST_DELAY_MS));
      }
    }

    this.log('🏁 --- CLEANUP COMPLETED ---');
    this.log(`🗑️ Deleted Fake/Invalid: ${deleted}`);
    this.log(`🤖 AI Analysis Added: ${aiAdded}`);
    this.log(`💾 Total Records Updated: ${updated}`);
  }
}
