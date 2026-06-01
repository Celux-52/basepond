import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testQuery() {
  const jobId = '0b31f275-18a0-4231-b66c-7bf825cc9ea6';
  
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
    
  console.log("Admin query:", adminError ? adminError : adminData);

  const { data: anonData, error: anonError } = await supabaseAnon
    .from('crawl_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
    
  console.log("Anon query:", anonError ? anonError : anonData);
}

testQuery();
