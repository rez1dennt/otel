# Cases CPT and Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. This plan must be executed inline in the current session; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish seven verified hotel case studies and the confirmed Kommersant event on the static site, then make cases independently editable through a native WordPress custom post type without ACF.

**Architecture:** `content/cases.json` is the immutable seed and static-generation source. A Node generator renders the static archive, three homepage cards, and seven detail pages; the WordPress theme copies the same JSON only for idempotent first-run seeding, then treats the WordPress database as authoritative. `/kejsy/` remains a Page, individual case URLs come from `forma_case`, and dynamic template parts replace marked static card regions during theme generation.

**Tech Stack:** Semantic HTML5, tokenized vanilla CSS, ES modules, Node.js test runner, Playwright, PHP 8.1, WordPress classic theme APIs, WordPress Playground.

## Global Constraints

- Keep the current static HTML/CSS/JavaScript site; do not delete it.
- Use the approved facts and metrics from `docs/superpowers/specs/2026-08-28-cases-cpt-and-event-design.md`; do not invent hotel names, results, event time, price, recording, or registration behavior.
- Register cases natively in the theme; do not require ACF, Elementor, or another plugin.
- Preserve `/kejsy/` as a WordPress Page and set `has_archive => false` for `forma_case`.
- Keep the fixed full-width header stable; burger opening must remain smooth and must not change page width or scroll position.
- Reuse existing CSS tokens, components, images, modal, FAQ, footer, and Cookie controls.
- Test desktop, 768 px, 360 px, and 320 px; mobile headings and body copy stay left-aligned with no horizontal overflow.
- All new public images use existing WebP assets and meaningful alt text; Featured Image overrides the theme fallback in WordPress.
- Initial WordPress import is idempotent and never overwrites edits to an existing case.
- Use test-first red/green cycles for every behavior or generator change.

---

## File map

### Content and static generation

- Create `content/cases.json`: seven seed records and all verified case copy.
- Create `scripts/generate-case-content.mjs`: validation, card rendering, detail rendering, marked-region replacement, and static output.
- Modify `package.json`: add `build:content` and run it before theme generation.
- Modify `index.html`: add a stable marked region around the three featured case cards and update the event card.
- Modify `kejsy/index.html`: add a stable marked archive region and real archive schema.
- Create seven `kejsy/<slug>/index.html` outputs.
- Modify `kejsy/rost-pryamyh-prodazh/index.html`: legacy `noindex, follow` compatibility page.
- Create `poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html`.
- Modify the old event page, `/poleznoe/`, the related-material link, and `sitemap.xml`.
- Modify `assets/css/styles.css`: shared case metrics, facts, solution steps, event speaker, and responsive rules.

### WordPress theme

- Create `wordpress-theme/forma-hotel/inc/case-post-type.php`: CPT, meta boxes, sanitization, save handlers, and admin asset registration.
- Create `wordpress-theme/forma-hotel/inc/case-content.php`: field accessors, fallbacks, queries, meta/schema helpers, and legacy redirects.
- Create `wordpress-theme/forma-hotel/inc/case-bootstrap.php`: JSON loading and idempotent seed import.
- Create `wordpress-theme/forma-hotel/assets/js/case-admin.js`: keyboard-operable repeaters.
- Create `wordpress-theme/forma-hotel/assets/css/case-admin.css`: token-aligned admin layout.
- Create `wordpress-theme/forma-hotel/template-parts/case-card.php`.
- Create `wordpress-theme/forma-hotel/template-parts/case-archive.php`.
- Create `wordpress-theme/forma-hotel/template-parts/home-cases.php`.
- Create `wordpress-theme/forma-hotel/single-forma_case.php`.
- Modify `wordpress-theme/forma-hotel/functions.php`, `inc/theme-setup.php`, `route-manifest.mjs`, and the theme generator.
- Copy `content/cases.json` to `wordpress-theme/forma-hotel/inc/data/cases.json` during generation.

### Tests

- Create `tests/cases-content.test.mjs`.
- Modify `tests/site.test.mjs` and `tests/mobile-layout.spec.mjs`.
- Modify `wordpress-theme/tests/generator.test.mjs`, `theme-structure.test.mjs`, and `e2e/wordpress-theme.spec.mjs`.

---

### Task 1: Define and validate the seven-case content contract

**Files:**
- Create: `tests/cases-content.test.mjs`
- Create: `content/cases.json`
- Create: `scripts/generate-case-content.mjs`

