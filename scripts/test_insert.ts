import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testInsert() {
  const { data, error } = await supabase
    .from('crawl_jobs')
    .insert({
      type: 'ON_DEMAND',
      status: 'queued',
      region: 'Istanbul',
      sector: 'Dis klinikleri'
    })
    .select('id')
    .single();
    
  if (error) {
    console.error("Test insert failed:", error);
  } else {
    console.log("Test insert succeeded:", data);
  }
}

testInsert();
