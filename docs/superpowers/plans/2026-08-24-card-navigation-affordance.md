# Card Navigation Affordance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every card that opens another page visibly navigable on desktop, keyboard, and touch devices without adding a second button.

**Architecture:** Add a shared, always-visible `.card-link-cue` span to navigable service, project, and insight cards. Preserve whole-anchor cards, stretch the existing service-title link across the non-button area, and implement all interaction states with shared token-driven CSS.

**Tech Stack:** Semantic HTML, vanilla CSS custom properties, Node.js built-in test runner, in-app browser responsive QA.

## Global Constraints

- Apply the pattern only to cards that lead to another page.
- Keep informational cards and modal-only material cards visually non-navigable.
- Keep one visual application button in every service card.
- Keep arrow and label together; never push the arrow to the far edge.
- Use only existing design tokens and the global reduced-motion behavior.
- Preserve existing URLs, copy, form behavior, and keyboard order.

---

### Task 1: Add persistent navigation cues to navigable cards

**Files:**
- Modify: `tests/site.test.mjs:400-500`
- Modify: `index.html:48`
- Modify: `projects.html:34`
- Modify: `blog.html:34`

**Interfaces:**
- Consumes: existing `service-card`, `project-card`, `project-listing`, and `insight-card` markup.
- Produces: `.card-link-cue` text spans that describe each existing page transition without creating new focus stops.

- [ ] **Step 1: Write the failing markup test**

Add this test to `tests/site.test.mjs`:

```js
test('navigable cards expose persistent destination cues without duplicating buttons', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const projects = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
  const blog = await readFile(new URL('../blog.html', import.meta.url), 'utf8');

  assert.equal((home.match(/class="card-link-cue"/g) || []).length, 10);
  assert.equal((home.match(/>Подробнее об услуге<\/span>/g) || []).length, 4);
  assert.equal((home.match(/>Смотреть кейс<\/span>/g) || []).length, 3);
  assert.equal((projects.match(/>Смотреть кейс<\/span>/g) || []).length, 3);
  assert.equal((blog.match(/class="card-link-cue"/g) || []).length, 2);

  const modalOnlyMaterial = blog.match(/<article class="insight-card"[\s\S]*?<\/article>/)?.[0] ?? '';
  assert.doesNotMatch(modalOnlyMaterial, /card-link-cue/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: the new test fails because no `.card-link-cue` spans exist.

- [ ] **Step 3: Add cues to `index.html`**

Insert an inert cue before each `.service-card__actions` block:

```html
<span class="card-link-cue" aria-hidden="true">Подробнее об услуге</span>
```

Insert these cues after the descriptive paragraph in each whole-link card:

```html
<span class="card-link-cue">Смотреть кейс</span>
<span class="card-link-cue">Читать статью</span>
<span class="card-link-cue">Смотреть анонсы</span>
<span class="card-link-cue">Открыть материалы</span>
```

Use `Смотреть кейс` in all three project cards. Use `Читать статью`, `Смотреть анонсы`, and `Открыть материалы` respectively in the three insight cards.

- [ ] **Step 4: Add cues to `projects.html` and `blog.html`**

Add this after the paragraph in all three `project-listing > a` cards:

```html
<span class="card-link-cue">Смотреть кейс</span>
```

Add these after the paragraph in the two linked `blog.html` insight cards:

```html
<span class="card-link-cue">Читать статью</span>
<span class="card-link-cue">Смотреть анонсы</span>
```

Do not add a cue to the third `<article class="insight-card">`, because it only opens a modal through its existing button.

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: the markup test and all existing site tests pass.

### Task 2: Implement shared hover, focus, and touch states

**Files:**
- Modify: `tests/site.test.mjs:400-520`
- Modify: `assets/css/styles.css:735-765`
- Modify: `assets/css/styles.css:1046-1075`
- Modify: `assets/css/styles.css:1452-1485`
- Modify: `assets/css/styles.css:2302-2335`

**Interfaces:**
- Consumes: `.card-link-cue` spans from Task 1 and existing page anchors/buttons.
- Produces: a shared token-driven state contract and a stretched service-card link that excludes the modal button layer.

- [ ] **Step 1: Write the failing CSS contract test**

Add this test to `tests/site.test.mjs`:

```js
test('card navigation cues expose desktop, keyboard and touch affordances', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.card-link-cue\s*\{[^}]*display:\s*inline-flex;[^}]*gap:\s*var\(--space-2\);[^}]*font-weight:\s*650;/s);
  assert.match(css, /\.card-link-cue::after\s*\{[^}]*content:\s*"\\2192";[^}]*transition:\s*translate var\(--duration-fast\) var\(--ease-out\);/s);
  assert.match(css, /\.service-card h3 a::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*content:\s*"";/s);
  assert.match(css, /\.service-card__actions\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/s);
  assert.match(css, /\.service-card:has\(h3 a:focus-visible\)\s*\{[^}]*box-shadow:\s*var\(--focus-ring\);/s);
  assert.match(css, /@media \(hover: hover\)[\s\S]*?:is\(\.service-card, \.project-card, \.insight-card\[href\], \.project-listing > a\):hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);[^}]*box-shadow:\s*var\(--shadow-float\);/s);
  assert.match(css, /:is\(\.service-card, \.project-card, \.insight-card\[href\], \.project-listing > a\):active\s*\{[^}]*translate:\s*0 var\(--space-1\);/s);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
