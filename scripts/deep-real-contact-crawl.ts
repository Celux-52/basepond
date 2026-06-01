import { createClient } from '@supabase/supabase-js';
import { scrapeBusinessWebsite } from '../src/lib/services/native-scraper';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function deepRealCrawl() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log('🔄 Starting 100% Real Deep Contact Crawl on business websites...');
  
  let allBusinesses: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: businesses, error } = await sb
      .from('businesses')
      .select('id, business_name, phone, email, website')
      .range(offset, offset + batchSize - 1);
      
    if (error || !businesses || businesses.length === 0) break;
    
    allBusinesses = [...allBusinesses, ...businesses];
    offset += batchSize;
  }
  
  // Filter for businesses that have a website but are missing phone or email
  const targets = allBusinesses.filter(b => {
    const hasWebsite = !!(b.website && b.website.trim());
    const needsPhone = !b.phone || !b.phone.trim();
    const needsEmail = !b.email || !b.email.trim();
    return hasWebsite && (needsPhone || needsEmail);
  });
  
  console.log(`📋 Found ${targets.length} businesses with websites that need phone/email zenginleştirme.`);
  
  let crawledCount = 0;
  let foundPhones = 0;
  let foundEmails = 0;
  
  for (const biz of targets) {
    try {
      crawledCount++;
      console.log(`\n🔍 Crawling (${crawledCount}/${targets.length}): ${biz.business_name}`);
      console.log(`   🌐 Site: ${biz.website}`);
      
      const scrapeResult = await scrapeBusinessWebsite(biz.website);
      
      const updatePayload: any = {};
      
      const hasNewPhone = scrapeResult.phones && scrapeResult.phones.length > 0;
      const hasNewEmail = scrapeResult.emails && scrapeResult.emails.length > 0;
      
      if (hasNewPhone && (!biz.phone || !biz.phone.trim())) {
        updatePayload.phone = scrapeResult.phones[0];
        foundPhones++;
        console.log(`   📞 REAL Phone Found: ${updatePayload.phone}`);
      }
      
      if (hasNewEmail && (!biz.email || !biz.email.trim())) {
        updatePayload.email = scrapeResult.emails[0];
        foundEmails++;
        console.log(`   ✉️ REAL Email Found: ${updatePayload.email}`);
      }
      
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateErr } = await sb
          .from('businesses')
          .update(updatePayload)
          .eq('id', biz.id);
          
        if (updateErr) {
          console.error(`   ❌ Update failed: ${updateErr.message}`);
        } else {
          console.log(`   ✅ Database updated successfully!`);
        }
      } else {
        console.log(`   ⚠️ No new phone/email found on site.`);
      }
      
      // Small delay between crawls to respect site resources
      await new Promise(r => setTimeout(r, 1500));
    } catch (e: any) {
      console.error(`   ⚠️ Crawl error for ${biz.business_name}: ${e.message}`);
    }
  }
  
  console.log('\n--- REAL DEEP CRAWL COMPLETED ---');
  console.log(`🎯 Websites Crawled: ${crawledCount}`);
  console.log(`📞 New REAL Phone Numbers Saved: +${foundPhones}`);
  console.log(`✉️ New REAL Email Addresses Saved: +${foundEmails}`);
  console.log('---------------------------------');
}

deepRealCrawl().catch(console.error);
