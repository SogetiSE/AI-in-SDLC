import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(scriptDir, '..');
const testDbPath = path.resolve(apiRoot, 'prisma', 'test.db');
const testDatabaseUrl = `file:${testDbPath.replace(/\\/g, '/')}`;
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const vitestArgs = process.argv.slice(2);

for (const filePath of [testDbPath, `${testDbPath}-journal`]) {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
}

execFileSync(
  command,
  ['prisma', 'db', 'push', '--schema', 'prisma/schema.test.prisma', '--skip-generate'],
  {
    cwd: apiRoot,
    stdio: 'inherit',
  },
);

execFileSync(command, ['vitest', ...vitestArgs], {
  cwd: apiRoot,
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
  stdio: 'inherit',
});
