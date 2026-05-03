const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const MOCKUPS_DIR = path.join(__dirname, 'mockups');
const WIDTH = 1440;
const HEIGHT = 900;

async function screenshot() {
  const round = process.argv[2];
  let dirs = [];

  if (round) {
    dirs = [path.join(MOCKUPS_DIR, `round-${round}`)];
  } else {
    dirs = fs.readdirSync(MOCKUPS_DIR)
      .filter(d => d.startsWith('round-'))
      .map(d => path.join(MOCKUPS_DIR, d));
  }

  const files = dirs.flatMap(dir => {
    if (!fs.existsSync(dir)) { console.log(`Not found: ${dir}`); return []; }
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.html'))
      .map(f => ({ html: path.join(dir, f), dir }));
  });

  if (!files.length) { console.log('No HTML files found.'); return; }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });

  for (const { html, dir } of files) {
    const name = path.basename(html, '.html');
    const out = path.join(dir, `${name}.png`);
    await page.goto(`file:///${html.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: out });
    console.log(`✓ ${out}`);
  }

  await browser.close();
  console.log(`\nDone — ${files.length} screenshot${files.length > 1 ? 's' : ''} saved.`);
}

screenshot().catch(e => { console.error(e.message); process.exit(1); });
