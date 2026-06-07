const https = require('https');

const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'ts-back';
const OWNER = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'toifood';
const TOKEN = process.env.GITHUB_TOKEN;

const files = {
  'would/MIGRATE-ISSUE-V1.md':     process.env.MIGRATE_ISSUE,
  'would/MIGRATE-ASSET-V1.md':     process.env.MIGRATE_ASSET,
  'would/PRICE-ISSUE-V1.md':       process.env.PRICE_ISSUE,
  'would/PRICE-ASSET-V1.md':       process.env.PRICE_ASSET,
  'would/RECOVERY-ISSUE-V1.md':    process.env.RECOVERY_ISSUE,
  'would/RECOVERY-ASSET-V1.md':    process.env.RECOVERY_ASSET,
  'would/USAGE-ISSUE-V1.md':       process.env.USAGE_ISSUE,
  'would/USAGE-ASSET-V1.md':       process.env.USAGE_ASSET,
  'would/INSTRUCTION-ISSUE-V1.md': process.env.INSTRUCTION_ISSUE,
  'would/INSTRUCTION-ASSET-V1.md': process.env.INSTRUCTION_ASSET,
};

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'ts-back-pipeline',
        'Accept': 'application/vnd.github.v3+json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function updateFile(filePath, content) {
  if (!content) { console.log(`SKIP ${filePath} — no content`); return; }
  const date = new Date().toISOString().slice(0, 10);
  let sha;
  try {
    const existing = await api('GET', `/repos/${OWNER}/${REPO}/contents/${filePath}`);
    sha = existing.sha;
    const prev = Buffer.from(existing.content, 'base64').toString('utf8');
    content = content + '\n\n' + prev;
  } catch {}
  await api('PUT', `/repos/${OWNER}/${REPO}/contents/${filePath}`, {
    message: `would: update ${filePath.split('/').pop()} ${date}`,
    content: Buffer.from(content).toString('base64'),
    ...(sha ? { sha } : {}),
  });
  console.log(`✓ ${filePath}`);
}

(async () => {
  for (const [filePath, content] of Object.entries(files)) {
    await updateFile(filePath, content);
  }
})();
