-- V11: Akıllı Filtreler İçin Veritabanı Güncellemesi
-- Bu SQL komutlarını Supabase > SQL Editor üzerinden çalıştırınız.

ALTER TABLE public.business_analysis
ADD COLUMN IF NOT EXISTS has_ssl BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mobile_responsive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_social_links BOOLEAN DEFAULT false;

-- Mevcut verileri korumak için varsayılan olarak false atadık.
-- Motor yeni veriler çektikçe bu alanlar gerçek değerlerle dolacaktır.
