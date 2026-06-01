import { createClient } from '@supabase/supabase-js';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

async function revertEmails() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log('🔄 Cleaning up any generated emails (sallmasyon e-postalar temizleniyor)...');
  
  let allBusinesses: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: businesses, error } = await sb
      .from('businesses')
      .select('id, business_name, email, website')
      .range(offset, offset + batchSize - 1);
      
    if (error || !businesses || businesses.length === 0) break;
    
    allBusinesses = [...allBusinesses, ...businesses];
    offset += batchSize;
  }
  
  let cleanedCount = 0;
  
  for (const biz of allBusinesses) {
    if (biz.email) {
      const slug = getSlug(biz.business_name);
      const generated1 = `${slug}@gmail.com`;
      const generated2 = `info@${slug}.com`;
      const generated3 = `iletisim@${slug}.com`;
      
      const emailLower = biz.email.toLowerCase().trim();
      
      if (emailLower === generated1 || emailLower === generated2 || emailLower === generated3) {
        const { error: updateErr } = await sb
          .from('businesses')
          .update({ email: null })
          .eq('id', biz.id);
          
        if (!updateErr) {
          cleanedCount++;
        }
      }
    }
  }
  
  console.log(`✅ Cleaned up ${cleanedCount} generated email addresses!`);
}

revertEmails().catch(console.error);
