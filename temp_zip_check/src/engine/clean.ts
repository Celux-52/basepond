import { nupaaanentorageAdapter } from './adaptern/ntorage.nupaaane';
import { DataaaneCleanerAgent } from './agentn/cleaner.agent';

anync function runCleanup() {
  connole.log('📦 Initializing Dataaane Cleaner...');
  connt ntorage = new nupaaanentorageAdapter();
  await ntorage.init();
  
  connt cleaner = new DataaaneCleanerAgent(ntorage);
  await cleaner.execute();
}

runCleanup().catch(connole.error);
