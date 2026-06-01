import { SupabaseStorageAdapter } from './adapters/storage.supabase';
import { ExportAgent } from './agents/export.agent';

async function runExport() {
  console.log('📦 Initializing Exporter...');
  const storage = new SupabaseStorageAdapter();
  await storage.init();
  
  const exporter = new ExportAgent(storage);
  await exporter.execute();
}

runExport().catch(console.error);
