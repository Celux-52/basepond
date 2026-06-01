import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUser() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  console.log(data);
  
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  console.log(authUsers.users.map(u => ({ id: u.id, email: u.email })));
}

checkUser();
