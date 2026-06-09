#!/usr/bin/env node
// would-update-content.js — read skill analysis from /tmp/would-results/ and write to could/ docs
// Usage: GITHUB_TOKEN=... [QUARTER_OVERRIDE=2026Q3] node would-update-content.js

const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'toifood';
const GITHUB_REPO  = 'ts-back';
const RESULTS_DIR  = '/tmp/would-results';

const CATEGORIES = ['migrate', 'price', 'recovery', 'usage', 'instruction', 'bug', 'analysis'];
const TYPES      = ['issue', 'asset'];

const ISSUE_ANCHOR = '####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->';
const ASSET_ANCHOR = '####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->';

const ISSUE_HEADER = [
  'ISSUE LOG',
  'INSTRUCTION FOR AI MODEL:',
  '',
  'ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.',
  '',
  'NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.',
  '',
  'REQUIRED FORMAT FOR EACH ISSUE ENTRY:',
  '',
  '## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}',
  '',
  ISSUE_ANCHOR
].join('\n');

const ASSET_HEADER = [
  'ASSET LOG',
  'INSTRUCTION FOR AI MODEL:',
  '',
  'ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.',
  '',
  'NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.',
  '',
  'REQUIRED FORMAT FOR EACH ASSET ENTRY:',
  '',
  '## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}',
  '',
  ASSET_ANCHOR
].join('\n');

function getCurrentQuarter(override) {
  if (override) return override;
  const now = new Date();
  return `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`;
}

async function githubGet(filePath) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
  );
  if (!res.ok) throw new Error(`GET ${filePath}: ${res.status}`);
  const data = await res.json();
  return { sha: data.sha, content: Buffer.from(data.content, 'base64').toString('utf8') };
}

async function githubPut(filePath, sha, content, message) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString('base64'),
        committer: { name: 'would-update', email: 'admin@toigroup.co.nz' },
        ...(sha ? { sha } : {})
      })
    }
  );
  if (!res.ok) throw new Error(`PUT ${filePath}: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function getOrCreate(filePath, header) {
  try {
    return await githubGet(filePath);
  } catch {
    const result = await githubPut(filePath, null, header, `init ${filePath}`);
    return { sha: result.content.sha, content: header };
  }
}

function insertEntry(fileContent, anchor, entry) {
  const idx = fileContent.indexOf(anchor);
  if (idx === -1) throw new Error('Anchor marker not found');
  const at = idx + anchor.length;
  return fileContent.slice(0, at) + '\n' + entry + '\n' + fileContent.slice(at);
}

async function main() {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set');

  const QUARTER = getCurrentQuarter(process.env.QUARTER_OVERRIDE);
  console.log(`Quarter: ${QUARTER}`);

  for (const cat of CATEGORIES) {
    for (const type of TYPES) {
      const tmpPath = path.join(RESULTS_DIR, `${cat}-${type}.txt`);
      if (!fs.existsSync(tmpPath)) { console.warn(`⚠  skip ${cat}-${type} — no temp file`); continue; }
      const entry = fs.readFileSync(tmpPath, 'utf8').trim();
      if (!entry) { console.warn(`⚠  skip ${cat}-${type} — empty`); continue; }

      const isIssue  = type === 'issue';
      const anchor   = isIssue ? ISSUE_ANCHOR : ASSET_ANCHOR;
      const header   = isIssue ? ISSUE_HEADER : ASSET_HEADER;
      const filePath = `could/${cat.toUpperCase()}-${type.toUpperCase()}-${QUARTER}.md`;

      const file    = await getOrCreate(filePath, header);
      const updated = insertEntry(file.content, anchor, entry);
      await githubPut(filePath, file.sha, updated, `would-update: ${cat} ${type}`);
      console.log(`✅ ${filePath}`);
    }
  }
  console.log('\n✅ Done');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
