# Compact Mobile Article Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the mobile article heading, lead, section-heading, and body sizes while preserving the desktop article design and every non-article template.

**Architecture:** Keep the shared HTML templates and global type tokens unchanged. Add scoped overrides inside the existing `max-width: 47.9375rem` media query, backed by static CSS-contract coverage and a rendered Playwright geometry test at 320 px, 360 px, and 1280 px.

**Tech Stack:** Static HTML, vanilla CSS custom properties, Node.js test runner, Playwright.

## Global Constraints

- Apply changes only to `.article-header h1`, `.article-lead`, `.article-body h2`, and `.article-body p` inside the existing mobile breakpoint up to `47.9375rem`.
- At 360 px use 36 px for the article `h1`, 18 px for the lead, 28 px for article `h2`, and 16 px for article body paragraphs.
- At 320 px use 32 px for the article `h1` and do not create horizontal overflow.
- Preserve desktop computed sizes at 1280 px: 76.8 px `h1`, 22 px lead, 40.96 px article `h2`, and 18 px body copy.
- Preserve metadata, article navigation, HTML semantics, text, colors, line heights, widths, spacing, images, FAQ, buttons, routes, and JavaScript.
- Use only existing CSS custom properties; do not add raw color, spacing, or type values.

---

### Task 1: Lock and implement the compact mobile article scale

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/mobile-layout.spec.mjs`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: Existing `.article-header`, `.article-lead`, `.article-body`, `--text-base`, `--text-lg`, `--text-2xl`, `--text-display`, and the shared mobile media query.
- Produces: A token-driven mobile article typography contract shared by the clean article URL and `article.html`, with unchanged desktop values.

- [ ] **Step 1: Add the failing static CSS contract test**

Append this test to `tests/site.test.mjs`:

```js
test('mobile article typography uses the compact token scale', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-header h1\s*\{[^}]*font-size:\s*clamp\(var\(--text-2xl\), 10vw, var\(--text-display\)\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-lead\s*\{[^}]*font-size:\s*var\(--text-lg\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-body h2\s*\{[^}]*font-size:\s*var\(--text-2xl\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-body p\s*\{[^}]*font-size:\s*var\(--text-base\);/s);
});
```

- [ ] **Step 2: Run the static test and verify the red state**

Run:

```powershell
node --test --test-name-pattern "mobile article typography uses" tests/site.test.mjs
```

Expected: FAIL because the four scoped mobile declarations do not exist yet.

- [ ] **Step 3: Add the failing rendered typography test**

Append this test to `tests/mobile-layout.spec.mjs`:

```js
test('article typography stays compact on mobile and unchanged on desktop', async ({ page }) => {
  const cases = [
    { width: 320, h1: 32, lead: 18, h2: 28, body: 16 },
    { width: 360, h1: 36, lead: 18, h2: 28, body: 16 },
    { width: 1280, h1: 76.8, lead: 22, h2: 40.96, body: 18 }
  ];

  for (const expected of cases) {
    await page.setViewportSize({ width: expected.width, height: 900 });
    await page.goto('/poleznoe/stati/kak-provesti-audit-prodazh-otelya/');

    const metrics = await page.evaluate(() => {
      const size = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
      return {
        h1: size('.article-header h1'),
        lead: size('.article-lead'),
        h2: size('.article-body h2'),
        body: size('.article-body section > p:not(.eyebrow)'),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect.soft(metrics.h1, `${expected.width}px h1`).toBeCloseTo(expected.h1, 1);
    expect.soft(metrics.lead, `${expected.width}px lead`).toBeCloseTo(expected.lead, 1);
    expect.soft(metrics.h2, `${expected.width}px h2`).toBeCloseTo(expected.h2, 1);
    expect.soft(metrics.body, `${expected.width}px body`).toBeCloseTo(expected.body, 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  }
});
```

- [ ] **Step 4: Run the rendered test and verify the red state**

Run:

```powershell
node scripts/run-playwright.mjs --config .playwright-cache/presentation-audit.config.mjs --grep "article typography stays compact"
```

Expected: FAIL for the mobile cases because the current computed values are 36/39.6 px `h1`, 22 px lead, 30 px `h2`, and 18 px body copy.

- [ ] **Step 5: Implement the minimal scoped CSS overrides**

Inside the existing `@media (max-width: 47.9375rem)` block in `assets/css/styles.css`, after the shared mobile hero-heading rule, add:

```css
.article-header h1 {
  font-size: clamp(var(--text-2xl), 10vw, var(--text-display));
}

.article-lead {
  font-size: var(--text-lg);
}

.article-body h2 {
  font-size: var(--text-2xl);
}

.article-body p {
  font-size: var(--text-base);
}
```

- [ ] **Step 6: Run the targeted tests and verify the green state**

Run:

```powershell
node --test --test-name-pattern "mobile article typography uses" tests/site.test.mjs
node scripts/run-playwright.mjs --config .playwright-cache/presentation-audit.config.mjs --grep "article typography stays compact"
```

Expected: Both targeted tests PASS.

- [ ] **Step 7: Run the complete regression and CSS-quality suites**

Run:

```powershell
npm test
node scripts/run-playwright.mjs --config .playwright-cache/presentation-audit.config.mjs
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py' 'C:\Users\bahti\Documents\виталина заказ сайт\.worktrees\hotel-site\assets\css\styles.css'
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py' 'C:\Users\bahti\Documents\виталина заказ сайт\.worktrees\hotel-site\assets\css\styles.css'
```

Expected: All Node and Playwright tests PASS; both CSS checks exit successfully.

- [ ] **Step 8: Visually inspect the clean article route**

Open `/poleznoe/stati/kak-provesti-audit-prodazh-otelya/` at 360 px and 320 px. Confirm the first screen is visibly lighter, the heading remains the main focal point, metadata stays readable, body copy is comfortable, and no line is clipped or overflows. Reset the browser viewport after inspection.

- [ ] **Step 9: Commit the implementation**

```powershell
git add tests/site.test.mjs tests/mobile-layout.spec.mjs assets/css/styles.css
git commit -m "fix: compact mobile article typography"
```

Expected: One focused implementation commit containing the four CSS overrides and their two regression tests.