**Interfaces:**
- Produces `loadCases(projectRoot): Promise<CaseRecord[]>`.
- Produces `validateCases(cases): CaseRecord[]`, throwing a descriptive error for invalid or duplicate records.
- `CaseRecord` fields: `seedId`, `slug`, `title`, `excerpt`, `objectType`, `product`, `location`, `format`, `context`, `task`, `steps[{title,body}]`, `metrics[{value,label}]`, `conclusion`, `fallbackImage`, `menuOrder`, `featuredRank`.

- [ ] **Step 1: Write the failing contract tests**

```js
test('case content exposes seven unique publishable records', async () => {
  const cases = validateCases(await loadCases(PROJECT_ROOT));
  assert.equal(cases.length, 7);
  assert.equal(new Set(cases.map((item) => item.seedId)).size, 7);
  assert.equal(new Set(cases.map((item) => item.slug)).size, 7);
  assert.deepEqual(cases.filter((item) => item.featuredRank > 0).map((item) => item.featuredRank), [1, 2, 3]);
});

test('case metrics preserve every approved numeric claim', async () => {
  const cases = validateCases(await loadCases(PROJECT_ROOT));
  const metrics = Object.fromEntries(cases.map((item) => [item.slug, item.metrics.map((metric) => metric.value)]));
  assert.deepEqual(metrics['perezagruzka-zagorodnogo-otelya'], ['+20%', '+25%']);
  assert.deepEqual(metrics['peresborka-marketinga-gorodskogo-otelya'], ['4 месяца', '+50%', '+4%', '+12%']);
  assert.deepEqual(metrics['zapusk-novogo-korpusa-na-volge'], ['37 → 72', '+56%', '+2%', '+10%']);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/cases-content.test.mjs`  
Expected: FAIL because `content/cases.json` and `scripts/generate-case-content.mjs` do not exist.

- [ ] **Step 3: Add the validator and the complete seven-record JSON**

Use these exact slugs and featured ranks:

```js
const CASE_KEYS = [
  ['perezagruzka-zagorodnogo-otelya', 1],
  ['antikrizisnaya-strategiya-individualnoe-razmeshchenie-b2b', 0],
  ['premialnyj-otel-novaya-riga-80-procentov-zagruzki', 0],
  ['peresborka-marketinga-gorodskogo-otelya', 2],
  ['zapusk-novogo-korpusa-na-volge', 0],
  ['peresborka-digital-i-kanalov-prodazh', 0],
  ['perepozicionirovanie-eko-otelya', 3]
];
```

`validateCases()` must require every text field, at least one step, at least one metric, `menuOrder` in ascending 10-point increments, `featuredRank` in `0..3`, a local `assets/images/*.webp` fallback, and safe lowercase transliterated slugs. Populate all prose and metrics exactly from specification section 4.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/cases-content.test.mjs`  
Expected: PASS, 7 records and all metric assertions green.

- [ ] **Step 5: Commit the content contract**

```powershell
git add content/cases.json scripts/generate-case-content.mjs tests/cases-content.test.mjs
git commit -m "feat: define verified case content"
```

---

### Task 2: Generate the static case archive, homepage cards, and detail pages

**Files:**
- Modify: `scripts/generate-case-content.mjs`
- Modify: `index.html`
- Modify: `kejsy/index.html`
- Create: seven `kejsy/<slug>/index.html` files
- Modify: `kejsy/rost-pryamyh-prodazh/index.html`
- Modify: `package.json`
- Modify: `tests/cases-content.test.mjs`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Produces `renderCaseCard(caseRecord, variant): string`, where `variant` is `archive` or `featured`.
- Produces `renderCasePage(caseRecord, sharedShell): string`.
- Produces `generateStaticCases({projectRoot}): Promise<string[]>` returning seven output paths.
- Marker contract: `<!-- forma:case-cards:start -->…<!-- forma:case-cards:end -->` and `<!-- forma:featured-cases:start -->…<!-- forma:featured-cases:end -->`.

- [ ] **Step 1: Add failing generation tests**

Assert that generation returns seven files, every file contains one `<main>`, one `<h1>`, one canonical, `Article` and `BreadcrumbList` JSON-LD, every approved step and metric, and no phrase «Пример структуры кейса» or «Шаблон будущего кейса». Assert that the homepage contains only ranks 1–3 and `/kejsy/` contains seven distinct URLs.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/cases-content.test.mjs`  
Expected: FAIL because render and generation exports are absent.

- [ ] **Step 3: Implement static rendering and marked-region replacement**

Render semantic cards as anchors with `.project-card`/`.project-listing` classes, a meaningful image alt, title, excerpt, metric list, and `.card-link-cue`. Render detail pages with breadcrumb, hero, facts, `#context`, `#task`, `#work`, `#result`, conclusion, and the existing modal CTA. Extract the shared header and everything after `</main>` from `kejsy/index.html` so all generated pages retain current menu, footer, modal, Cookie controls, and module script.

