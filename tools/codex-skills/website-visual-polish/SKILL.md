---
name: website-visual-polish
description: Use when diagnosing or correcting visual, responsive, and interaction defects in an existing website, especially with UI screenshots or reports of cramped content, giant gaps, misaligned cards, oversized mobile text, unclear buttons, image-frame gaps, broken hover geometry, horizontal overflow, a jumping fixed header, abrupt burger navigation, modal scroll jumps, crowded Cookie controls, FAQ animation problems, or a request to audit layouts down to 360px or 320px. Do not use as the primary workflow for a new multi-page build or release-only Git verification.
---

# Website Visual Polish

## Overview

Treat every visual complaint as a measurable layout or state defect. Reproduce it at the reported viewport, fix the shared cause, then prove both the geometry and the rendered result.

## Required process

**REQUIRED SUB-SKILL:** Use `systematic-debugging` before changing an uncertain visual cause and `test-driven-development` for every behavior correction.

1. Capture the exact route, viewport, scroll position, state and screenshot that expose the defect.
2. Inspect DOM boxes, computed styles, overflow, stacking contexts and state classes. Identify the first shared cause.
3. Add a focused failing structural or browser test that reproduces the defect.
4. Read [responsive-visual-contract.md](references/responsive-visual-contract.md) for layout, typography, cards, actions and media.
5. Read [stable-interactions.md](references/stable-interactions.md) whenever header, burger, modal, FAQ, Cookie, focus, motion or scroll locking is involved.
6. Implement the smallest shared correction. Avoid page-specific offsets unless the component is genuinely unique.
7. Rerun the focused test, then inspect screenshots and measured geometry at desktop, an intermediate width, `360px` and `320px` when responsive behavior is affected.
8. Run the project’s applicable full suite and report evidence rather than declaring that it “looks fine”.

## Non-negotiable personal UI contract

- Header is always fixed at the top, full width and visually stable.
- Opening or closing navigation never shifts header controls, page width or scroll position.
- Burger, modal, FAQ and Cookie panels animate both directions; content is not hidden before the closing transition finishes.
- Escape closes temporary layers and focus returns with `preventScroll` behavior.
- Mobile headings use a shared left axis unless the approved design explicitly establishes another alignment.
- Mobile layouts are compact, not cramped: no giant section gaps, oversized type or full-width buttons without purpose.
- Repeated card actions share a baseline and retain clear separation from copy.
- Hover, focus and active states do not alter component dimensions or create double borders/corners.
- Images fill intentional frames; an empty background tail is a defect unless it is an approved content area.
- `360px` and `320px` are tested, not inferred from a wider mobile screenshot.

## Evidence contract

For each corrected issue return:

| Evidence | Required content |
|---|---|
| Reproduction | route, viewport and state |
| Root cause | controlling element and property/state logic |
| Automated check | failing-then-passing test or measured assertion |
| Visual check | relevant before/after or final screenshots |
| Regression check | neighboring widths, touch/focus and full applicable suite |

## Common mistakes

- Editing margins before finding the overflow or intrinsic-size source.
- Using `display: none` at the start of a closing animation.
- Locking body scroll without scrollbar compensation and scroll restoration.
- Centering mobile headings because one desktop hero is centered.
- Fixing card height with a large `min-height` that creates blank space.
- Using `object-fit: cover` without giving the frame a definite rendered size.
- Checking hover only, leaving keyboard and touch states inconsistent.
- Reviewing one screenshot and skipping the page matrix.

