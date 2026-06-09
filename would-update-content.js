#!/usr/bin/env node
// would-update-content.js — upload local could/*-{QUARTER}.md files to GitHub API

const fs   = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'toifood';
const GITHUB_REPO  = 'ts-back';
const WORKSPACE    = process.env.GITHUB_WORKSPACE || __dirname;
const COULD_DIR    = path.join(WORKSPACE, 'could');

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
  return (await res.json()).sha;
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
}

async function main() {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not set');

  const QUARTER = getCurrentQuarter(process.env.QUARTER_OVERRIDE);
  console.log(`Quarter: ${QUARTER}`);

  const files = fs.readdirSync(COULD_DIR).filter(f => f.endsWith(`-${QUARTER}.md`));
  if (files.length === 0) { console.error(`❌ No *-${QUARTER}.md files in could/`); process.exit(1); }

  for (const filename of files) {
    const content = fs.readFileSync(path.join(COULD_DIR, filename), 'utf8');
    const ghPath  = `could/${filename}`;
    let sha = null;
    try { sha = await githubGet(ghPath); } catch {}
    await githubPut(ghPath, sha, content, `would-update: ${filename}`);
    console.log(`✅ ${ghPath}`);
  }

  console.log('\n✅ Done');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
