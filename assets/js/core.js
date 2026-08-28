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

export function getLeadTransport(value) {
  if (!value || typeof value !== 'object') return null;

  const ajaxUrl = String(value.ajaxUrl ?? '').trim();
  const action = String(value.action ?? '').trim();
  const nonce = String(value.nonce ?? '').trim();
  const messages = value.messages;
  if (!ajaxUrl || !action || !nonce || !messages || typeof messages !== 'object') return null;

  const loading = String(messages.loading ?? '').trim();
  const success = String(messages.success ?? '').trim();
  const error = String(messages.error ?? '').trim();
  if (!loading || !success || !error) return null;

  return {
    ajaxUrl,
    action,
    nonce,
    messages: { loading, success, error }
  };
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

export function getMenuState(open) {
  return {
    expanded: String(Boolean(open)),
    hidden: String(!open),
    label: open ? 'Закрыть меню' : 'Открыть меню',
    className: open ? 'is-open' : ''
  };
}

export function getDisclosureState(open) {
  return {
    expanded: String(Boolean(open)),
    hidden: String(!open),
    className: open ? 'is-open' : ''
  };
}
