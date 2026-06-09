#!/usr/bin/env node
// would-update-csv.js — append weekly analysis headlines to would/LOG-METRIC-{QUARTER}.csv

const fs   = require('fs');
const path = require('path');

const RESULTS_DIR = '/tmp/would-results';
const WORKSPACE   = process.env.GITHUB_WORKSPACE || __dirname;
const WOULD_DIR   = path.join(WORKSPACE, 'would');

const CATEGORIES = ['migrate', 'price', 'recovery', 'usage', 'instruction', 'bug', 'analysis'];
const TYPES      = ['issue', 'asset'];
const HEADERS    = 'date,category,type,headline\n';

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

function extractHeadline(tmpPath) {
  try {
    const content = fs.readFileSync(tmpPath, 'utf8');
    const match   = content.match(/^##\s+(?:ISSUE|ASSET):[^\n]+→\s*(.+)$/m);
    return match ? match[1].trim() : '';
  } catch { return ''; }
}

function toCsvRow(date, category, type, headline) {
  return `${date},${category},${type},"${headline.replace(/"/g, '""')}"\n`;
}

function main() {
  const QUARTER  = getCurrentQuarter(process.env.QUARTER_OVERRIDE);
  const CSV_PATH = path.join(WOULD_DIR, `LOG-METRIC-${QUARTER}.csv`);
  const date     = nzDate();
  const rows     = [];

  for (const cat of CATEGORIES) {
    for (const type of TYPES) {
      const tmpPath = path.join(RESULTS_DIR, `${cat}-${type}.txt`);
      const headline = extractHeadline(tmpPath);
      if (headline) rows.push(toCsvRow(date, cat, type, headline));
    }
  }

  if (rows.length === 0) {
    console.error('❌ No headlines found — skipping CSV update');
    process.exit(1);
  }

  fs.mkdirSync(WOULD_DIR, { recursive: true });
  const existing = fs.existsSync(CSV_PATH) ? fs.readFileSync(CSV_PATH, 'utf8') : HEADERS;
  fs.writeFileSync(CSV_PATH, existing + rows.join(''));
  console.log(`✅ ${CSV_PATH} — ${rows.length} rows appended (${date})`);
}

main();
