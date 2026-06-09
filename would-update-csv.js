#!/usr/bin/env node
// would-update-csv.js — extract headlines from local could/*-{QUARTER}.md and append to would/LOG-METRIC-{QUARTER}.csv

const fs  = require('fs');
const path = require('path');

const WORKSPACE = process.env.GITHUB_WORKSPACE || __dirname;
const COULD_DIR = path.join(WORKSPACE, 'could');
const WOULD_DIR = path.join(WORKSPACE, 'would');
const HEADERS   = 'date,category,type,headline\n';

function getCurrentQuarter(override) {
  if (override) return override;
  const now = new Date();
  return `${now.getFullYear()}Q${Math.ceil((now.getMonth() + 1) / 3)}`;
}

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

function main() {
  const QUARTER  = getCurrentQuarter(process.env.QUARTER_OVERRIDE);
  const CSV_PATH = path.join(WOULD_DIR, `LOG-METRIC-${QUARTER}.csv`);
  const date     = nzDate();
  const rows     = [];

  const files = fs.readdirSync(COULD_DIR).filter(f => f.endsWith(`-${QUARTER}.md`));

  for (const filename of files) {
    const parts    = filename.replace(`-${QUARTER}.md`, '').toLowerCase().split('-');
    const type     = parts.pop();
    const cat      = parts.join('-');
    const headline = extractHeadline(path.join(COULD_DIR, filename));
    if (headline) rows.push(`${date},${cat},${type},"${headline.replace(/"/g, '""')}"\n`);
  }

  if (rows.length === 0) { console.error('❌ No headlines found — skipping CSV'); process.exit(1); }

  fs.mkdirSync(WOULD_DIR, { recursive: true });
  const existing = fs.existsSync(CSV_PATH) ? fs.readFileSync(CSV_PATH, 'utf8') : HEADERS;
  fs.writeFileSync(CSV_PATH, existing + rows.join(''));
  console.log(`✅ ${CSV_PATH} — ${rows.length} rows (${date})`);
}

main();
