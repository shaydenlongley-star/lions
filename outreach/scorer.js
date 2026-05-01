/**
 * scorer.js
 * Scores websites in prospects.csv by quality.
 * LOW score = bad website = priority target.
 * Adds websiteScore column and upgrades priority for bad sites.
 *
 * Usage: node scorer.js
 * Skips rows with no website (already marked HIGH priority).
 */

import fetch from 'node-fetch';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const INPUT  = 'prospects.csv';
const TIMEOUT = 8000;

function scoreHtml(html, url, headers, responseTime) {
  let score = 10;
  const h = html.toLowerCase();

  // No viewport = not mobile optimised (-3)
  if (!h.includes('name="viewport"') && !h.includes("name='viewport'")) score -= 3;

  // Table-based layout = ancient (-2)
  if ((h.match(/<table/g) || []).length > 3) score -= 2;

  // No HTTPS (-2)
  if (url.startsWith('http://')) score -= 2;

  // Very small page = mostly empty or splash (-2)
  if (html.length < 8000) score -= 2;

  // No meta description (-1)
  if (!h.includes('meta name="description"') && !h.includes("meta name='description'")) score -= 1;

  // Slow to respond (-1)
  if (responseTime > 4000) score -= 1;

  // Old school indicators (-1)
  if (h.includes('macromedia') || h.includes('flash') || h.includes('marquee')) score -= 1;

  return Math.max(0, score);
}

async function scoreUrl(url) {
  if (!url || !url.startsWith('http')) return null;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteScouter/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();
    const responseTime = Date.now() - start;
    return scoreHtml(html, url, res.headers, responseTime);
  } catch {
    return null;
  }
}

async function run() {
  const raw = readFileSync(INPUT, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, relax_column_count: true });

  console.log(`Scoring ${rows.length} prospects...`);
  let scored = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.website || row.priority === 'HIGH') {
      row.websiteScore = '';
      continue;
    }
    if (row.websiteScore) continue; // already scored

    process.stdout.write(`  [${i + 1}/${rows.length}] ${row.name}... `);
    const score = await scoreUrl(row.website);
    row.websiteScore = score !== null ? String(score) : 'error';
    if (score !== null && score <= 4) row.priority = 'HIGH';
    console.log(score !== null ? `score ${score}${score <= 4 ? ' → HIGH priority' : ''}` : 'unreachable');
    scored++;

    // Polite delay
    await new Promise((r) => setTimeout(r, 500));
  }

  // Re-write CSV
  const headers = Object.keys(rows[0]);
  if (!headers.includes('websiteScore')) headers.push('websiteScore');
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
    ),
  ];
  writeFileSync(INPUT, csvLines.join('\n'), 'utf8');

  const highCount = rows.filter((r) => r.priority === 'HIGH').length;
  console.log(`\nDone. Scored ${scored} sites. ${highCount} total HIGH priority prospects.`);
}

run();
