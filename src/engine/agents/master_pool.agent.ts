import { BaseAgent } from '../core/base.agent';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { BusinessRecord } from '../types/business';

export class MasterPoolAgent extends BaseAgent<BusinessRecord, void> {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter) {
    super('MasterPoolAgent');
    this.storage = storage;
  }

  async execute(business: BusinessRecord): Promise<void> {
    this.log(`Attempting to save to Master Pool: ${business.business_name}`);
    await this.storage.upsertBusiness(business);
    this.log(`Successfully saved: ${business.business_name}`);
  }
}
