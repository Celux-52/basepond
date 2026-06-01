import { BaseAgent } from '../interfaces/agent.interface';
import { QueueTask } from '../interfaces/queue.interface';
import { createClient } from '@supabase/supabase-js';
import { CrawlerAgent } from './crawler.agent';

export class LifecycleOrchestratorAgent implements BaseAgent {
  name = 'LifecycleOrchestratorAgent';
  status: 'idle' | 'running' | 'error' = 'idle';
  private supabase: any;
  private crawler: CrawlerAgent;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.crawler = new CrawlerAgent();
  }

  async initialize(): Promise<void> {
    await this.crawler.initialize();
    console.log(`[${this.name}] Initialized.`);
  }

  // This handles a full CRON or ON_DEMAND crawl job
  async processTask(task: QueueTask): Promise<any> {
    this.status = 'running';
    const jobId = task.payload.crawlJobId;

    try {
      // 1. Update Job Status -> Fetching
      await this.updateJobStatus(jobId, 'fetching');

      // 2. Run Crawler
      const crawlRes = await this.crawler.processTask(task);
      
      // Save RAW records
      await this.saveRawRecords(crawlRes);
      await this.updateJobCounters(jobId, { fetched_count: crawlRes.fetched_count });

      // 3. Update Job Status -> Verifying
      await this.updateJobStatus(jobId, 'verifying');
      const verifiedCount = await this.verifyRecords(jobId);
      await this.updateJobCounters(jobId, { verified_count: verifiedCount });

      // 4. Update Job Status -> Analyzing
      await this.updateJobStatus(jobId, 'analyzing');
      const analyzedCount = await this.analyzeRecords(jobId);
      await this.updateJobCounters(jobId, { analyzed_count: analyzedCount });

      // 5. Update Job Status -> Publishing
      await this.updateJobStatus(jobId, 'publishing');
      const publishedCount = await this.publishRecords(jobId);
      await this.updateJobCounters(jobId, { published_count: publishedCount });

      // 6. Complete
      await this.updateJobStatus(jobId, 'completed');
      return { success: true, publishedCount };

    } catch (error: any) {
      this.status = 'error';
      await this.updateJobStatus(jobId, 'failed', error.message);
      throw error;
    } finally {
      if (this.status !== 'error') this.status = 'idle';
    }
  }

  private async updateJobStatus(jobId: string, status: string, errorMsg?: string) {
    const updatePayload: any = { status };
    if (status === 'completed' || status === 'failed') updatePayload.finished_at = new Date().toISOString();
    if (status === 'fetching') updatePayload.started_at = new Date().toISOString();
    if (errorMsg) updatePayload.error_message = errorMsg;

    await this.supabase.from('crawl_jobs').update(updatePayload).eq('id', jobId);
  }

  private async updateJobCounters(jobId: string, counters: any) {
    // In production this should be a DB function to avoid race conditions, but simple update is fine here
    await this.supabase.from('crawl_jobs').update(counters).eq('id', jobId);
  }

  private async saveRawRecords(crawlRes: any) {
    const inserts = crawlRes.raw_data.map((r: any) => ({
      crawl_job_id: crawlRes.crawl_job_id,
      source: crawlRes.source,
      source_query: crawlRes.source_query,
      place_id: r.place_id,
      domain: r.website,
      phone: r.phone,
      raw_data: r,
      status: 'raw',
      last_fetched_at: new Date().toISOString()
    }));
    await this.supabase.from('source_records').insert(inserts);
  }

  private async verifyRecords(jobId: string) {
    // Basic deduplication logic
    const { data: records } = await this.supabase
      .from('source_records')
      .select('*')
      .eq('crawl_job_id', jobId)
      .eq('status', 'raw');

    if (!records) return 0;
    
    let verified = 0;
    let duplicate = 0;

    for (const r of records) {
      // Check if place_id exists in published businesses or old source_records
      const { data: existing } = await this.supabase
        .from('source_records')
        .select('id')
        .eq('place_id', r.place_id)
        .neq('id', r.id)
        .limit(1);

      if (existing && existing.length > 0) {
        await this.supabase.from('source_records').update({ status: 'duplicate' }).eq('id', r.id);
        duplicate++;
      } else {
        await this.supabase.from('source_records').update({ status: 'verified', last_verified_at: new Date().toISOString() }).eq('id', r.id);
        verified++;
      }
    }
    
    if (duplicate > 0) await this.updateJobCounters(jobId, { duplicate_count: duplicate });
    return verified;
  }

  private async analyzeRecords(jobId: string) {
    // Fake AI analysis step
    const { data: records } = await this.supabase
      .from('source_records')
      .select('*')
      .eq('crawl_job_id', jobId)
      .eq('status', 'verified');
    
    if (!records) return 0;

    for (const r of records) {
      await this.supabase.from('source_records').update({ 
        status: 'analyzed',
        last_analyzed_at: new Date().toISOString() 
      }).eq('id', r.id);
    }
    return records.length;
  }

  private async publishRecords(jobId: string) {
    const { data: records } = await this.supabase
      .from('source_records')
      .select('*')
      .eq('crawl_job_id', jobId)
      .eq('status', 'analyzed');
    
    if (!records) return 0;

    for (const r of records) {
      // 1. Insert to businesses
      const { data: biz } = await this.supabase.from('businesses').insert({
        business_name: r.raw_data.business_name,
        category: r.raw_data.category || 'Bilinmiyor',
        city: r.raw_data.address, // simple mapping for demo
        phone: r.phone,
        website: r.domain,
        source_record_id: r.id,
        crawl_job_id: r.crawl_job_id,
        status: 'published'
      }).select().single();

      // 2. Insert to business_analysis
      if (biz) {
         await this.supabase.from('business_analysis').insert({
           business_id: biz.id,
           ai_score: 85, // fake AI score
           quality_tier: 'premium',
           opportunity_reasons: ['Yeni kurulmuş', 'Dijital varlığı zayıf'],
           recommended_services: ['Web Tasarım', 'SEO']
         });
      }

      await this.supabase.from('source_records').update({ status: 'published' }).eq('id', r.id);
    }
    return records.length;
  }
}
