# Card Action Alignment and Hero Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vertically center and bottom-align card actions, add a 12 px action gap, and make detail-page images fill their full media frames without distortion.

**Architecture:** Preserve all HTML and JavaScript behavior and fix the three confirmed root causes in the shared CSS component layer. Extend the existing static contracts and Playwright suite so computed layout geometry is verified at desktop, 360 px, and 320 px.

**Tech Stack:** Static HTML, shared vanilla CSS custom properties, Node.js test runner, `@playwright/test` 1.62.1.

## Global Constraints

- Do not change HTML, copy, routes, images, links, buttons, modal behavior, forms, or JavaScript.
- Keep every compact action at `var(--control-md)` minimum height.
- Use `var(--space-3)` for the minimum action gap.
- Keep `object-fit: cover`; cropping is allowed, aspect-ratio distortion is not.
- Use the existing 34rem desktop and 22rem mobile detail-media heights.
- Preserve focus-visible, active, hover, reduced-motion, and whole-card click behavior.
- Preserve zero horizontal overflow at 360 px and 320 px.

---

### Task 1: Define failing component and geometry contracts

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/mobile-layout.spec.mjs`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: `.project-card`, `.project-card__caption`, `.card-link-cue`, `.service-card__body`, `.insight-card`, and `.detail-hero__grid .image-frame`.
- Produces: regression contracts for alignment, spacing, and media fill.

- [ ] **Step 1: Add the static component contracts to `tests/site.test.mjs`**

Append:

```js
test('card actions use centered bottom alignment and a twelve pixel content gap', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.project-card\s*\{[^}]*grid-template-rows:\s*auto 1fr;/s);
  assert.match(css, /\.project-card__caption\s*\{[^}]*display:\s*flex;[^}]*height:\s*100%;[^}]*flex-direction:\s*column;/s);
  assert.match(css, /\.project-card \.card-link-cue\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*margin-block-end:\s*0;/s);
  assert.match(css, /\.service-card__body > \.card-link-cue\s*\{[^}]*margin-block-start:\s*var\(--space-3\);/s);
  assert.match(css, /\.insight-card p\s*\{[^}]*margin-block-end:\s*var\(--space-3\);/s);
});

