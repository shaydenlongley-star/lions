/**
 * prospect-finder.js
 * Scrapes Bangkok businesses from Google Maps via SerpAPI.
 * Outputs prospects.csv with name, category, website, phone, mapsUrl, priority.
 *
 * Usage: node prospect-finder.js
 * Free tier: 100 searches/month at serpapi.com
 */

import { getJson } from 'serpapi';
import { createObjectCsvWriter } from 'csv-writer';
import { existsSync, readFileSync } from 'fs';
import 'dotenv/config';

const CATEGORIES = [
  'yoga studio Bangkok',
  'dance studio Bangkok',
  'art gallery Bangkok',
  'pottery class Bangkok',
  'language school Bangkok',
  'pilates studio Bangkok',
  'wine bar Bangkok',
  'event venue Bangkok',
  'skincare clinic Bangkok',
  'wedding photographer Bangkok',
];

const OUTPUT = 'prospects.csv';

async function searchCategory(category) {
  console.log(`Searching: ${category} Bangkok...`);
  const results = await getJson({
    engine: 'google_maps',
    q: `${category} Bangkok`,
    type: 'search',
    api_key: process.env.SERPAPI_KEY,
  });

  const places = results.local_results || [];
  return places.map((p) => ({
    name: p.title || '',
    category,
    website: p.website || '',
    phone: p.phone || '',
    address: p.address || '',
    mapsUrl: p.links?.directions || p.place_id_search || '',
    rating: p.rating || '',
    reviews: p.reviews || '',
    priority: !p.website ? 'HIGH' : 'NORMAL',
  }));
}

async function run() {
  if (!process.env.SERPAPI_KEY) {
    console.error('ERROR: SERPAPI_KEY not set in .env');
    process.exit(1);
  }

  // Load existing prospects to skip duplicates
  const existing = new Set();
  if (existsSync(OUTPUT)) {
    const raw = readFileSync(OUTPUT, 'utf8');
    raw.split('\n').slice(1).forEach((line) => {
      const name = line.split(',')[0]?.replace(/"/g, '').trim();
      if (name) existing.add(name.toLowerCase());
    });
    console.log(`Found ${existing.size} existing prospects — will skip duplicates.`);
  }

  const writer = createObjectCsvWriter({
    path: OUTPUT,
    header: [
      { id: 'name',     title: 'name' },
      { id: 'category', title: 'category' },
      { id: 'website',  title: 'website' },
      { id: 'phone',    title: 'phone' },
      { id: 'address',  title: 'address' },
      { id: 'mapsUrl',  title: 'mapsUrl' },
      { id: 'rating',   title: 'rating' },
      { id: 'reviews',  title: 'reviews' },
      { id: 'priority', title: 'priority' },
      { id: 'email',    title: 'email' },
      { id: 'notes',    title: 'notes' },
    ],
    append: existsSync(OUTPUT),
  });

  let total = 0;
  for (const category of CATEGORIES) {
    try {
      const results = await searchCategory(category);
      const fresh = results.filter((r) => !existing.has(r.name.toLowerCase()));
      if (fresh.length > 0) {
        await writer.writeRecords(fresh);
        total += fresh.length;
        console.log(`  → ${fresh.length} new (${results.length - fresh.length} skipped as duplicates)`);
      }
      // Polite delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      console.error(`  ERROR on "${category}":`, err.message);
    }
  }

  console.log(`\nDone. ${total} new prospects saved to ${OUTPUT}`);
  console.log(`HIGH priority (no website): run "grep HIGH prospects.csv | wc -l" to count`);
}

run();
