import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { BusinessRecord, BusinessUpdate } from '../types/business';
import * as dotenv from 'dotenv';
import path from 'path';

export class SupabaseStorageAdapter implements IStorageAdapter {
  private sb: SupabaseClient;

  constructor() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    this.sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async init(): Promise<void> {
    // Supabase is already initialized
  }

  async upsertBusiness(business: BusinessRecord): Promise<void> {
    // 1. Insert into businesses table
    const { data: newBiz, error: insertError } = await this.sb.from('businesses').insert({
      business_name: business.business_name,
      category: business.category,
      city: `${business.city} (${business.district})`,
      phone: business.phone,
      email: business.email,
      website: business.website || "Yok",
      maps_url: business.maps_url,
      instagram: business.instagram,
      facebook: business.facebook,
      linkedin: business.linkedin,
      twitter: business.twitter_x,
      rating: business.rating,
      review_count: business.review_count
    }).select().single();

    if (insertError) {
      console.error(`[Storage] Hata (businesses):`, insertError.message);
      return;
    }

    // 2. Insert into business_analysis
    const { error: analysisError } = await this.sb.from('business_analysis').insert({
      business_id: newBiz.id,
      ai_score: business.ai_score,
      opportunity_reason: business.opportunity_analysis,
      seo_score: 50,
      mobile_score: 50,
      social_score: 50
    });

    if (analysisError) {
      console.error(`[Storage] Hata (analysis):`, analysisError.message);
    }
  }

  async updateBusiness(id: string, update: BusinessUpdate): Promise<void> {
    const { error } = await this.sb.from('businesses').update(update).eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteBusiness(id: string): Promise<void> {
    const { error } = await this.sb.from('businesses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async upsertAnalysis(businessId: string, analysis: any): Promise<void> {
    // Check if exists
    const { data } = await this.sb.from('business_analysis').select('id').eq('business_id', businessId).maybeSingle();
    
    if (data) {
      await this.sb.from('business_analysis').update(analysis).eq('id', data.id);
    } else {
      await this.sb.from('business_analysis').insert({
        business_id: businessId,
        ...analysis
      });
    }
  }

  async findByPhone(phone: string): Promise<BusinessRecord | null> {
    const { data } = await this.sb.from('businesses').select('*').eq('phone', phone).maybeSingle();
    return data as any;
  }

  async findByWebsite(website: string): Promise<BusinessRecord | null> {
    if (!website || website === 'Yok') return null;
    const { data } = await this.sb.from('businesses').select('*').eq('website', website).maybeSingle();
    return data as any;
  }

  async findByNameAndCity(name: string, city: string): Promise<BusinessRecord | null> {
    const { data } = await this.sb.from('businesses').select('*').eq('business_name', name).like('city', `${city}%`).maybeSingle();
    return data as any;
  }

  async findByMapsUrl(url: string): Promise<BusinessRecord | null> {
    if (!url) return null;
    const { data } = await this.sb.from('businesses').select('*').eq('maps_url', url).maybeSingle();
    return data as any;
  }

  async getPremiumLeads(): Promise<BusinessRecord[]> {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data } = await this.sb.from('businesses')
        .select('*, business_analysis(*)')
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (!data || data.length === 0) break;
      
      const premiums = data.filter((d: any) => {
        const analysis = Array.isArray(d.business_analysis) ? d.business_analysis[0] : d.business_analysis;
        const aiScore = analysis?.ai_score || 0;
        return aiScore >= 70;
      });
      allData = allData.concat(premiums);
      
      if (data.length < pageSize) break;
      page++;
    }
    
    return allData;
  }

  async getAllLeads(): Promise<BusinessRecord[]> {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data } = await this.sb.from('businesses')
        .select('*, business_analysis(*)')
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      
      if (data.length < pageSize) break;
      page++;
    }
    
    return allData;
  }
}
