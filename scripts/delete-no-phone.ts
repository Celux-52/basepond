import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function deleteNoPhone() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log('🗑️ Starting deletion of businesses without telephone numbers (telefonu olmayan kayıtlar temizleniyor)...');
  
  // Perform the deletion query
  const { error, count } = await sb
    .from('businesses')
    .delete({ count: 'exact' })
    .or('phone.is.null,phone.eq.,phone.eq.Yok');
    
  if (error) {
    console.error('❌ Failed to delete records:', error.message);
    return;
  }
  
  console.log('--- DELETION COMPLETE ---');
  console.log(`✅ Successfully deleted ${count} businesses without phone numbers!`);
  console.log('-------------------------');
}

deleteNoPhone().catch(console.error);
