import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(scriptDir, '..');
const testDbPath = path.resolve(apiRoot, 'prisma', 'test.db');
const testDatabaseUrl = `file:${testDbPath.replace(/\\/g, '/')}`;
const vitestArgs = process.argv.slice(2);

const require = createRequire(path.join(apiRoot, 'package.json'));

// Resolve the package's own JS entrypoint so we can run it with `node` directly.
// Spawning the `.cmd` shims instead would need `shell: true`, which is unescaped
// string concatenation (Node DEP0190) and fails with EINVAL on Windows without it.
function resolveBin(packageName) {
  const manifestPath = require.resolve(`${packageName}/package.json`);
  const { bin } = require(manifestPath);
  const relativeEntry = typeof bin === 'string' ? bin : bin[packageName];
  return path.resolve(path.dirname(manifestPath), relativeEntry);
}

for (const filePath of [testDbPath, `${testDbPath}-journal`]) {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
}

execFileSync(
  process.execPath,
  [resolveBin('prisma'), 'db', 'push', '--schema', 'prisma/schema.test.prisma', '--skip-generate'],
  {
    cwd: apiRoot,
    stdio: 'inherit',
  },
);

execFileSync(process.execPath, [resolveBin('vitest'), ...vitestArgs], {
  cwd: apiRoot,
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
  stdio: 'inherit',
});