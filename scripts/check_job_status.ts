import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkJob() {
  const { data } = await supabaseAdmin.from('crawl_jobs').select('status, fetched_count').eq('id', '555ccfc6-4618-4107-bd25-28482a46537b').single();
  console.log("Job status:", data);
  
  const { data: item } = await supabaseAdmin.from('crawl_job_items').select('status').eq('job_id', '555ccfc6-4618-4107-bd25-28482a46537b').single();
  console.log("Item status:", item);
}

checkJob();
