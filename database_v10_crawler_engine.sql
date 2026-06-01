-- v10 Crawler Engine Schema
-- Extension for generating UUIDs if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. crawl_jobs
CREATE TABLE IF NOT EXISTS public.crawl_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('CRON', 'ON_DEMAND')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'fetching', 'verifying', 'analyzing', 'publishing', 'completed', 'failed')),
    region TEXT,
    sector TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    fetched_count INT DEFAULT 0,
    verified_count INT DEFAULT 0,
    analyzed_count INT DEFAULT 0,
    published_count INT DEFAULT 0,
    duplicate_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. crawl_job_items
CREATE TABLE IF NOT EXISTS public.crawl_job_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
    query TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. source_records (Ham kayıtlar)
CREATE TABLE IF NOT EXISTS public.source_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crawl_job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE SET NULL,
    source TEXT NOT NULL, -- e.g., 'google_maps', 'apollo'
    source_query TEXT,
    place_id TEXT, -- Uniqueness from source
    domain TEXT,
    phone TEXT,
    raw_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'raw' CHECK (status IN ('raw', 'fetched', 'verified', 'analyzed', 'published', 'duplicate', 'failed')),
    region TEXT,
    sector TEXT,
    last_fetched_at TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    last_analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast duplication checks
CREATE INDEX IF NOT EXISTS idx_source_records_place_id ON public.source_records(place_id);
CREATE INDEX IF NOT EXISTS idx_source_records_domain ON public.source_records(domain);

-- 4. crawl_errors
CREATE TABLE IF NOT EXISTS public.crawl_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
    source_record_id UUID REFERENCES public.source_records(id) ON DELETE CASCADE,
    error_step TEXT NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. user_requested_crawls
CREATE TABLE IF NOT EXISTS public.user_requested_crawls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, 
    crawl_job_id UUID REFERENCES public.crawl_jobs(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    spent_credits INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. businesses tablosu guncellemeleri
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS source_record_id UUID REFERENCES public.source_records(id);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS crawl_job_id UUID REFERENCES public.crawl_jobs(id);
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