Update `package.json`:

```json
"build:content": "node scripts/generate-case-content.mjs",
"build:theme": "npm run build:content && powershell -NoProfile -ExecutionPolicy Bypass -File wordpress-theme/build-theme.ps1"
```

Convert the old detail page to `noindex, follow`, canonical `/kejsy/`, and a visible link «Смотреть реальные кейсы».

- [ ] **Step 4: Generate outputs and verify GREEN**

Run: `npm run build:content`  
Run: `node --test tests/cases-content.test.mjs tests/site.test.mjs`  
Expected: seven detail pages generated; focused suites PASS.

- [ ] **Step 5: Commit static case publication**

```powershell
git add package.json content scripts tests index.html kejsy
git commit -m "feat: publish seven hotel cases"
```

---

### Task 3: Publish the confirmed Kommersant event and responsive page styles

**Files:**
- Create: `poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html`
- Modify: `poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html`
- Modify: `poleznoe/index.html`
- Modify: `poleznoe/materialy/chek-list-audita-prodazh/index.html`
- Modify: `index.html`
- Modify: `sitemap.xml`
- Modify: `assets/css/styles.css`
- Modify: `tests/site.test.mjs`
- Modify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Public event path: `/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/`.
- External CTA URL: `https://events.kommersant.ru/event/industriya-gostepriimstva_26/`.
- New CSS blocks: `.case-facts`, `.case-metrics`, `.case-steps`, `.case-conclusion`, `.event-speaker`, `.event-speaker__media`, `.event-speaker__copy`, `.event-topics`.

- [ ] **Step 1: Add failing content and mobile geometry tests**

Assert exact visible strings «Виталина Погорила — спикер», «10 сентября 2026 года», `УК «ДОМ»`, `проект «Экоранчо»`, the official CTA URL, and `Event` JSON-LD with `startDate: 2026-09-10`. At 360 and 320 px assert no overflow, left-aligned `h1`/`h2`, filled image frames, and CTA width within its container.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/site.test.mjs`  
Run: `npm run test:ui -- tests/mobile-layout.spec.mjs`  
Expected: FAIL because the event route and new selectors are absent.

- [ ] **Step 3: Add the event page, legacy fallback, links, sitemap, and token-based CSS**

Use the confirmed date, address, speaker role, six agenda themes, and the current `client-about-hero.webp` portrait. Omit time, end date, offers, price, and recording. The old event page becomes `noindex, follow` with canonical and visible link to the new event. Update all event cards and related links.

All new CSS values must resolve through existing `--space-*`, `--color-*`, `--radius-*`, typography, container, and motion variables; add a new root token only when no semantic equivalent exists. Use grid/flex with `min-width: 0`, `object-fit: cover`, `:focus-visible`, and the existing reduced-motion block.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/site.test.mjs`  
Run: `npm run test:ui -- tests/mobile-layout.spec.mjs`  
Expected: all event and responsive assertions PASS.

- [ ] **Step 5: Commit event and shared presentation**

```powershell
git add assets/css/styles.css index.html poleznoe sitemap.xml tests
git commit -m "feat: publish Kommersant hospitality event"
```

---

### Task 4: Add the native WordPress case type and safe admin fields

