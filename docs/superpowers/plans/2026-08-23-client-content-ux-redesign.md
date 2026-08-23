# Client Content and UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder hotel-advisory content with the client's confirmed positioning and correct the mobile menu, FAQ, modal, Cookie, typography and responsive defects without changing the reference-derived palette.

**Architecture:** Preserve the static multi-page architecture and shared token theme. Keep pure state/validation logic in `assets/js/core.js`, DOM state orchestration in `assets/js/main.js`, and use semantic state classes plus ARIA attributes for motion. Update all repeated HTML shells so navigation, contacts, forms, legal links and consent controls stay consistent across 13 pages.

**Tech Stack:** Semantic HTML5, tokenized CSS, vanilla JavaScript ES modules, Node.js built-in test runner, Python static server, in-app browser QA.

## Global Constraints

- Preserve the exact palette `#F2F1EF`, `#FAF9F7`, `#2D281D`, `#66635B`, `#3E4136`, `#8B745F`, `#D0C5B8`, `#BABCC1`, `#C9B3A4` through the existing shared tokens.
- Keep every existing public filename and local link valid.
- Use only client-confirmed personal, professional and legal facts; do not invent case metrics, addresses, prices, social handles, payment providers or processors.
- Display phone `+7 906 503-94-28`, `tel:+79065039428`, email `vitalinapogorila@yandex.ru`, IP `Погорила Виталина Петровна`, INN `502745335560`, OGRNIP `325774600286352`.
- Keep forms in explicitly labelled demonstration mode until a submission endpoint is provided.
- Social controls for Telegram, MAX and Dzen remain disabled and explain that exact links are awaited.
- Respect `prefers-reduced-motion`, keyboard navigation, focus return, focus trap and visible focus states.
- Every behavior change follows red-green-refactor; no production interaction change is written before its test fails for the expected reason.

---

### Task 1: Characterize the approved content and UI contracts

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/core.test.mjs`
- Test: `tests/site.test.mjs`
- Test: `tests/core.test.mjs`

**Interfaces:**
- Consumes: the 13-page `pages` array and existing file-reading helpers in `tests/site.test.mjs`.
- Produces: regression contracts for new navigation, service content, client details, animated components and modal/Cookie layout.

- [ ] **Step 1: Add failing shared-content tests**

Add tests that require the new labels and client details on every relevant shared surface:

```js
test('shared navigation uses the client information architecture', () => {
  for (const file of pages) {
    const html = read(file);
    for (const label of ['О проекте', 'Услуги', 'Кейсы', 'Полезное', 'Контакты']) {
      assert.match(html, new RegExp(`>${label}<`), `${file}: ${label}`);
    }
  }
});

test('public contact details are consistent', () => {
  for (const file of marketingPages) {
    const html = read(file);
    assert.match(html, /tel:\+79065039428/);
    assert.match(html, /vitalinapogorila@yandex\.ru/i);
  }
});
```

- [ ] **Step 2: Add failing service and page-content tests**

```js
test('services present the four confirmed offers', () => {
  const html = read('services.html');
  const offers = [
    'Аудит системы продаж',
    'Индивидуальная консультация',
    'Ведение внешних каналов продаж',
    'Ведение прямых каналов продаж'
  ];
  for (const offer of offers) assert.match(html, new RegExp(offer));
  assert.equal((html.match(/data-service-offer/g) ?? []).length, 4);
});

test('project page contains the confirmed mission and biography anchors', () => {
  const html = read('about.html');
  assert.match(html, /увеличивать доход и выручку отелей/i);
  assert.match(html, /2013/);
  assert.match(html, /коммерческ(?:ий|ого) директор/i);
  assert.match(html, /HLB/);
  assert.match(html, /Коммерсантъ/);
});
```

- [ ] **Step 3: Add failing interaction/layout tests**

```js
test('mobile menu exposes three animated strokes and an open class contract', () => {
  const html = read('index.html');
  const css = read('assets/css/styles.css');
  const js = read('assets/js/main.js');
  assert.equal((html.match(/menu-toggle__line/g) ?? []).length, 3);
  assert.match(css, /menu-toggle\[aria-expanded="true"\]/);
  assert.match(css, /\.mobile-menu\.is-open/);
  assert.match(js, /Закрыть меню/);
});

