#!/usr/bin/env node
// would-update-csv.js — extract headlines from skill-modified could/ files → would/LOG-METRIC-{QUARTER}.csv
// Quarter-agnostic for reading: uses git diff to find what the skill wrote.
// Quarter used only for CSV filename — derived from the modified files themselves.

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.GITHUB_WORKSPACE || __dirname;
const COULD_DIR = path.join(WORKSPACE, 'could');
const WOULD_DIR = path.join(WORKSPACE, 'would');
const HEADERS   = 'date,category,type,headline\n';

function nzDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function extractHeadline(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const anchor  = content.indexOf('####### <!-- ANCHOR MARKER');
    if (anchor === -1) return '';
    const match   = content.slice(anchor).match(/^##\s+(?:ISSUE|ASSET):[^\n]+→\s*(.+)$/m);
    return match ? match[1].trim() : '';
  } catch { return ''; }
}

function quarterFromFilename(filename) {
  const match = filename.match(/(\d{4}Q\d)\.md$/);
  return match ? match[1] : null;
}

function main() {
  const modified = execSync('git diff --name-only HEAD -- could/ && git ls-files --others --exclude-standard could/', { cwd: WORKSPACE })
    .toString().trim().split('\n')
    .filter(f => f.endsWith('.md') && f !== '');

  if (modified.length === 0) { console.warn('⚠  No changed could/ files — skipping CSV'); return; }

  const date  = nzDate();
  const byQuarter = {};

  for (const ghPath of modified) {
    const filename = path.basename(ghPath);
    const quarter  = quarterFromFilename(filename);
    if (!quarter) continue;

    const parts   = filename.replace(`-${quarter}.md`, '').toLowerCase().split('-');
    const type    = parts.pop();
    const cat     = parts.join('-');
    const headline = extractHeadline(path.join(WORKSPACE, ghPath));
    if (!headline) continue;

    if (!byQuarter[quarter]) byQuarter[quarter] = [];
    byQuarter[quarter].push(`${date},${cat},${type},"${headline.replace(/"/g, '""')}"\n`);
  }

  if (Object.keys(byQuarter).length === 0) { console.error('❌ No headlines found — skipping CSV'); process.exit(1); }

  fs.mkdirSync(WOULD_DIR, { recursive: true });

  for (const [quarter, rows] of Object.entries(byQuarter)) {
    const CSV_PATH = path.join(WOULD_DIR, `LOG-METRIC-${quarter}.csv`);
    const existing = fs.existsSync(CSV_PATH) ? fs.readFileSync(CSV_PATH, 'utf8') : HEADERS;
    fs.writeFileSync(CSV_PATH, existing + rows.join(''));
    console.log(`✅ ${CSV_PATH} — ${rows.length} rows (${date})`);
  }
}

main();
