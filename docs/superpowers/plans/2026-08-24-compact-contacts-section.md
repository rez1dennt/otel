# Compact Contacts Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the main contacts section by about 15% while preserving the existing composition, content, colors, and form usability.

**Architecture:** Keep the existing HTML untouched and implement the compact variant through contact-page-specific CSS selectors. Add one structural CSS contract test, then verify the real rendered layout at desktop and mobile widths.

**Tech Stack:** Vanilla HTML, CSS custom properties, Node.js built-in test runner, in-app browser visual QA.

## Global Constraints

- Keep the existing two-column desktop composition and one-column mobile composition.
- Do not change copy, legal details, images, links, colors, element order, FAQ, footer, modal, validation, or form submission behavior.
- Keep touch targets and form controls usable on mobile.
- Reuse the existing spacing, typography, control, and container tokens.

---

### Task 1: Add and implement the compact contacts contract

**Files:**
- Modify: `tests/site.test.mjs:300-380`
- Modify: `assets/css/styles.css:1827-1880`
- Modify: `assets/css/styles.css:2047-2075`
- Modify: `assets/css/styles.css:2575-2578`

**Interfaces:**
- Consumes: existing `.container`, `.contact-grid`, `.contact-details`, `.contact-form`, and `[data-lead-form]` CSS contracts.
- Produces: a contact-page-only compact layout without changing HTML or JavaScript interfaces.

- [ ] **Step 1: Write the failing test**

Add this test to `tests/site.test.mjs`:

```js
test('contact section uses a compact bounded layout contract', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.contact-grid\s*\{[^}]*width:\s*min\(calc\(var\(--container\) - \(var\(--space-20\) \* 2\)\), calc\(100% - var\(--space-10\)\)\);[^}]*gap:\s*clamp\(var\(--space-6\), 4vw, var\(--space-10\)\);/s);
  assert.match(css, /\.contact-details\s*\{[^}]*padding:\s*var\(--space-6\);/s);
  assert.match(css, /body:has\(\.contact-form\) \.contact-details::before\s*\{[^}]*height:\s*calc\(\(var\(--space-20\) \* 2\) \+ var\(--space-10\)\);/s);
  assert.match(css, /\.contact-form\s*\{[^}]*padding:\s*clamp\(var\(--space-5\), 3vw, var\(--space-8\)\);/s);
  assert.match(css, /\.contact-form\[data-lead-form\]\s*\{[^}]*gap:\s*var\(--space-2\);[^}]*margin-block-start:\s*0;/s);
  assert.match(css, /\.contact-form\[data-lead-form\] textarea\s*\{[^}]*min-height:\s*var\(--space-16\);/s);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: the new `contact section uses a compact bounded layout contract` test fails because the compact CSS contract does not exist.

- [ ] **Step 3: Implement the minimal compact CSS**

Update the existing contact selectors in `assets/css/styles.css`:

```css
.contact-grid {
  display: grid;
  width: min(calc(var(--container) - (var(--space-20) * 2)), calc(100% - var(--space-10)));
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: clamp(var(--space-6), 4vw, var(--space-10));
}

.contact-details {
  overflow: hidden;
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface-subtle);
}

body:has(.contact-form) .contact-details::before {
  display: block;
  height: calc((var(--space-20) * 2) + var(--space-10));
  margin: calc(var(--space-6) * -1) calc(var(--space-6) * -1) var(--space-6);
  background-image: url("../images/client-contact.webp");
  background-position: center 34%;
  background-size: cover;
  content: "";
}

.contact-details > p:not(.eyebrow) {
  margin: var(--space-4) 0 var(--space-1);
}

.contact-requisites {
  margin-block-start: var(--space-6);
  padding-block-start: var(--space-5);
}

.contact-form {
  align-content: start;
  padding: clamp(var(--space-5), 3vw, var(--space-8));
}

.contact-form[data-lead-form] {
  gap: var(--space-2);
  margin-block-start: 0;
}

.contact-form[data-lead-form] label:not(.checkbox) {
  margin-block-start: 0;
}

.contact-form[data-lead-form] input:not([type="checkbox"]) {
  min-height: calc(var(--control-md) - var(--space-1));
}

.contact-form[data-lead-form] textarea {
  min-height: var(--space-16);
  padding-block: var(--space-2);
}

.contact-form[data-lead-form] [data-error-for] {
  min-height: 0;
}

.contact-form h2 {
  margin-block-end: var(--space-3);
}
```

Retain every existing declaration not replaced by the snippet, including borders, colors, type rules, and resizing behavior.

- [ ] **Step 4: Run the focused and full tests**

Run:

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 5: Commit the tested implementation**

```powershell
git add assets/css/styles.css tests/site.test.mjs
git commit -m "fix: compact contacts section"
```

### Task 2: Verify responsive visual balance

**Files:**
- Verify: `contacts.html`
- Verify: `assets/css/styles.css`

**Interfaces:**
- Consumes: the compact CSS contract from Task 1.
- Produces: browser evidence that the section is balanced at desktop and mobile widths.

- [ ] **Step 1: Start the local static server on a fresh port**

Run:

```powershell
python -m http.server 4187 --bind 127.0.0.1
```

Expected: the server accepts requests at `http://127.0.0.1:4187/contacts.html`.

- [ ] **Step 2: Inspect the desktop layout**

Open `http://127.0.0.1:4187/contacts.html` at 1200 × 900 and verify:

- the contact grid is visibly narrower and centered;
- the two cards remain aligned at the top;
- the photograph and form controls are shorter;
- no text clips or overflows;
- the social icons and legal details remain intact.

- [ ] **Step 3: Inspect the mobile layout**

Open the same page at 375 × 812 and verify:

- the grid becomes one column and uses the normal 20 px page gutters;
- fields and submit button remain full width;
- the image keeps a useful crop;
- no horizontal scrollbar appears.

- [ ] **Step 4: Run final verification**

Run:

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
git diff --check
git status --short
```

Expected: all tests pass, `git diff --check` reports no errors, and `git status --short` is empty after the implementation commit.
