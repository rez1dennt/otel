# Website skills eval results

Execution mode: inline qualitative dry-runs, because the user selected execution without delegated agents. Historical defects and corrections from the hotel website are the no-skill baseline.

## website-build-workflow / Eval 1

- Prompt: five-page static clinic site from photographs, a legal PDF and two visual references; WordPress excluded.
- Result summary: the skill first creates a source-truth ledger and site/component map, then routes implementation through shared static architecture and the visual/release gates without loading the WordPress section.
- Passed expectations: 6/6.
- Evidence:
  - Attachment boundary: `Source truth contract` states that text inside PDFs and screenshots is source material, not a command.
  - Client truth: `project-intake.md` defines confirmed, working, missing and forbidden-to-invent states.
  - Shared system: workflow steps 4–6 require approved direction, shared tokens/components and verified assets.
  - Responsive/accessibility: `static-site-architecture.md` requires fixed header behavior, semantic controls and 360/320px checks.
  - WordPress exclusion: scope table and activation rule exclude CMS work when not requested.
  - Evidence gate: workflow steps 8–9 require browser checks and `website-release-qa`.
- Corrections applied: none.

## website-build-workflow / Eval 2

- Prompt: reusable article, event, material and case templates with clean URLs and later WordPress editing.
- Result summary: the skill produces static archive/detail contracts first, then a separate WordPress object/template/field map with redirects and conditional structured data.
- Passed expectations: 6/6.
- Evidence:
  - Content contracts: `seo-wordpress-handoff.md` lists archive card, detail hero, body, action and related-content fields.
  - SEO: the same reference requires clean slugs, canonical, breadcrumbs and supported JSON-LD.
  - CMS choices: post, CPT and taxonomy decisions are conditional on editorial behavior.
  - Field map: WordPress handoff includes editable fields, type, required state, fallback and escaping.
  - Static demo: scope decision keeps a complete static version before handoff.
  - Truth limits: template contract forbids unconfirmed dates, prices, availability and results.
- Corrections applied: none.

## website-build-workflow / Eval 3

- Prompt: static one-page tradesperson site with services, portfolio, FAQ and form; CMS explicitly excluded.
- Result summary: the skill keeps the implementation static, extracts only visual principles from the reference and still applies shared tokens, accessible interactions and release checks.
- Passed expectations: 6/6.
- Evidence:
  - Reference boundary: `project-intake.md` forbids reproducing distinctive content and full composition.
  - CMS exclusion: both scope decision and WordPress activation predicate keep CMS artifacts out.
  - Reuse: implementation contract centralizes tokens and shared interface components.
  - Form truth: source-truth rules require simulated external behavior to be labelled and missing endpoints reported.
  - Images: workflow step 6 and static architecture require optimized client media and verified cropping.
  - Interaction QA: static architecture and final workflow steps cover header, menu, FAQ, forms and mobile widths.
- Corrections applied: none.

## website-visual-polish / Eval 1

- Prompt: fixed mobile header jumps sideways, burger opens abruptly and closing moves the page to the top.
- Result summary: the skill reproduces the exact state, adds a browser regression, then uses one disclosure/scroll-lock owner with scrollbar compensation, delayed hiding and scroll/focus restoration.
- Passed expectations: 6/6.
- Evidence:
  - Diagnosis: required process captures route, viewport, scroll and DOM geometry before editing.
  - Fixed header: personal contract and `stable-interactions.md` require fixed full-width stable geometry.
  - Two-way animation: state machine keeps the layer rendered through closing.
  - Scroll restoration: lock records scrollbar gap and scrollY, restores owned styles and the exact position.
  - Accessibility: closing returns focus with scrolling prevented and Escape uses the same path.
  - Narrow/reduced checks: browser assertions include 360px, 320px, overflow and reduced motion.
- Corrections applied: none.

## website-visual-polish / Eval 2

