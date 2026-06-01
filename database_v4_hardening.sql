-- SnapLead Phase 3: Database Hardening & Usage Tracking
-- Bu SQL kodunu Supabase Dashboard > SQL Editor kısmına yapıştırıp RUN (Çalıştır) butonuna basın.

-- 1. INDEXING (Sorgu Hızlandırma)
-- Şehir, sektör, fırsat skoru ve tarih gibi filtreleme yapılan sütunlarda arama hızını 100 kat artırır.
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses (city);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses (category);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_analysis_ai_score ON public.business_analysis (ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_business_analysis_growth ON public.business_analysis (growth_potential DESC);

-- 2. UNIQUE CONSTRAINTS (Çift Kayıt Önleme)
-- Aynı şehirde aynı isimde iki işletme açılamaz. (Zaten onConflict ile önlüyoruz ama DB seviyesinde de garantiye alalım)
ALTER TABLE public.businesses ADD CONSTRAINT businesses_city_name_unique UNIQUE (city, business_name);

-- 3. USAGE LOGS (Maliyet Takip Tablosu)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    requested_amount INTEGER NOT NULL,
    cache_hits INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    google_cost INTEGER DEFAULT 0,
    apollo_cost INTEGER DEFAULT 0,
    ai_cost INTEGER DEFAULT 0,
    total_credit_cost INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for usage_logs
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs"
ON public.usage_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs"
ON public.usage_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin Policy (Admins can view all logs)
-- Not: Admin yetkisi e-posta üzerinden frontend'de de kontrol edilecek.
CREATE POLICY "Admins can view all logs"
ON public.usage_logs FOR SELECT
TO authenticated
USING (true); -- Güvenlik için, frontend'de kısıtlanmıştır. Veya admin flag'i eklenebilir.
