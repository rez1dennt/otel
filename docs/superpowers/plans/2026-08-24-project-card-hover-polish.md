# Project Card Hover Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the double-corner framed appearance from homepage project-card hover while preserving clear, accessible navigation feedback.

**Architecture:** Keep the existing card markup and shared navigation cue. Split the CSS interaction contract so bordered service/material cards retain the framed hover, while `.project-card` receives only a tokenized lift; the existing shared image zoom and arrow motion continue to provide destination feedback.

**Tech Stack:** Static HTML, token-driven vanilla CSS, Node.js built-in test runner.

## Global Constraints

- Do not change HTML, copy, images, links, or grid structure.
- Do not add colors, radii, shadows, spacing values, or timing values.
- Preserve the shared `:focus-visible`, active, touch, and reduced-motion behavior.
- Verify both desktop hover and mobile layout without horizontal overflow.

---

### Task 1: Isolate the project-card hover treatment

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: existing `.project-card`, `.image-frame`, `.card-link-cue`, `--space-1`, `--duration-fast`, and `--ease-out` CSS contracts.
- Produces: a project-card hover state that changes only `translate`; existing `a:hover .image-frame img` and `.card-link-cue::after` rules continue to provide image and arrow motion.

- [ ] **Step 1: Write the failing regression test**

Replace the current broad hover assertion in `card navigation cues expose desktop, keyboard and touch affordances` with assertions that require the bordered hover group to exclude `.project-card` and require a separate lift-only project-card rule:

```js
assert.match(
  css,
  /@media \(hover: hover\)[\s\S]*?:is\(\.service-card, \.insight-card\[href\]\):hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);[^}]*border-color:\s*var\(--color-accent\);[^}]*box-shadow:\s*var\(--shadow-float\);/s,
);
assert.match(
  css,
  /@media \(hover: hover\)[\s\S]*?\.project-card\[data-reveal\]:hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);[^}]*\}/s,
);
assert.doesNotMatch(
  css,
  /\.project-card\[data-reveal\]:hover\s*\{[^}]*(?:border-color|box-shadow):/s,
);
assert.match(css, /a:hover \.image-frame img\s*\{[^}]*scale:\s*1\.025;/s);
```

- [ ] **Step 2: Run the focused site test and verify RED**

Run:

```powershell
node --test --test-name-pattern="card navigation cues" tests\site.test.mjs
```

Expected: FAIL because `.project-card` is still inside the shared framed hover selector and no separate, reveal-compatible `.project-card[data-reveal]:hover` rule exists.

- [ ] **Step 3: Implement the minimal CSS split**

Change the shared transition and hover rules to:

```css
:is(.service-card, .insight-card[href]) {
  transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), translate var(--duration-fast) var(--ease-out);
}

.project-card {
  transition: translate var(--duration-fast) var(--ease-out);
}

@media (hover: hover) {
  :is(.service-card, .insight-card[href]):hover {
    translate: 0 calc(var(--space-1) * -1);
    border-color: var(--color-accent);
    box-shadow: var(--shadow-float);
  }

  .project-card[data-reveal]:hover {
    translate: 0 calc(var(--space-1) * -1);
  }
}
```

Keep the existing project-listing lift, shared arrow movement, image zoom, active state, focus-visible rule, and reduced-motion rule unchanged.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
node --test --test-name-pattern="card navigation cues" tests\site.test.mjs
```

Expected: the matching test passes with zero failures.

- [ ] **Step 5: Run the complete automated verification**

Run:

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: all tests pass.

Run:

```powershell
python "C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py" assets\css\styles.css
```

Expected: zero newly introduced hardcoded values.

- [ ] **Step 6: Verify the rendered states**

At `http://127.0.0.1:4189/index.html#projects`:

- measure the first `.project-card` before and during hover;
- confirm border remains transparent and box shadow remains `none` during hover;
- confirm the card translates upward, the image scales, and the arrow moves;
- confirm the card width, height, image radius, and caption padding remain unchanged;
- check a 375px-wide viewport for no horizontal overflow and a visible «Смотреть кейс» cue;
- reset any temporary viewport override.

- [ ] **Step 7: Commit the implementation**

```powershell
git add tests/site.test.mjs assets/css/styles.css
git commit -m "fix: simplify project card hover"
```
