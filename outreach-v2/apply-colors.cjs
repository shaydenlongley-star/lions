// apply-colors.cjs <path-to-incoming-json>
// Reads brand colors JSON, patches :root CSS vars in the matching mockup, re-screenshots.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const incomingFile = process.argv[2];
if (!incomingFile) { console.error('Usage: node apply-colors.cjs <incoming-json>'); process.exit(1); }

const { round, handle, colors } = JSON.parse(fs.readFileSync(incomingFile, 'utf8'));
const { primary, secondary, accent, bg, text } = colors;

// Find the mockup file for this handle
const roundDir = path.join(__dirname, 'mockups', `round-${round}`);
if (!fs.existsSync(roundDir)) { console.error(`Round dir not found: ${roundDir}`); process.exit(1); }

// Match by handle similarity — strip dots/underscores and compare lowercase
const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const files = fs.readdirSync(roundDir).filter(f => f.endsWith('.html'));
const match = files.find(f => normalize(path.basename(f, '.html')).includes(normalize(handle)) ||
                               normalize(handle).includes(normalize(path.basename(f, '.html'))));

if (!match) {
  console.error(`No mockup found for handle "${handle}" in round-${round}. Files: ${files.join(', ')}`);
  process.exit(1);
}

const mockupPath = path.join(roundDir, match);
let html = fs.readFileSync(mockupPath, 'utf8');

// Replace the :root CSS vars block
const rootBlock = `  --brand-primary: ${primary};
  --brand-secondary: ${secondary};
  --brand-accent: ${accent};
  --brand-bg: ${bg};
  --brand-text: ${text};`;

if (html.includes('--brand-primary:')) {
  // Template-style mockup — patch vars
  html = html.replace(/--brand-primary:\s*[^;]+;/, `--brand-primary: ${primary};`);
  html = html.replace(/--brand-secondary:\s*[^;]+;/, `--brand-secondary: ${secondary};`);
  html = html.replace(/--brand-accent:\s*[^;]+;/, `--brand-accent: ${accent};`);
  html = html.replace(/--brand-bg:\s*[^;]+;/, `--brand-bg: ${bg};`);
  html = html.replace(/--brand-text:\s*[^;]+;/, `--brand-text: ${text};`);
  fs.writeFileSync(mockupPath, html, 'utf8');
  console.log(`[COLORS APPLIED] ${match} — primary:${primary} secondary:${secondary} accent:${accent} bg:${bg} text:${text}`);
} else {
  console.log(`[SKIP] ${match} uses hardcoded colors — update manually or use CSS var template`);
  process.exit(0);
}

// Re-screenshot
try {
  execSync(`node "${path.join(__dirname, 'screenshot.cjs')}" ${round}`, { stdio: 'inherit', cwd: __dirname });
  console.log(`[SCREENSHOT] Round ${round} done`);
} catch (e) {
  console.error('[SCREENSHOT ERROR]', e.message);
}
