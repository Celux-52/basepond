import { NextResponse } from 'next/server';
import { SupabaseStorageAdapter } from '@/engine/adapters/storage.supabase';
import { OrchestratorAgent } from '@/engine/agents/orchestrator.agent';

export const dynamic = 'force-dynamic';
// Vercel gibi platformlarda uzun sürmesi için maxDuration (saniye) artırılabilir:
export const maxDuration = 300; 

export async function POST(req: Request) {
  try {
    let body = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}
    console.log('Agent Triggered via Webhook. Payload:', body);

    // İşlemi arka planda (asenkron) başlatıyoruz.
    // Next.js API Routes (serverless) uzun süren işlemleri beklemeden response dönebilmeli.
    // Coolify (Node server) üzerinde bu arka planda çalışmaya devam edecektir.
    startAgentEngine().catch(console.error);

    return NextResponse.json({ 
      success: true, 
      message: 'Agent orchestration started in the background.' 
    });

  } catch (error: any) {
    console.error('Trigger error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function startAgentEngine() {
  console.log('🚀 Bootstrapping Basepound V2 Engine from API...');
  
  // 1. Initialize Storage
  const storage = new SupabaseStorageAdapter();
  await storage.init();
  
  // 2. Initialize Orchestrator
  const orchestrator = new OrchestratorAgent(storage);
  
  // 3. Run Pipeline
  await orchestrator.execute();
  console.log('✅ Basepound V2 Engine execution finished.');
}
