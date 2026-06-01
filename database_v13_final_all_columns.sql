-- ============================================
-- BASEPOND FINAL DATABASE - TUM KOLONLAR
-- Bu SQL'i Supabase SQL Editor'de calistirin
-- Mevcut verilere zarar VERMEZ, sadece eksik sutunlari ekler
-- ============================================

-- 1. UUID eklentisi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ana Isletmeler Tablosu (yoksa olusturur)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    category TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    maps_url TEXT,
    instagram TEXT,
    facebook TEXT,
    linkedin TEXT,
    twitter TEXT,
    rating NUMERIC,
    review_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Eksik sutunlari akillica ekliyoruz (varsa atlar, yoksa ekler)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'TR';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS trust_score NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS ai_score NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS opportunity_analysis TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS ai_activity TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS sales_readiness TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS purchase_intent TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS why_now TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS recommended_services TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'APPROVED';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'PENDING';

-- Website intelligence sutunlari
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website_status TEXT DEFAULT 'Bilinmiyor';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS ssl_status TEXT DEFAULT 'Bilinmiyor';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS mobile_friendly TEXT DEFAULT 'Bilinmiyor';

-- Social intelligence sutunlari
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS social_score NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS social_activity TEXT DEFAULT 'Pasif';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS primary_social_network TEXT;

-- CRM sutunlari (bos baslar, siz doldurursunuz)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS contact_position TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'ORTA';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS potential_service TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS potential_value TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMPTZ;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS call_count INT DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS proposal_sent BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS response_status TEXT DEFAULT 'Bekleniyor';
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS close_probability NUMERIC DEFAULT 0;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Analiz Tablosu (yoksa olusturur)
CREATE TABLE IF NOT EXISTS public.business_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    ai_score NUMERIC,
    opportunity_reason TEXT,
    seo_score NUMERIC DEFAULT 0,
    mobile_score NUMERIC DEFAULT 0,
    social_score NUMERIC DEFAULT 0,
    sales_readiness TEXT,
    purchase_intent TEXT,
    why_now TEXT,
    recommended_services TEXT,
    confidence_score NUMERIC DEFAULT 0,
    website_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eksik analysis sutunlari
ALTER TABLE public.business_analysis ADD COLUMN IF NOT EXISTS sales_readiness TEXT;
ALTER TABLE public.business_analysis ADD COLUMN IF NOT EXISTS purchase_intent TEXT;
ALTER TABLE public.business_analysis ADD COLUMN IF NOT EXISTS why_now TEXT;
ALTER TABLE public.business_analysis ADD COLUMN IF NOT EXISTS recommended_services TEXT;
ALTER TABLE public.business_analysis ADD COLUMN IF NOT EXISTS confidence_score NUMERIC DEFAULT 0;
ALTER TABLE public.business_analysis ADD COLUMN IF NOT EXISTS website_status TEXT;

-- 5. Mevcut SYNCED verileri tekrar PENDING yap (tabloya tekrar gonderilsin)
UPDATE public.businesses SET sync_status = 'PENDING' WHERE sync_status = 'SYNCED' OR sync_status IS NULL;

-- TAMAM!
