import { BaseAgent } from '../core/base.agent';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { BusinessRecord } from '../types/business';

export interface DuplicateInput {
  phone?: string | null;
  website?: string | null;
  business_name: string;
  city: string;
  maps_url?: string | null;
}

export class DuplicateAgent extends BaseAgent<DuplicateInput, BusinessRecord | null> {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter) {
    super('DuplicateAgent');
    this.storage = storage;
  }

  async execute(input: DuplicateInput): Promise<BusinessRecord | null> {
    // 1. Phone Match (Strongest)
    if (input.phone) {
      const byPhone = await this.storage.findByPhone(input.phone);
      if (byPhone) {
        this.log(`Duplicate found by Phone: ${input.phone}`);
        return byPhone;
      }
    }

    // 2. Website Match
    if (input.website && input.website !== 'Yok') {
      const byWeb = await this.storage.findByWebsite(input.website);
      if (byWeb) {
        this.log(`Duplicate found by Website: ${input.website}`);
        return byWeb;
      }
    }

    // 3. Maps URL Match
    if (input.maps_url) {
      const byMaps = await this.storage.findByMapsUrl(input.maps_url);
      if (byMaps) {
        this.log(`Duplicate found by Maps URL`);
        return byMaps;
      }
    }

    // 4. Name + City Match
    const byName = await this.storage.findByNameAndCity(input.business_name, input.city);
    if (byName) {
      this.log(`Duplicate found by Name + City: ${input.business_name} in ${input.city}`);
      return byName;
    }

    return null; // No duplicate found
  }
}