test('detail hero media uses definite responsive block sizes', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.detail-hero__grid \.image-frame\s*\{[^}]*min-height:\s*0;[^}]*block-size:\s*34rem;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.detail-hero__grid \.image-frame\s*\{[^}]*min-height:\s*0;[^}]*block-size:\s*22rem;/s);
});
```

- [ ] **Step 2: Add desktop action geometry to `tests/mobile-layout.spec.mjs`**

Append:

```js
test('desktop card actions are centered, bottom-aligned and separated from copy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/index.html');

  const geometry = await page.evaluate(() => {
    const gapAfterPrevious = (cue) => cue.getBoundingClientRect().top - cue.previousElementSibling.getBoundingClientRect().bottom;
    const projectCues = [...document.querySelectorAll('.project-card .card-link-cue')];
    const projectBottoms = projectCues.map((cue) => Math.round(cue.getBoundingClientRect().bottom));
    const projectStyles = projectCues.map((cue) => {
      const style = getComputedStyle(cue);
      return { display: style.display, alignItems: style.alignItems, justifyContent: style.justifyContent };
    });

    return {
      projectBottoms,
      projectStyles,
      serviceGaps: [...document.querySelectorAll('.service-card .card-link-cue')].map(gapAfterPrevious),
      insightGaps: [...document.querySelectorAll('.insight-card .card-link-cue')].map(gapAfterPrevious)
    };
  });

  expect(Math.max(...geometry.projectBottoms) - Math.min(...geometry.projectBottoms)).toBeLessThanOrEqual(1);
  expect(geometry.projectStyles).toEqual(geometry.projectStyles.map(() => ({ display: 'flex', alignItems: 'center', justifyContent: 'center' })));
  expect(Math.min(...geometry.serviceGaps)).toBeGreaterThanOrEqual(12);
  expect(Math.min(...geometry.insightGaps)).toBeGreaterThanOrEqual(12);
});
```

- [ ] **Step 3: Add the cross-route media-fill test**

Append:

```js
test('detail hero images fill their complete frames at every target width', async ({ page }) => {
  const routes = [
    '/service.html',
    '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
    '/poleznoe/materialy/chek-list-audita-prodazh/'
  ];

  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      const media = await page.locator('.detail-hero__grid .image-frame').evaluate((frame) => {
        const image = frame.querySelector('img');
        return {
          frameHeight: frame.getBoundingClientRect().height,
          imageHeight: image.getBoundingClientRect().height,
          objectFit: getComputedStyle(image).objectFit
        };
      });
      expect(Math.abs(media.frameHeight - media.imageHeight), `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(media.objectFit).toBe('cover');
    }
  }
});
```

- [ ] **Step 4: Run the focused tests and verify the expected failures**

Run:

```powershell
node --test --test-name-pattern="card actions use|detail hero media uses" tests/site.test.mjs
npm run test:ui -- --grep "desktop card actions|detail hero images"
```

Expected: static tests fail because the new component rules do not exist; desktop geometry fails because project cues use `display: block`, bottom coordinates differ, and service/insight gaps include values below 12; media fill fails with 74–152 px blank space on desktop.

- [ ] **Step 5: Commit the failing regression tests**

```powershell
git add tests/site.test.mjs tests/mobile-layout.spec.mjs
git commit -m "test: cover card alignment and hero media fill"
```

---

### Task 2: Implement action alignment and spacing

**Files:**
- Modify: `assets/css/styles.css:915-957`
- Modify: `assets/css/styles.css:1068-1082`
- Modify: `assets/css/styles.css:1499-1540`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: the existing outline-pill `.card-link-cue` primitive.
- Produces: aligned project actions and a 12 px minimum copy-to-action gap.

- [ ] **Step 1: Make project captions consume the remaining card height**

Update the existing rules to:

```css
.project-card {
  display: grid;
  grid-template-rows: auto 1fr;
  border: var(--line-thin) solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-decoration: none;
}

.project-card__caption {
  display: flex;
  height: 100%;
  flex-direction: column;
  padding-block: var(--space-5);
}

.project-card .card-link-cue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 0;
}
```

- [ ] **Step 2: Add the service and insight action gaps**

Add the service override after the base cue rule and update the insight paragraph rule:

```css
.service-card__body > .card-link-cue {
  margin-block-start: var(--space-3);
}

.insight-card p {
  margin-block-end: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
```

- [ ] **Step 3: Run the focused component and geometry tests**

Run:

```powershell
node --test --test-name-pattern="card actions use" tests/site.test.mjs
npm run test:ui -- --grep "desktop card actions"
```

Expected: both tests pass.

- [ ] **Step 4: Commit the action-layout fix**

```powershell
git add assets/css/styles.css
git commit -m "fix: align card actions and copy spacing"
```

---

### Task 3: Make detail images fill their media frames

**Files:**
- Modify: `assets/css/styles.css:1589-1598`
- Modify: `assets/css/styles.css:3210-3212`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: the existing `.image-frame img { width: 100%; height: 100%; object-fit: cover; }` primitive.
- Produces: definite detail-media heights at desktop and mobile breakpoints.

- [ ] **Step 1: Replace the desktop minimum with a definite block size**

Change the desktop rule to:

```css
.detail-hero__grid .image-frame {
  min-height: 0;
  block-size: 34rem;
}
```

- [ ] **Step 2: Replace the mobile minimum with a definite block size**

Inside `@media (max-width: 47.9375rem)`, change the rule to:

```css
.detail-hero__grid .image-frame {
  min-height: 0;
  block-size: 22rem;
}
```

- [ ] **Step 3: Run the media contracts**

Run:

```powershell
node --test --test-name-pattern="detail hero media uses" tests/site.test.mjs
npm run test:ui -- --grep "detail hero images"
```

Expected: static and rendered media tests pass at 1280, 360, and 320 px.

- [ ] **Step 4: Commit the media fix**

```powershell
git add assets/css/styles.css
git commit -m "fix: fill detail hero media frames"
```

---

### Task 4: Verify the complete interface regression suite

**Files:**
- Verify: `assets/css/styles.css`
- Verify: `tests/site.test.mjs`
- Verify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: the completed shared CSS fixes.
- Produces: fresh evidence for all existing and new layout contracts.

- [ ] **Step 1: Run every Node contract**

```powershell
npm test
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run every Playwright contract**

```powershell
npm run test:ui
```

Expected: all responsive and geometry tests pass with zero failures.

- [ ] **Step 3: Run source-integrity and repository checks**

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` exits successfully and the working tree is clean after the implementation commits.

- [ ] **Step 4: Visually review representative pages**

Use the in-app browser at 1280 px, 360 px, and 320 px for:

```text
/index.html#projects
/index.html#insights
/service.html
/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/
/poleznoe/materialy/chek-list-audita-prodazh/
```

Confirm the three project actions share one baseline, every outline-pill label is centered, copy gaps are visible, and no media frame exposes its background below the photograph.
