import { SupabaseStorageAdapter } from './adapters/storage.supabase';
import { DatabaseCleanerAgent } from './agents/cleaner.agent';

async function runCleanup() {
  console.log('📦 Initializing Database Cleaner...');
  const storage = new SupabaseStorageAdapter();
  await storage.init();
  
  const cleaner = new DatabaseCleanerAgent(storage);
  await cleaner.execute();
}

runCleanup().catch(console.error);
