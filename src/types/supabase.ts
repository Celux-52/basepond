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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          credits: number
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          credits?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          credits?: number
          created_at?: string
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
        Returns: undefined
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
