-- V12: Kaydedilenler (Saved Businesses)
-- Bu SQL komutlarını Supabase > SQL Editor üzerinden çalıştırınız.

CREATE TABLE IF NOT EXISTS public.saved_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- RLS
ALTER TABLE public.saved_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved businesses"
ON public.saved_businesses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
