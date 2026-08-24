# Interface Polish Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the wide-case hover artifact, unify the material-request action, widen the contact card, align footer legal controls, and make the shared header sticky.

**Architecture:** Keep all existing HTML structure and JavaScript behavior except for adding the shared cue class to the material-request button. Split compact-card hover from wide-listing hover, then implement the remaining layout fixes through shared token-driven CSS.

**Tech Stack:** Semantic HTML, vanilla CSS custom properties, Node.js built-in test runner, in-app browser responsive QA.

## Global Constraints

- Preserve all routes, text, images, form actions, modal behavior, menu behavior, and legal links.
- Use only existing design tokens.
- Keep the header below modals and the mobile menu functional.
- Keep 20 px mobile gutters and avoid horizontal scrolling at 320 px.
- Keep reduced-motion and keyboard focus behavior intact.

---

### Task 1: Separate wide-case hover and unify the material action

**Files:**
- Modify: `tests/site.test.mjs:430-500`
- Modify: `blog.html:34`
- Modify: `assets/css/styles.css:1450-1520`
- Modify: `assets/css/styles.css:1669-1705`
- Modify: `assets/css/styles.css:2660-2675`

**Interfaces:**
- Consumes: `.card-link-cue`, `.project-listing > a`, `.insight-card`, and existing modal button wiring.
- Produces: lightweight wide-row hover and one shared material-action appearance.

- [ ] **Step 1: Write failing regression tests**

Add this test to `tests/site.test.mjs`:

```js
test('wide case rows stay unboxed while material actions share one cue style', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const blog = await readFile(new URL('../blog.html', import.meta.url), 'utf8');

  assert.match(blog, /<button class="text-link card-link-cue"[^>]*data-modal-open[^>]*>Запросить материал<\/button>/);
  assert.match(css, /\.insight-card \.card-link-cue\s*\{[^}]*min-height:\s*var\(--space-8\);[^}]*font-size:\s*var\(--text-xs\);[^}]*letter-spacing:\s*0\.1em;[^}]*text-transform:\s*uppercase;/s);
  assert.match(css, /\.project-listing > a\s*\{[^}]*transition:\s*translate var\(--duration-fast\) var\(--ease-out\);/s);
  assert.doesNotMatch(css, /\.project-listing > a,\s*\.article-listing > a\s*\{[^}]*border:/s);
  assert.match(css, /@media \(hover: hover\)[\s\S]*?\.project-listing > a:hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);/s);
});
```

- [ ] **Step 2: Run the site tests and verify the new test fails**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: FAIL because the button lacks `card-link-cue` and wide rows still use the compact-card border contract.

- [ ] **Step 3: Unify the modal-only material action**

Change the button in `blog.html` to:

```html
<button class="text-link card-link-cue" type="button" data-modal-open data-modal-title="Запросить материал" data-modal-description="Укажите тему чек-листа, методики или стандарта. Мы сообщим, когда материал будет доступен.">Запросить материал</button>
```

Add the shared insight cue override after `.card-link-cue`:

```css
.insight-card .card-link-cue {
  min-height: var(--space-8);
  align-items: center;
  padding: 0;
  color: var(--color-text);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Split compact-card and wide-listing hover**

Remove border and radius declarations from the combined `.project-listing > a, .article-listing > a` rule.

Replace the shared transition selector with:

```css
:is(.service-card, .project-card, .insight-card[href]) {
  transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), translate var(--duration-fast) var(--ease-out);
}

