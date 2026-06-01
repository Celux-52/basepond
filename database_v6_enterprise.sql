-- SnapLead V6 Enterprise Architecture Migration
-- Run this in the Supabase SQL Editor

-- 1. ADD NEW COLUMNS TO EXISTING TABLES

-- Table: businesses (Add trust and freshness metrics)
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS data_freshness INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS is_dead BOOLEAN DEFAULT false;

-- Table: business_analysis (Add advanced predictive metrics)
ALTER TABLE public.business_analysis 
ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_readiness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buy_intent TEXT DEFAULT 'Low',
ADD COLUMN IF NOT EXISTS why_now_signals JSONB DEFAULT '[]'::jsonb;


-- 2. CREATE NEW TABLES

-- Table: business_history (To build a proprietary long-term dataset and detect trends)
CREATE TABLE IF NOT EXISTS public.business_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rating NUMERIC(3, 1),
    review_count INTEGER,
    ai_score INTEGER,
    website_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: search_telemetry (To track user retention and behavior)
CREATE TABLE IF NOT EXISTS public.search_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g., 'search', 'view_detail', 'generate_script', 'export'
    sector TEXT,
    city TEXT,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: job_queue (For scalable asynchronous background processing)
CREATE TABLE IF NOT EXISTS public.job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- e.g., 'deep_scan', 'enrichment', 'batch_ai_scoring'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);


-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON NEW TABLES

ALTER TABLE public.business_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;


-- 4. CREATE RLS POLICIES

-- business_history: Users can read all history, only service role can insert/update
CREATE POLICY "Anyone can read business history" ON public.business_history FOR SELECT USING (true);

-- search_telemetry: Users can only see and insert their own telemetry
CREATE POLICY "Users can insert their own telemetry" ON public.search_telemetry FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own telemetry" ON public.search_telemetry FOR SELECT USING (auth.uid() = user_id);

-- job_queue: Users can see and insert their own jobs
CREATE POLICY "Users can insert their own jobs" ON public.job_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own jobs" ON public.job_queue FOR SELECT USING (auth.uid() = user_id);


-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_business_history_bid ON public.business_history(business_id);
CREATE INDEX IF NOT EXISTS idx_search_telemetry_uid ON public.search_telemetry(user_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
