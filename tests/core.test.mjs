import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDisclosureState,
  getMenuState,
  normalizeCookiePreferences,
  serializeCookiePreferences,
  validateLead
} from '../assets/js/core.js';

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
