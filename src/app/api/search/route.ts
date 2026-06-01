import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function logDebug(msg: string) {
  try {
    fs.appendFileSync(path.join(process.cwd(), 'api_debug.log'), new Date().toISOString() + ': ' + msg + '\n');
  } catch(e) {}
}

export async function POST(request: Request) {
  try {
    logDebug('Search API started');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.email === 'melih20052005gs@gmail.com';

    const body = await request.json();
    const { query, region, sector, limit = 10 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Check Quota
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('scans_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not fetch user profile' }, { status: 500 });
    }

    const requiredScans = limit / 10; // 1 scan per 10 items
    if (!isAdmin && profile.scans_remaining < requiredScans) {
      return NextResponse.json({ error: 'Insufficient scans remaining' }, { status: 403 });
    }

    // 2. Create Crawl Job
    logDebug('Creating crawl job...');
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
      logDebug(`Job creation failed: ${JSON.stringify(jobError)}`);
      return NextResponse.json({ error: `Failed to create crawl job: ${jobError?.message || 'Unknown'}` }, { status: 500 });
    }
    logDebug(`Job created: ${job.id}`);

    // 3. Create Job Item (The actual query to run)
    logDebug('Creating job item...');
    const { error: itemError } = await supabaseAdmin
      .from('crawl_job_items')
      .insert({
        job_id: job.id,
        query: JSON.stringify({ searchTerm: query, limit }),
        status: 'pending'
      });

    if (itemError) {
      logDebug(`Job item failed: ${JSON.stringify(itemError)}`);
      await supabaseAdmin.from('crawl_jobs').delete().eq('id', job.id);
      return NextResponse.json({ error: `Failed to create job item: ${itemError.message}` }, { status: 500 });
    }
    logDebug('Job item created');

    // 4. Create User Requested Crawl Record
    const { error: requestError } = await supabaseAdmin
      .from('user_requested_crawls')
      .insert({
        user_id: user.id,
        crawl_job_id: job.id,
        search_query: query,
        spent_credits: requiredScans // mapped to 'spent_credits' in v10 schema (or scans)
      });

    if (requestError) {
      console.error('Failed to log user request:', requestError);
    }

    // 5. Decrement Quota (skip for admin)
    if (!isAdmin) {
      const { error: rpcError } = await supabase.rpc('decrement_scans', {
        user_id_param: user.id,
        amount: requiredScans
      });

      if (rpcError) {
        console.error('Failed to decrement quota:', rpcError);
      }
    }

    // Trigger process-queue async? Next.js fetch without await or just let a cron handle it.
    // For MVP immediacy, let's hit our own queue processor async
    logDebug('Triggering process queue...');
    try {
      const queueUrl = new URL('/api/cron/process-queue', request.url);
      fetch(queueUrl.toString(), { method: 'POST' }).catch(e => logDebug(`Fetch error: ${e.message}`));
    } catch (e: any) {
      logDebug(`URL parsing error: ${e.message}`);
    }

    logDebug('Returning success');
    return NextResponse.json({ success: true, jobId: job.id });

  } catch (err: any) {
    logDebug(`Catch block error: ${err.message}\n${err.stack}`);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
