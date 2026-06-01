import { BaseAgent } from '../interfaces/agent.interface';
import { QueueTask } from '../interfaces/queue.interface';

// Not: Gerçek projede Apollo veya Google Maps API entegrasyonu kullanılır.
// Bu crawler yapısı, mimari kurallara uygun olarak "source_records" tablosuna RAW data yazar.
export class CrawlerAgent implements BaseAgent {
  name = 'CrawlerAgent';
  status: 'idle' | 'running' | 'error' = 'idle';

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized.`);
  }

  async processTask(task: QueueTask): Promise<any> {
    this.status = 'running';
    try {
      console.log(`[${this.name}] Processing task:`, task.id);
      
      const { region, sector, crawlJobId } = task.payload;

      // TODO: Replace with real Google Maps / Apollo API call.
      // Mocked data fetching simulation:
      const rawLeads = this.simulateGoogleMapsSearch(region, sector);

      // We return these to the lifecycle orchestrator which will insert them into source_records
      return {
        success: true,
        source: 'google_maps',
        source_query: `${region} ${sector}`,
        crawl_job_id: crawlJobId,
        fetched_count: rawLeads.length,
        raw_data: rawLeads
      };

    } catch (error: any) {
      this.status = 'error';
      throw new Error(`Crawl failed: ${error.message}`);
    } finally {
      if (this.status !== 'error') this.status = 'idle';
    }
  }

  private simulateGoogleMapsSearch(region: string, sector: string) {
    return [
      {
        place_id: `mock-place-${Date.now()}-1`,
        business_name: `Örnek ${sector} 1`,
        address: `${region} Merkez`,
        phone: '+905551112233',
        website: 'https://example1.com'
      },
      {
        place_id: `mock-place-${Date.now()}-2`,
        business_name: `Örnek ${sector} 2`,
        address: `${region} Şube`,
        phone: '+905559998877',
        website: null
      }
    ];
  }
}
