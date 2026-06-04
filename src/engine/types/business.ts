export interface BusinessRecord {
  id: string; // UUID
  country: string; // Global expansion: TR, US, UK, etc.
  locale?: string;
  city: string;
  district: string;
  
  business_name: string;
  category: string;
  
  phone: string;
  email: string | null;
  website: string | null;
  maps_url: string | null;
  
  // Social
  instagram: string | null;
  facebook: string | null;
  twitter_x: string | null;
  linkedin: string | null;
  tiktok: string | null;
  
  // Quality
  rating: number;
  review_count: number;
  trust_score: number;
  
  // AI Analysis
  ai_score: number;
  opportunity_analysis: string | null;
  ai_activity: string | null;
  sales_readiness: number;
  purchase_intent: 'High' | 'Medium' | 'Low' | null;
  why_now: string | null;
  recommended_services: string[];
  source_used: string[];
  confidence_score: number;
  signals?: string[];
  
  // Metadata
  is_premium: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  
  // Re-Enrichment Tracking
  last_checked_at?: Date;
  next_refresh_at?: Date;
  enrichment_version?: string;

  rejection_reason?: string;

  // Dashboard-injected fields (from server actions)
  is_unlocked?: boolean;
  is_stolen?: boolean;
  claimed_by?: string | null;
  claimed_at?: string | null;
  quality_tier?: string;
  opportunity_reasons?: string[];
  
  created_at: Date;
  updated_at: Date;
}

export interface BusinessHistory {
  id: string;
  business_id: string;
  changed_field: string;
  old_value: string;
  new_value: string;
  changed_at: Date;
}

export interface BusinessAnalysis {
  id?: string;
  business_id: string;
  ai_score: number;
  opportunity_reasons?: string[]; // Standardized JSON array
  recommended_services?: string[]; // Standardized JSON array
  quality_tier?: 'A' | 'B' | 'C';
  seo_score?: number;
  mobile_score?: number;
  social_score?: number;
  sales_readiness?: string; // e.g. "Yüksek"
  buy_intent?: string; // e.g. "High"
  why_now_signals?: string[];
  signals?: string[];
  urgency_score?: number;
  growth_potential?: string;
  website_status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface BusinessSnapshot {
  id: string;
  business_id: string;
  snapshot_data: any;
  enrichment_version: string;
  taken_at: Date;
}

export interface SupplierRecord {
  id: string;
  supplier_name: string;
  sector: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  coverage_area: string | null;
  created_at: Date;
  updated_at: Date;
}

// Partial update model
export type BusinessUpdate = Partial<Omit<BusinessRecord, 'id' | 'created_at'>>;
