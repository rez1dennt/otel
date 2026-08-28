# Event Long Title Fit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the «Индустрия гостеприимства» H1 inside its detail-hero text column without changing other hero titles.

**Architecture:** The event generator adds a page-scoped `detail-hero--long-title` modifier. The shared stylesheet exposes one component token for the reduced fluid size and applies it only to that modifier; the existing mobile rule remains authoritative below 47.9375rem. Playwright measures real heading, copy-column, image, and viewport boxes.

**Tech Stack:** Semantic HTML, CSS custom properties, Node.js static generator, Playwright, WordPress classic-theme snapshot generator.

## Global Constraints

- Preserve the existing display font, weight, line height, left alignment, image geometry, and all other detail hero titles.
- Do not split Russian words mid-word and do not mask overflow.
- Verify 1280, 1024, 768, 360, and 320 px.
- Keep the static source and generated WordPress theme visually identical.
- Work inline in the current session; do not dispatch subagents.

---

### Task 1: Add and satisfy the long-title geometry contract

**Files:**
- Modify: `tests/mobile-layout.spec.mjs`
- Modify: `tests/site.test.mjs`
- Modify: `scripts/generate-event-content.mjs`
- Modify: `assets/css/styles.css`
- Generate: `poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html`
- Generate: `wordpress-theme/forma-hotel/page-industriya-gostepriimstva-2026.php`
- Generate: `wordpress-theme/forma-hotel/assets/css/styles.css`
- Generate: `wordpress-theme/dist/forma-hotel.zip`

**Interfaces:**
- Consumes: `renderEventMain(): string`, `.detail-hero__grid`, and the existing mobile H1 rule.
- Produces: `.detail-hero--long-title` and `--detail-long-title-size`.

- [ ] **Step 1: Write the failing browser regression**

Add a Playwright test that opens the event page at 1280, 1024, 768, 360, and 320 px. For desktop and intermediate widths assert `heading.right <= copy.right + 1` and `heading.right <= media.left`; for mobile assert `scrollWidth <= innerWidth`, start alignment, and the same shared mobile font size as the material detail H1.

- [ ] **Step 2: Write the failing structural regression**

Require the generated event HTML to contain `detail-hero detail-hero--long-title`, and require `assets/css/styles.css` to define and consume `--detail-long-title-size` without adding a global overflow mask.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```powershell
node --test --test-name-pattern="long event title" tests/site.test.mjs
npm run test:ui -- --grep "long event title"
```

Expected: FAIL because the modifier and token do not exist and the current H1 crosses its text column.

- [ ] **Step 4: Implement the smallest scoped correction**

In `renderEventMain()`, change the event section to:

```html
<section class="detail-hero detail-hero--long-title">
```

Add the component token:

```css
--detail-long-title-size: clamp(var(--text-2xl), 5vw, 4rem);
```

Add the scoped rule after the shared detail-title rule:

```css
.detail-hero--long-title h1 {
  font-size: var(--detail-long-title-size);
  text-wrap: balance;
}
```

- [ ] **Step 5: Regenerate static content and verify GREEN**

Run:

```powershell
npm run build:content
node --test --test-name-pattern="long event title" tests/site.test.mjs
npm run test:ui -- --grep "long event title"
```

Expected: both focused regressions PASS.

- [ ] **Step 6: Run the full release matrix and rebuild WordPress**

Run:

```powershell
npm test
npm run test:ui
npm run build:theme
git diff --check
```

Expected: all static, browser, theme, and WordPress Playground tests PASS; the final ZIP is promoted to `wordpress-theme/dist/forma-hotel.zip`.

- [ ] **Step 7: Inspect the final rendered event hero**

Capture or inspect the event page at 1280, 768, 360, and 320 px. Confirm the title is fully readable, the image still fills its frame, and neighboring detail pages retain their original title size.

- [ ] **Step 8: Commit the implementation**

Stage only the task-owned source, generated files, tests, and validated ZIP, then commit:

```powershell
git commit -m "fix: fit long event title"
```