**Files:**
- Create: `wordpress-theme/forma-hotel/inc/case-post-type.php`
- Create: `wordpress-theme/forma-hotel/assets/js/case-admin.js`
- Create: `wordpress-theme/forma-hotel/assets/css/case-admin.css`
- Modify: `wordpress-theme/forma-hotel/functions.php`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`

**Interfaces:**
- Produces `forma_register_case_post_type(): void`.
- Produces `forma_case_meta_boxes(): void` and `forma_save_case_meta(int $post_id): void`.
- Stores `_forma_case_object_type`, `_forma_case_product`, `_forma_case_location`, `_forma_case_format`, `_forma_case_context`, `_forma_case_task`, `_forma_case_steps`, `_forma_case_metrics`, `_forma_case_conclusion`, `_forma_case_privacy_mode`, `_forma_case_featured_rank`, `_forma_case_seed_id`, and `_forma_case_fallback_image`.

- [ ] **Step 1: Add failing theme-structure tests**

Assert the new include exists, `register_post_type( 'forma_case'` uses `public => true`, `has_archive => false`, `rewrite => ['slug' => 'kejsy']`, REST, revisions, thumbnail and page attributes. Assert save code checks nonce, `edit_post`, autosave, sanitizes arrays, and admin JS uses real `<button type="button">` controls.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test wordpress-theme/tests/theme-structure.test.mjs`  
Expected: FAIL because the CPT and admin assets do not exist.

- [ ] **Step 3: Implement registration, meta boxes, repeaters, and secure save**

Register on `init`; call native media support through Featured Image. Render visible labels and help text. The repeater JavaScript clones `<template>` rows, assigns monotonically increasing numeric indexes, moves focus to the first input of a new row, and moves focus to «Добавить шаг»/«Добавить показатель» after deletion. Save handlers strip empty rows and allow only paragraphs, lists, emphasis, and links in long text.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test wordpress-theme/tests/theme-structure.test.mjs`  
Expected: PASS with no structural or security-contract failures.

- [ ] **Step 5: Commit the WordPress editing model**

```powershell
git add wordpress-theme/forma-hotel/functions.php wordpress-theme/forma-hotel/inc/case-post-type.php wordpress-theme/forma-hotel/assets wordpress-theme/tests/theme-structure.test.mjs
git commit -m "feat: add native WordPress case editor"
```

---

### Task 5: Seed cases idempotently and render dynamic WordPress templates

**Files:**
- Create: `wordpress-theme/forma-hotel/inc/case-content.php`
- Create: `wordpress-theme/forma-hotel/inc/case-bootstrap.php`
- Create: `wordpress-theme/forma-hotel/template-parts/case-card.php`
- Create: `wordpress-theme/forma-hotel/template-parts/case-archive.php`
- Create: `wordpress-theme/forma-hotel/template-parts/home-cases.php`
- Create: `wordpress-theme/forma-hotel/single-forma_case.php`
- Modify: `wordpress-theme/forma-hotel/functions.php`
- Modify: `wordpress-theme/forma-hotel/inc/theme-setup.php`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`
- Modify: `wordpress-theme/tests/e2e/wordpress-theme.spec.mjs`

**Interfaces:**
- Produces `forma_load_case_seed_data(): array`.
- Produces `forma_seed_cases(): array` returning `['created' => int[], 'errors' => array]`.
- Produces `forma_case_archive_query(int $limit = -1, bool $featured = false): WP_Query`.
- Produces `forma_case_get_fields(int $post_id): array` and `forma_case_image_url(int $post_id): string`.
- Produces `forma_case_single_schema(WP_Post $post): array` and `forma_case_archive_schema(?array $posts = null): array`.

- [ ] **Step 1: Add failing seed and public rendering tests**

In structural tests require lookup by `_forma_case_seed_id` then slug, no update path for existing posts, no delete calls, and one rewrite flush after bootstrap. In Playground tests assert seven seeded REST records, seven archive cards, three homepage cards, working single URLs, and no duplicate after a second `forma_hotel_bootstrap_site()` call.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test wordpress-theme/tests/theme-structure.test.mjs`  
Expected: FAIL because seed and template helpers are absent.

- [ ] **Step 3: Implement seed loading, non-destructive import, templates, fallbacks, and dynamic metadata**

When `forma_case` is not registered during `after_switch_theme`, call `forma_register_case_post_type()` before `wp_insert_post()`. Store the initial record as published with `menu_order`; map steps and metrics as sanitized arrays. Existing `_seed_id` or slug means skip without update. Add bootstrap errors to the existing notice.

Render cards and sections only for non-empty fields. Privacy `hide_metrics` omits numeric cards but leaves conclusion. Single meta uses post excerpt, canonical permalink, Featured Image/fallback, `Article`, and `BreadcrumbList`. `/kejsy/` uses `CollectionPage` and `ItemList`. Redirect `/kejsy/rost-pryamyh-prodazh/` to `/kejsy/` through `template_redirect`.

- [ ] **Step 4: Run structure tests and build a candidate**

Run: `node --test wordpress-theme/tests/theme-structure.test.mjs`  
Run: `npm run build:theme`  
Expected: structure PASS and `wordpress-theme/dist/forma-hotel.candidate.zip` is produced for the later E2E gate.

- [ ] **Step 5: Commit dynamic WordPress cases**

```powershell
git add wordpress-theme/forma-hotel wordpress-theme/tests
git commit -m "feat: render dynamic WordPress cases"
```

---

### Task 6: Integrate dynamic regions and the event into the WordPress snapshot generator

**Files:**
- Modify: `wordpress-theme/route-manifest.mjs`
- Modify: `wordpress-theme/scripts/generate-wordpress-theme.mjs`
- Modify: `wordpress-theme/tests/generator.test.mjs`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`
- Regenerate: `wordpress-theme/forma-hotel/front-page.php`
- Regenerate: `wordpress-theme/forma-hotel/page-kejsy.php`
- Regenerate: `wordpress-theme/forma-hotel/page-poleznoe.php`
- Regenerate: `wordpress-theme/forma-hotel/page-industriya-gostepriimstva-2026.php`
- Regenerate: `wordpress-theme/forma-hotel/inc/generated-routes.php`

**Interfaces:**
- Produces `injectDynamicThemeRegions(route, main): string`.
- Generator copies `content/cases.json` to `inc/data/cases.json`.
- Manifest removes the demonstrational case Page route and adds the confirmed event Page route.

- [ ] **Step 1: Add failing generator tests**

Assert that `ROUTES` contains `/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/`, excludes `/kejsy/rost-pryamyh-prodazh/`, and maps old project/event addresses to the new canonical destinations. Assert generated home/case archive templates contain `get_template_part( 'template-parts/home-cases' )` and `get_template_part( 'template-parts/case-archive' )`, and the copied JSON byte-for-byte matches the source.

- [ ] **Step 2: Run generator tests and verify RED**

Run: `node --test wordpress-theme/tests/generator.test.mjs`  
Expected: FAIL on manifest, dynamic regions, and seed copy.

- [ ] **Step 3: Implement manifest and generator integration**

Replace only content between the exact marker comments. For `cases`, set `$GLOBALS['forma_page_schema'] = forma_case_archive_schema();` before `get_header()`. Leave all other generated routes on the existing snapshot path. Include the new event route in bootstrap hierarchy and legacy maps.

- [ ] **Step 4: Regenerate and verify GREEN**

Run: `npm run build:content`  
Run: `node wordpress-theme/scripts/generate-wordpress-theme.mjs`  
Run: `node --test wordpress-theme/tests/generator.test.mjs wordpress-theme/tests/theme-structure.test.mjs`  
Expected: all generator/theme structure tests PASS and static source hashes remain unchanged during theme generation.

- [ ] **Step 5: Commit generator integration**

```powershell
git add wordpress-theme
git commit -m "build: integrate dynamic cases into theme snapshot"
```

---

### Task 7: Complete browser, WordPress, accessibility, and release verification

**Files:**
- Modify as failures require: case/event HTML, CSS, PHP templates, tests
- Regenerate: `wordpress-theme/dist/forma-hotel.zip`
- Modify: `docs/wordpress-content-template-map.md`

**Interfaces:**
- Final archive: `wordpress-theme/dist/forma-hotel.zip`.
- Release evidence: static test count, UI test count, theme test count, Playground E2E count, viewports, and Git status.

- [ ] **Step 1: Extend WordPress Playground E2E for real editor behavior**

With the blueprint’s authenticated session, create an eighth case through `/wp-admin/post-new.php?post_type=forma_case`, add one solution step and one metric, publish it, verify it appears on `/kejsy/`, and open its single URL. Edit a seeded title, switch temporarily to the installed default theme through `/wp-admin/themes.php`, reactivate FORMA Hotel through the same screen, and verify the edited title remains. Keep the existing fixed-header, burger, modal, FAQ, Cookie, and overflow tests.

- [ ] **Step 2: Run the complete test matrix**

```powershell
npm test
npm run test:ui
npm run test:theme
npm run build:theme
npm run test:theme:e2e
```

Expected: every command exits 0; no console errors, request failures, PHP warnings, duplicate case seeds, horizontal overflow, or interaction regressions.

- [ ] **Step 3: Run design and accessibility gates that fit the existing token system**

Run the installed UX/UI hardcode and token-reference linters against `assets/css/styles.css`, then inspect actual screenshots at 1280, 768, 360, and 320 px. Run keyboard checks for navigation, modal, Cookie controls, archive cards, event CTA, and WordPress repeaters. Verify reduced motion and that fixed header does not obscure focus.

If an upstream UX/UI gate cannot consume the project’s existing single-file token format, record it as not applicable instead of claiming a pass; use the project’s Playwright measurements as the evidence.

- [ ] **Step 4: Update handoff documentation and rebuild the final ZIP**

Document `forma_case`, `/kejsy/`, `single-forma_case.php`, editable fields, seed behavior, structured data, and redirects in `docs/wordpress-content-template-map.md`. Run `npm run build:theme` again after the final successful source state; validation promotes the candidate to `wordpress-theme/dist/forma-hotel.zip`.

- [ ] **Step 5: Verify repository integrity and commit final fixes**

```powershell
git diff --check
git status --short
git add docs wordpress-theme tests assets content scripts package.json index.html kejsy poleznoe sitemap.xml
git commit -m "test: verify cases and event release"
```

Expected: `git diff --check` prints nothing; after commit the worktree is clean.
