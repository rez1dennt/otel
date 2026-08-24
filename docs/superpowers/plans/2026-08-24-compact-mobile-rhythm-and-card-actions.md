# Compact Mobile Rhythm and Card Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace arrow-based card actions with compact button affordances, left-align all mobile content headings, and reduce oversized mobile section gaps across every public page.

**Architecture:** Keep the existing HTML and JavaScript contracts intact and solve the defects in the shared token-driven CSS layer. Protect the shared behavior with Node static contract tests and one Playwright responsive audit that visits all 19 routes at 360 px and 320 px.

**Tech Stack:** Static HTML, shared vanilla CSS custom properties, Node.js test runner, `@playwright/test` 1.62.1, Python static HTTP server.

## Global Constraints

- Preserve all routes, content, images, link/button semantics, forms, modal behavior, and JavaScript behavior.
- Use only existing CSS tokens for color, spacing, radius, size, shadow, and motion.
- Card navigation cues are compact outline pills without arrows.
- Service-card form actions are compact dark pills without arrows and do not stretch to full width.
- At widths up to `47.9375rem`, every visible `main h1`, `main h2`, and `main h3` is left-aligned.
- At widths up to `47.9375rem`, the common section block padding is `var(--space-12)`.
- All 19 routes must reflow without horizontal scrolling at 360 px and 320 px.
- Interactive controls retain visible focus indication, at least `var(--control-md)` height, and reduced-motion behavior.

---

### Task 1: Replace the old CSS expectations with the approved contracts

**Files:**
- Modify: `tests/site.test.mjs:586-708`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: the shared stylesheet at `assets/css/styles.css`.
- Produces: static regression contracts for card cues, service-card actions, mobile heading alignment, and mobile section density.

- [ ] **Step 1: Replace the old arrow and centered-heading assertions with failing approved assertions**

Replace the arrow-specific part of `service cards expose one aligned minimalist action row` with:

```js
assert.match(css, /\.service-card__actions \.text-link\s*\{[^}]*width:\s*max-content;[^}]*min-height:\s*var\(--control-md\);[^}]*padding-inline:\s*var\(--space-4\);[^}]*border-radius:\s*var\(--radius-pill\);[^}]*background:\s*var\(--color-action\);[^}]*color:\s*var\(--color-on-action\);/s);
assert.match(css, /\.service-card__actions \.text-link::after\s*\{[^}]*content:\s*none;/s);
```

Replace the arrow assertion in `card navigation cues expose desktop, keyboard and touch affordances` with:

```js
assert.match(css, /\.card-link-cue\s*\{[^}]*min-height:\s*var\(--control-md\);[^}]*padding-inline:\s*var\(--space-4\);[^}]*border:\s*var\(--line-thin\) solid var\(--color-border\);[^}]*border-radius:\s*var\(--radius-pill\);/s);
assert.match(css, /\.card-link-cue::after\s*\{[^}]*content:\s*none;/s);
assert.match(css, /@media \(hover: hover\)[\s\S]*?:is\(\.service-card, \.project-card, \.insight-card\[href\], \.project-listing > a\):hover \.card-link-cue\s*\{[^}]*border-color:\s*var\(--color-action\);[^}]*background:\s*var\(--color-surface-subtle\);[^}]*color:\s*var\(--color-action\);/s);
```

Replace `mobile marketing headings are centered and avoid narrow balanced columns` with:

```js
test('mobile content headings share one left-aligned axis', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?main :where\(h1, h2, h3\)\s*\{[^}]*width:\s*100%;[^}]*text-align:\s*start;[^}]*text-wrap:\s*pretty;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.page-hero__center\s*\{[^}]*justify-items:\s*start;[^}]*text-align:\s*start;/s);
});
```

Add the compact rhythm contract:

```js
test('mobile sections use the compact shared vertical rhythm', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.section,\s*\.section--compact\s*\{[^}]*padding-block:\s*var\(--space-12\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.case-hero\s*\{[^}]*padding-block:\s*var\(--space-10\) 0;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.related-materials\s*\{[^}]*padding-block-end:\s*var\(--space-16\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.faq-panel,\s*\.contact-panel\s*\{[^}]*padding:\s*var\(--space-6\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.contact-panel\s*\{[^}]*min-height:\s*0;/s);
});
```

