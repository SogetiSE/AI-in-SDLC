import { execSync } from 'node:child_process';
import process from 'node:process';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
  });
}

const input = await readStdin();
const payload = input ? JSON.parse(input) : {};

if (payload.stop_hook_active) {
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

try {
  execSync('npm test --workspaces --if-present', {
    cwd: payload.cwd ?? process.cwd(),
    stdio: 'pipe',
    encoding: 'utf8',
  });

  process.stdout.write(
    JSON.stringify({
      continue: true,
      systemMessage: 'Stop hook verified the full workspace test suite passed.',
    }),
  );
} catch (error) {
  const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
  const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
  const combinedOutput = `${stdout}\n${stderr}`.trim().split('\n').slice(-12).join('\n');

  process.stdout.write(
    JSON.stringify({
      continue: true,
      systemMessage: combinedOutput || 'Workspace tests failed during Stop hook execution.',
      hookSpecificOutput: {
        hookEventName: 'Stop',
        decision: 'block',
        reason: 'Run the test suite and fix the failures before the agent session completes.',
      },
    }),
  );
}