test('FAQ and companion card have independent animated layout contracts', () => {
  const css = read('assets/css/styles.css');
  const js = read('assets/js/main.js');
  assert.match(css, /\.final-grid\s*\{[^}]*align-items:\s*start/s);
  assert.match(css, /\.accordion__panel\.is-open/);
  assert.doesNotMatch(js, /panel\.hidden\s*=\s*expanded/);
});

test('lead dialog avoids an internal scrolling panel', () => {
  const css = read('assets/css/styles.css');
  const panelRule = css.match(/\.modal__panel\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  assert.doesNotMatch(panelRule, /overflow:\s*auto/);
  assert.match(css, /\.modal\s*\{[^}]*overflow-y:\s*auto/s);
});

test('Cookie settings use the shared button system', () => {
  for (const file of pages) {
    const html = read(file);
    assert.match(html, /data-cookie-settings[^>]*class="[^"]*button--ghost/);
    assert.match(html, /data-cookie-options[^>]*class="cookie-options/);
  }
});
```

- [ ] **Step 4: Add failing pure state tests**

Extend `core.test.mjs` with the desired menu/disclosure state API:

```js
import { getDisclosureState, getMenuState } from '../assets/js/core.js';

test('getMenuState synchronizes classes and accessible labels', () => {
  assert.deepEqual(getMenuState(true), {
    expanded: 'true',
    hidden: 'false',
    label: 'Закрыть меню',
    className: 'is-open'
  });
  assert.equal(getMenuState(false).label, 'Открыть меню');
});

test('getDisclosureState returns one synchronized open state', () => {
  assert.deepEqual(getDisclosureState(true), {
    expanded: 'true',
    hidden: 'false',
    className: 'is-open'
  });
});
```

- [ ] **Step 5: Run the tests and verify RED**

Run:

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: failures specifically report missing client labels/details, four-service content, animated state contracts and missing `getMenuState` / `getDisclosureState` exports. Existing unrelated tests remain passing.

- [ ] **Step 6: Commit the failing contract tests**

```powershell
git add tests/site.test.mjs tests/core.test.mjs
git commit -m "test: define client content and ux contracts"
```

---

### Task 2: Implement synchronized interaction state and compact overlays

**Files:**
- Modify: `assets/js/core.js`
- Modify: `assets/js/main.js`
- Modify: `assets/css/styles.css`
- Modify: `index.html`
- Test: `tests/core.test.mjs`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `getMenuState(open: boolean)` and `getDisclosureState(open: boolean)` expectations from Task 1.
- Produces: class/ARIA state helpers used by the menu and every FAQ; `data-modal-open` may supply `data-modal-title` and `data-modal-description`.

- [ ] **Step 1: Implement the pure state helpers**

Add to `assets/js/core.js`:

```js
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
```

- [ ] **Step 2: Run core tests and verify GREEN for the new helpers**

Run:

```powershell
node --test tests\core.test.mjs
```

Expected: all core tests pass; site tests remain red because markup/CSS/DOM code is not complete.

- [ ] **Step 3: Replace menu mounting and close behavior**

Update `setupMenu()` and `closeMenu()` so JavaScript removes the initial `hidden` attribute once, then toggles `.is-open`, `aria-expanded`, `aria-hidden`, the accessible label and body lock from `getMenuState()`. Do not immediately set `hidden=true` when closing; `visibility:hidden` and `pointer-events:none` make the closed menu inert while the exit transition plays.

The menu button markup becomes:

```html
<button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Открыть меню">
  <span class="menu-toggle__icon" aria-hidden="true">
    <span class="menu-toggle__line"></span>
    <span class="menu-toggle__line"></span>
    <span class="menu-toggle__line"></span>
  </span>
</button>
```

- [ ] **Step 4: Replace FAQ hidden toggles with synchronized classes**

Each answer follows this structure:

```html
<div class="accordion__panel" id="faq-home-1" role="region" aria-hidden="true">
  <div class="accordion__content"><p>С короткого разговора о текущей системе продаж, задачах объекта и ожидаемом результате.</p></div>
</div>
```

`setupAccordion()` toggles the `.is-open` class, button `aria-expanded` and panel `aria-hidden` using `getDisclosureState()`. Only one answer per accordion remains open at a time to keep dense page endings readable.

- [ ] **Step 5: Make modal copy contextual and eliminate panel scrolling**

When a trigger includes `data-modal-title` and `data-modal-description`, copy those values into the dialog heading/description before opening. Move vertical overflow fallback to `.modal`, remove `overflow:auto` from `.modal__panel`, tighten padding/gaps/fields and set stable scrollbar handling on `html`.

- [ ] **Step 6: Build coherent Cookie settings motion**

Give the settings control `button button--ghost`, the options wrapper `cookie-options`, and toggle `.is-open` plus `aria-expanded` instead of visually detached raw text controls. Keep storage behavior unchanged.

- [ ] **Step 7: Add the required CSS motion and reduced-motion states**

Implement:

```css
.mobile-menu {
  visibility: hidden;
  opacity: 0;
  translate: 0 -0.75rem;
  pointer-events: none;
  transition: opacity var(--duration-base) var(--ease-out), translate var(--duration-base) var(--ease-out), visibility 0s linear var(--duration-base);
}

.mobile-menu.is-open {
  visibility: visible;
  opacity: 1;
  translate: 0;
  pointer-events: auto;
  transition-delay: 0s;
}

.accordion__panel { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--duration-base) var(--ease-out), opacity var(--duration-fast) var(--ease-out); }
.accordion__panel.is-open { grid-template-rows: 1fr; opacity: 1; }
.accordion__content { overflow: hidden; }
```

Add the three-line-to-cross transforms and `align-items:start` on `.final-grid`.

- [ ] **Step 8: Run focused and full tests**

Run:

```powershell
node --test tests\core.test.mjs
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: interaction and modal/Cookie contract tests pass. Content tests may remain red until Tasks 3–6.

