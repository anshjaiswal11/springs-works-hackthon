const { validateQuoteRequest, calculateQuote } = require('./pricing');

function handleQuote(req, res) {
  const validation = validateQuoteRequest(req.body, req.store.checksCatalog);
  if (validation.error) return res.status(400).json({ error: validation.error });

  const { checkIds, discountPercent } = validation.value;
  const quote = calculateQuote(checkIds, discountPercent, req.store.checksCatalog);
  return res.status(200).json(quote);
}

function handleCatalog(req, res) {
  const publicCatalog = req.store.checksCatalog.map(({ id, name, price }) => ({ id, name, price }));
  return res.status(200).json(publicCatalog);
}

module.exports = { handleQuote, handleCatalog };
