# Material Actions Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align all three material-card actions on one horizontal line.

**Architecture:** Reset the inherited metadata margin on the shared `.insight-card .card-link-cue` component. Keep the current flex-column layout and automatic top margin unchanged.

**Tech Stack:** Vanilla CSS, Node.js built-in test runner, in-app browser visual QA.

## Global Constraints

- Do not add card-specific offsets or selectors.
- Preserve link and button semantics, modal behavior, hover, focus, arrows, and mobile layout.
- Use existing tokens and shared selectors only.

---

### Task 1: Reset inherited cue margin

**Files:**
- Modify: `tests/site.test.mjs:460-480`
- Modify: `assets/css/styles.css:1516-1528`

**Interfaces:**
- Consumes: `.insight-card .card-link-cue` shared visual component.
- Produces: identical bottom spacing for span and button cues.

- [ ] **Step 1: Write the failing test**

Extend the existing `wide case rows stay unboxed while material actions share one cue style` CSS assertion:

```js
assert.match(css, /\.insight-card \.card-link-cue\s*\{[^}]*margin-block-end:\s*0;[^}]*min-height:\s*var\(--space-8\);/s);
```

- [ ] **Step 2: Run the site tests and verify failure**

```powershell
node --test tests\site.test.mjs
```

Expected: FAIL because the shared cue does not reset the span metadata margin.

- [ ] **Step 3: Implement the shared reset**

Update the component rule:

```css
.insight-card .card-link-cue {
  margin-block-end: 0;
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

- [ ] **Step 4: Run the full suite**

```powershell
node --test tests\site.test.mjs tests\core.test.mjs
```

Expected: all tests pass.

- [ ] **Step 5: Verify desktop and mobile**

At 1200 × 900, verify all three `.card-link-cue` elements in `.useful-grid` have identical `top`, `bottom`, and height. At 375 × 812, verify one-column cards have no horizontal overflow.

- [ ] **Step 6: Commit**

```powershell
git add assets/css/styles.css tests/site.test.mjs
git commit -m "fix: align material card actions"
```

- [ ] **Step 7: Final checks**

```powershell
python C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py assets\css\styles.css
node --test tests\site.test.mjs tests\core.test.mjs
git diff --check
git status --short
```

Expected: zero lint violations, all tests pass, no whitespace errors, and a clean worktree.
