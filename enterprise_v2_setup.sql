-- SnapLead Enterprise V2: Devasa Veritabanı Genişletmesi
-- Bu SQL kodunu Supabase Dashboard > SQL Editor kısmına yapıştırıp RUN (Çalıştır) butonuna basın.

ALTER TABLE public.leads 
-- İletişim ve Sosyal Medya
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS linkedin_company TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,

-- Web Sitesi Analizi ve SEO Metrikleri
ADD COLUMN IF NOT EXISTS has_website BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seo_score INTEGER,
ADD COLUMN IF NOT EXISTS ssl_status BOOLEAN,
ADD COLUMN IF NOT EXISTS mobile_responsive BOOLEAN,
ADD COLUMN IF NOT EXISTS site_speed TEXT,

-- İşletme ve Google Haritalar Verileri
ADD COLUMN IF NOT EXISTS google_rating NUMERIC,
ADD COLUMN IF NOT EXISTS review_count INTEGER,
ADD COLUMN IF NOT EXISTS business_hours TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,

-- AI Fırsat Analizi
ADD COLUMN IF NOT EXISTS opportunity_type TEXT,
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;

-- Not: score ve status sütunlarımız zaten var.
