import process from 'node:process';

/**
 * PreToolUse secret-scanner hook for GitHub Copilot.
 *
 * Scans the content of every tool call (file writes, edits, terminal commands)
 * for hard-coded credentials and denies the call when a secret is detected.
 *
 * It is field-name agnostic: it recursively gathers every string value from
 * `tool_input`, so it works regardless of which write/edit tool Copilot uses.
 */

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

function emit(decision, reason) {
  const hookSpecificOutput = {
    hookEventName: 'PreToolUse',
    permissionDecision: decision,
  };
  if (reason) hookSpecificOutput.permissionDecisionReason = reason;
  process.stdout.write(JSON.stringify({ continue: true, hookSpecificOutput }));
  process.exit(0);
}

// Collect every string value found anywhere in the tool input.
function collectStrings(value, out) {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

// Pull out anything that looks like a target file path, to skip example files.
function findPath(toolInput) {
  for (const key of ['filePath', 'file_path', 'path', 'file', 'targetFile', 'uri']) {
    const v = toolInput?.[key];
    if (typeof v === 'string') return v;
  }
  return '';
}

// High-precision provider patterns — these effectively never false-positive.
const SECRET_PATTERNS = [
  { name: 'AWS access key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/ },
  { name: 'GitHub fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Stripe live secret key', re: /\bsk_live_[0-9a-zA-Z]{16,}\b/ },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'OpenAI API key', re: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}\b/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  {
    name: 'JSON Web Token',
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

// Generic `secret = "<value>"` assignments with a long, non-placeholder value.
const GENERIC_ASSIGNMENT =
  /(?:api[_-]?key|secret|token|password|passwd|pwd|access[_-]?key|client[_-]?secret)\s*[:=]\s*['"]([^'"\n]{16,})['"]/i;

// Values that are obviously placeholders / documented dev defaults — never block these.
const PLACEHOLDER =
  /^(?:zava-dev-secret|changeme|change-me|your[-_].*|<.*>|x{3,}|placeholder|example|todo|secret|password|test|dummy|fake|\$\{?[A-Z_]+\}?|process\.env\.)/i;

const input = await readStdin();

let payload;
try {
  payload = input ? JSON.parse(input) : {};
} catch {
  // Never break the agent on a malformed payload — fail open.
  emit('allow');
}

const toolInput = payload.tool_input ?? payload.toolInput ?? {};
const targetPath = findPath(toolInput);

// Don't scan example/sample/template/fixture files — they intentionally carry fake values.
const isExampleFile =
  /(\.example|\.sample|\.template|\.dist)$|(?:^|[\\/])(?:fixtures?|__fixtures__|examples?)[\\/]/i.test(
    targetPath,
  );

const haystack = collectStrings(toolInput, []).join('\n');

let finding = null;

for (const { name, re } of SECRET_PATTERNS) {
  if (re.test(haystack)) {
    finding = name;
    break;
  }
}

if (!finding && !isExampleFile) {
  const m = GENERIC_ASSIGNMENT.exec(haystack);
  if (m && !PLACEHOLDER.test(m[1].trim())) {
    finding = 'hard-coded credential assignment';
  }
}

if (finding) {
  emit(
    'deny',
    `Possible secret blocked by workspace policy: ${finding}${
      targetPath ? ` (in ${targetPath})` : ''
    }. Use an environment variable or a secrets manager instead of committing the value.`,
  );
}

emit('allow');
