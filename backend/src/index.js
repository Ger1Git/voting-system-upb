import { createApp } from './app.js';
import { config } from './config.js';
import { autoSetupDatabaseOnStart } from './db/bootstrap.js';

const app = createApp();

async function start() {
  await autoSetupDatabaseOnStart(config.autoSeedOnStart);

  app.listen(config.port, () => {
    console.log(`Voting API listening on http://localhost:${config.port}/api`);
  });
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
