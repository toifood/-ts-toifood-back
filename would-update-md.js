#!/usr/bin/env node
// would-update-md.js — invoke /would-update skill locally
// Usage: node would-update-md.js [ts-back|ts-front|ts-web]

const { execSync } = require('child_process');

const target = process.argv[2] || 'ts-back';
console.log(`▶ /would-update ${target}`);
execSync(`claude --dangerously-skip-permissions --print "/would-update ${target}"`, { stdio: 'inherit' });
