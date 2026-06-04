import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_URL_HERE',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_KEY_HERE'
);

async function check() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*, business_analysis!inner(*)')
    .limit(1);
    
  console.log(JSON.stringify(data, null, 2));
}

check();
