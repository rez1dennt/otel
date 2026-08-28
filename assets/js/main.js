import {
  getDisclosureState,
  getLeadTransport,
  getMenuState,
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
let lockedScrollY = null;

function setDocumentScrollLocked(locked) {
  if (locked) {
    if (lockedScrollY === null) lockedScrollY = window.scrollY;
    document.body.classList.add('is-locked');
    return;
  }

  document.body.classList.remove('is-locked');
  if (lockedScrollY === null) return;
  const restoreScrollY = lockedScrollY;
  lockedScrollY = null;
  window.scrollTo({ top: restoreScrollY, left: window.scrollX, behavior: 'instant' });
}

function setOverlayState(overlay, open, returnTarget = null) {
  if (!overlay) return;

  overlay.classList.toggle('is-open', open);
  overlay.setAttribute('aria-hidden', String(!open));
  setDocumentScrollLocked(open);
  activeOverlay = open ? overlay : null;

  if (open) {
    lastFocused = returnTarget ?? document.activeElement;
    const focusTarget = overlay.querySelector(FOCUSABLE);
    requestAnimationFrame(() => focusTarget?.focus());
  } else if (lastFocused instanceof HTMLElement) {
    lastFocused.focus({ preventScroll: true });
    lastFocused = null;
  }
}

function closeMenu({ restoreFocus = true } = {}) {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
  const state = getMenuState(false);
  toggle.setAttribute('aria-expanded', state.expanded);
  toggle.setAttribute('aria-label', state.label);
  menu.classList.toggle('is-open', Boolean(state.className));
  menu.setAttribute('aria-hidden', state.hidden);
  setDocumentScrollLocked(false);
  if (activeOverlay === menu) activeOverlay = null;
  if (restoreFocus && wasOpen) requestAnimationFrame(() => toggle.focus({ preventScroll: true }));
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

  modal.hidden = false;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');

  const title = modal.querySelector('[data-modal-title-target]');
  const description = modal.querySelector('[data-modal-description-target]');

  document.querySelectorAll('[data-modal-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const openedFromMenu = Boolean(button.closest('[data-mobile-menu]'));
      const returnTarget = openedFromMenu
        ? document.querySelector('[data-menu-toggle]')
        : button;
      if (openedFromMenu) closeMenu({ restoreFocus: false });
      const nextTitle = button.dataset.modalTitle;
      const nextDescription = button.dataset.modalDescription;
      if (title && nextTitle) title.textContent = nextTitle;
      if (description && nextDescription) description.textContent = nextDescription;
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

  menu.hidden = false;
  const initialState = getMenuState(false);
  toggle.setAttribute('aria-expanded', initialState.expanded);
  toggle.setAttribute('aria-label', initialState.label);
  menu.setAttribute('aria-hidden', initialState.hidden);
  menu.classList.remove('is-open');

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    if (!open) {
      closeMenu();
      return;
    }
    const state = getMenuState(open);
    toggle.setAttribute('aria-expanded', state.expanded);
    toggle.setAttribute('aria-label', state.label);
    menu.classList.toggle('is-open', Boolean(state.className));
    menu.setAttribute('aria-hidden', state.hidden);
    setDocumentScrollLocked(true);
    activeOverlay = menu;
    requestAnimationFrame(() => menu.querySelector(FOCUSABLE)?.focus());
  });
}

function setupCurrentNavigation() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.site-nav a, [data-mobile-menu] a').forEach((link) => {
    const destination = new URL(link.href, window.location.origin).pathname;
    const exact = destination === currentPath;
    const section = destination !== '/' && destination.endsWith('/') && currentPath.startsWith(destination);
    link.toggleAttribute('aria-current', exact || section);
    if (exact || section) link.setAttribute('aria-current', 'page');
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
  const transport = getLeadTransport(window.formaLeadConfig);

  document.querySelectorAll('[data-lead-form]').forEach((form, index) => {
    if (!form.id) form.id = `lead-form-${index + 1}`;

    form.addEventListener('submit', async (event) => {
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
      if (!transport) {
        if (status) status.textContent = 'Демонстрационная заявка заполнена. Отправка доступна в WordPress-версии сайта.';
        return;
      }

      const initialLabel = submit?.textContent || 'Отправить заявку';
      data.set('action', transport.action);
      data.set('nonce', transport.nonce);
      data.set('page_url', window.location.href);
      submit?.setAttribute('disabled', '');
      submit?.setAttribute('aria-busy', 'true');
      if (submit) submit.textContent = transport.messages.loading;
      if (status) status.textContent = transport.messages.loading;

      try {
        const response = await fetch(transport.ajaxUrl, {
          method: 'POST',
          credentials: 'same-origin',
          body: data
        });
        const result = await response.json();
        if (!response.ok || result?.success !== true) throw new Error('Lead delivery failed');

        form.reset();
        if (status) status.textContent = result?.data?.message || transport.messages.success;
      } catch {
        if (status) status.textContent = transport.messages.error;
      } finally {
        submit?.removeAttribute('disabled');
        submit?.removeAttribute('aria-busy');
        if (submit) submit.textContent = initialLabel;
      }
    });
  });
}

function setupAccordion() {
  document.querySelectorAll('[data-accordion-button]').forEach((button) => {
    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    panel.hidden = false;
    panel.classList.add('accordion__panel');
    const initial = getDisclosureState(false);
    button.setAttribute('aria-expanded', initial.expanded);
    panel.setAttribute('aria-hidden', initial.hidden);
    panel.classList.remove('is-open');

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const accordion = button.closest('.accordion');

      accordion?.querySelectorAll('[data-accordion-button]').forEach((otherButton) => {
        if (otherButton === button) return;
        const otherId = otherButton.getAttribute('aria-controls');
        const otherPanel = otherId ? document.getElementById(otherId) : null;
        if (!otherPanel) return;
        const closedState = getDisclosureState(false);
        otherButton.setAttribute('aria-expanded', closedState.expanded);
        otherPanel.setAttribute('aria-hidden', closedState.hidden);
        otherPanel.classList.remove('is-open');
      });

      const state = getDisclosureState(!expanded);
      button.setAttribute('aria-expanded', state.expanded);
      panel.setAttribute('aria-hidden', state.hidden);
      panel.classList.toggle('is-open', Boolean(state.className));
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
  const settings = banner.querySelector('[data-cookie-settings]');
  const setOptionsState = (open) => {
    if (!options) return;
    const state = getDisclosureState(open);
    options.classList.toggle('is-open', Boolean(state.className));
    options.setAttribute('aria-hidden', state.hidden);
    settings?.setAttribute('aria-expanded', state.expanded);
  };

  if (options) {
    options.hidden = false;
    options.classList.add('cookie-options');
    setOptionsState(false);
  }
  const save = (preferences) => {
    localStorage.setItem(COOKIE_KEY, serializeCookiePreferences(preferences));
    banner.hidden = true;
  };

  const stored = readCookiePreferences();
  if (!stored) banner.hidden = false;
  if (analytics && stored) analytics.checked = stored.analytics;

  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => save({ analytics: true }));
  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => save({ analytics: false }));
  settings?.addEventListener('click', () => {
    setOptionsState(settings.getAttribute('aria-expanded') !== 'true');
  });
  banner.querySelector('[data-cookie-save]')?.addEventListener('click', () => {
    save({ analytics: Boolean(analytics?.checked) });
  });

  document.querySelectorAll('[data-cookie-reopen]').forEach((button) => {
    button.addEventListener('click', () => {
      banner.hidden = false;
      setOptionsState(true);
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
