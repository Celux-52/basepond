import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchPlaces, getPlaceDetails } from '@/lib/services/google-maps';
import { analyzeWebsite } from '@/lib/services/analysis';
import { enrichCompanyData } from '@/lib/services/apollo';
import { generateAIScore } from '@/lib/services/ai-scorer';

export const maxDuration = 300; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  return handleQueue();
}

export async function GET(request: Request) {
  return handleQueue();
}

async function handleQueue() {
  try {
    const { data: item, error: findError } = await supabaseAdmin
      .from('crawl_job_items')
      .select('id, job_id, query, status, crawl_jobs ( id, region, sector, status )')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (findError || !item) {
      return NextResponse.json({ message: 'No pending jobs in queue' });
    }

    await supabaseAdmin.from('crawl_job_items').update({ status: 'processing' }).eq('id', item.id);
    await supabaseAdmin.from('crawl_jobs').update({ status: 'fetching' }).eq('id', item.job_id);

    let searchTerm = item.query;
    let limit = 10;
    try {
      const parsed = JSON.parse(item.query);
      if (parsed.searchTerm) {
        searchTerm = parsed.searchTerm;
        limit = parsed.limit || 10;
      }
    } catch(e) {}

    console.log(`[Queue] Processing job ${item.job_id} - Query: ${searchTerm} (Limit: ${limit})`);
    
    // 1. Fetch from Google Maps
    const results = await searchPlaces(searchTerm, limit);
    let fetchedCount = 0;
    
    await Promise.all(results.map(async (place) => {
      // --- CACHE HIT LOGIC (HYBRID ENGINE) ---
      const { data: existingRecord } = await supabaseAdmin
        .from('source_records')
        .select('id, domain, phone, raw_data, last_fetched_at')
        .eq('place_id', place.place_id)
        .limit(1)
        .maybeSingle();

      let usedCache = false;

      if (existingRecord && existingRecord.last_fetched_at) {
        // Check if fetched within the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const lastFetched = new Date(existingRecord.last_fetched_at);

        if (lastFetched >= thirtyDaysAgo) {
          // It's fresh! Find the most recent business analysis for this source record
          const { data: recentBusiness } = await supabaseAdmin
            .from('businesses')
            .select('*, business_analysis(*)')
            .eq('source_record_id', existingRecord.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentBusiness && recentBusiness.business_analysis && recentBusiness.business_analysis.length > 0) {
            const oldAnalysis = recentBusiness.business_analysis[0];
            
            // CACHE HIT! Duplicate the business and analysis records for the new job
            const { data: newBusiness } = await supabaseAdmin
              .from('businesses')
              .insert({
                business_name: recentBusiness.business_name,
                category: recentBusiness.category,
                city: recentBusiness.city,
                phone: recentBusiness.phone,
                website: recentBusiness.website,
                rating: recentBusiness.rating,
                review_count: recentBusiness.review_count,
                source_record_id: existingRecord.id,
                crawl_job_id: item.job_id,
                status: 'published'
              })
              .select('id')
              .single();

            if (newBusiness) {
              await supabaseAdmin
                .from('business_analysis')
                .insert({
                  business_id: newBusiness.id,
                  ai_score: oldAnalysis.ai_score,
                  opportunity_reason: oldAnalysis.opportunity_reason,
                  website_status: oldAnalysis.website_status,
                  growth_potential: oldAnalysis.growth_potential,
                  has_ssl: oldAnalysis.has_ssl,
                  mobile_responsive: oldAnalysis.mobile_responsive,
                  has_social_links: oldAnalysis.has_social_links,
                });
              fetchedCount++;
              usedCache = true;
            }
          }
        }
      }

      if (usedCache) {
        console.log(`[Queue] Cache hit for ${place.name}`);
        return; // Skip expensive API calls
      }

      // --- CACHE MISS (FRESH FETCH) ---
      console.log(`[Queue] Cache miss for ${place.name} - Fetching API...`);
      const details = await getPlaceDetails(place.place_id);
      const phone = details?.formatted_phone_number || null;
      let website = details?.website || details?.url || null;
      
      // UPSERT Source Record (Manual to avoid missing unique constraint)
      let sourceRecord = null;
      // We already checked existingRecord above
      const recordPayload = {
        crawl_job_id: item.job_id,
        source: 'google_maps',
        source_query: item.query,
        place_id: place.place_id,
        domain: website,
        phone: phone,
        raw_data: details || place,
        status: 'analyzed',
        region: (item.crawl_jobs as any)?.region || null,
        sector: (item.crawl_jobs as any)?.sector || null,
        last_fetched_at: new Date().toISOString()
      };

      if (existingRecord) {
        const { data: updated } = await supabaseAdmin
          .from('source_records')
          .update(recordPayload)
          .eq('id', existingRecord.id)
          .select('id')
          .single();
        sourceRecord = updated;
      } else {
        const { data: inserted } = await supabaseAdmin
          .from('source_records')
          .insert(recordPayload)
          .select('id')
          .single();
        sourceRecord = inserted;
      }
        
      if (sourceRecord) {
        fetchedCount++;

        // 2. Deep Enrichment (Website + Apollo)
        const websiteAnalysis = await analyzeWebsite(website);
        const apolloData = await enrichCompanyData(website, place.name);

        // Merge Apollo Phone/Website if Google didn't have it
        website = website || apolloData.website_url || null;
        const finalPhone = phone || apolloData.phone || null;

        // 3. AI Scoring
        const aiScore = await generateAIScore(
          { name: place.name, category: place.types?.[0] || 'business', rating: details?.rating, review_count: details?.user_ratings_total },
          websiteAnalysis,
          apolloData
        );

        // 4. UPSERT to businesses
        const { data: business } = await supabaseAdmin
          .from('businesses')
          .insert({
            business_name: place.name,
            category: (item.crawl_jobs as any)?.sector || place.types?.[0] || 'Unknown',
            city: (item.crawl_jobs as any)?.region || 'Unknown',
            phone: finalPhone,
            website: website,
            rating: details?.rating || null,
            review_count: details?.user_ratings_total || null,
            source_record_id: sourceRecord.id,
            crawl_job_id: item.job_id,
            status: 'published'
          })
          .select('id')
          .single();

        // 5. UPSERT to business_analysis (Manual to avoid missing unique constraint)
        if (business) {
          const { data: existingAnalysis } = await supabaseAdmin
            .from('business_analysis')
            .select('id')
            .eq('business_id', business.id)
            .limit(1)
            .maybeSingle();

          const analysisPayload = {
            business_id: business.id,
            ai_score: aiScore.ai_score,
            opportunity_reason: aiScore.opportunity_reason,
            website_status: websiteAnalysis.status,
            growth_potential: aiScore.growth_potential,
            has_ssl: websiteAnalysis.has_ssl,
            mobile_responsive: websiteAnalysis.mobile_responsive,
            has_social_links: websiteAnalysis.has_social_links,
          };

          if (existingAnalysis) {
            await supabaseAdmin.from('business_analysis').update(analysisPayload).eq('id', existingAnalysis.id);
          } else {
            await supabaseAdmin.from('business_analysis').insert(analysisPayload);
          }
        }
      }
    }));

    await supabaseAdmin.from('crawl_job_items').update({ status: 'completed' }).eq('id', item.id);

    // Update fetched_count safely
    const { data: jobStats } = await supabaseAdmin.from('crawl_jobs').select('fetched_count').eq('id', item.job_id).single();
    await supabaseAdmin.from('crawl_jobs').update({ fetched_count: (jobStats?.fetched_count || 0) + fetchedCount }).eq('id', item.job_id);

    const { count: pendingCount } = await supabaseAdmin.from('crawl_job_items').select('*', { count: 'exact', head: true }).eq('job_id', item.job_id).eq('status', 'pending');
    if (pendingCount === 0) {
      await supabaseAdmin.from('crawl_jobs').update({ status: 'completed', finished_at: new Date().toISOString() }).eq('id', item.job_id);
    }

    return NextResponse.json({ success: true, processed_item: item.id, fetched: fetchedCount });
    
  } catch (error: any) {
    console.error('[Queue Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
