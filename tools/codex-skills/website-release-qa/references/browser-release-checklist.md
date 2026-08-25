# Browser release checklist

Read this reference before presenting a site as complete or client-ready.

## Discover the surface

Build the route list from sitemap, route configuration, HTML files, archive/detail directories and internal navigation. Exclude known legacy/noindex routes only when their redirect or canonical behavior is also tested. Identify shared component variants and pages that exercise each one.

Discover available commands from project instructions, package scripts and existing test configuration. Reuse local infrastructure before adding a duplicate server or Playwright setup.

## Automated baseline

- Run focused regression tests for the changed behavior.
- Run the full relevant unit/static test suite.
- Run `git diff --check`.
- Validate JSON/structured-data blocks and local link/resource resolution when the project has no equivalent test.
- Record exact commands, exit codes and pass/fail counts.

## Viewport matrix

Visit every public route at `1280px`, an intermediate/breakpoint width, `360px` and `320px` when the site is responsive. At each target check:

- `scrollWidth <= innerWidth`;
- content gutters and heading alignment;
- fixed header top/width and content/anchor offsets;
- navigation and footer wrapping;
- card/action spacing and consistent geometry;
- image-frame fill, crop and loading;
- absence of unintended fixed/min-height blank areas;
- readable type and compact controls.

Capture screenshots for representative pages and every previously failing state.

## Interaction matrix

### Fixed header and burger

- Header remains fixed and full width before, during and after menu state changes.
- Open/close animations both complete without abrupt hiding.
- Page width and header controls do not move when scroll is locked.
- Closing through button, link, backdrop and Escape synchronizes classes and `aria-expanded`.
- Scroll position returns within one pixel; focus returns without scrolling.
- Long links wrap, menu fits `100dvh`, and reduced motion reaches the same final states.

### Dialogs and forms

- Every opener works and the dialog has an accessible name.
- Initial focus, focus containment where needed, Escape, backdrop policy and close button work.
- Closing restores opener focus and the exact page position.
- Required, email and telephone validation states are understandable.
- Loading, error and success states match the actual integration; demo forms do not claim transmission.
- Legal consent and privacy links resolve.

### FAQ and Cookie

- FAQ buttons synchronize `aria-expanded`, visibility and content flow.
- Opening one item does not overlap or hide following content.
- Cookie accept, reject, settings, save and reopen controls work.
- Optional analytics does not run before consent.
- Mobile Cookie UI remains compact, readable and touch-safe at `320px`.

## Runtime and resource checks

Collect console errors, page errors and failed network requests. Verify internal links, clean URLs, images, fonts, icons, manifest and downloadable assets. Treat missing local resources and JavaScript exceptions as blockers.

## SEO and launch checks

- unique title/description and one logical `h1`;
- correct canonical and Open Graph URL/image for the intended domain state;
- descriptive alt text and breadcrumbs on nested routes;
- valid structured data using confirmed values;
- `robots.txt` and sitemap route coverage;
- legal pages, operator details and consent wording aligned with confirmed integrations.

Report performance, contrast or accessibility conformance only when measured with an appropriate tool. Do not infer a score from appearance.

## Failure loop

When a check fails: preserve the failing evidence, diagnose the root cause, add or strengthen the regression, implement the smallest shared fix, rerun the focused case, then restart the full applicable matrix. The final evidence must come from the post-fix run.

