#!/usr/bin/env node
// would-update-content.js — upload skill-modified could/ files to GitHub API
// Quarter-agnostic: uses git diff to find what the skill wrote, not recomputed quarter.

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'toifood';
const GITHUB_REPO  = 'ts-back';
const WORKSPACE    = process.env.GITHUB_WORKSPACE || __dirname;

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

  const modified = execSync('git diff --name-only HEAD -- could/ && git ls-files --others --exclude-standard could/', { cwd: WORKSPACE })
    .toString().trim().split('\n')
    .filter(f => f.endsWith('.md') && f !== '');

  if (modified.length === 0) { console.warn('⚠  No changed could/ files — nothing to upload'); return; }

  for (const ghPath of modified) {
    const content = fs.readFileSync(path.join(WORKSPACE, ghPath), 'utf8');
    let sha = null;
    try { sha = await githubGet(ghPath); } catch {}
    await githubPut(ghPath, sha, content, `would-update: ${ghPath}`);
    console.log(`✅ ${ghPath}`);
  }

  console.log('\n✅ Done');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
