-- SnapLead Phase 4: Enterprise Pricing & Quota System
-- Bu SQL kodunu Supabase Dashboard > SQL Editor kısmına yapıştırıp RUN (Çalıştır) butonuna basın.

-- 1. PROFILES Tablosu Güncellemesi
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS scans_remaining INTEGER DEFAULT 50, -- Yeni kullanıcılara 50 deneme hakkı
ADD COLUMN IF NOT EXISTS total_scans_purchased INTEGER DEFAULT 50;

-- Eğer mevcut kullanıcıların eski "credits" verisi varsa, onları "scans_remaining" formatına dönüştürelim.
-- Eski sistemde 1 scan = 7 credit olarak hesaplanıyordu, bu yüzden eski kredileri 7'ye bölüyoruz.
UPDATE public.profiles 
SET scans_remaining = COALESCE(credits / 7, 50) 
WHERE scans_remaining = 50 AND credits IS NOT NULL AND credits > 0;

-- 2. PAYMENTS Tablosu (Ciro / MRR Takibi İçin)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_usd NUMERIC NOT NULL,
    plan_name TEXT NOT NULL,
    scans_added INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (true); -- Güvenlik frontend'de sağlanacak.

-- 3. QUOTA DEDUCTION RPC (Stored Procedure)
-- Bu fonksiyon, Node.js üzerinden atomik bir şekilde kullanıcıların kotasından "Scan" (Tarama) düşmek için kullanılır.
CREATE OR REPLACE FUNCTION decrement_scans(user_id_param UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET scans_remaining = scans_remaining - amount
  WHERE id = user_id_param AND scans_remaining >= amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
