-- ==========================================
-- SNAPLEAD DATABASE SETUP (SUPABASE)
-- ==========================================

-- 1. PROFILES TABLE
-- Kullanıcıların ekstra bilgilerini tutacağımız tablo
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles için RLS (Güvenlik) Aktifleştirme
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Sadece kendi profilini görebilir
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Sadece kendi profilini güncelleyebilir
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- ==========================================

-- 2. LEADS TABLE
-- Müşteri adaylarının (leads) tutulacağı ana tablo
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  industry TEXT,
  linkedin_url TEXT,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, email) -- Bir kullanıcının aynı mail adresine sahip birden fazla lead'i olmasını engeller
);

-- Leads için RLS Aktifleştirme
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi lead'lerini görebilir
CREATE POLICY "Users can view their own leads" 
ON public.leads FOR SELECT 
USING (auth.uid() = user_id);

-- Kullanıcı sadece kendine lead ekleyebilir
CREATE POLICY "Users can insert their own leads" 
ON public.leads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Kullanıcı sadece kendi lead'lerini güncelleyebilir
CREATE POLICY "Users can update their own leads" 
ON public.leads FOR UPDATE 
USING (auth.uid() = user_id);

-- Kullanıcı sadece kendi lead'lerini silebilir
CREATE POLICY "Users can delete their own leads" 
ON public.leads FOR DELETE 
USING (auth.uid() = user_id);

-- ==========================================

-- 3. AUTO PROFILE TRIGGER
-- Birisi kayıt olduğunda profiles tablosuna otomatik satır ekleyen sistem

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name' -- Kayıt olurken verilen isim
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı auth.users tablosuna bağlama
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
