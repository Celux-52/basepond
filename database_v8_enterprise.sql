-- V8 Enterprise Architecture SQL Setup

-- 1. BUSINESS_HISTORY Tablosu
CREATE TABLE IF NOT EXISTS public.business_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    changed_field VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BUSINESS_SNAPSHOTS Tablosu
CREATE TABLE IF NOT EXISTS public.business_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    enrichment_version VARCHAR(50),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MASTER_SUPPLIER_POOL Tablosu
CREATE TABLE IF NOT EXISTS public.master_supplier_pool (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    coverage_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Security)
ALTER TABLE public.business_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_supplier_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.business_history FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.business_snapshots FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.master_supplier_pool FOR SELECT USING (true);
