import { BusinessRecord, BusinessUpdate } from '../types/business';

export interface IStorageAdapter {
  init(): Promise<void>;
  
  // Create / Update / Delete
  upsertBusiness(business: BusinessRecord): Promise<void>;
  updateBusiness(id: string, update: BusinessUpdate): Promise<void>;
  deleteBusiness(id: string): Promise<void>;
  upsertAnalysis(businessId: string, analysis: any): Promise<void>;
  
  // Duplicate Checks
  findByPhone(phone: string): Promise<BusinessRecord | null>;
  findByWebsite(website: string): Promise<BusinessRecord | null>;
  findByNameAndCity(name: string, city: string): Promise<BusinessRecord | null>;
  findByMapsUrl(url: string): Promise<BusinessRecord | null>;
  
  // Queries
  getPremiumLeads(): AsyncGenerator<BusinessRecord[]>;
  getAllLeads(): AsyncGenerator<BusinessRecord[]>;
}