- [ ] **Step 2: Run the focused Node tests and verify the approved contracts fail**

Run:

```powershell
node --test --test-name-pattern="service cards expose|card navigation cues|mobile content headings|mobile sections use" tests/site.test.mjs
```

Expected: FAIL because the stylesheet still uses arrow pseudo-elements, full-width service actions, centered mobile headings, 80 px mobile section padding, and a 34rem mobile contact-panel minimum.

- [ ] **Step 3: Commit the failing contract tests**

```powershell
git add tests/site.test.mjs
git commit -m "test: define compact mobile layout contracts"
```

---

### Task 2: Add the cross-route Playwright mobile audit

**Files:**
- Create: `playwright.config.mjs`
- Create: `tests/mobile-layout.spec.mjs`
- Modify: `package.json`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: all public HTML routes served from the repository root.
- Produces: `npm run test:ui`, a responsive audit at 360 px and 320 px.

- [ ] **Step 1: Add the Playwright test script to `package.json`**

Keep the existing scripts and add:

```json
"test:ui": "playwright test"
```

- [ ] **Step 2: Create the Playwright configuration**

Create `playwright.config.mjs`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'mobile-layout.spec.mjs',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4191',
    colorScheme: 'light',
    reducedMotion: 'reduce'
  },
  webServer: {
    command: 'python -m http.server 4191',
    url: 'http://127.0.0.1:4191',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
```

- [ ] **Step 3: Create the 19-route mobile audit**

Create `tests/mobile-layout.spec.mjs`:

```js
import { expect, test } from '@playwright/test';

const routes = [
  '/index.html',
  '/about.html',
  '/services.html',
  '/service.html',
  '/projects.html',
  '/project.html',
  '/blog.html',
  '/article.html',
  '/contacts.html',
  '/kejsy/',
  '/kejsy/rost-pryamyh-prodazh/',
  '/poleznoe/',
  '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
  '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
  '/poleznoe/materialy/chek-list-audita-prodazh/',
  '/privacy.html',
  '/consent.html',
  '/cookies.html',
  '/404.html'
];

for (const width of [360, 320]) {
  test(`all public pages keep compact left-aligned mobile layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });

    for (const route of routes) {
      await page.goto(route);

      const audit = await page.evaluate(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };

        const nonLeftHeadings = [...document.querySelectorAll('main h1, main h2, main h3')]
          .filter(visible)
          .filter((heading) => getComputedStyle(heading).textAlign !== 'start')
          .map((heading) => heading.textContent.trim().replace(/\s+/g, ' '));

        const arrowActions = [...document.querySelectorAll('.card-link-cue, .service-card__actions .text-link')]
          .filter(visible)
          .filter((action) => getComputedStyle(action, '::after').content.includes('→'))
          .map((action) => action.textContent.trim());

        return {
          nonLeftHeadings,
          arrowActions,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        };
      });

      expect(audit.nonLeftHeadings, `${route}: heading alignment`).toEqual([]);
      expect(audit.arrowActions, `${route}: arrow actions`).toEqual([]);
      expect(audit.scrollWidth, `${route}: horizontal overflow`).toBeLessThanOrEqual(audit.viewportWidth);
    }
  });
}

test('mobile section and action geometry uses the compact tokens', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/index.html');

  const sectionPadding = await page.locator('.services-section').evaluate((element) => getComputedStyle(element).paddingBlockStart);
  const cue = await page.locator('.card-link-cue').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { minHeight: style.minHeight, borderTopWidth: style.borderTopWidth };
  });
  const actionGeometry = await page.locator('.service-card__actions').first().evaluate((row) => {
    const button = row.querySelector('.text-link');
    return { rowWidth: row.getBoundingClientRect().width, buttonWidth: button.getBoundingClientRect().width };
  });

  expect(sectionPadding).toBe('48px');
  expect(cue).toEqual({ minHeight: '48px', borderTopWidth: '1px' });
  expect(actionGeometry.buttonWidth).toBeLessThan(actionGeometry.rowWidth);

  await page.goto('/kejsy/rost-pryamyh-prodazh/');
  await expect(page.locator('.case-hero')).toHaveCSS('padding-bottom', '0px');

  await page.goto('/poleznoe/');
  await expect(page.locator('.contact-panel')).toHaveCSS('min-height', '0px');
});
```

- [ ] **Step 4: Run the Playwright audit and verify it fails on the current CSS**

Run:

```powershell
npm run test:ui
```

Expected: FAIL on centered headings, arrow actions, 80 px section padding, full-width service actions, non-zero case-hero padding, and the old contact-panel minimum.

- [ ] **Step 5: Commit the failing responsive audit**

```powershell
git add package.json playwright.config.mjs tests/mobile-layout.spec.mjs
git commit -m "test: audit mobile layout across public routes"
```

---

### Task 3: Implement the compact card-action system

**Files:**
- Modify: `assets/css/styles.css:1499-1530`
- Modify: `assets/css/styles.css:2397-2427`
- Modify: `assets/css/styles.css:2786-2804`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: `.card-link-cue`, `.service-card__actions`, `.text-link`, and existing semantic tokens.
- Produces: one outline navigation cue and one filled form-action pattern.

- [ ] **Step 1: Replace the card cue with a compact outline pill**

Change `.card-link-cue` and its insight-card variant to:

```css
.card-link-cue {
  display: inline-flex;
  min-height: var(--control-md);
  align-items: center;
  align-self: flex-start;
  margin-block-start: auto;
  padding-inline: var(--space-4);
  border: var(--line-thin) solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: normal;
  line-height: 1;
  text-transform: none;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
}

.card-link-cue::after {
  content: none;
}

.insight-card .card-link-cue {
  min-height: var(--control-md);
  margin-block-end: 0;
  padding-inline: var(--space-4);
  color: var(--color-text);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Replace the service-card form link with a compact filled pill**

Keep the action-row divider and replace `.service-card__actions .text-link` with:

```css
.service-card__actions .text-link {
  width: max-content;
  min-height: var(--control-md);
  justify-content: center;
  justify-self: start;
  padding-inline: var(--space-4);
  border: var(--line-thin) solid transparent;
  border-radius: var(--radius-pill);
  background: var(--color-action);
  color: var(--color-on-action);
  text-align: center;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), translate var(--duration-fast) var(--ease-out);
}

.service-card__actions .text-link::after {
  content: none;
}

.service-card__actions .text-link:hover {
  background: var(--color-action-hover);
  color: var(--color-on-action);
}

.service-card__actions .text-link:active {
  translate: 0 var(--space-1);
}
```

- [ ] **Step 3: Replace the arrow-travel hover rule with a pill-state hover rule**

Inside `@media (hover: hover)`, replace the `card-link-cue::after` rule with:

```css
:is(.service-card, .project-card, .insight-card[href], .project-listing > a):hover .card-link-cue,
.service-card:has(h3 a:focus-visible) .card-link-cue {
  border-color: var(--color-action);
  background: var(--color-surface-subtle);
  color: var(--color-action);
}
```

- [ ] **Step 4: Run the focused action tests**

Run:

```powershell
node --test --test-name-pattern="service cards expose|card navigation cues|wide case rows" tests/site.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the action-system implementation**

```powershell
git add assets/css/styles.css tests/site.test.mjs
git commit -m "fix: replace card arrows with compact actions"
```

---

### Task 4: Implement left-aligned headings and compact mobile spacing

**Files:**
- Modify: `assets/css/styles.css:2890-3282`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: the existing `47.9375rem` mobile breakpoint and spacing tokens.
- Produces: one shared mobile heading axis and one shared compact section rhythm.

- [ ] **Step 1: Replace the common mobile section and heading rules**

At the start of `@media (max-width: 47.9375rem)`, replace the current `.section` and centered heading declarations with:

```css
.section,
.section--compact {
  padding-block: var(--space-12);
}

.section-heading h2,
.service-card h3 {
  max-width: none;
}

main :where(h1, h2, h3) {
  width: 100%;
  text-align: start;
  text-wrap: pretty;
}

.page-hero__center {
  justify-items: start;
  text-align: start;
}
```

Remove `text-align: center` from the later mobile hero-heading selector while keeping its font-size, max-width, wrapping, and overflow rules.

- [ ] **Step 2: Add compact mobile hero and publication seams**

Inside the same mobile breakpoint add:

```css
.page-hero:not(.page-hero--split) {
  padding-block: var(--space-10);
}

.case-hero {
  padding-block: var(--space-10) 0;
}

.article-header {
  padding-block: var(--space-10) 0;
}

.detail-hero {
  padding-block: var(--space-8) 0;
}

.related-materials {
  padding-block-end: var(--space-16);
}
```

- [ ] **Step 3: Compact the final FAQ and contact panels**

Replace the mobile contact minimum and add shared panel padding:

```css
.faq-panel,
.contact-panel {
  min-height: 0;
  padding: var(--space-6);
}

.contact-panel {
  min-height: 0;
}
```

- [ ] **Step 4: Run the focused static tests**

Run:

```powershell
node --test --test-name-pattern="mobile content headings|mobile sections use|mobile final panels|mobile headings keep" tests/site.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run the cross-route Playwright audit**

Run:

```powershell
npm run test:ui
```

Expected: 3 tests passed; both 19-route loops report no centered headings, no card arrows, and no horizontal overflow, while the geometry test confirms 48 px section padding and compact panels.

- [ ] **Step 6: Commit the mobile rhythm implementation**

```powershell
git add assets/css/styles.css tests/mobile-layout.spec.mjs
git commit -m "fix: compact mobile rhythm across pages"
```

---

### Task 5: Run the full regression and visual-quality gates

**Files:**
- Verify: `assets/css/styles.css`
- Verify: `tests/site.test.mjs`
- Verify: `tests/mobile-layout.spec.mjs`
- Verify: all 19 HTML routes

**Interfaces:**
- Consumes: the completed shared CSS and tests.
- Produces: fresh evidence that the approved design works across the site.

- [ ] **Step 1: Run every Node test**

Run:

```powershell
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run every responsive Playwright test**

Run:

```powershell
npm run test:ui
```

Expected: 3 tests pass with zero failures.

- [ ] **Step 3: Run source-integrity checks**

Run:

```powershell
git diff --check
rg -n "content:\s*\"\\2192\"" assets/css/styles.css
```

Expected: `git diff --check` exits successfully. The arrow search may find the global `.text-link::after` rule, but it must not find an arrow in `.card-link-cue::after` or `.service-card__actions .text-link::after`.

- [ ] **Step 4: Perform a browser screenshot review at 360 px and 320 px**

Review these representative pages with the in-app browser viewport override:

```text
/index.html
/services.html
/kejsy/rost-pryamyh-prodazh/
/poleznoe/
/poleznoe/stati/kak-provesti-audit-prodazh-otelya/
/contacts.html
/404.html
```

Confirm visually:

```text
Headings share the left content edge.
Outline cues read as small navigation buttons.
Dark request actions read as compact form buttons.
No pseudo-arrow is visible in those actions.
No section seam produces a blank mobile screen.
FAQ and contact panels remain readable and balanced.
```

- [ ] **Step 5: Review the final Git diff and working tree**

Run:

```powershell
git diff --stat HEAD~2..HEAD
git status --short
```

Expected: only the planned stylesheet, tests, Playwright configuration, package script, and plan/spec documentation are changed; no generated screenshots or Playwright artifacts are tracked.

- [ ] **Step 6: Commit any verification-only corrections if required**

If source changes were necessary during the verification review, run:

```powershell
git add assets/css/styles.css tests/site.test.mjs tests/mobile-layout.spec.mjs playwright.config.mjs package.json
git commit -m "test: verify compact mobile interface"
```

If no source correction was necessary, do not create an empty commit.
