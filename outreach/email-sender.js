/**
 * email-sender.js — Automated 3-touch cold email sequences
 *
 * Reads prospects.csv, sends the correct touch to each prospect based on
 * their current touchNumber in tracker.json, then updates the tracker.
 *
 * Usage: node email-sender.js
 *   --dry-run    Print emails to console instead of sending
 *   --limit N    Send max N emails this run (default: 20)
 *   --id <id>    Send only to tracker record with this ID
 *
 * Setup: copy .env.example → .env and fill in Gmail OAuth2 credentials.
 * Gmail OAuth2 guide: https://developers.google.com/gmail/api/quickstart/nodejs
 */

import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';

const DB          = 'tracker.json';
const PROSPECTS   = 'prospects.csv';
const MAX_DEFAULT = 20;

// ---- Gmail OAuth2 transport ----
function createTransport() {
  const OAuth2 = google.auth.OAuth2;
  const client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_FROM,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: client.getAccessToken(),
    },
  });
}

// ---- Tracker helpers ----
function loadTracker() {
  return existsSync(DB) ? JSON.parse(readFileSync(DB, 'utf8')) : [];
}

function saveTracker(records) {
  writeFileSync(DB, JSON.stringify(records, null, 2), 'utf8');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function nextId(records) {
  return records.length === 0 ? 1 : Math.max(...records.map((r) => r.id)) + 1;
}

// ---- Email templates ----
function buildEmail(prospect, touch) {
  const name = prospect.name;
  const first = name.split(' ')[0];
  const category = prospect.category;
  const website = prospect.website;
  const whatsapp = process.env.WHATSAPP_NUMBER || '[your WhatsApp number]';

  // Pick the right observation for Touch 1
  let observation = '';
  if (!website) {
    observation = `You don't seem to have a website — which means you're invisible to anyone searching ${category} in Bangkok online.`;
  } else {
    observation = `Your site doesn't show what ${name} is really about — and on mobile it's especially rough.`;
  }

  if (touch === 1) {
    return {
      subject: `Quick thought on ${name}'s website`,
      text: `Hi,

I was looking up ${category} in Bangkok and came across ${name}.

${observation}

I'm a web designer based in Bangkok. I build custom sites for local businesses — no templates, built from scratch. Here's my portfolio: shaydefy.com

I think ${name} could look a lot stronger online. Worth 5 minutes?

Shayden
shaydefy.com`,
    };
  }

  if (touch === 2) {
    const siteNote = website
      ? `Three things I'd change on ${website} right now:`
      : `Three things a website for ${name} needs from day one:`;
    return {
      subject: `Re: Quick thought on ${name}'s website`,
      text: `Hi,

Just following up — wanted to add something more specific.

${siteNote}
1. Mobile optimisation — over 70% of Bangkok searches happen on phone
2. A clear reason why someone should choose ${name} over the 10 other ${category} options on Google Maps
3. One obvious next step for visitors (book, call, WhatsApp — just one)

None of this is a dig — most Bangkok businesses are in the same position. I just think you could be getting a lot more from your online presence.

Still happy to chat if you're open to it.

Shayden
shaydefy.com`,
    };
  }

  if (touch === 3) {
    return {
      subject: `Built something for ${name}`,
      text: `Hi,

Last email from me — I promise.

I spent a couple hours building a mockup of what ${name}'s website could look like.

No strings. I just wanted to show you what's possible rather than tell you.

If you want to see it — or just want to talk — reply here or WhatsApp me: ${whatsapp}

Either way, good luck with the business.

Shayden
shaydefy.com`,
    };
  }
}

// ---- Main ----
async function run() {
  const args = process.argv.slice(2);
  const dryRun  = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit   = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : MAX_DEFAULT;
  const idIdx   = args.indexOf('--id');
  const targetId = idIdx !== -1 ? parseInt(args[idIdx + 1]) : null;

  // Validate env
  if (!dryRun) {
    const required = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_FROM'];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
      console.error('Missing .env vars:', missing.join(', '));
      console.error('Run in dry-run mode with --dry-run to test without credentials.');
      process.exit(1);
    }
  }

  // Load data
  const records  = loadTracker();
  let prospects  = [];
  if (existsSync(PROSPECTS)) {
    const raw = readFileSync(PROSPECTS, 'utf8');
    prospects = parse(raw, { columns: true, skip_empty_lines: true });
  }

  // Find who to email today
  const dueToday = records.filter((r) => {
    if (targetId && r.id !== targetId) return false;
    if (!['sent', 'replied'].includes(r.status) && r.status !== 'sent') return false;
    if (['closed', 'dead', 'interested'].includes(r.status)) return false;
    if (r.touchNumber >= 3) return false;
    if (r.nextFollowUp && r.nextFollowUp > today()) return false;
    return r.channel === 'email';
  }).slice(0, limit);

  // Also pick fresh prospects not yet in tracker (for Touch 1)
  const trackedEmails = new Set(records.map((r) => r.name.toLowerCase()));
  const fresh = prospects
    .filter((p) => p.email && !trackedEmails.has(p.name.toLowerCase()))
    .slice(0, Math.max(0, limit - dueToday.length));

  const transport = dryRun ? null : createTransport();
  let sent = 0;

  // Send follow-ups
  for (const rec of dueToday) {
    const prospect = prospects.find((p) => p.name.toLowerCase() === rec.name.toLowerCase()) || { name: rec.name, category: rec.category, website: rec.website || '' };
    const nextTouch = rec.touchNumber + 1;
    const email = buildEmail(prospect, nextTouch);

    if (!rec.email) { console.log(`[SKIP] ${rec.name} — no email address`); continue; }

    console.log(`[Touch ${nextTouch}] ${rec.name} <${rec.email}>`);
    console.log(`  Subject: ${email.subject}`);

    if (!dryRun) {
      await transport.sendMail({ from: process.env.GMAIL_FROM, to: rec.email, subject: email.subject, text: email.text });
      await new Promise((r) => setTimeout(r, 2000));
    }

    rec.touchNumber = nextTouch;
    rec.dateContacted = today();
    rec.nextFollowUp = nextTouch < 3 ? addDays(nextTouch === 1 ? 3 : 7) : '';
    sent++;
  }

  // Send fresh Touch 1 outreach
  for (const prospect of fresh) {
    const email = buildEmail(prospect, 1);
    console.log(`[Touch 1 NEW] ${prospect.name} <${prospect.email}>`);
    console.log(`  Subject: ${email.subject}`);

    if (!dryRun) {
      await transport.sendMail({ from: process.env.GMAIL_FROM, to: prospect.email, subject: email.subject, text: email.text });
      await new Promise((r) => setTimeout(r, 2000));
    }

    records.push({
      id: nextId(records),
      name: prospect.name,
      category: prospect.category,
      channel: 'email',
      email: prospect.email,
      website: prospect.website || '',
      touchNumber: 1,
      dateContacted: today(),
      status: 'sent',
      nextFollowUp: addDays(3),
      notes: '',
    });
    sent++;
  }

  if (!dryRun) saveTracker(records);
  console.log(`\n${dryRun ? '[DRY RUN] Would have sent' : 'Sent'} ${sent} emails.`);
}

run().catch((err) => { console.error(err); process.exit(1); });
