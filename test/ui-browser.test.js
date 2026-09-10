const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadApp() {
  const elements = new Map();
  const listeners = new Map();

  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        value: id === 'discount-input' ? '10' : '',
        textContent: '',
        className: '',
        checked: false,
        dataset: {},
        addEventListener(type, handler) {
          listeners.set(`${id}:${type}`, handler);
        }
      });
    }
    return elements.get(id);
  }

  const document = {
    getElementById: element,
    querySelectorAll: () => [],
    createElement: () => element('created'),
    body: { appendChild() {} }
  };
  const context = {
    window: {},
    document,
    fetch: async () => ({ ok: true, json: async () => [] }),
    setTimeout,
    clearTimeout,
    console
  };
  context.window.BGVAppLogic = require('../public/app-logic');
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/app.js'), 'utf8'), context);
  return { input: element('discount-input'), error: element('discount-error'), listeners };
}

test('UI discount validation runs again after a valid value becomes invalid', () => {
  const { input, error, listeners } = loadApp();
  const onInput = listeners.get('discount-input:input');

  input.value = '10';
  onInput();
  assert.equal(error.textContent, '');

  input.value = '101';
  onInput();
  assert.equal(error.textContent, 'Discount must be between 0 and 100.');
});