import { BaseAgent } from '../core/base.agent';
import { IDataProvider } from '../interfaces/provider.interface';
import { CONFIG } from '../config';

export class CollectorAgent extends BaseAgent<string, any[]> {
  private providers: IDataProvider[];

  constructor(providers: IDataProvider[]) {
    super('CollectorAgent');
    this.providers = providers;
  }

  async execute(query: string): Promise<any[]> {
    this.log(`Collecting data for query: ${query}`);
    let allResults: any[] = [];

    for (const provider of this.providers) {
      try {
        const places = await provider.search(query, CONFIG.GOOGLE_MAPS_MAX_RESULTS);
        this.log(`Collected ${places.length} raw results from ${provider.name}.`);
        
        // Tag with provider name for future reference
        places.forEach((p: any) => p.source_provider = provider.name);
        allResults = allResults.concat(places);
      } catch (e: any) {
        this.error(`Failed to collect data from ${provider.name} for ${query}`, e.message);
      }
    }

    return allResults;
  }

  async getDetails(placeId: string, providerName: string = 'GoogleMaps'): Promise<any> {
    const provider = this.providers.find(p => p.name === providerName);
    if (!provider) return null;
    return await provider.getDetails(placeId);
  }
}
