import { BaseAgent } from '../core/base.agent';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { IQueueAdapter } from '../interfaces/queue.interface';
import { BusinessRecord } from '../types/business';
import { CONFIG } from '../config';
import { LocalQueueAdapter } from '../adapters/queue.local';
import { GoogleProvider } from '../providers/google.provider';

// Import All Agents
import { CollectorAgent } from './collector.agent';
import { DuplicateAgent } from './duplicate.agent';
import { EnrichmentAgent } from './enrichment.agent';
import { PhoneValidationAgent } from './phone_validation.agent';
import { EmailValidationAgent } from './email_validation.agent';
import { WebsiteIntelligenceAgent } from './website_intel.agent';
import { SocialIntelligenceAgent } from './social_intel.agent';
import { SupplierMatchingAgent } from './supplier_matching.agent';
import { AIOpportunityAgent } from './ai_opportunity.agent';
import { QualityControlAgent } from './quality_control.agent';
import { MasterPoolAgent } from './master_pool.agent';
import { QueryParserAgent } from './query_parser.agent';

export interface ProcessJob {
  place: any;
  city: string;
  district: string;
  category: string;
}

export class OrchestratorAgent extends BaseAgent<void, void> {
  private storage: IStorageAdapter;
  private queue: IQueueAdapter<ProcessJob>;
  
  private collector: CollectorAgent;
  private duplicate: DuplicateAgent;
  private enrichment: EnrichmentAgent;
  private phoneValidator: PhoneValidationAgent;
  private emailValidator: EmailValidationAgent;
  private websiteIntel: WebsiteIntelligenceAgent;
  private socialIntel: SocialIntelligenceAgent;
  private supplierMatch: SupplierMatchingAgent;
  private aiOpportunity: AIOpportunityAgent;
  private qualityControl: QualityControlAgent;
  private masterPool: MasterPoolAgent;
  private queryParser: QueryParserAgent;

  private savedCount = 0;
  
  constructor(storage: IStorageAdapter) {
    super('OrchestratorAgent');
    this.storage = storage;
    this.queue = new LocalQueueAdapter<ProcessJob>();
    
    const googleProvider = new GoogleProvider();
    this.collector = new CollectorAgent([googleProvider]);
    this.duplicate = new DuplicateAgent(storage);
    this.enrichment = new EnrichmentAgent();
    this.phoneValidator = new PhoneValidationAgent();
    this.emailValidator = new EmailValidationAgent();
    this.websiteIntel = new WebsiteIntelligenceAgent();
    this.socialIntel = new SocialIntelligenceAgent();
    this.supplierMatch = new SupplierMatchingAgent();
    this.aiOpportunity = new AIOpportunityAgent();
    this.qualityControl = new QualityControlAgent();
    this.masterPool = new MasterPoolAgent(storage);
    this.queryParser = new QueryParserAgent();
  }

  async execute(customQuery?: string): Promise<void> {
    this.log('Basepound V3 Asynchronous Queue Engine Started');
    this.savedCount = 0;
    let targetCount = 100;
    
    // 1. Queue Seeding (Push all jobs to queue)
    if (customQuery) {
      this.log(`\n\n📌 PARSING CUSTOM QUERY: ${customQuery}`);
      let queries = [customQuery];
      let category = customQuery;

      try {
        const parsed = await this.queryParser.execute(customQuery);
        this.log(`🎯 Parsed successfully! Target Count: ${parsed.targetCount}, Sub-queries: ${parsed.queries.join(', ')}`);
        targetCount = parsed.targetCount;
        queries = parsed.queries;
        category = parsed.category;
      } catch (e: any) {
        this.error('Failed to parse query, using fallback', e.message);
      }

      for (const q of queries) {
        if (this.savedCount >= targetCount) break;
        this.log(`\n\n📌 TARGET SUB-QUERY: ${q}`);
        try {
          const places = await this.collector.execute(q);
          for (const place of places) {
            await this.queue.push({
              place,
              city: "Bilinmiyor", // API'den gelen serbest metin
              district: "Bilinmiyor",
              category: category
            });
          }
        } catch (e: any) {
          this.error(`Target loop failed for: ${q}`, e.message);
        }
      }
    } else {
      for (const cat of CONFIG.CATEGORIES) {
        for (const locale of CONFIG.TARGETS) {
          for (const district of locale.districts) {
            const query = `${district}, ${locale.city} ${cat}`;
            this.log(`\n\n📌 TARGET: ${query}`);
            
            try {
              const places = await this.collector.execute(query);
              for (const place of places) {
                await this.queue.push({
                  place,
                  city: locale.city,
                  district,
                  category: cat
                });
              }
            } catch (e: any) {
              this.error(`Target loop failed: ${query}`, e.message);
            }
          }
        }
      }
    }
    
    const totalJobs = await this.queue.size();
    this.log(`📦 Seeded ${totalJobs} jobs into the queue. Starting workers...`);

    // 2. Queue Processing (Concurrent Batch Processing)
    const CONCURRENCY_LIMIT = 5; // Process 5 jobs at a time

    while ((await this.queue.size()) > 0) {
      if (this.savedCount >= targetCount) {
        this.log(`🎯 TARGET REACHED (${this.savedCount}/${targetCount}). Stopping crawl execution.`);
        break;
      }

      const batch: ProcessJob[] = [];
      for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
        if ((await this.queue.size()) === 0) break;
        const job = await this.queue.pop();
        if (job) batch.push(job);
      }

      if (batch.length === 0) break;

      this.log(`🚀 Processing batch of ${batch.length} jobs concurrently...`);
      
      const promises = batch.map(async (job) => {
        try {
          await this.processJob(job);
        } catch(e: any) {
          this.error(`Job failed for ${job.place.name}`, e.message);
        }
      });

      await Promise.allSettled(promises);
      
      // Rate limiting between batches
      await new Promise(r => setTimeout(r, CONFIG.REQUEST_DELAY_MS));
    }
    
