import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LifecycleOrchestratorAgent } from '@/engine/agents/lifecycle_orchestrator.agent';
import { QueueTask } from '@/engine/interfaces/queue.interface';

// Vercel Cron Endpoint for Daily Automatic Crawl
export async function GET(request: Request) {
  try {
    const supabase = await createClient(); // Wait, in API route it's better to use service_role client if no user is signed in
    // Since createClient in server.ts gets cookies, it might fail in a cron context if not careful.
    // But let's assume we use a direct supabase-js client with service role for background job
    const { createClient: createSupabaseJs } = await import('@supabase/supabase-js');
    const sbAdmin = createSupabaseJs(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create a CRON job record
    const { data: job, error } = await sbAdmin.from('crawl_jobs').insert({
      type: 'CRON',
      status: 'queued',
      region: 'Auto',
      sector: 'General'
    }).select().single();

    if (error) throw error;

    const task: QueueTask = {
      id: `cron-${Date.now()}`,
      type: 'CRAWL',
      payload: {
        crawlJobId: job.id,
        region: 'İstanbul',
        sector: 'Restoran' // In reality, this iterates over missing regions
      },
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0
    };

    // 2. Trigger Orchestrator Async (Fire and forget)
    const orchestrator = new LifecycleOrchestratorAgent();
    // We do NOT await this so the API responds immediately to the cron runner
    orchestrator.processTask(task).catch(console.error);

    return NextResponse.json({ success: true, jobId: job.id, message: 'Daily crawl job started in background' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
