import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDisclosureState,
  getLeadTransport,
  getMenuState,
  normalizeCookiePreferences,
  serializeCookiePreferences,
  validateLead
} from '../assets/js/core.js';

test('lead transport accepts only complete server-provided configuration', () => {
  const config = {
    ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php',
    action: 'forma_submit_lead',
    nonce: 'test-nonce',
    messages: {
      loading: 'Отправляем заявку…',
      success: 'Заявка отправлена.',
      error: 'Не удалось отправить заявку.'
    }
  };

  assert.deepEqual(getLeadTransport(config), config);
  assert.equal(getLeadTransport({ ...config, nonce: '' }), null);
  assert.equal(getLeadTransport({ ...config, messages: {} }), null);
  assert.equal(getLeadTransport(undefined), null);
});

test('valid lead has no errors', () => {
  assert.deepEqual(validateLead({
    name: 'Анна',
    email: 'anna@example.ru',
    phone: '+7 900 000-00-00',
    consent: true
  }), {});
});

test('invalid lead exposes exact field errors', () => {
  assert.deepEqual(validateLead({
    name: '',
    email: 'bad',
    phone: '12',
    consent: false
  }), {
    name: 'Укажите имя',
    email: 'Проверьте электронную почту',
    phone: 'Проверьте номер телефона',
    consent: 'Нужно согласие на обработку данных'
  });
});

test('cookie preferences always keep necessary cookies', () => {
  assert.deepEqual(
    normalizeCookiePreferences({ necessary: false, analytics: true }),
    { necessary: true, analytics: true }
  );
  assert.equal(
    serializeCookiePreferences({ analytics: false }),
    '{"necessary":true,"analytics":false}'
  );
});

test('menu state synchronizes classes and accessible labels', () => {
  assert.deepEqual(getMenuState(true), {
    expanded: 'true',
    hidden: 'false',
    label: 'Закрыть меню',
    className: 'is-open'
  });
  assert.deepEqual(getMenuState(false), {
    expanded: 'false',
    hidden: 'true',
    label: 'Открыть меню',
    className: ''
  });
});

test('disclosure state returns synchronized open and closed values', () => {
  assert.deepEqual(getDisclosureState(true), {
    expanded: 'true',
    hidden: 'false',
    className: 'is-open'
  });
  assert.deepEqual(getDisclosureState(false), {
    expanded: 'false',
    hidden: 'true',
    className: ''
  });
});
