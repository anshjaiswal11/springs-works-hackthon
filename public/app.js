let catalog = [];
let liveSubtotal = 0;
const logic = window.BGVAppLogic;

function renderLiveSubtotal() {
  const checkboxes = document.querySelectorAll('input[type=checkbox]');
  liveSubtotal = logic.calculateLiveSubtotal(checkboxes);
  document.getElementById('live-subtotal').textContent = logic.formatMoney(liveSubtotal);
}

async function loadCatalog() {
  const res = await fetch('/api/checks-catalog');
  if (!res.ok) throw new Error('Unable to load checks catalog');
  catalog = await res.json();
  const list = document.getElementById('checks-list');
  list.innerHTML = '';
  catalog.forEach((check) => {
    const row = document.createElement('div');
    row.className = 'check-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `check-${check.id}`;
    input.value = check.id;
    input.dataset.price = check.price;
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = check.name;
    const price = document.createElement('span');
    price.textContent = check.price;
    row.append(input, label, price);
    list.appendChild(row);
  });
  list.querySelectorAll('input[type=checkbox]').forEach((cb) => cb.addEventListener('change', onCheckToggle));
  renderLiveSubtotal();
}

function onCheckToggle() {
  renderLiveSubtotal();
}

function getSelectedCheckIds() {
  return logic.getSelectedCheckIds(document.querySelectorAll('input[type=checkbox]'));
}

function validateDiscountInput() {
  const input = document.getElementById('discount-input');
  const errorEl = document.getElementById('discount-error');
  const message = logic.validateDiscount(input.value);
  errorEl.textContent = message;
  return !message;
}

document.getElementById('discount-input').addEventListener('input', validateDiscountInput);
document.getElementById('discount-input').addEventListener('change', validateDiscountInput);

async function getQuote() {
  const messageEl = document.getElementById('message');
  if (!validateDiscountInput()) {
    messageEl.textContent = 'Please correct the discount before getting a quote.';
    messageEl.className = 'message error';
    return;
  }

  const checkIds = getSelectedCheckIds();
  if (checkIds.length === 0) {
    messageEl.textContent = 'Please select at least one check.';
    messageEl.className = 'message error';
    return;
  }

  const discountPercent = Number(document.getElementById('discount-input').value || 0);

  try {
    const res = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIds, discountPercent })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data && data.error ? data.error : 'Unable to generate quote');
    }

    document.getElementById('result-subtotal').textContent = logic.formatMoney(data.subtotal);
    document.getElementById('result-discount').textContent = logic.formatMoney(data.discount);
    document.getElementById('result-gst').textContent = logic.formatMoney(data.gst);
    document.getElementById('result-total').textContent = logic.formatMoney(data.total);
    messageEl.textContent = 'Quote generated successfully!';
    messageEl.className = 'message success';
  } catch (err) {
    messageEl.textContent = `Unable to generate quote: ${err.message}`;
    messageEl.className = 'message error';
  }
}

document.getElementById('quote-btn').addEventListener('click', getQuote);

function showToast(msg) {
  let toast = document.getElementById('__toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '__toast';
    toast.style.cssText =
      'position:fixed;bottom:20px;right:20px;background:#333;color:#fff;padding:10px 16px;' +
      'border-radius:4px;font-family:sans-serif;z-index:9999;opacity:0;transition:opacity .2s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast.__timer);
  toast.__timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

document.getElementById('reset-btn').addEventListener('click', async () => {
  const messageEl = document.getElementById('message');
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    document.querySelectorAll('input[type=checkbox]').forEach((cb) => { cb.checked = false; });
    liveSubtotal = 0;
    document.getElementById('discount-input').value = '0';
    document.getElementById('discount-error').textContent = '';
    document.getElementById('live-subtotal').textContent = '₹0.00';
    document.getElementById('result-subtotal').textContent = '-';
    document.getElementById('result-discount').textContent = '-';
    document.getElementById('result-gst').textContent = '-';
    document.getElementById('result-total').textContent = '-';
    messageEl.textContent = '';
    await loadCatalog();
    showToast('Data reset');
  } catch (err) {
    messageEl.textContent = `Unable to reset data: ${err.message}`;
    messageEl.className = 'message error';
  }
});

loadCatalog().catch((err) => {
  document.getElementById('checks-list').textContent = 'Unable to load checks.';
  document.getElementById('message').textContent = err.message;
  document.getElementById('message').className = 'message error';
});
