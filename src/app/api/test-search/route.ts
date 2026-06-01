import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, region, sector } = body;

    // Hardcode user ID for testing
    const userId = "00000000-0000-0000-0000-000000000000"; // Example user ID

    console.log("Starting test API...");

    const { data: job, error: jobError } = await supabaseAdmin
      .from('crawl_jobs')
      .insert({
        type: 'ON_DEMAND',
        status: 'queued',
        region: region || null,
        sector: sector || null
      })
      .select('id')
      .single();

    if (jobError || !job) {
      console.error("Job Error:", jobError);
      return NextResponse.json({ error: `Failed to create crawl job: ${jobError?.message || 'Unknown'}` }, { status: 500 });
    }

    const { error: itemError } = await supabaseAdmin
      .from('crawl_job_items')
      .insert({
        job_id: job.id,
        query: query,
        status: 'pending'
      });

    if (itemError) {
      console.error("Item Error:", itemError);
      return NextResponse.json({ error: 'Failed to create job item' }, { status: 500 });
    }

    const { error: requestError } = await supabaseAdmin
      .from('user_requested_crawls')
      .insert({
        user_id: userId,
        crawl_job_id: job.id,
        search_query: query,
        spent_credits: 1
      });

    if (requestError) {
      console.error("Request Error:", requestError);
    }

    return NextResponse.json({ success: true, jobId: job.id });

  } catch (err: any) {
    console.error('Search API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
