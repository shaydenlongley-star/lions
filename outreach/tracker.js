/**
 * tracker.js — Outreach tracking CLI
 *
 * Commands:
 *   node tracker.js list                  — show all contacts
 *   node tracker.js follow-up             — show who needs follow-up today
 *   node tracker.js add                   — interactive: add manual outreach entry
 *   node tracker.js update <id> <status>  — update status
 *   node tracker.js stats                 — summary counts
 *
 * Statuses: sent | replied | interested | closed | dead
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';

const DB = 'tracker.json';
const STATUSES = ['sent', 'replied', 'interested', 'closed', 'dead'];

function load() {
  return existsSync(DB) ? JSON.parse(readFileSync(DB, 'utf8')) : [];
}

function save(records) {
  writeFileSync(DB, JSON.stringify(records, null, 2), 'utf8');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function nextId(records) {
  return records.length === 0 ? 1 : Math.max(...records.map((r) => r.id)) + 1;
}

function statusColor(s) {
  const map = { sent: '\x1b[33m', replied: '\x1b[36m', interested: '\x1b[32m', closed: '\x1b[35m', dead: '\x1b[90m' };
  return (map[s] || '') + s + '\x1b[0m';
}

function printRecord(r) {
  console.log(
    `[${r.id}] ${r.name} (${r.category}) | ${r.channel} | Touch ${r.touchNumber} | ` +
    `${statusColor(r.status)} | Contacted: ${r.dateContacted} | Follow-up: ${r.nextFollowUp || '—'}`
  );
  if (r.notes) console.log(`     Notes: ${r.notes}`);
}

// ---- COMMANDS ----

function cmdList() {
  const records = load();
  if (records.length === 0) { console.log('No records yet.'); return; }
  records.forEach(printRecord);
  console.log(`\nTotal: ${records.length}`);
}

function cmdFollowUp() {
  const records = load();
  const due = records.filter((r) => r.nextFollowUp && r.nextFollowUp <= today() && !['closed', 'dead'].includes(r.status));
  if (due.length === 0) { console.log('Nothing due today.'); return; }
  console.log(`\n📬 Follow-ups due today (${today()}):\n`);
  due.forEach(printRecord);
}

function cmdStats() {
  const records = load();
  const counts = {};
  STATUSES.forEach((s) => (counts[s] = 0));
  records.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
  console.log('\nOutreach stats:');
  Object.entries(counts).forEach(([s, n]) => console.log(`  ${statusColor(s)}: ${n}`));
  console.log(`  Total: ${records.length}`);
}

function cmdToday() {
  const records = load();
  const sent = records.filter((r) => r.dateContacted === today());
  console.log(`\nSent today (${today()}): ${sent.length}/20\n`);
  sent.forEach(printRecord);
}

function cmdLog(name, category, channel, touch, status, notes) {
  if (!name || !channel) {
    console.error('Usage: node tracker.js log "<name>" "<category>" <channel> [touch] [status] [notes]');
    process.exit(1);
  }
  const records = load();
  const dateContacted = today();
  const touchNum = parseInt(touch) || 1;
  const st = STATUSES.includes(status) ? status : 'sent';
  const nextFollowUp = touchNum < 3 ? addDays(dateContacted, touchNum === 1 ? 3 : 7) : '';
  const record = {
    id: nextId(records),
    name,
    category: category || '',
    channel,
    touchNumber: touchNum,
    dateContacted,
    status: st,
    nextFollowUp,
    notes: notes || '',
  };
  records.push(record);
  save(records);
  console.log(`Logged [${record.id}] ${name} | ${channel} | ${statusColor(st)} | Follow-up: ${nextFollowUp || 'none'}`);
}

async function cmdAdd() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));
  const records = load();

  console.log('\nAdd outreach record (press Enter to skip optional fields)\n');
  const name     = await ask('Business name: ');
  const category = await ask('Category: ');
  const channel  = await ask('Channel (email/instagram/whatsapp/linkedin): ');
  const touch    = await ask('Touch number (1/2/3): ');
  const status   = await ask('Status (sent/replied/interested/closed/dead) [sent]: ') || 'sent';
  const notes    = await ask('Notes (optional): ');

  const dateContacted = today();
  const touchNum = parseInt(touch) || 1;
  const nextFollowUp = touchNum < 3 ? addDays(dateContacted, touchNum === 1 ? 3 : 7) : '';

  const record = {
    id: nextId(records),
    name,
    category,
    channel,
    touchNumber: touchNum,
    dateContacted,
    status,
    nextFollowUp,
    notes,
  };

  records.push(record);
  save(records);
  rl.close();
  console.log(`\nSaved. ID: ${record.id} | Next follow-up: ${nextFollowUp || 'none'}`);
}

function cmdUpdate(id, status) {
  if (!id || !status) {
    console.error('Usage: node tracker.js update <id> <status>');
    console.error('Statuses:', STATUSES.join(', '));
    process.exit(1);
  }
  if (!STATUSES.includes(status)) {
    console.error('Invalid status. Options:', STATUSES.join(', '));
    process.exit(1);
  }
  const records = load();
  const rec = records.find((r) => r.id === parseInt(id));
  if (!rec) { console.error(`No record with ID ${id}`); process.exit(1); }
  rec.status = status;
  if (['closed', 'dead'].includes(status)) rec.nextFollowUp = '';
  save(records);
  console.log(`Updated [${id}] ${rec.name} → ${statusColor(status)}`);
}

// ---- ROUTER ----
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'list':      cmdList();             break;
  case 'follow-up': cmdFollowUp();         break;
  case 'stats':     cmdStats();            break;
  case 'today':     cmdToday();            break;
  case 'add':       cmdAdd();              break;
  case 'log':       cmdLog(...args);       break;
  case 'update':    cmdUpdate(...args);    break;
  default:
    console.log('Commands: list | follow-up | stats | today | add | log "<name>" "<category>" <channel> [touch] [status] | update <id> <status>');
}
