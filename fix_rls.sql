-- Supabase SQL Editor'da çalıştırın:
-- Yeni oluşturulan tablolarda verilerin ön tarafa çekilebilmesi için RLS Okuma izinlerini açar

-- 1. crawl_jobs okuma yetkisi
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.crawl_jobs;
CREATE POLICY "Enable read access for all" ON public.crawl_jobs FOR SELECT USING (true);

-- 2. businesses okuma yetkisi
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.businesses;
CREATE POLICY "Enable read access for all" ON public.businesses FOR SELECT USING (true);

-- 3. business_analysis okuma yetkisi
ALTER TABLE public.business_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all" ON public.business_analysis;
CREATE POLICY "Enable read access for all" ON public.business_analysis FOR SELECT USING (true);
