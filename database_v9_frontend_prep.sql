-- SnapLead V9: Frontend Hazırlık, Kredi ve Status Sistemi
-- Supabase SQL Editor'da çalıştırınız.

-- 1. YENİ TABLOLARIN OLUŞTURULMASI

-- user_wallets: Kullanıcı kredi bakiyeleri
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- credit_transactions: Kredi harcama logları
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- Örn: -1 (harcama) veya +100 (yükleme)
    action_type TEXT NOT NULL, -- Örn: 'UNLOCK_PHONE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- user_lead_status: Kullanıcının lead ile etkileşimi
CREATE TABLE IF NOT EXISTS public.user_lead_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'NEW' NOT NULL, -- 'NEW', 'VIEWED', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST'
    is_unlocked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, business_id)
);


-- 2. VERİ ŞEMASI STANDARDİZASYONU (business_analysis)
-- Mevcut tabloya eksik olan JSONB formatlı array alanlarını ekliyoruz
ALTER TABLE public.business_analysis 
ADD COLUMN IF NOT EXISTS opportunity_reasons JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommended_services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quality_tier TEXT;


-- 3. GÜVENLİK (RLS POLICIES)

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lead_status ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi cüzdanını görebilir
CREATE POLICY "Users can view own wallet" ON public.user_wallets FOR SELECT USING (auth.uid() = user_id);
-- Kullanıcı sadece kendi işlemlerini görebilir
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
-- Kullanıcı sadece kendi etkileşimlerini görebilir ve düzenleyebilir
CREATE POLICY "Users can view own lead status" ON public.user_lead_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lead status" ON public.user_lead_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lead status" ON public.user_lead_status FOR UPDATE USING (auth.uid() = user_id);


-- 4. KREDİ DÜŞME VE KİLİT AÇMA (RPC FONKSİYONU)
-- Race condition'u önlemek için atomik işlem (Transaction)

CREATE OR REPLACE FUNCTION public.unlock_lead_phone(p_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Yetkili olarak çalışır (RLS bypass edip cüzdanı güncelleyebilir)
AS $$
DECLARE
    v_user_id UUID;
    v_wallet_id UUID;
    v_balance INTEGER;
    v_phone TEXT;
    v_already_unlocked BOOLEAN;
BEGIN
    -- İstek yapan kullanıcıyı al
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Kullanıcının zaten bu lead'in kilidini açıp açmadığını kontrol et
    SELECT is_unlocked INTO v_already_unlocked 
    FROM public.user_lead_status 
    WHERE user_id = v_user_id AND business_id = p_business_id;

    -- Zaten açıksa krediyi düşme, sadece numarayı döndür
    IF v_already_unlocked THEN
        SELECT phone INTO v_phone FROM public.businesses WHERE id = p_business_id;
        RETURN json_build_object('success', true, 'phone', v_phone, 'message', 'Already unlocked');
    END IF;

    -- Cüzdanı locklayarak (FOR UPDATE) oku (Race Condition koruması)
    SELECT id, balance INTO v_wallet_id, v_balance 
    FROM public.user_wallets 
    WHERE user_id = v_user_id 
    FOR UPDATE;

    -- Cüzdan yoksa veya bakiye 0 ise hata dön
    IF v_wallet_id IS NULL OR v_balance < 1 THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient credits');
    END IF;

    -- Krediyi 1 düş
    UPDATE public.user_wallets SET balance = balance - 1, updated_at = NOW() WHERE id = v_wallet_id;

    -- Log tablosuna yaz
    INSERT INTO public.credit_transactions (user_id, business_id, amount, action_type)
    VALUES (v_user_id, p_business_id, -1, 'UNLOCK_PHONE');

    -- Status tablosunu güncelle/ekle (UPSERT)
    INSERT INTO public.user_lead_status (user_id, business_id, status, is_unlocked)
    VALUES (v_user_id, p_business_id, 'VIEWED', true)
    ON CONFLICT (user_id, business_id) 
    DO UPDATE SET is_unlocked = true, status = 'VIEWED', updated_at = NOW();

    -- Başarılı ise telefon numarasını döndür
    SELECT phone INTO v_phone FROM public.businesses WHERE id = p_business_id;

    RETURN json_build_object('success', true, 'phone', v_phone, 'new_balance', v_balance - 1);
END;
$$;