.project-listing > a {
  transition: translate var(--duration-fast) var(--ease-out);
}
```

Keep all navigable cards in the existing active rule. Replace the hover block with:

```css
@media (hover: hover) {
  :is(.service-card, .project-card, .insight-card[href]):hover {
    translate: 0 calc(var(--space-1) * -1);
    border-color: var(--color-accent);
    box-shadow: var(--shadow-float);
  }

  .project-listing > a:hover {
    translate: 0 calc(var(--space-1) * -1);
  }

  :is(.service-card, .project-card, .insight-card[href], .project-listing > a):hover .card-link-cue::after,
  .service-card:has(h3 a:focus-visible) .card-link-cue::after {
    translate: var(--space-1) 0;
  }

  .service-card:hover .image-frame img {
    scale: 1.025;
  }
}
```

- [ ] **Step 5: Run the site tests**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: all site tests pass.

### Task 2: Widen contacts, align footer controls, and make header sticky

**Files:**
- Modify: `tests/site.test.mjs:440-510`
- Modify: `assets/css/styles.css:116-125`
- Modify: `assets/css/styles.css:369-379`
- Modify: `assets/css/styles.css:1281-1306`
- Modify: `assets/css/styles.css:1861-1865`
- Modify: `assets/css/styles.css:2762-2770`

**Interfaces:**
- Consumes: existing shared header, footer, and contact-grid selectors.
- Produces: sticky full-width header, aligned legal controls, and a `0.8 / 1.2` contact split.

- [ ] **Step 1: Write failing layout contract tests**

Add this test to `tests/site.test.mjs`:

```js
test('shared layout uses sticky header, aligned footer controls and wider contact details', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /html\s*\{[^}]*scroll-padding-top:\s*calc\(var\(--header-height\) \+ var\(--space-4\)\);/s);
  assert.match(css, /\.site-header\s*\{[^}]*position:\s*sticky;[^}]*inset-block-start:\s*0;[^}]*width:\s*100%;[^}]*border-block-end:\s*var\(--line-thin\) solid var\(--color-border\);[^}]*background:\s*var\(--color-page\);/s);
  assert.match(css, /\.footer-bottom > div\s*\{[^}]*align-items:\s*center;/s);
  assert.match(css, /\.footer-bottom > div > :is\(a, button\)\s*\{[^}]*display:\s*inline-flex;[^}]*min-height:\s*var\(--space-8\);[^}]*align-items:\s*center;[^}]*line-height:\s*1;/s);
  assert.match(css, /\.contact-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.8fr\) minmax\(0, 1\.2fr\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.site-header\s*\{[^}]*width:\s*100%;[^}]*padding-inline:\s*var\(--space-5\);/s);
});
```

Update the existing contact ratio assertion to `0.8fr / 1.2fr`. Update the mobile-gutter assertion so `.container` retains the 20 px width contract while `.site-header` is tested separately as full width.

- [ ] **Step 2: Run the site tests and verify they fail**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: FAIL on the old relative header, footer alignment, and contact ratio.

- [ ] **Step 3: Implement sticky header and anchor offset**

Add to `html`:

```css
scroll-padding-top: calc(var(--header-height) + var(--space-4));
```

Replace the shared header layout with:

```css
.site-header {
  position: sticky;
  inset-block-start: 0;
  z-index: 60;
  display: flex;
  width: 100%;
  min-height: var(--header-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  margin-inline: 0;
  padding-inline: max(var(--space-3), calc((100% - var(--container)) / 2));
  border-block-end: var(--line-thin) solid var(--color-border);
  background: var(--color-page);
}
```

In the mobile media query, keep `.container` at the existing width and add:

```css
.site-header {
  width: 100%;
  padding-inline: var(--space-5);
}
```

- [ ] **Step 4: Implement footer and contact alignment**

Change `.contact-grid` columns to:

```css
grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
```

Update footer controls:

```css
.footer-bottom > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.footer-bottom > div > :is(a, button) {
  display: inline-flex;
  min-height: var(--space-8);
  align-items: center;
  line-height: 1;
}
```

- [ ] **Step 5: Run the full test suite**

Run:

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 6: Commit implementation**

```powershell
git add blog.html assets/css/styles.css tests/site.test.mjs
git commit -m "fix: polish shared interface alignment"
```

### Task 3: Browser and design-system verification

**Files:**
- Verify: `index.html`
- Verify: `projects.html`
- Verify: `blog.html`
- Verify: `contacts.html`
- Verify: `assets/css/styles.css`

- [ ] **Step 1: Start a fresh server**

Run:

```powershell
python -m http.server 4189 --bind 127.0.0.1
```

- [ ] **Step 2: Verify desktop pages at 1200 × 900**

Confirm:

- wide case hover has no enclosing border, corner artifact, or shadow box;
- «Запросить материал» matches the two material cues and still opens the modal;
- contact columns are approximately 392/588 px with the existing total width;
- all footer legal controls share one baseline;
- header stays at viewport top while scrolling and `#services` remains visible below it.

- [ ] **Step 3: Verify mobile at 375 × 812 and 320 px width**

Confirm:

- sticky header remains full width with 20 px inner gutters;
- burger menu opens above content, closes, and preserves its smooth animation;
- no focus target or anchor heading is hidden under the header;
- contacts remain one column;
- footer controls wrap cleanly;
- no horizontal overflow appears.

- [ ] **Step 4: Run final checks**

```powershell
python C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py assets\css\styles.css
python C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py assets\css\styles.css assets\css\styles.css
node --test tests\site.test.mjs tests\core.test.mjs
git diff --check
git status --short
```

Expected: zero lint violations, no unresolved tokens, all tests pass, no whitespace errors, and a clean worktree after the implementation commit.