- [ ] **Step 9: Commit interaction implementation**

```powershell
git add assets/js/core.js assets/js/main.js assets/css/styles.css index.html tests
git commit -m "fix: smooth shared interactions and overlays"
```

---

### Task 3: Synchronize the shared shell across every page

**Files:**
- Modify: `index.html`
- Modify: `services.html`
- Modify: `service.html`
- Modify: `about.html`
- Modify: `projects.html`
- Modify: `project.html`
- Modify: `blog.html`
- Modify: `article.html`
- Modify: `contacts.html`
- Modify: `privacy.html`
- Modify: `consent.html`
- Modify: `cookies.html`
- Modify: `404.html`
- Modify: `assets/css/styles.css`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: menu, modal and Cookie markup contracts from Task 2.
- Produces: identical shared navigation, footer, contacts, social group, dialog and Cookie controls on all pages.

- [ ] **Step 1: Update every desktop and mobile navigation**

Use exact labels and routes:

```html
<a href="about.html">О проекте</a>
<a href="services.html">Услуги</a>
<a href="projects.html">Кейсы</a>
<a href="blog.html">Полезное</a>
<a href="contacts.html">Контакты</a>
```

Install the three-stroke menu button markup on all pages.

- [ ] **Step 2: Update every footer**

Use the public phone/email, confirmed IP details, the new navigation labels and a compact social group. Social controls are non-links with `aria-disabled="true"` and visually-hidden explanatory text until URLs arrive.

- [ ] **Step 3: Synchronize every lead dialog**

Use one compact field order and copy contract on all pages: heading, explanation, name, phone, email, short task, consent checkbox, legal links, submit action and demo-mode status.

- [ ] **Step 4: Synchronize every Cookie card**

Use matching markup/classes and the same three first-level actions on every page: `Принять все`, `Отклонить`, `Настроить`. Keep `Сохранить выбор` inside the animated options area.

