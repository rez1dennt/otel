const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

export function validateLead(values = {}) {
  const errors = {};
  const name = String(values.name ?? '').trim();
  const email = String(values.email ?? '').trim();
  const phoneDigits = String(values.phone ?? '').replace(/\D/gu, '');

  if (!name) errors.name = 'Укажите имя';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Проверьте электронную почту';
  if (phoneDigits.length < 7) errors.phone = 'Проверьте номер телефона';
  if (values.consent !== true) errors.consent = 'Нужно согласие на обработку данных';

  return errors;
}

export function normalizeCookiePreferences(value = {}) {
  return {
    necessary: true,
    analytics: Boolean(value.analytics)
  };
}

export function serializeCookiePreferences(value = {}) {
  return JSON.stringify(normalizeCookiePreferences(value));
}
