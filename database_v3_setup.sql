-- ==========================================
-- SNAPLEAD V3 DATABASE SETUP (SUPABASE)
-- ==========================================

-- 1. DROP OLD TABLES (IF EXISTS)
DROP TABLE IF EXISTS public.leads CASCADE;

-- 2. UPDATE PROFILES TABLE
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- RPC for decrementing credits safely
CREATE OR REPLACE FUNCTION public.decrement_credits(user_id_param UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - amount
  WHERE id = user_id_param AND credits >= amount;
END;
$$;

-- 3. BUSINESSES TABLE
CREATE TABLE public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Turkey',
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  linkedin TEXT,
  facebook TEXT,
  twitter TEXT,
  tiktok TEXT,
  maps_url TEXT,
  rating NUMERIC,
  review_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(business_name, city)
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view businesses" ON public.businesses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert businesses" ON public.businesses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update businesses" ON public.businesses FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. BUSINESS ANALYSIS TABLE
CREATE TABLE public.business_analysis (
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE PRIMARY KEY,
  ai_score INTEGER,
  seo_score INTEGER,
  mobile_score INTEGER,
  social_score INTEGER,
  opportunity_reason TEXT,
  website_status TEXT,
  growth_potential TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analysis" ON public.business_analysis FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert analysis" ON public.business_analysis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update analysis" ON public.business_analysis FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. SEARCHES TABLE
CREATE TABLE public.searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  search_query TEXT,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  requested_amount INTEGER,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own searches" ON public.searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own searches" ON public.searches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. CACHE SYSTEM TABLE
CREATE TABLE public.cache_system (
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE PRIMARY KEY,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  needs_update BOOLEAN DEFAULT false
);

ALTER TABLE public.cache_system ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view cache" ON public.cache_system FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert cache" ON public.cache_system FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update cache" ON public.cache_system FOR UPDATE USING (auth.role() = 'authenticated');
