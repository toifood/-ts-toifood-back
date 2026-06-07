const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, 'source');
const MUST = path.join(SOURCE, '-MUST');

function read(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

function sourceContext() {
  const parts = [];
  for (const f of ['README.md', 'package.json', 'prisma/schema.prisma', '.env.example']) {
    const c = read(path.join(SOURCE, f));
    if (c) parts.push(`### ${f}\n\`\`\`\n${c.slice(0, 3000)}\n\`\`\``);
  }
  const srcDir = path.join(SOURCE, 'src');
  if (fs.existsSync(srcDir)) {
    const walk = (dir, depth = 0) => depth > 2 ? [] : fs.readdirSync(dir).flatMap(f => {
      const full = path.join(dir, f);
      return fs.statSync(full).isDirectory() ? walk(full, depth + 1) : [full.replace(SOURCE + path.sep, '')];
    });
    parts.push(`### src/ file tree\n${walk(srcDir).join('\n')}`);
  }
  return parts.join('\n\n');
}

const EMBEDDED_PROMPTS = {
  bug: {
    issue: 'Analyze the codebase for overall and undiscovered bugs — hidden errors, edge cases, race conditions, unhandled exceptions, off-by-one errors, null dereferences, async pitfalls. Focus on non-obvious issues that could cause production failures.',
    asset: 'Identify existing bug-prevention assets in the codebase — error handling, validation, defensive code, test coverage, logging. What is currently protecting against bugs and where are the gaps?',
  },
  analysis: {
    issue: 'Provide an overall code quality and architecture analysis. Identify technical debt, architectural concerns, missing patterns, scalability issues, or areas that could degrade under load or growth.',
    asset: 'Summarize the overall codebase health — what is well-built, the tech stack, what is production-ready vs. in progress, and what the main engineering strengths are.',
  },
};

function buildPrompt(category, type) {
  const embedded = EMBEDDED_PROMPTS[category]?.[type];
  let instruction;
  if (embedded) {
    instruction = embedded;
  } else {
    const fileMap = {
      migrate:     { asset: 'migrate-asset-v1.md',     issue: 'migrate-issue-v1.md' },
      price:       { asset: 'price-asset-v1.md',       issue: 'price-issue-v1.md' },
      recovery:    { asset: 'recovery-asset-v1.md',    issue: 'recovery-issue-v1.md' },
      usage:       { asset: 'usage-asset-v1.md',       issue: 'usage-issue-v1.md' },
      instruction: { asset: 'INSTRUCTION-ASSET_v1.md', issue: 'INSTRUCTION-ASSET_v1.md' },
    };
    const fileName = fileMap[category]?.[type];
    if (!fileName) return '';
    instruction = read(path.join(MUST, fileName));
    if (!instruction) return '';
  }
  const context = sourceContext();
  return `${instruction}\n\n---\n\nHere is the current codebase context:\n\n${context}\n\n---\n\nBased on the above, generate ONLY the next new ${type} entry to add at the top of this log. Follow the format exactly as shown in the instructions above.`;
}

const out = [];
for (const cat of ['migrate', 'price', 'recovery', 'usage', 'instruction', 'bug', 'analysis']) {
  for (const type of ['issue', 'asset']) {
    const key = `${cat}_${type}_prompt`;
    const prompt = buildPrompt(cat, type);
    out.push(`${key}<<GS_EOF\n${prompt}\nGS_EOF`);
  }
}

const dest = process.env.GITHUB_OUTPUT;
if (dest) fs.appendFileSync(dest, out.join('\n') + '\n');
else console.log(out.join('\n'));
