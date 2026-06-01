import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const { data, error } = await sb
    .from('crawl_jobs')
    .select('id')
    .limit(1);

  if (error) {
    console.log("TABLE_ERROR:", error.message);
  } else {
    console.log("TABLE_EXISTS");
  }
}

check().catch(console.error);