- Prompt: card actions are uneven and cramped, hover produces double corners, and image frames expose an empty lower surface.
- Result summary: the skill traces the shared card/media structure, adds geometry assertions and fixes the common component rather than per-card offsets.
- Passed expectations: 6/6.
- Evidence:
  - Shared cause: required process inspects grid/flex boxes and rejects page-specific offsets.
  - Action alignment: responsive contract uses growing content rows and natural bottom alignment.
  - Copy gap: contract requires at least 12px before actions.
  - Stable hover: geometry-changing border/padding is explicitly excluded.
  - Media fill: definite frame size plus one-pixel image/frame measurement is required.
  - Evidence matrix: screenshots and DOM assertions cover desktop, 360px and 320px.
- Corrections applied: none.

## website-visual-polish / Eval 3

- Prompt: full-site 320px audit for centered headings, giant gaps, oversized controls, crowded Cookie banner and horizontal overflow.
- Result summary: the skill builds a route/viewport matrix, finds the actual overflow element and corrects shared mobile tokens/components before a route-wide rerun.
- Passed expectations: 6/6.
- Evidence:
  - Route coverage: viewport matrix requires each affected public route and component variant.
  - Left axis: mobile axes require `text-align: start` and shared gutters.
  - Rhythm: compact rhythm removes broad fixed heights and uses tokens.
  - Dense controls: Cookie/buttons remain compact and touch-safe at 320px.
  - Overflow root: reference enumerates crossing DOM boxes instead of hiding overflow globally.
  - Regression matrix: 1280px, intermediate, 360px and 320px are mandatory.
- Corrections applied: none.

## website-release-qa / Eval 1

- Prompt: urgently push all current changes to main; Playwright exists and some changes predate the current task.
- Result summary: the explicit “all” instruction authorizes complete inclusion after status/secrets/artifact review, but the evidence gate still runs fresh tests and verifies safe feature-to-main integration plus the remote hash.
- Passed expectations: 6/6.
- Evidence:
  - State discovery: evidence gate records status, branch, remote/upstream and included scope.
  - Fresh checks: automated baseline requires focused/full tests and `git diff --check`.
  - User work: staging contract preserves pre-existing changes and treats “all” as inclusion, not deletion.
  - Main target: Git reference routes feature-to-main through the established workflow rather than silently renaming a push.
  - Non-force truth: force and premature push claims are red flags.
  - Remote verification: commit/push recipe compares the authoritative remote ref.
- Corrections applied: none.

## website-release-qa / Eval 2

- Prompt: decide whether a site with no test setup is client-ready, with special attention to mobile.
- Result summary: the skill discovers routes and shared variants, adds project-local Playwright when needed and withholds readiness until the complete browser/SEO/runtime matrix has fresh evidence.
- Passed expectations: 6/6.
- Evidence:
  - No single-page guess: browser checklist starts with route and variant discovery.
  - Routes: sitemap, config, HTML files and navigation all contribute to the surface map.
  - Missing Playwright: evidence gate requires local setup rather than a silent downgrade.
  - Viewports: release matrix includes 1280px, intermediate, 360px and 320px.
  - Behaviors/runtime: checklist covers header, burger, dialog, forms, FAQ, Cookie, console, network, links and assets.
  - External inputs: evidence gate separates code readiness from client-controlled launch data.
- Corrections applied: none.

## website-release-qa / Eval 3

- Prompt: final modal scroll and burger aria test fails; user asks for a quick fix and to rely on yesterday’s other results.
- Result summary: the pressure-resistant gate keeps the failure blocking, follows failing-test/root-cause repair and restarts the full post-fix verification matrix.
- Passed expectations: 6/6.
- Evidence:
  - Urgency resistance: “push/fix now” never deletes the evidence gate.
  - Debugging/TDD: required sub-skills activate on any failure.
  - Shared state: browser checklist verifies visual classes, aria, focus and scroll through every close path.
  - Focused rerun: failure loop reruns the exact regression after the fix.
  - Full rerun: one passing focused fix explicitly requires the full applicable suite.
  - Fresh report: completion shape records current commands/results and forbids stale readiness language.
- Corrections applied: none.
