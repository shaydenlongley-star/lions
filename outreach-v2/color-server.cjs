// Plain HTTP — file:// origins can POST to http://localhost without Chrome's Private Network Access restrictions
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INCOMING_DIR = path.join(__dirname, 'incoming');
if (!fs.existsSync(INCOMING_DIR)) fs.mkdirSync(INCOMING_DIR);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url === '/colors') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { round, handle, colors } = data;
        if (!round || !handle || !colors) {
          res.writeHead(400); res.end('Missing round, handle, or colors'); return;
        }
        const safe = handle.replace(/[^a-zA-Z0-9_.\-]/g, '_');
        const filename = `r${round}-${safe}.json`;
        const filepath = path.join(INCOMING_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify({ round, handle, colors, receivedAt: new Date().toISOString() }, null, 2));
        console.log(`[COLOR_RECEIVED] ${filename}`);

        // Auto-apply colors to the matching mockup
        try {
          execSync(`node "${path.join(__dirname, 'apply-colors.cjs')}" "${filepath}"`, { stdio: 'inherit' });
        } catch (e) {
          console.error('[APPLY ERROR]', e.message);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, file: filename }));
      } catch (e) {
        res.writeHead(400); res.end('Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(3457, '127.0.0.1', () => {
  console.log('[COLOR SERVER] http://127.0.0.1:3457 — waiting for submissions');
});
