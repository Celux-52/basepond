import { createClient } from '@supabase/supabase-js';
import { scrapeBusinessWebsite } from '../src/lib/services/native-scraper';
import { searchApolloByName } from '../src/lib/services/apollo';
import { searchPlaces, getPlaceDetails } from '../src/lib/services/google-maps';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function enrichAllRemaining() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  console.log('🔄 Starting Exhaustive Real Contact Enrichment for ALL remaining businesses...');
  
  let allBusinesses: any[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data: businesses, error } = await sb
      .from('businesses')
      .select('id, business_name, city, phone, email, website')
      .range(offset, offset + batchSize - 1);
      
    if (error || !businesses || businesses.length === 0) break;
    
    allBusinesses = [...allBusinesses, ...businesses];
    offset += batchSize;
  }
  
  // Filter for any business that is missing phone or email
  const targets = allBusinesses.filter(b => {
    const needsPhone = !b.phone || !b.phone.trim() || b.phone === "Yok";
    const needsEmail = !b.email || !b.email.trim() || b.email === "Yok";
    return needsPhone || needsEmail;
  });
  
  console.log(`📋 Found ${targets.length} businesses with missing phone or email details.`);
  
  let processedCount = 0;
  let foundPhones = 0;
  let foundEmails = 0;
  let foundWebsites = 0;
  
  for (const biz of targets) {
    try {
      processedCount++;
      let currentPhone = biz.phone || null;
      let currentEmail = biz.email || null;
      let currentWebsite = biz.website || null;
      
      console.log(`\n🔍 Processing (${processedCount}/${targets.length}): ${biz.business_name} (${biz.city || 'Turkey'})`);
      
      // Step 1: If website is missing, check Google Maps Places API to see if we can find website or phone!
      if (!currentWebsite || currentWebsite === "Yok" || !currentPhone || currentPhone === "Yok") {
        try {
          const query = `${biz.business_name} ${biz.city || ''}`;
          console.log(`   🔎 Querying Google Maps Places for missing details...`);
          const places = await searchPlaces(query, 1);
          
          if (places && places.length > 0) {
            const details = await getPlaceDetails(places[0].place_id);
            if (details) {
              if (details.website && (!currentWebsite || currentWebsite === "Yok")) {
                currentWebsite = details.website;
                foundWebsites++;
                console.log(`      📍 Found Website on Google Maps: ${currentWebsite}`);
              }
              if (details.formatted_phone_number && (!currentPhone || currentPhone === "Yok")) {
                currentPhone = details.formatted_phone_number;
                foundPhones++;
                console.log(`      📍 Found Phone on Google Maps: ${currentPhone}`);
              }
            }
          }
        } catch (mapsErr) {
          // maps check failed
        }
      }
      
      // Step 2: If we have a website, deeply crawl its homepage and contact pages
      if (currentWebsite && currentWebsite !== "Yok" && currentWebsite !== "") {
        try {
          console.log(`   🌐 Scraping website: ${currentWebsite}`);
          const scrapeResult = await scrapeBusinessWebsite(currentWebsite);
          
          if (scrapeResult.is_alive) {
            if (scrapeResult.phones && scrapeResult.phones.length > 0 && (!currentPhone || currentPhone === "Yok")) {
              currentPhone = scrapeResult.phones[0];
              foundPhones++;
              console.log(`      📞 REAL Phone Found from site: ${currentPhone}`);
            }
            if (scrapeResult.emails && scrapeResult.emails.length > 0 && (!currentEmail || currentEmail === "Yok")) {
              currentEmail = scrapeResult.emails[0];
              foundEmails++;
              console.log(`      ✉️ REAL Email Found from site: ${currentEmail}`);
            }
          }
        } catch (scrapeErr) {
          // website crawl failed
        }
      }
      
      // Step 3: Call Apollo fallback search by name to fill remaining blanks
      if (!currentPhone || !currentEmail || currentPhone === "Yok" || currentEmail === "Yok") {
        try {
          console.log(`   📞 Searching Apollo by business name...`);
          const apolloResult = await searchApolloByName(biz.business_name, biz.city || 'Turkey');
          
          if (apolloResult.phone && (!currentPhone || currentPhone === "Yok")) {
            currentPhone = apolloResult.phone;
            foundPhones++;
            console.log(`      📞 REAL Phone Found from Apollo: ${currentPhone}`);
          }
          if (apolloResult.primary_email && (!currentEmail || currentEmail === "Yok")) {
            currentEmail = apolloResult.primary_email;
            foundEmails++;
            console.log(`      ✉️ REAL Email Found from Apollo: ${currentEmail}`);
          }
        } catch (apolloErr) {
          // apollo failed
        }
      }
      
      // Save updated fields if we found anything new
      const updatePayload: any = {};
      let hasUpdate = false;
      
      if (currentPhone && currentPhone !== biz.phone) {
        updatePayload.phone = currentPhone;
        hasUpdate = true;
      }
      if (currentEmail && currentEmail !== biz.email) {
        updatePayload.email = currentEmail;
        hasUpdate = true;
      }
      if (currentWebsite && currentWebsite !== biz.website) {
        updatePayload.website = currentWebsite;
        hasUpdate = true;
      }
      
      if (hasUpdate) {
        await sb
          .from('businesses')
          .update(updatePayload)
          .eq('id', biz.id);
        console.log(`   ✅ Database updated successfully.`);
      } else {
        console.log(`   ⚠️ No new verified phone/email/website discovered.`);
      }
      
      // Respectful rate limit delay between queries
      await new Promise(r => setTimeout(r, 1500));
    } catch (err: any) {
      console.error(`   ⚠️ Failed to process ${biz.business_name}: ${err.message}`);
    }
  }
  
  console.log('\n--- EXHAUSTIVE ENRICHMENT COMPLETED ---');
  console.log(`🎯 Remaining Businesses Processed: ${processedCount}`);
  console.log(`📞 New REAL Phone Numbers Recovered: +${foundPhones}`);
  console.log(`✉️ New REAL Email Addresses Recovered: +${foundEmails}`);
  console.log(`🌐 New websites found: +${foundWebsites}`);
  console.log('---------------------------------------');
}

enrichAllRemaining().catch(console.error);
