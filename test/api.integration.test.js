const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

let server;
let baseUrl;

function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
      env: { ...process.env, PORT: '0', SCOREBOARD_URL: 'http://127.0.0.1:1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    const onData = (chunk) => {
      output += chunk.toString();
      const match = output.match(/listening on port (\d+)/);
      if (match) { baseUrl = `http://127.0.0.1:${match[1]}`; resolve(); }
    };
    server.stdout.on('data', onData);
    server.stderr.on('data', (chunk) => { output += chunk.toString(); });
    server.on('error', reject);
    server.on('exit', (code) => { if (!baseUrl) reject(new Error(`server exited early: ${code}\n${output}`)); });
  });
}

async function request(pathname, options = {}) {
  const res = await fetch(baseUrl + pathname, options);
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { res, body };
}

test.before(startServer);
test.after(() => server.kill());

test('HTTP API returns public catalog and correct quote responses', async () => {
  const catalog = await request('/api/checks-catalog');
  assert.equal(catalog.res.status, 200);
  assert.deepEqual(Object.keys(catalog.body[0]).sort(), ['id', 'name', 'price']);

  const quote = await request('/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkIds: ['IDENTITY', 'EDUCATION'], discountPercent: 10 })
  });
  assert.equal(quote.res.status, 200);
  assert.deepEqual(quote.body, { subtotal: 798, discount: 79.8, gst: 129.28, total: 847.48 });
});

test('HTTP API rejects invalid quote input with 400', async () => {
  for (const body of [{}, { checkIds: [] }, { checkIds: ['INVALID_CHECK'] }, { checkIds: ['IDENTITY'], discountPercent: 101 }]) {
    const result = await request('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    assert.equal(result.res.status, 400, JSON.stringify(body));
  }
});
