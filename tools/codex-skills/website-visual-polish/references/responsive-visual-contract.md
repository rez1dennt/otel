# Responsive visual contract

Read this reference for spacing, typography, cards, media, buttons or whole-site mobile audits.

## Viewport matrix

Default checks:

- desktop: `1280px` or the project’s primary desktop target;
- intermediate: `768px` or the layout’s actual breakpoint boundary;
- mobile: `360px`;
- narrow mobile: `320px`.

Test at least one height that forces scrolling. Visit every affected public route; a shared component change requires a representative page for each variant and a route-wide overflow audit.

## Find overflow, do not mask it

Compare `document.documentElement.scrollWidth` with `window.innerWidth`. Enumerate visible elements whose bounding box crosses the viewport, then inspect intrinsic widths, grid tracks, flex shrink, transforms, long text and fixed-position layers. Do not solve a child overflow by applying global `overflow-x: hidden` unless the overflow is an intentional clipped decoration.

## Mobile axes and gutters

- Use the project container token; default to a `20px` mobile gutter when no approved value exists.
- Visible content headings share the main left axis and `text-align: start`.
- Use `min-width: 0` on flexible/grid children and safe wrapping on long labels and URLs.
- Anchored headings reserve the fixed header height through `scroll-margin-top`.

## Compact vertical rhythm

Derive section padding, internal gaps and type rhythm from shared tokens. On mobile, reduce the scale consistently instead of overriding individual sections. Avoid fixed heights and broad `min-height` values for content blocks. Empty space must communicate grouping or hierarchy, not compensate for a desktop layout.

## Typography

Use fluid values or breakpoint tokens with measured results at `320px` and `360px`. Keep readable line-height and practical line length. Reduce oversized article/hero type before it causes word-by-word wrapping; preserve the approved type family, weight and hierarchy.

## Cards and actions

- Use grid/flex structure so the content column grows and the action row follows it naturally.
- Align repeated actions using `margin-block-start: auto` or consistent grid rows, not absolute positioning.
- Keep at least `12px` between the final copy block and its action unless the design token is more generous.
- Prefer small, visible text-buttons/chips over isolated arrows with unclear meaning.
- Hover/focus may change color, shadow, image transform or decoration, but not border width, padding or outer geometry.
- If a whole card is a link, avoid duplicating a conflicting nested link/button.

## Media frames

Give the frame a definite aspect ratio or block size at each layout mode. Set the image to fill the frame and verify rendered image height matches frame height within one pixel. Use `object-position` to preserve the meaningful crop. Remove decorative lower surfaces that exist only because the image itself has no definite height.

## Buttons and dense controls

Keep actions visually compact while preserving a usable touch target. Cookie banners and modals should not spend half the viewport on oversized padding or buttons; they must still preserve readable labels, focus rings and safe wrapping at `320px`.

## Screenshot and geometry evidence

Capture the final target states with browser screenshots. Assert computed alignment, gaps, scroll width, frame/image dimensions and header position where a screenshot alone could hide a regression.

