import { db } from './infrastructure/firebase';
import { liveSyncService } from './services/liveSync.service';

async function run() {
  console.log('Running manual sync...');
  await (liveSyncService as any).pollLiveStatuses();
  console.log('Done.');
  process.exit(0);
}
run();
