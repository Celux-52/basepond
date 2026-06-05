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
    // Oncelik hesapla
    const priority = business.ai_score >= 75 ? 'YUKSEK' : (business.ai_score >= 50 ? 'ORTA' : 'DUSUK');
    const potentialService = (!business.website || business.website === 'Yok') ? 'Web Sitesi + SEO' : 'Dijital Pazarlama Paketi';
    const potentialValue = business.ai_score >= 75 ? '500-1000' : (business.ai_score >= 50 ? '250-500' : '100-250');
    const sslStatus = (business.website && business.website.startsWith('https')) ? 'Evet' : 'Hayir';
    const websiteStatus = (business.website && business.website !== 'Yok') ? 'Aktif' : 'Yok';

    // 1. Insert into businesses table - TUM SUTUNLAR
    const { data: newBiz, error: insertError } = await this.sb.from('businesses').insert({
      business_name: business.business_name,
      category: business.category,
      country: business.country || 'TR',
      city: `${business.city} (${business.district})`,
      district: business.district,
      phone: business.phone,
      email: business.email,
      website: business.website || "Yok",
      maps_url: business.maps_url,
      instagram: business.instagram,
      facebook: business.facebook,
      linkedin: business.linkedin,
      twitter: business.twitter_x,
      tiktok: business.tiktok,
      rating: business.rating,
      review_count: business.review_count,
      trust_score: business.trust_score,
      ai_score: business.ai_score,
      opportunity_analysis: business.opportunity_analysis,
      ai_activity: business.ai_activity,
      sales_readiness: business.sales_readiness,
      purchase_intent: business.purchase_intent,
      why_now: business.why_now,
      recommended_services: Array.isArray(business.recommended_services) ? business.recommended_services.join(', ') : null,
      confidence_score: business.confidence_score,
      is_premium: business.is_premium,
      status: business.status || 'APPROVED',
      sync_status: 'PENDING',
      website_status: websiteStatus,
      ssl_status: sslStatus,
      mobile_friendly: 'Bilinmiyor',
      social_score: 0,
      social_activity: business.ai_activity || 'Pasif',
      primary_social_network: business.instagram ? 'Instagram' : (business.facebook ? 'Facebook' : null),
      priority: priority,
      potential_service: potentialService,
      potential_value: potentialValue,
      close_probability: Math.min(business.ai_score || 0, 95),
      contact_person: null,
      contact_position: null,
      notes: null
    }).select().single();

    if (insertError) {
      console.error(`[Storage] Hata (businesses):`, insertError.message);
      return;
    }

    // 2. Insert into business_analysis - TUM ANALIZ VERILERI
    const { error: analysisError } = await this.sb.from('business_analysis').insert({
      business_id: newBiz.id,
      ai_score: business.ai_score,
      opportunity_reason: business.opportunity_analysis,
      seo_score: 50,
      mobile_score: 50,
      social_score: 50,
      sales_readiness: business.sales_readiness,
      purchase_intent: business.purchase_intent,
      why_now: business.why_now,
      recommended_services: Array.isArray(business.recommended_services) ? business.recommended_services.join(', ') : null,
      confidence_score: business.confidence_score,
      website_status: websiteStatus
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

  async *getPremiumLeads(): AsyncGenerator<BusinessRecord[]> {
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

      if (premiums.length > 0) {
        yield premiums;
      }
      
      if (data.length < pageSize) break;
      page++;
    }
  }

  async *getAllLeads(): AsyncGenerator<BusinessRecord[]> {
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data } = await this.sb.from('businesses')
        .select('*, business_analysis(*)')
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (!data || data.length === 0) break;
      
      yield data;
      
      if (data.length < pageSize) break;
      page++;
    }
  }
}
