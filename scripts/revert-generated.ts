import { createClient } from '@supabase/supabase-js';

// Disable SSL reject unauthorized for local proxy bypass (trailing dot issue)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function revert() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log('🔄 Reverting generated contacts to clean state (sallmasyon verileri siliniyor)...');
  
  let allBusinesses: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: businesses, error } = await sb
      .from('businesses')
      .select('id, business_name, phone, email, website')
      .range(offset, offset + batchSize - 1);
      
    if (error) {
      console.error('❌ Error fetching businesses:', error.message);
      return;
    }
    
    if (!businesses || businesses.length === 0) {
      break;
    }
    
    allBusinesses = [...allBusinesses, ...businesses];
    offset += batchSize;
  }
  
  let revertedCount = 0;
  
  for (const biz of allBusinesses) {
    const isGeneratedPhone = biz.phone && biz.phone.startsWith('+90 (');
    
    // We generated phone and email together in our deep fill script.
    // If the phone matches our generated format (+90 (XXX) XXX XX XX), we revert BOTH phone and email.
    if (isGeneratedPhone) {
      const { error: updateErr } = await sb
        .from('businesses')
        .update({
          phone: null,
          email: null
        })
        .eq('id', biz.id);
        
      if (updateErr) {
        console.error(`❌ Failed to revert ${biz.business_name}:`, updateErr.message);
      } else {
        revertedCount++;
      }
    }
  }
  
  console.log(`✅ Successfully reverted ${revertedCount} businesses back to pure null state!`);
}

revert().catch(console.error);
