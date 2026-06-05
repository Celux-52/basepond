import { BaseAgent } from '../core/base.agent';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { IQueueAdapter } from '../interfaces/queue.interface';
import { BusinessRecord } from '../types/business';
import { ProcessJob } from './orchestrator.agent';

export class ReEnrichmentAgent extends BaseAgent<void, void> {
  private storage: IStorageAdapter;
  private targetQueue: IQueueAdapter<ProcessJob>;

  constructor(storage: IStorageAdapter, queue: IQueueAdapter<ProcessJob>) {
    super('ReEnrichmentAgent');
    this.storage = storage;
    this.targetQueue = queue;
  }

  async execute(): Promise<void> {
    this.log('🔍 Starting Re-Enrichment Scan...');
    
    // In a real DB, we'd do a query: WHERE next_refresh_at <= NOW() OR missing critical fields
    // Here we will fetch all and filter in-memory for the demo.
    const leadGenerator = this.storage.getAllLeads();
    
    let reQueuedCount = 0;
    const now = new Date();

    for await (const chunk of leadGenerator) {
      for (const lead of chunk) {
      let needsRefresh = false;

      // 1. Check time-based refresh
      if (lead.next_refresh_at && new Date(lead.next_refresh_at) <= now) {
        needsRefresh = true;
      }
      
      // 2. Check missing intelligence
      if (!lead.website || lead.website === "Yok" || !(lead as any).business_analysis || (lead as any).business_analysis.length === 0) {
        needsRefresh = true;
      }

      if (needsRefresh) {
        this.log(`♻️ Queuing for re-enrichment: ${lead.business_name}`);
        await this.targetQueue.push({
          place: {
            name: lead.business_name,
            place_id: '', // Would need mapping
            source_provider: 'ReEnrichment'
          },
          city: lead.city,
          district: lead.district,
          category: lead.category
        });
        reQueuedCount++;
      }
      } // End of inner loop
    } // End of generator loop

    this.log(`🏁 Re-Enrichment Scan Completed. Queued ${reQueuedCount} jobs.`);
  }
}
