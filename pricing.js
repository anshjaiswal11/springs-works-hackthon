const GST_RATE = 0.18;

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateQuoteRequest(body, catalog) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'request body must be an object' };
  }

  const { checkIds } = body;
  if (!Array.isArray(checkIds)) {
    return { error: 'checkIds must be an array' };
  }
  if (checkIds.length === 0) {
    return { error: 'checkIds must contain at least one check ID' };
  }
  if (checkIds.some((id) => typeof id !== 'string' || id.length === 0)) {
    return { error: 'checkIds must contain non-empty strings' };
  }

  const validIds = new Set(catalog.map((check) => check.id));
  const invalidIds = [...new Set(checkIds.filter((id) => !validIds.has(id)))];
  if (invalidIds.length > 0) {
    return { error: `unknown check ID: ${invalidIds.join(', ')}` };
  }

  let discountPercent = body.discountPercent;
  if (discountPercent === undefined) discountPercent = 0;
  if (typeof discountPercent !== 'number' || !Number.isFinite(discountPercent)) {
    return { error: 'discountPercent must be a number between 0 and 100' };
  }
  if (discountPercent < 0 || discountPercent > 100) {
    return { error: 'discountPercent must be between 0 and 100' };
  }

  return { value: { checkIds, discountPercent } };
}

function calculateQuote(checkIds, discountPercent, catalog) {
  const uniqueIds = [...new Set(checkIds)];
  const priceById = new Map(catalog.map((check) => [check.id, check.price]));
  const subtotal = roundMoney(uniqueIds.reduce((sum, id) => sum + priceById.get(id), 0));
  const discount = roundMoney(subtotal * discountPercent / 100);
  const taxableAmount = roundMoney(subtotal - discount);
  const gst = roundMoney(taxableAmount * GST_RATE);
  const total = roundMoney(taxableAmount + gst);
  return { subtotal, discount, gst, total };
}

module.exports = { GST_RATE, roundMoney, validateQuoteRequest, calculateQuote };
