-- ============================================
-- BASEPOND DATABASE - FOMO (ARAZI KAPMACA) GUNCELLEMESI
-- Bu SQL'i Supabase SQL Editor'de calistirin
-- ============================================

-- Businesses tablosuna kilitleyen kisi ve tarihi ekle
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- TAMAM!
