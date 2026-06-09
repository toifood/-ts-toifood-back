#!/usr/bin/env node
// would-read-md.js — fetch ts-toifood-back source, output codebase context to /tmp/would-source.txt

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_OWNER = 'toifood-dev';
const REPO_NAME  = 'ts-toifood-back';
const ZIP_PATH   = '/tmp/toifood-source.zip';
const EXTRACT    = '/tmp/toifood-source';
const OUT_PATH   = '/tmp/would-read-content.txt';

async function getLatestBranch() {
  const raw      = execSync(`gh api repos/${REPO_OWNER}/${REPO_NAME}/branches --jq '[.[].name]'`).toString();
  const branches = JSON.parse(raw);
  let latestBranch = '';
  let latestDate   = '';
  for (const branch of branches) {
    if (branch === 'main') continue;
    try {
      const date = execSync(
        `gh api repos/${REPO_OWNER}/${REPO_NAME}/compare/main...${branch} --jq '.commits[-1].commit.committer.date'`
      ).toString().trim().replace(/"/g, '');
      if (date > latestDate) { latestDate = date; latestBranch = branch; }
    } catch {}
  }
  return latestBranch || 'main';
}

function read(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

function walk(dir, depth = 0) {
  if (depth > 3 || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap(f => {
    const full = path.join(dir, f);
    return fs.statSync(full).isDirectory() ? walk(full, depth + 1) : [full.replace(dir + path.sep, 'src/')];
  });
}

async function main() {
  const branch = await getLatestBranch();
  console.log(`Branch: ${branch}`);

  execSync(`rm -rf ${EXTRACT}`);
  execSync(`gh api repos/${REPO_OWNER}/${REPO_NAME}/zipball/${branch} > ${ZIP_PATH}`);
  execSync(`unzip -q ${ZIP_PATH} -d ${EXTRACT}`);
  const root = fs.readdirSync(EXTRACT)
    .map(f => path.join(EXTRACT, f))
    .find(f => fs.statSync(f).isDirectory());

  const parts = [`## CODEBASE: ${REPO_NAME} (branch: ${branch})\n`];

  for (const f of ['README.md', 'package.json', 'prisma/schema.prisma']) {
    const c = read(path.join(root, f));
    if (c) parts.push(`### ${f}\n\`\`\`\n${c.slice(0, 3000)}\n\`\`\``);
  }

  const srcDir = path.join(root, 'src');
  if (fs.existsSync(srcDir)) {
    parts.push(`### src/ file tree\n${walk(srcDir).join('\n')}`);
  }

  const mustDir  = path.join(root, '-MUST');
  const cats     = ['migrate', 'price', 'recovery', 'usage', 'instruction'];
  const mustParts = ['\n## INSTRUCTIONS\n'];
  for (const cat of cats) {
    for (const type of ['issue', 'asset']) {
      const candidates = [
        `${cat}-${type}.md`, `${cat}-${type}-v1.md`,
        `${cat.toUpperCase()}-${type.toUpperCase()}.md`,
      ];
      let content = '';
      for (const name of candidates) {
        content = read(path.join(mustDir, name));
        if (content) break;
      }
      if (content) mustParts.push(`### ${cat} ${type}\n${content}`);
    }
  }
  parts.push(...mustParts);

  fs.writeFileSync(OUT_PATH, parts.join('\n\n'));
  console.log(`✅ ${OUT_PATH} (${fs.statSync(OUT_PATH).size} bytes)`);

  execSync(`rm -rf ${ZIP_PATH} ${EXTRACT}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
