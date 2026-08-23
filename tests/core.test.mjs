import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
