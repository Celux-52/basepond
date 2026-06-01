import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ scans_remaining: 50 })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all users essentially
  
  if (error) console.error("Error updating credits:", error);
  else console.log("Successfully added 50 test credits to all users!");
}

main();
