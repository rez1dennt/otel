# Mission Quote Left Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the handwritten mission quote with the left edge of the mission heading and body copy at desktop and mobile widths without changing its typography or measure.

**Architecture:** Keep the existing HTML and shared token system unchanged. Add regression coverage to the existing static CSS test and responsive Playwright suite, then change only the logical horizontal placement expressed by the quote's margin shorthand.

**Tech Stack:** Static HTML, vanilla CSS custom properties, Node.js test runner, Playwright.

## Global Constraints

- Preserve the quote text, `max-width: 30ch`, `var(--color-accent)`, `var(--text-2xl)`, and `line-height: 1.45`.
- Preserve `var(--space-4)` as the quote's top margin.
- Do not change `about.html`, JavaScript, routes, other mission-panel elements, or unrelated styles.
- At viewport widths 1280 px, 360 px, and 320 px, the quote and mission body left coordinates must differ by no more than 1 px.
- At 320 px, the page must not have horizontal overflow.

---

### Task 1: Lock and implement the shared left axis

**Files:**
- Modify: `tests/site.test.mjs:797`
- Modify: `tests/mobile-layout.spec.mjs:245`
- Modify: `assets/css/styles.css:2553`

**Interfaces:**
- Consumes: Existing `.mission-panel`, `.script-accent`, spacing tokens, and Playwright configuration.
- Produces: A stable CSS contract in which `.mission-panel .script-accent` uses `margin: var(--space-4) auto 0 0` and shares the mission body copy's left coordinate.

- [ ] **Step 1: Add the failing static CSS contract test**

Append this test to `tests/site.test.mjs`:

```js
test('mission quote keeps its visual tokens and aligns from the left', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(
    css,
    /\.mission-panel \.script-accent\s*\{[^}]*max-width:\s*30ch;[^}]*margin:\s*var\(--space-4\) auto 0 0;[^}]*color:\s*var\(--color-accent\);[^}]*font-size:\s*var\(--text-2xl\);[^}]*line-height:\s*1\.45;/s
  );
});
```

- [ ] **Step 2: Run the static test and verify the red state**

Run:

```powershell
node --test --test-name-pattern "mission quote keeps" tests/site.test.mjs
```

Expected: FAIL because the current rule contains `margin: var(--space-4) 0 0 auto`.

- [ ] **Step 3: Add the failing responsive geometry test**

Append this test to `tests/mobile-layout.spec.mjs`:

```js
test('mission quote shares the content left axis at every target width', async ({ page }) => {
  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about.html');

    const metrics = await page.evaluate(() => {
      const panel = document.querySelector('.mission-panel');
      const body = panel.querySelector('p:not(.eyebrow):not(.script-accent)');
      const quote = panel.querySelector('.script-accent');

      return {
        leftDelta: Math.abs(quote.getBoundingClientRect().left - body.getBoundingClientRect().left),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect.soft(metrics.leftDelta, `${width}px quote left axis`).toBeLessThanOrEqual(1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  }
});
```

- [ ] **Step 4: Run the responsive test and verify the red state**

Run:

```powershell
node scripts/run-playwright.mjs tests/mobile-layout.spec.mjs --grep "mission quote shares"
```

Expected: FAIL at 1280 px because the quote is currently right-aligned inside the mission panel.

- [ ] **Step 5: Implement the minimal CSS change**

In `assets/css/styles.css`, replace only the margin declaration inside `.mission-panel .script-accent`:

```css
.mission-panel .script-accent {
  max-width: 30ch;
  margin: var(--space-4) auto 0 0;
  color: var(--color-accent);
  font-size: var(--text-2xl);
  line-height: 1.45;
}
```

- [ ] **Step 6: Run the targeted tests and verify the green state**

Run:

```powershell
node --test --test-name-pattern "mission quote keeps" tests/site.test.mjs
node scripts/run-playwright.mjs tests/mobile-layout.spec.mjs --grep "mission quote shares"
```

Expected: Both targeted tests PASS.

- [ ] **Step 7: Run the complete regression suites**

Run:

```powershell
npm test
npm run test:ui
```

Expected: All Node and Playwright tests PASS.

- [ ] **Step 8: Run CSS quality checks**

Run from `C:\Users\bahti\.codex\skills\ux-ui-agent-skills` with the bundled Python runtime:

```powershell
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\lint_hardcodes.py 'C:\Users\bahti\Documents\виталина заказ сайт\.worktrees\hotel-site\assets\css\styles.css'
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\validate_theme_refs.py 'C:\Users\bahti\Documents\виталина заказ сайт\.worktrees\hotel-site\assets\css\styles.css'
```

Expected: Both checks exit successfully without new hardcoded values or invalid theme references.

- [ ] **Step 9: Commit the implementation**

```powershell
git add tests/site.test.mjs tests/mobile-layout.spec.mjs assets/css/styles.css
git commit -m "fix: align mission quote with content"
```

Expected: One focused implementation commit containing only the two tests and the CSS declaration change.
