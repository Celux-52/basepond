'use server';

import { createClient } from '@/lib/supabase/server';
import { LifecycleOrchestratorAgent } from '@/engine/agents/lifecycle_orchestrator.agent';
import { QueueTask } from '@/engine/interfaces/queue.interface';

export async function initiateOnDemandCrawl(searchQuery: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Unauthorized');

  const userId = userData.user.id;
  const COST = 10;

  // Use service role client for background writes to prevent RLS issues in background tasks
  const { createClient: createSupabaseJs } = await import('@supabase/supabase-js');
  const sbAdmin = createSupabaseJs(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Check wallet and deduct credits
  const { data: profile } = await sbAdmin.from('profiles').select('credits').eq('id', userId).single();
  if (!profile || profile.credits < COST) {
    throw new Error(`Yetersiz bakiye. Bu işlem için ${COST} kredi gerekiyor.`);
  }

  // Deduct
  await sbAdmin.from('profiles').update({ credits: profile.credits - COST }).eq('id', userId);

  // 2. Create Job
  const { data: job, error: jobErr } = await sbAdmin.from('crawl_jobs').insert({
    type: 'ON_DEMAND',
    status: 'queued',
    region: searchQuery, // simplified
    sector: 'User Demand'
  }).select().single();

  if (jobErr) throw jobErr;

  // 3. Log user request
  await sbAdmin.from('user_requested_crawls').insert({
    user_id: userId,
    crawl_job_id: job.id,
    search_query: searchQuery,
    spent_credits: COST
  });

  // 4. Trigger Orchestrator Async
  const task: QueueTask = {
    id: `on-demand-${Date.now()}`,
    type: 'CRAWL',
    payload: {
      crawlJobId: job.id,
      region: searchQuery,
      sector: 'Genel'
    },
    status: 'pending',
    createdAt: new Date(),
    retryCount: 0
  };

  const orchestrator = new LifecycleOrchestratorAgent();
  // Fire and forget
  orchestrator.processTask(task).catch(console.error);

  return { success: true, jobId: job.id };
}

export async function checkCrawlJobStatus(jobId: string) {
  const { createClient: createSupabaseJs } = await import('@supabase/supabase-js');
  const sbAdmin = createSupabaseJs(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await sbAdmin.from('crawl_jobs').select('*').eq('id', jobId).single();
  if (error || !data) throw new Error('Job not found');

  return data;
}
