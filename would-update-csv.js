#!/usr/bin/env node
// would-update-csv.js — append weekly analysis headlines to would/log-codebase-v1.csv
// Usage: node would-update-csv.js  (run after /would-update skill, from $GITHUB_WORKSPACE)

const fs   = require('fs');
const path = require('path');

const WORKSPACE  = process.env.GITHUB_WORKSPACE || __dirname;
const WOULD_DIR  = path.join(WORKSPACE, 'would');
const CSV_PATH   = path.join(WOULD_DIR, 'log-codebase-v1.csv');
const HEADERS    = 'date,category,type,headline\n';

const CATEGORIES = ['migrate', 'price', 'recovery', 'usage', 'instruction'];
const TYPES      = ['issue', 'asset'];

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
    const after   = content.slice(anchor);
    const match   = after.match(/^##\s+(?:ISSUE|ASSET):[^\n]+→\s*(.+)$/m);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

function toCsvRow(date, category, type, headline) {
  const safe = headline.replace(/"/g, '""');
  return `${date},${category},${type},"${safe}"\n`;
}

function main() {
  const date = nzDate();
  const rows = [];

  for (const cat of CATEGORIES) {
    for (const type of TYPES) {
      const file     = path.join(WOULD_DIR, `${cat}-${type}-v1.md`);
      const headline = extractHeadline(file);
      if (headline) rows.push(toCsvRow(date, cat, type, headline));
    }
  }

  if (rows.length === 0) {
    console.error('❌ No headlines found — skipping CSV update');
    process.exit(1);
  }

  let existing = HEADERS;
  let sha      = null;

  if (fs.existsSync(CSV_PATH)) {
    existing = fs.readFileSync(CSV_PATH, 'utf8');
  }

  const updated = existing + rows.join('');
  fs.writeFileSync(CSV_PATH, updated);
  console.log(`✅ would/-log-codebase-v1.csv — ${rows.length} rows appended (${date})`);
}

main();
