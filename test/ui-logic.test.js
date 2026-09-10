const test = require('node:test');
const assert = require('node:assert/strict');
const { formatMoney, getSelectedCheckIds, calculateLiveSubtotal, validateDiscount } = require('../public/app-logic');

function checkbox(value, price, checked) {
  return { value, dataset: { price: String(price) }, checked };
}

test('live subtotal recalculates after a check is unchecked', () => {
  const checks = [checkbox('IDENTITY', 299, true)];
  assert.equal(calculateLiveSubtotal(checks), 299);
  checks[0].checked = false;
  assert.equal(calculateLiveSubtotal(checks), 0);
});

test('selected check IDs use checkbox values, not DOM element IDs', () => {
  const checks = [
    { id: 'check-IDENTITY', value: 'IDENTITY', checked: true },
    { id: 'check-EDUCATION', value: 'EDUCATION', checked: false }
  ];
  assert.deepEqual(getSelectedCheckIds(checks), ['IDENTITY']);
});

test('money is consistently formatted to two decimals', () => {
  assert.equal(formatMoney(299), '₹299.00');
  assert.equal(formatMoney(29.9), '₹29.90');
  assert.equal(formatMoney(0), '₹0.00');
});

test('discount validation rejects values outside 0 to 100', () => {
  assert.equal(validateDiscount('10'), '');
  assert.equal(validateDiscount('0'), '');
  assert.equal(validateDiscount('100'), '');
  assert.equal(validateDiscount('101'), 'Discount must be between 0 and 100.');
  assert.equal(validateDiscount('-1'), 'Discount must be between 0 and 100.');
});
