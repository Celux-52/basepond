export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      crawl_jobs: {
        Row: {
          id: string
          user_id: string
          search_query: string
          city: string
          category: string
          status: string
          discovered_count: number
          processed_count: number
          success_count: number
          failed_count: number
          created_at: string
          updated_at: string
          error_message: string | null
          last_processed_token: string | null
        }
        Insert: {
          id?: string
          user_id: string
          search_query: string
          city: string
          category: string
          status?: string
          discovered_count?: number
          processed_count?: number
          success_count?: number
          failed_count?: number
          created_at?: string
          updated_at?: string
          error_message?: string | null
          last_processed_token?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          search_query?: string
          city?: string
          category?: string
          status?: string
          discovered_count?: number
          processed_count?: number
          success_count?: number
          failed_count?: number
          created_at?: string
          updated_at?: string
          error_message?: string | null
          last_processed_token?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          credits: number
          created_at: string
          has_purchased: boolean
          trial_ends_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          credits?: number
          created_at?: string
          has_purchased?: boolean
          trial_ends_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          credits?: number
          created_at?: string
          has_purchased?: boolean
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_businesses: {
        Row: {
          id: string
          user_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      businesses: {
        Row: {
          id: string
          business_name: string
          category: string
          city: string
          country: string
          phone: string | null
          email: string | null
          website: string | null
          instagram: string | null
          linkedin: string | null
          facebook: string | null
          twitter: string | null
          tiktok: string | null
          maps_url: string | null
          rating: number | null
          review_count: number | null
          trust_score: number | null
          data_freshness: number | null
          is_dead: boolean | null
          district: string | null
          crawl_job_id: string | null
          claimed_by: string | null
          claimed_at: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          category: string
          city: string
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          linkedin?: string | null
          facebook?: string | null
          twitter?: string | null
          tiktok?: string | null
          maps_url?: string | null
          rating?: number | null
          review_count?: number | null
          trust_score?: number | null
          data_freshness?: number | null
          is_dead?: boolean | null
          district?: string | null
          crawl_job_id?: string | null
          claimed_by?: string | null
          claimed_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          category?: string
          city?: string
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          linkedin?: string | null
          facebook?: string | null
          twitter?: string | null
          tiktok?: string | null
          maps_url?: string | null
          rating?: number | null
          review_count?: number | null
          trust_score?: number | null
          data_freshness?: number | null
          is_dead?: boolean | null
          district?: string | null
          crawl_job_id?: string | null
          claimed_by?: string | null
          claimed_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_analysis: {
        Row: {
          business_id: string
          ai_score: number | null
          seo_score: number | null
          mobile_score: number | null
          social_score: number | null
          opportunity_reason: string | null
          website_status: string | null
          growth_potential: string | null
          has_ssl: boolean | null
          mobile_responsive: boolean | null
          has_social_links: boolean | null
          urgency_score: number | null
          sales_readiness: number | null
          buy_intent: string | null
          why_now_signals: string[] | null
          updated_at: string
        }
        Insert: {
          business_id: string
          ai_score?: number | null
          seo_score?: number | null
          mobile_score?: number | null
          social_score?: number | null
          opportunity_reason?: string | null
          website_status?: string | null
          growth_potential?: string | null
          has_ssl?: boolean | null
          mobile_responsive?: boolean | null
          has_social_links?: boolean | null
          urgency_score?: number | null
          sales_readiness?: number | null
          buy_intent?: string | null
          why_now_signals?: string[] | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          ai_score?: number | null
          seo_score?: number | null
          mobile_score?: number | null
          social_score?: number | null
          opportunity_reason?: string | null
          website_status?: string | null
          growth_potential?: string | null
          has_ssl?: boolean | null
          mobile_responsive?: boolean | null
          has_social_links?: boolean | null
          urgency_score?: number | null
          sales_readiness?: number | null
          buy_intent?: string | null
          why_now_signals?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_analysis_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      searches: {
        Row: {
          id: string
          user_id: string
          search_query: string | null
          city: string
          category: string
          requested_amount: number | null
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          search_query?: string | null
          city: string
          category: string
          requested_amount?: number | null
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          search_query?: string | null
          city?: string
          category?: string
          requested_amount?: number | null
          credits_used?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cache_system: {
        Row: {
          business_id: string
          last_checked_at: string
          needs_update: boolean
        }
        Insert: {
          business_id: string
          last_checked_at?: string
          needs_update?: boolean
        }
        Update: {
          business_id?: string
          last_checked_at?: string
          needs_update?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cache_system_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      user_lead_status: {
        Row: {
          id: string
          user_id: string
          business_id: string
          is_unlocked: boolean
          status: string
          unlocked_at: string | null
          pipeline_stage: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          is_unlocked?: boolean
          status?: string
          unlocked_at?: string | null
          pipeline_stage?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          is_unlocked?: boolean
          status?: string
          unlocked_at?: string | null
          pipeline_stage?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lead_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lead_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_credits: {
        Args: {
          user_id_param: string
          amount: number
        }
        Returns: boolean
      }
      unlock_lead_phone: {
        Args: {
          p_business_id: string
        }
        Returns: { success: boolean; message: string; phone?: string; }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