node --test tests\site.test.mjs
```

Expected: the new CSS contract test fails because the shared interaction rules do not exist.

- [ ] **Step 3: Update service-card layout and overlay-link safety**

Change the service body grid and add the stretched link contract:

```css
.service-card__body {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
  align-content: stretch;
  padding: var(--space-5);
}

.service-card h3 a::after {
  position: absolute;
  inset: 0;
  content: "";
}

.service-card__actions {
  position: relative;
  z-index: 2;
  display: grid;
  width: 100%;
  margin-block-start: var(--space-3);
  padding-block-start: var(--space-3);
  border-block-start: var(--line-thin) solid var(--color-border);
}

.service-card:has(h3 a:focus-visible) {
  box-shadow: var(--focus-ring);
}

.project-card,
.project-listing > a {
  border: var(--line-thin) solid transparent;
  border-radius: var(--radius-md);
}
```

Retain all existing action visibility and button rules.

- [ ] **Step 4: Add the shared cue and card-state CSS**

Add this after the listing typography rules so it overrides metadata span styles:

```css
.card-link-cue {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-2);
  margin-block-start: auto;
  padding-block-start: var(--space-4);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: normal;
  line-height: 1;
  text-transform: none;
}

.card-link-cue::after {
  content: "\2192";
  transition: translate var(--duration-fast) var(--ease-out);
}

:is(.service-card, .project-card, .insight-card[href], .project-listing > a) {
  transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), translate var(--duration-fast) var(--ease-out);
}

:is(.service-card, .project-card, .insight-card[href], .project-listing > a):active {
  translate: 0 var(--space-1);
}

@media (hover: hover) {
  :is(.service-card, .project-card, .insight-card[href], .project-listing > a):hover {
    border-color: var(--color-accent);
    box-shadow: var(--shadow-float);
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

Update the insight-card content rule so cues align at the bottom of equal-height cards:

```css
.insight-card > div:last-child {
  display: flex;
  flex-direction: column;
  padding: var(--space-5);
}
```

- [ ] **Step 5: Update the existing service action-row test**

Change its grid assertion from four to five rows:

```js
assert.match(css, /\.service-card__body\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0,\s*1fr\) auto auto;[^}]*align-content:\s*stretch;/s);
```

- [ ] **Step 6: Run the full test suite**

Run:

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: all tests pass with zero failures.

- [ ] **Step 7: Commit the implementation**

```powershell
git add index.html projects.html blog.html assets/css/styles.css tests/site.test.mjs
git commit -m "feat: clarify navigable card interactions"
```

### Task 3: Verify the interaction design in the browser

**Files:**
- Verify: `index.html`
- Verify: `projects.html`
- Verify: `blog.html`
- Verify: `assets/css/styles.css`

**Interfaces:**
- Consumes: markup and CSS contracts from Tasks 1 and 2.
- Produces: responsive visual evidence for pointer, keyboard, and touch layouts.

- [ ] **Step 1: Start a fresh local server**

Run:

```powershell
python -m http.server 4188 --bind 127.0.0.1
```

Expected: pages are available from `http://127.0.0.1:4188/`.

- [ ] **Step 2: Verify desktop pointer and keyboard states**

At 1200 × 900, inspect the card sections on `index.html`, `projects.html`, and `blog.html`:

- every page-link card has an always-visible text cue and adjacent arrow;
- service cards keep one visible application button;
- hovering lifts only navigable cards and shifts only their adjacent arrow;
- service buttons remain clickable and open the modal instead of navigating;
- Tab focus is visible on whole-link cards and around a focused service-card link;
- the modal-only material card does not lift or show a page-transition cue.

- [ ] **Step 3: Verify mobile touch layout**

At 375 × 812, inspect the same pages:

- cues remain visible without hover;
- arrows stay beside their text;
- tapping a card navigates, while tapping the service application button opens its modal;
- no card content overflows horizontally;
- active feedback does not cause persistent layout movement.

- [ ] **Step 4: Run design-system and final repository checks**

Run:

```powershell
python C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py assets\css\styles.css
python C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py assets\css\styles.css assets\css\styles.css
node --test tests\site.test.mjs tests\core.test.mjs
git diff --check
git status --short
```

Expected: no hardcoded-value violations, no unresolved token references, all tests pass, no whitespace errors, and the worktree is clean after the implementation commit.