    this.log(`🏁 --- ORCHESTRATOR COMPLETED (Saved: ${this.savedCount}/${targetCount}) ---`);
  }

  private async processJob(job: ProcessJob): Promise<void> {
    const { place, city, district, category } = job;
    this.log(`⚙️ Processing Job: ${place.name}`);

    // 1. First Pass Duplicate
    const earlyDup = await this.duplicate.execute({ business_name: place.name, city });
    if (earlyDup) return;

    // 2. Collect Details
    const details = await this.collector.getDetails(place.place_id, place.source_provider);
    if (!details) return;

    // 3. Second Pass Duplicate
    const webDup = await this.duplicate.execute({ 
      business_name: place.name, city, website: details.website, maps_url: details.url 
    });
    if (webDup) return;

    // 4. Enrichment
    const enriched = await this.enrichment.execute({
      businessName: place.name,
      website: details.website,
      rating: place.rating || 0
    });

    const rawPhone = enriched.phone || details.formatted_phone_number || null;
    const rawEmail = enriched.email || null;

    // 5. Validations
    const validPhone = await this.phoneValidator.execute(rawPhone);
    if (!validPhone && CONFIG.PHONE_REQUIRED) {
      this.log(`❌ SKIPPED (No Valid Phone): ${place.name}`);
      return;
    }

    const validEmail = await this.emailValidator.execute(rawEmail);

    // 6. Third Pass Duplicate (Phone)
    if (validPhone) {
      const phoneDup = await this.duplicate.execute({ business_name: place.name, city, phone: validPhone });
      if (phoneDup) return;
    }

    // 7. Intelligence Agents
    const webIntel = await this.websiteIntel.execute(details.website);
    const socialIntel = await this.socialIntel.execute(enriched.socials);
    const supplierIntel = await this.supplierMatch.execute(category);

    // 8. AI Opportunity
    this.log(`🤖 AI Analyzing: ${place.name}`);
    const aiData = await this.aiOpportunity.execute({
      businessName: place.name,
      category,
      rating: place.rating || 0,
      hasWebsite: webIntel.website_status === 'Active',
      hasSocial: socialIntel.is_active,
      hasEmail: !!validEmail,
      hasPhone: !!validPhone,
      reviewCount: place.user_ratings_total || 0,
      websiteSignals: webIntel.signals || [],
      htmlSnippet: webIntel.html_text_snippet || ""
    });

    // 9. Build Record & Quality Control
    let trustScore = 40;
    if ((place.rating || 0) >= 4.5 && (place.user_ratings_total || 0) > 100) trustScore += 30;
    else if ((place.rating || 0) >= 4.0) trustScore += 15;
    if (validEmail) trustScore += 10;
    if (socialIntel.is_active) trustScore += 10;
    trustScore = Math.min(100, trustScore);

    const businessRecord: BusinessRecord = {
      id: crypto.randomUUID(),
      country: 'TR',
      city,
      district,
      business_name: place.name,
      category,
      phone: validPhone!,
      email: validEmail,
      website: details.website || null,
      maps_url: details.url || null,
      instagram: enriched.socials.instagram,
      facebook: enriched.socials.facebook,
      twitter_x: enriched.socials.twitter,
      linkedin: enriched.socials.linkedin,
      tiktok: null,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      trust_score: trustScore,
      ai_score: aiData.ai_score,
      opportunity_analysis: aiData.opportunity_analysis,
      ai_activity: socialIntel.is_active ? 'Active on ' + socialIntel.primary_network : null,
      sales_readiness: aiData.sales_readiness,
      purchase_intent: aiData.purchase_intent,
      why_now: aiData.why_now,
      recommended_services: aiData.recommended_services.concat([supplierIntel.primary_supplier_type]),
      source_used: [place.source_provider || "Google Maps", "AI", "Web Scraper"],
      confidence_score: aiData.confidence_score,
      signals: aiData.signals,
      is_premium: trustScore >= CONFIG.PREMIUM_TRUST_SCORE_MIN && aiData.ai_score >= CONFIG.PREMIUM_AI_SCORE_MIN,
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date()
    };

    const isQuality = await this.qualityControl.execute(businessRecord);
    if (!isQuality) {
      this.log(`❌ QA Failed: ${place.name}`);
      return;
    }
    
    businessRecord.status = 'APPROVED';

    // 10. Master Pool Agent
    await this.masterPool.execute(businessRecord);
    this.savedCount++;
    this.log(`📈 Saved count updated: ${this.savedCount}`);
  }
}
