import { SupabaseStorageAdapter } from './adapters/storage.supabase';
import { OrchestratorAgent } from './agents/orchestrator.agent';

async function bootstrap() {
  console.log('🚀 Bootstrapping Basepound V2 Engine...');
  
  // 1. Initialize Storage
  const storage = new SupabaseStorageAdapter();
  await storage.init();
  
  // 2. Initialize Orchestrator
  const orchestrator = new OrchestratorAgent(storage);
  
  // 3. Run Pipeline
  await orchestrator.execute();
}

bootstrap().catch(err => {
  console.error('Fatal Error during Engine Bootstrap:', err);
  process.exit(1);
});
