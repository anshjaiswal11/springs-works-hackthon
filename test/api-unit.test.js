const test = require('node:test');
const assert = require('node:assert/strict');
const { makeSeed } = require('../data');
const { handleCatalog, handleQuote } = require('../handlers');

function fakeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function request(body) {
  const req = { body, store: makeSeed() };
  const res = fakeResponse();
  handleQuote(req, res);
  return res;
}

test('catalog response strips vendorCost', () => {
  const req = { store: makeSeed() };
  const res = fakeResponse();
  handleCatalog(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(Object.keys(res.body[0]).sort(), ['id', 'name', 'price']);
});

test('missing checkIds returns 400', () => {
  const res = request({ discountPercent: 10 });
  assert.equal(res.statusCode, 400);
});

test('empty checkIds returns 400', () => {
  const res = request({ checkIds: [] });
  assert.equal(res.statusCode, 400);
});

test('invalid check ID returns 400', () => {
  const res = request({ checkIds: ['IDENTITY', 'INVALID_CHECK'], discountPercent: 0 });
  assert.equal(res.statusCode, 400);
});

test('duplicate IDs are priced once', () => {
  const res = request({ checkIds: ['IDENTITY', 'IDENTITY'], discountPercent: 0 });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { subtotal: 299, discount: 0, gst: 53.82, total: 352.82 });
});

test('discount defaults to zero instead of leaking previous request state', () => {
  const req = { store: makeSeed() };
  let res = fakeResponse();
  req.body = { checkIds: ['IDENTITY'], discountPercent: 10 };
  handleQuote(req, res);
  res = fakeResponse();
  req.body = { checkIds: ['IDENTITY'] };
  handleQuote(req, res);
  assert.deepEqual(res.body, { subtotal: 299, discount: 0, gst: 53.82, total: 352.82 });
});

test('pricing formula applies discount before GST and subtracts discount from total', () => {
  const res = request({ checkIds: ['IDENTITY', 'EDUCATION'], discountPercent: 10 });
  assert.deepEqual(res.body, { subtotal: 798, discount: 79.8, gst: 129.28, total: 847.48 });
});

test('same checks with different discounts do not reuse a stale quote', () => {
  const req = { store: makeSeed() };
  let res = fakeResponse();
  req.body = { checkIds: ['IDENTITY'], discountPercent: 0 };
  handleQuote(req, res);
  res = fakeResponse();
  req.body = { checkIds: ['IDENTITY'], discountPercent: 10 };
  handleQuote(req, res);
  assert.deepEqual(res.body, { subtotal: 299, discount: 29.9, gst: 48.44, total: 317.54 });
});

test('quoting does not mutate catalog prices', () => {
  const store = makeSeed();
  const req = { store, body: { checkIds: ['IDENTITY'], discountPercent: 10 } };
  handleQuote(req, fakeResponse());
  assert.equal(store.checksCatalog.find((c) => c.id === 'IDENTITY').price, 299);
});

test('invalid discount types and ranges return 400', () => {
  for (const discountPercent of [-1, 101, true, null, { value: 10 }, NaN]) {
    const res = request({ checkIds: ['IDENTITY'], discountPercent });
    assert.equal(res.statusCode, 400, `expected 400 for ${String(discountPercent)}`);
  }
});

test('valid quote returns 200', () => {
  const res = request({ checkIds: ['IDENTITY'], discountPercent: 0 });
  assert.equal(res.statusCode, 200);
});
