# Stable fixed header and animated interactions

Read this reference for header, burger navigation, dialogs, FAQ, Cookie panels, body scroll locking, focus or animation defects.

## Fixed header contract

- Use a fixed full-width header with a stable measured height.
- Reserve that height in page flow and anchor offsets.
- Keep the header’s left/right geometry unchanged when the scrollbar disappears.
- Layer page content below the header and active menus/dialogs above it.
- Re-measure the header after responsive font or control-size changes; expose the value as a CSS custom property when content uses it.

## Disclosure state machine

Model temporary layers with explicit closed, opening, open and closing behavior. Keep visual state, `aria-expanded`, `aria-hidden`, inertness and focus management synchronized.

Opening recipe:

1. Record the opener, `scrollY` and scrollbar gap.
2. Make the layer present but initially in its closed visual state.
3. Lock document scroll with compensated width.
4. On the next animation frame, enter the open state and move focus to the first appropriate control.

Closing recipe:

1. Enter the closing visual state while the layer remains rendered.
2. After the actual transition completes, mark it hidden/inert.
3. Restore body styles and the recorded `scrollY` using non-smooth restoration.
4. Return focus to the opener with scrolling prevented.

Handle zero-duration/reduced-motion states without waiting forever for `transitionend`.

## Scroll lock

Before locking, calculate `window.innerWidth - document.documentElement.clientWidth`. Preserve the current scroll position. Apply compensation consistently to the body and any fixed full-width header so neither jumps sideways. On unlock, restore only styles owned by the lock and return to the exact recorded scroll position.

Nested layers need one owner or a lock counter; closing a menu because it opened a modal must not briefly unlock and relock the page.

## Motion

Use transform and opacity for full-screen navigation where possible. A typical deliberate transition is about `220–300ms` with a smooth ease; use project motion tokens. Both opening and closing remain perceptible. Reduced motion removes travel while preserving correct visibility and state changes.

## Burger navigation

- Keep the burger control fixed in place and update its accessible label/state.
- Ensure the open menu fits `100dvh`, wraps long links and does not create horizontal overflow.
- Keep the close action reachable and keyboard order logical.
- Clicking navigation, Escape, backdrop or a modal-triggering action closes through the same state machine.

## Dialogs, FAQ and Cookie

- Dialog close restores the original page position and opener focus.
- Only intentional content regions scroll; do not create a short internal panel when the dialog can fit compactly.
- FAQ height/opacity transitions do not overlap following content or leave hidden content focusable.
- Cookie actions remain compact, visible and touch-safe at `320px`; settings and banner layers share the scroll-lock owner.

## Browser assertions

Measure before and after:

- header `top`, width and control coordinates;
- document width and horizontal overflow;
- scroll position before open and after close (within one pixel);
- `aria-expanded`, visibility and focus target;
- closing duration/state and final hidden/inert state;
- reduced-motion completion;
- behavior at `360px` and `320px`.

