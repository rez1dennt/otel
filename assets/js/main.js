import {
  normalizeCookiePreferences,
  serializeCookiePreferences,
  validateLead
} from './core.js';

document.documentElement.classList.add('js');

const COOKIE_KEY = 'hotel-consulting-cookie-preferences';
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

let activeOverlay = null;
let lastFocused = null;

function setOverlayState(overlay, open, returnTarget = null) {
  if (!overlay) return;

  overlay.hidden = !open;
  overlay.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('is-locked', open);
  activeOverlay = open ? overlay : null;

  if (open) {
    lastFocused = returnTarget ?? document.activeElement;
    const focusTarget = overlay.querySelector(FOCUSABLE);
    requestAnimationFrame(() => focusTarget?.focus());
  } else if (lastFocused instanceof HTMLElement) {
    lastFocused.focus();
    lastFocused = null;
  }
}

function closeMenu({ restoreFocus = true } = {}) {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const wasOpen = !menu.hidden;
  toggle.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
  menu.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  if (activeOverlay === menu) activeOverlay = null;
  if (restoreFocus && wasOpen) requestAnimationFrame(() => toggle.focus());
}

function trapFocus(event) {
  if (event.key !== 'Tab' || !activeOverlay) return;

  const focusable = [...activeOverlay.querySelectorAll(FOCUSABLE)]
    .filter((element) => !element.hidden && element.offsetParent !== null);
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable.at(-1);

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setupModal() {
  const modal = document.querySelector('[data-modal]');
  if (!modal) return;

  document.querySelectorAll('[data-modal-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const openedFromMenu = Boolean(button.closest('[data-mobile-menu]'));
      const returnTarget = openedFromMenu
        ? document.querySelector('[data-menu-toggle]')
        : button;
      if (openedFromMenu) closeMenu({ restoreFocus: false });
      setOverlayState(modal, true, returnTarget);
    });
  });

  modal.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => setOverlayState(modal, false));
  });
}

function setupMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    if (!open) {
      closeMenu();
      return;
    }
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);
    activeOverlay = open ? menu : null;
    if (open) menu.querySelector(FOCUSABLE)?.focus();
  });
}

function setupCurrentNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, [data-mobile-menu] a').forEach((link) => {
    const destination = link.getAttribute('href')?.split('#')[0];
    link.toggleAttribute('aria-current', destination === currentPage);
    if (destination === currentPage) link.setAttribute('aria-current', 'page');
  });
}

function setFieldError(form, fieldName, message) {
  const field = form.elements.namedItem(fieldName);
  const error = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (!(field instanceof HTMLElement) || !error) return;

  const errorId = `${form.id || 'lead'}-${fieldName}-error`;
  error.id = errorId;
  error.textContent = message || '';
  field.toggleAttribute('aria-invalid', Boolean(message));
  if (message) field.setAttribute('aria-describedby', errorId);
  else field.removeAttribute('aria-describedby');
}

function setupForms() {
  document.querySelectorAll('[data-lead-form]').forEach((form, index) => {
    if (!form.id) form.id = `lead-form-${index + 1}`;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const errors = validateLead({
        name: data.get('name'),
        phone: data.get('phone'),
        email: data.get('email'),
        consent: data.get('consent') === 'on'
      });

      for (const fieldName of ['name', 'phone', 'email', 'consent']) {
        setFieldError(form, fieldName, errors[fieldName]);
      }

      const status = form.querySelector('[data-form-status]');
      if (Object.keys(errors).length) {
        if (status) status.textContent = 'Проверьте отмеченные поля.';
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const submit = form.querySelector('[type="submit"]');
      submit?.setAttribute('aria-busy', 'true');
      if (status) status.textContent = 'Демонстрационная заявка заполнена. Отправка будет подключена после выбора сервиса.';
      window.setTimeout(() => submit?.removeAttribute('aria-busy'), 450);
    });
  });
}

function setupAccordion() {
  document.querySelectorAll('[data-accordion-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const panelId = button.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.hidden = expanded;
    });
  });
}

function readCookiePreferences() {
  try {
    const value = localStorage.getItem(COOKIE_KEY);
    return value ? normalizeCookiePreferences(JSON.parse(value)) : null;
  } catch {
    return null;
  }
}

function setupCookies() {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const options = banner.querySelector('[data-cookie-options]');
  const analytics = banner.querySelector('[data-cookie-analytics]');
  const save = (preferences) => {
    localStorage.setItem(COOKIE_KEY, serializeCookiePreferences(preferences));
    banner.hidden = true;
  };

  const stored = readCookiePreferences();
  if (!stored) banner.hidden = false;
  if (analytics && stored) analytics.checked = stored.analytics;

  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => save({ analytics: true }));
  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => save({ analytics: false }));
  banner.querySelector('[data-cookie-settings]')?.addEventListener('click', () => {
    if (options) options.hidden = !options.hidden;
  });
  banner.querySelector('[data-cookie-save]')?.addEventListener('click', () => {
    save({ analytics: Boolean(analytics?.checked) });
  });

  document.querySelectorAll('[data-cookie-reopen]').forEach((button) => {
    button.addEventListener('click', () => {
      banner.hidden = false;
      if (options) options.hidden = false;
    });
  });
}

function setupReveal() {
  const targets = [...document.querySelectorAll('[data-reveal]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!targets.length || reduced || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach((target) => observer.observe(target));
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeOverlay) {
    if (activeOverlay.matches('[data-modal]')) setOverlayState(activeOverlay, false);
    else closeMenu();
  }
  trapFocus(event);
});

setupModal();
setupCurrentNavigation();
setupMenu();
setupForms();
setupAccordion();
setupCookies();
setupReveal();
