import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

function collectFiles(toolName, toolInput) {
  const editToolNames = new Set(['create_file', 'replace_string_in_file', 'editFiles']);
  if (!editToolNames.has(toolName)) {
    return [];
  }

  const files = new Set();

  if (
    typeof process.env.TOOL_INPUT_FILE_PATH === 'string' &&
    process.env.TOOL_INPUT_FILE_PATH.length > 0
  ) {
    files.add(process.env.TOOL_INPUT_FILE_PATH);
  }

  if (typeof toolInput.filePath === 'string') {
    files.add(toolInput.filePath);
  }

  if (Array.isArray(toolInput.files)) {
    for (const file of toolInput.files) {
      if (typeof file === 'string') {
        files.add(file);
      }
    }
  }

  return [...files].filter((filePath) => existsSync(filePath));
}

const input = await readStdin();
const payload = input ? JSON.parse(input) : {};
const toolName = payload.tool_name ?? payload.toolName ?? '';
const toolInput = payload.tool_input ?? payload.toolInput ?? {};
const files = collectFiles(toolName, toolInput);

if (files.length === 0) {
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

try {
  for (const filePath of files) {
    execFileSync('npx', ['prettier', '--write', '--ignore-unknown', filePath], {
      cwd: payload.cwd ?? process.cwd(),
      stdio: 'ignore',
    });
  }

  process.stdout.write(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Prettier formatted ${files.length} edited file(s).`,
      },
    }),
  );
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown formatting error';
  process.stdout.write(
    JSON.stringify({
      continue: true,
      systemMessage: `Prettier hook warning: ${message}`,
    }),
  );
}
