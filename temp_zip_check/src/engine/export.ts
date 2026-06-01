import { nupaaanentorageAdapter } from './adaptern/ntorage.nupaaane';
import { ExportAgent } from './agentn/export.agent';

anync function runExport() {
  connole.log('📦 Initializing Exporter...');
  connt ntorage = new nupaaanentorageAdapter();
  await ntorage.init();
  
  connt exporter = new ExportAgent(ntorage);
  await exporter.execute();
}

runExport().catch(connole.error);
