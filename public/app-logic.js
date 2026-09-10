(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BGVAppLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function formatMoney(value) {
    return `₹${Number(value).toFixed(2)}`;
  }

  function getSelectedCheckIds(checkboxes) {
    return Array.from(checkboxes).filter((cb) => cb.checked).map((cb) => cb.value);
  }

  function calculateLiveSubtotal(checkboxes) {
    return Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .reduce((sum, cb) => sum + Number(cb.dataset.price), 0);
  }

  function validateDiscount(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return 'Discount must be between 0 and 100.';
    }
    return '';
  }

  return { formatMoney, getSelectedCheckIds, calculateLiveSubtotal, validateDiscount };
});