- [ ] **Step 5: Run the shared-shell tests**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: shared navigation, contact, modal, Cookie, local-link and semantic-contract tests pass; page-specific content tests may remain red.

- [ ] **Step 6: Commit the shared shell**

```powershell
git add *.html assets/css/styles.css tests/site.test.mjs
git commit -m "feat: align shared shell with client structure"
```

---

### Task 4: Rewrite the home page and project/about page

**Files:**
- Modify: `index.html`
- Modify: `about.html`
- Modify: `assets/css/styles.css`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: shared shell and contextual modal triggers.
- Produces: mission-led home page and confirmed founder story.

- [ ] **Step 1: Replace the home hero and overview copy**

Use a revenue/sales-system hero such as `Продажи отеля — как система, которая работает на результат`, with the client's mission in the lead and a short handwritten accent on one phrase. Primary CTA: `Записаться на бесплатную консультацию`; secondary CTA: `Посмотреть услуги`.

- [ ] **Step 2: Replace the six old service cards with four confirmed offers**

Keep the asymmetric editorial grid but render four balanced cards. The text-only card uses `service-card--text` and no fixed image row. Each card carries `data-service-offer` and two clear actions.

- [ ] **Step 3: Update home stages, useful materials and FAQ**

Stages explain acquaintance, diagnostics, solution plan and implementation support. Useful cards represent article, event and methodical material categories without fake dates/prices. The home FAQ contains 4 questions relevant to first contact.

- [ ] **Step 4: Rewrite `about.html` with mission and biography**

Structure the supplied biography into scan-friendly editorial sections: beginning in 2013, management path, development projects, commercial focus and professional community. Use one pull quote/script accent; keep all factual claims exactly within supplied information.

- [ ] **Step 5: Add a page-specific FAQ to `about.html`**

Include four questions about experience, working format, types of properties and starting point; avoid claiming object names or performance figures.

- [ ] **Step 6: Run content tests and commit**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: mission, biography, four-home-service and FAQ tests pass.

```powershell
git add index.html about.html assets/css/styles.css tests/site.test.mjs
git commit -m "feat: publish client mission and founder story"
```

---

### Task 5: Rewrite services and service detail

**Files:**
- Modify: `services.html`
- Modify: `service.html`
- Modify: `assets/css/styles.css`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: the four confirmed offer names and contextual modal trigger contract.
- Produces: complete service listing, one audit detail page, service outcomes, stages, two CTA types and FAQs.

- [ ] **Step 1: Build the four-service listing**

Each service includes client-provided purpose, concise explanation, four outcome bullets and `data-service-offer`. Do not merge external and direct channels.

- [ ] **Step 2: Add a six-step shared work process**

Use: first conversation, initial data, diagnostics, findings/session, action plan, follow-up. State that exact scope and timing are agreed after task review.

- [ ] **Step 3: Repurpose `service.html` as `Аудит системы продаж`**

Include audit areas: tariff policy, sales channels, request handling, booking scripts, sales-team process and motivation. Explain deliverables without numerical promises.

- [ ] **Step 4: Add both CTA types and service FAQs**

Every service block has `Оставить заявку` and `Записаться на бесплатную консультацию`, with contextual dialog title/description. Both service pages end with four relevant questions.

- [ ] **Step 5: Run tests and commit**

```powershell
node --test tests\site.test.mjs
git add services.html service.html assets/css/styles.css tests/site.test.mjs
git commit -m "feat: publish confirmed consulting services"
```

Expected: four-offer, CTA, service detail, FAQ and local-link tests pass.

---

### Task 6: Align cases, useful content, contacts, legal copy and SEO

**Files:**
- Modify: `projects.html`
- Modify: `project.html`
- Modify: `blog.html`
- Modify: `article.html`
- Modify: `contacts.html`
- Modify: `privacy.html`
- Modify: `consent.html`
- Modify: `cookies.html`
- Modify: `404.html`
- Modify: `robots.txt`
- Modify: `sitemap.xml`
- Modify: `README.md`
- Modify: `assets/css/styles.css`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: shared shell, page FAQ pattern and confirmed contact/legal details.
- Produces: client-aligned secondary pages and accurate metadata without unsupported claims.

