import { app } from './app.js';
import { ensureDemoData } from './lib/demo-data.js';

const PORT = process.env.PORT || 3001;

async function start(): Promise<void> {
  await ensureDemoData();

  app.listen(PORT, () => {
    console.log(`🚀 Zava API running on http://localhost:${PORT}`);
  });
}

void start();
