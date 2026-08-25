# Static HTML/CSS/JavaScript architecture

Read this reference when implementing or restructuring the static website.

## File and component boundaries

- Preserve an existing project’s conventions unless they cause the requested defect.
- Use one shared tokenized stylesheet or a small responsibility-based set; avoid per-page style duplication.
- Keep pure validation and state helpers separate from DOM orchestration when JavaScript grows beyond a few handlers.
- Use semantic component classes and stable `data-*` hooks for behavior.
- Keep shared header, navigation, footer, modal, Cookie and form contracts identical across pages.

## Fixed header contract

- Header remains fixed at the top and full width on every page.
- Reserve its measured height on initial content and `scroll-margin` targets.
- Keep logo, menu control, height and horizontal padding stable during scroll lock and menu transitions.
- Layer header above page content and below active full-screen navigation, dialogs and Cookie settings.

## Responsive contract

Validate desktop, one intermediate width, `360px` and `320px`.

- No horizontal overflow or forced minimum page width.
- Mobile headings share a clear left content axis unless the approved design explicitly establishes another alignment.
- Section spacing remains compact and proportional; avoid large fixed heights and viewport-height gaps.
- Grid children use `min-width: 0`; long text and URLs wrap safely.
- Repeated cards align their actions without absolute positioning or card-specific offsets.
- Images fill intentional frames with explicit aspect/height rules and verified `object-fit`.

## Interaction and accessibility

- Native links, buttons, labels and disclosure semantics come first.
- Menu, modal, FAQ and Cookie states synchronize visual classes with `aria-expanded`, `aria-hidden` or dialog state.
- Escape closes temporary layers; focus returns to the opener without scrolling the document.
- Preserve page width and scroll position while locking body scroll.
- Respect `prefers-reduced-motion` without disabling the final open/closed state.

## Images

Prefer supplied client imagery. Auto-orient, crop intentionally, remove unnecessary metadata and create WebP or AVIF at the largest rendered size needed. Do not upscale weak originals. Give content images meaningful alt text; hide decorative media from assistive technology.

## Test-first implementation

Add a failing structural or browser test for every behavior fix. Verify its expected failure, implement the smallest shared correction, rerun the focused test, then the full applicable suite.