- [ ] **Step 1: Rename and rewrite case surfaces**

Use `Кейсы` labels and explanatory copy about future object experience/results. Keep demonstrations explicitly marked `Пример структуры кейса`; remove any phrasing that could be read as a completed client project.

- [ ] **Step 2: Rebuild `Полезное` categories**

Present articles, event announcements, and checklists/methods/standards. Material CTAs open an enquiry dialog stating that catalogue/payment details are being prepared; do not create fake prices or checkout.

- [ ] **Step 3: Compact the contacts page**

Render the phone and email as bounded, safely wrapping links. Replace the invented-address placeholder with advance-agreement copy. Keep the form column wider than the information column and add disabled Telegram/MAX/Dzen controls.

- [ ] **Step 4: Update legal contact copy**

Replace the old public mailbox with `vitalinapogorila@yandex.ru` where the operator contact is required. Keep working-template notices and unknown production processors explicit.

- [ ] **Step 5: Update titles, descriptions, headings and JSON-LD**

Use factual hotel-sales-consulting language per page. Update visible navigation names without changing filenames. Validate every JSON-LD block with `JSON.parse`; retain placeholder-domain notes in README.

- [ ] **Step 6: Add 3–4 page-specific FAQs to marketing pages**

Add FAQ endings to cases, useful, article and contacts pages where they support the visitor decision. Reuse the shared animated disclosure markup.

- [ ] **Step 7: Run full tests and commit**

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
git add projects.html project.html blog.html article.html contacts.html privacy.html consent.html cookies.html 404.html robots.txt sitemap.xml README.md assets/css/styles.css tests
git commit -m "feat: align secondary pages seo and contacts"
```

Expected: all automated tests pass.

---

### Task 7: Visual, responsive, accessibility and regression verification

**Files:**
- Modify if defects are found: `assets/css/styles.css`
- Modify if defects are found: `assets/js/main.js`
- Modify if defects are found: affected `*.html`
- Test: `tests/site.test.mjs`
- Test: `tests/core.test.mjs`

**Interfaces:**
- Consumes: complete implementation from Tasks 1–6.
- Produces: verified release candidate with no known Critical or Important issue.

- [ ] **Step 1: Run the complete automated suite**

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
git diff --check
```

Expected: all tests pass, no whitespace errors.

- [ ] **Step 2: Run token/design-system gates**

From the installed UX/UI skill root, run the existing hardcode/token/emoji/contrast validators against the changed project. Required result: preserved palette tokens, no off-theme hardcoded page colors, no emoji icons, measured WCAG AA text pairs.

- [ ] **Step 3: Verify desktop at 1440 × 1000**

Check home, about, services, service, contacts, useful and legal pages. Confirm heading scale, card `04`, contacts wrapping, FAQ companion independence, contextual modal, Cookie settings and no horizontal overflow.

- [ ] **Step 4: Verify mobile at 390 × 844, 375 × 850 and 320 × 700**

For every page, confirm no horizontal overflow. On representative pages verify menu cross animation, exit motion, Escape, focus return, body lock, FAQ animation, one-open-item behavior, modal without panel scrollbar at 375 × 850, Cookie expansion, footer controls and readable gutters.

- [ ] **Step 5: Verify reduced motion and console state**

Confirm reduced motion reaches the same final states immediately. Read browser console logs and require zero errors.

- [ ] **Step 6: Fix each discovered defect test-first**

For every defect, add the smallest failing regression assertion, run it to confirm RED, implement one fix, and rerun the focused and full suites.

- [ ] **Step 7: Update README and create final verification commit**

Document the confirmed client content, unavailable production integrations and local commands.

```powershell
git add README.md assets tests *.html
git commit -m "chore: verify client ux redesign"
```

- [ ] **Step 8: Request final code review**

Review the branch against the pre-redesign base for Critical and Important issues. Resolve every finding and rerun the entire verification suite before handoff.
