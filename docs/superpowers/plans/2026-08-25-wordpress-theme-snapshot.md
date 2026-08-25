# WordPress Theme Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify an installable `forma-hotel.zip` classic WordPress theme that reproduces the current static site immediately after activation while leaving the static source untouched and easy to resynchronize.

**Architecture:** A route manifest maps canonical static HTML pages to clean WordPress paths and generated PHP page templates. Hand-written classic-theme shell files own WordPress integration and idempotent activation bootstrap; a deterministic generator copies current assets and emits page snapshots, then a candidate ZIP is installed in WordPress Playground and tested with Playwright before it replaces the final archive.

**Tech Stack:** Node.js ES modules and built-in test runner, PowerShell `Compress-Archive`, PHP classic theme templates, WordPress APIs, `@wp-playground/cli`, existing `@playwright/test`.

## Global Constraints

- Do not delete, move, rename, or rewrite the existing static HTML/CSS/JavaScript site.
- Static files remain the canonical source for all first-version page content and assets.
- Create all theme work under `wordpress-theme/`; final archive is `wordpress-theme/dist/forma-hotel.zip`.
- The ZIP contains exactly one top-level `forma-hotel/` folder.
- Theme activation creates missing routes, page hierarchy, front page, clean permalinks and primary menu without duplicating or overwriting existing pages.
- First-version page body content remains generated static PHP; Gutenberg, ACF and CPT conversion is out of scope.
- Preserve current design, fixed/pinned header behavior, burger, modal, FAQ, Cookie and responsive contracts down to `320px`.
- Connect assets through `get_theme_file_uri()` and internal routes through escaped `home_url()`.
- Include `wp_head()`, `wp_body_open()`, `wp_footer()`, `body_class()`, registered menus and enqueued module JavaScript.
- Do not present demonstration forms, analytics, payments or materials as live integrations.
- Candidate ZIP becomes the final ZIP only after structural, PHP, activation and browser tests pass.
- WordPress Playground CLI requires Node.js `20.18` or newer; verify `node --version` before installing it.
- Source specification: `docs/superpowers/specs/2026-08-25-wordpress-theme-snapshot-design.md`.

---

## File map

### Manifest and generation

- Create `wordpress-theme/route-manifest.mjs` — single source of route, source-page, slug, parent, template, title and menu metadata.
- Create `wordpress-theme/scripts/generate-wordpress-theme.mjs` — extracts `<main>`, transforms URLs, emits PHP templates and generated PHP route data, and copies assets.
- Create `wordpress-theme/tests/generator.test.mjs` — unit/integration tests for extraction, URL transforms, deterministic generation and source integrity.

### Hand-written classic theme shell

- Create `wordpress-theme/forma-hotel/style.css` — WordPress theme metadata only.
- Create `wordpress-theme/forma-hotel/functions.php` — supports, menus, assets, module-script tag and page metadata/schema rendering.
- Create `wordpress-theme/forma-hotel/header.php` — document head, WordPress hooks, fixed header and menu fallback.
- Create `wordpress-theme/forma-hotel/footer.php` — shared footer, modal/Cookie partials and WordPress footer hook.
- Create `wordpress-theme/forma-hotel/index.php` — semantic fallback loop.
- Create `wordpress-theme/forma-hotel/404.php` — generated/snapshot 404 content inside shared shell.
- Create `wordpress-theme/forma-hotel/inc/theme-setup.php` — idempotent `after_switch_theme` bootstrap and admin failure notice.
- Generate `wordpress-theme/forma-hotel/inc/generated-routes.php` — PHP mirror of route manifest.
- Create `wordpress-theme/forma-hotel/template-parts/lead-dialog.php` — current shared dialog with WordPress URLs.
- Create `wordpress-theme/forma-hotel/template-parts/cookie-controls.php` — current Cookie UI.
- Generate `wordpress-theme/forma-hotel/front-page.php` and `page-*.php` — current `<main>` snapshots.
- Generate `wordpress-theme/forma-hotel/assets/` — exact current CSS, JS, images and icons.

### Validation, packaging and real WordPress smoke

- Create `wordpress-theme/scripts/validate-wordpress-theme.mjs` — validates shell, generated templates, references and archive entries.
- Create `wordpress-theme/tests/theme-structure.test.mjs` — failing-first structural contracts.
- Create `wordpress-theme/build-theme.ps1` — candidate build, validation, Playground E2E and atomic final archive replacement.
- Create `wordpress-theme/playground/blueprint.json` — installs bundled candidate ZIP with activation enabled.
- Create `wordpress-theme/scripts/run-playground-e2e.ps1` — builds Blueprint bundle, starts isolated Playground and runs Playwright.
- Create `wordpress-theme/playwright.config.mjs` — WordPress-only browser test configuration.
- Create `wordpress-theme/tests/e2e/wordpress-theme.spec.mjs` — activation, route, UI and responsive tests.
- Create `wordpress-theme/README.md` — build/update/install workflow and first-version limitations.
- Modify `package.json` and `package-lock.json` — add `test:theme`, `test:theme:e2e`, `build:theme` and local `@wp-playground/cli`.

---

### Task 1: Lock the route manifest and generator contract

**Files:**
- Create: `wordpress-theme/route-manifest.mjs`
- Create: `wordpress-theme/tests/generator.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `ROUTES: RouteDefinition[]` for visible snapshot pages, `CONTAINER_ROUTES: RouteDefinition[]` for the three nested WordPress parent pages, and `BOOTSTRAP_ROUTES` for activation. Each definition has `id`, `source`, `output`, `path`, `title`, `parentPath`, `menuOrder`, `menuLabel` and `template`.
- Requires generator exports `extractMain(html)`, `transformMarkup(markup, sourcePath, routes)`, `renderPageTemplate(route, html)` and `generateThemeSnapshot(options)`.

- [ ] **Step 1: Add a theme test command**

Add to `package.json` scripts:

```json
"test:theme": "node --test wordpress-theme/tests/*.test.mjs"
```

- [ ] **Step 2: Create the exact route manifest**

Create `wordpress-theme/route-manifest.mjs`:

```js
export const ROUTES = [
  { id: 'home', source: 'index.html', output: 'front-page.php', path: '/', title: 'Главная', parentPath: null, menuOrder: 0, menuLabel: 'Главная', template: 'front-page.php' },
  { id: 'services', source: 'services.html', output: 'page-uslugi.php', path: '/uslugi/', title: 'Услуги', parentPath: null, menuOrder: 10, menuLabel: 'Услуги', template: 'page-uslugi.php' },
  { id: 'service-audit', source: 'service.html', output: 'page-audit-sistemy-prodazh-otelya.php', path: '/uslugi/audit-sistemy-prodazh-otelya/', title: 'Аудит системы продаж отеля', parentPath: '/uslugi/', menuOrder: null, menuLabel: null, template: 'page-audit-sistemy-prodazh-otelya.php' },
  { id: 'about', source: 'about.html', output: 'page-o-proekte.php', path: '/o-proekte/', title: 'О проекте', parentPath: null, menuOrder: 20, menuLabel: 'О проекте', template: 'page-o-proekte.php' },
  { id: 'cases', source: 'kejsy/index.html', output: 'page-kejsy.php', path: '/kejsy/', title: 'Кейсы', parentPath: null, menuOrder: 30, menuLabel: 'Кейсы', template: 'page-kejsy.php' },
  { id: 'case-growth', source: 'kejsy/rost-pryamyh-prodazh/index.html', output: 'page-rost-pryamyh-prodazh.php', path: '/kejsy/rost-pryamyh-prodazh/', title: 'Рост прямых продаж', parentPath: '/kejsy/', menuOrder: null, menuLabel: null, template: 'page-rost-pryamyh-prodazh.php' },
  { id: 'useful', source: 'poleznoe/index.html', output: 'page-poleznoe.php', path: '/poleznoe/', title: 'Полезное', parentPath: null, menuOrder: 40, menuLabel: 'Полезное', template: 'page-poleznoe.php' },
  { id: 'article-audit', source: 'poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html', output: 'page-kak-provesti-audit-prodazh-otelya.php', path: '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/', title: 'Как провести аудит продаж отеля', parentPath: '/poleznoe/stati/', menuOrder: null, menuLabel: null, template: 'page-kak-provesti-audit-prodazh-otelya.php' },
  { id: 'event-system', source: 'poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html', output: 'page-prodazhi-otelya-kak-sistema.php', path: '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/', title: 'Продажи отеля как система', parentPath: '/poleznoe/meropriyatiya/', menuOrder: null, menuLabel: null, template: 'page-prodazhi-otelya-kak-sistema.php' },
  { id: 'material-checklist', source: 'poleznoe/materialy/chek-list-audita-prodazh/index.html', output: 'page-chek-list-audita-prodazh.php', path: '/poleznoe/materialy/chek-list-audita-prodazh/', title: 'Чек-лист аудита продаж отеля', parentPath: '/poleznoe/materialy/', menuOrder: null, menuLabel: null, template: 'page-chek-list-audita-prodazh.php' },
  { id: 'contacts', source: 'contacts.html', output: 'page-kontakty.php', path: '/kontakty/', title: 'Контакты', parentPath: null, menuOrder: 50, menuLabel: 'Контакты', template: 'page-kontakty.php' },
  { id: 'privacy', source: 'privacy.html', output: 'page-politika-konfidencialnosti.php', path: '/politika-konfidencialnosti/', title: 'Политика конфиденциальности', parentPath: null, menuOrder: null, menuLabel: null, template: 'page-politika-konfidencialnosti.php' },
  { id: 'consent', source: 'consent.html', output: 'page-soglasie-na-obrabotku-personalnyh-dannyh.php', path: '/soglasie-na-obrabotku-personalnyh-dannyh/', title: 'Согласие на обработку персональных данных', parentPath: null, menuOrder: null, menuLabel: null, template: 'page-soglasie-na-obrabotku-personalnyh-dannyh.php' },
  { id: 'cookies', source: 'cookies.html', output: 'page-politika-cookie.php', path: '/politika-cookie/', title: 'Политика использования Cookie', parentPath: null, menuOrder: null, menuLabel: null, template: 'page-politika-cookie.php' }
];

export const CONTAINER_ROUTES = [
  { id: 'articles-container', source: null, output: 'page-stati.php', path: '/poleznoe/stati/', title: 'Статьи', parentPath: '/poleznoe/', menuOrder: null, menuLabel: null, template: 'page-stati.php', redirectPath: '/poleznoe/' },
  { id: 'events-container', source: null, output: 'page-meropriyatiya.php', path: '/poleznoe/meropriyatiya/', title: 'Мероприятия', parentPath: '/poleznoe/', menuOrder: null, menuLabel: null, template: 'page-meropriyatiya.php', redirectPath: '/poleznoe/' },
  { id: 'materials-container', source: null, output: 'page-materialy.php', path: '/poleznoe/materialy/', title: 'Материалы', parentPath: '/poleznoe/', menuOrder: null, menuLabel: null, template: 'page-materialy.php', redirectPath: '/poleznoe/' }
];

export const BOOTSTRAP_ROUTES = [...ROUTES, ...CONTAINER_ROUTES];

export const LEGACY_PATHS = new Map([
  ['/index.html', '/'], ['/services.html', '/uslugi/'], ['/service.html', '/uslugi/audit-sistemy-prodazh-otelya/'],
  ['/about.html', '/o-proekte/'], ['/projects.html', '/kejsy/'], ['/project.html', '/kejsy/rost-pryamyh-prodazh/'],
  ['/blog.html', '/poleznoe/'], ['/article.html', '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/'],
  ['/contacts.html', '/kontakty/'], ['/privacy.html', '/politika-konfidencialnosti/'],
  ['/consent.html', '/soglasie-na-obrabotku-personalnyh-dannyh/'], ['/cookies.html', '/politika-cookie/']
]);
```

- [ ] **Step 3: Write failing generator tests**

Test these exact behaviors in `generator.test.mjs`:

```js
test('manifest covers every intended public WordPress route', () => {
  assert.equal(ROUTES.length, 14);
  assert.equal(new Set(ROUTES.map((route) => route.path)).size, ROUTES.length);
  assert.ok(ROUTES.every((route) => route.path.startsWith('/') && route.path.endsWith('/')));
  assert.equal(CONTAINER_ROUTES.length, 3);
  assert.equal(new Set(BOOTSTRAP_ROUTES.map((route) => route.path)).size, BOOTSTRAP_ROUTES.length);
});

test('extractMain returns one complete main landmark', () => {
  assert.equal(extractMain('<body><main id="main-content"><h1>A</h1></main></body>'), '<main id="main-content"><h1>A</h1></main>');
  assert.throws(() => extractMain('<body></body>'), /exactly one <main>/);
});

test('transformMarkup resolves source-relative assets and clean internal routes', () => {
  const html = '<a href="../../../../services.html">A</a><img src="../../../../assets/images/x.webp">';
  const result = transformMarkup(html, 'poleznoe/stati/x/index.html', ROUTES);
  assert.match(result, /esc_url\( home_url\( '\/uslugi\/' \) \)/);
  assert.match(result, /esc_url\( get_theme_file_uri\( '\/assets\/images\/x\.webp' \) \)/);
});

test('renderPageTemplate wraps generated main with the shared shell', () => {
  const output = renderPageTemplate(ROUTES[0], '<html><head><title>X</title></head><body><main id="main-content"><h1>X</h1></main></body></html>');
  assert.match(output, /get_header\(\);/);
  assert.match(output, /get_footer\(\);/);
  assert.match(output, /GENERATED FILE/);
});
```

- [ ] **Step 4: Verify RED**

Run `npm run test:theme`.

Expected: failure because `generate-wordpress-theme.mjs` and its exports do not exist.

- [ ] **Step 5: Commit the manifest and red tests**

```powershell
git add package.json wordpress-theme/route-manifest.mjs wordpress-theme/tests/generator.test.mjs
git commit -m "test: define WordPress theme snapshot routes"
```

---

### Task 2: Build the hand-written classic theme shell

**Files:**
- Create: `wordpress-theme/tests/theme-structure.test.mjs`
- Create: `wordpress-theme/forma-hotel/style.css`
- Create: `wordpress-theme/forma-hotel/functions.php`
- Create: `wordpress-theme/forma-hotel/header.php`
- Create: `wordpress-theme/forma-hotel/footer.php`
- Create: `wordpress-theme/forma-hotel/index.php`
- Create: `wordpress-theme/forma-hotel/template-parts/lead-dialog.php`
- Create: `wordpress-theme/forma-hotel/template-parts/cookie-controls.php`

**Interfaces:**
- `forma_theme_asset_version(string $relativePath): string`
- `forma_primary_menu_fallback(array $args): void`
- `forma_replace_demo_urls(mixed $value): mixed`
- Global `$forma_page_meta` and `$forma_page_schema` are set by generated templates before `get_header()`.

- [ ] **Step 1: Write failing shell structure tests**

Require:

```js
const required = ['style.css', 'functions.php', 'header.php', 'footer.php', 'index.php'];
for (const file of required) await access(path.join(THEME, file));

assert.match(await readFile(path.join(THEME, 'style.css'), 'utf8'), /Theme Name:\s*FORMA Hotel/);
assert.match(await readFile(path.join(THEME, 'header.php'), 'utf8'), /wp_head\(\)/);
assert.match(await readFile(path.join(THEME, 'header.php'), 'utf8'), /wp_body_open\(\)/);
assert.match(await readFile(path.join(THEME, 'footer.php'), 'utf8'), /wp_footer\(\)/);
assert.match(await readFile(path.join(THEME, 'functions.php'), 'utf8'), /wp_enqueue_scripts/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test wordpress-theme/tests/theme-structure.test.mjs
```

Expected: failure on missing `style.css`.

- [ ] **Step 3: Create theme metadata and WordPress supports**

Use this exact `style.css` header:

```css
/*
Theme Name: FORMA Hotel
Description: Снимок сайта FORMA hotel advisory для последующей динамической натяжки.
Version: 0.1.0
Requires at least: 6.4
Requires PHP: 8.1
License: GNU General Public License v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: forma-hotel
*/
```

In `functions.php`, define `FORMA_HOTEL_VERSION` as `0.1.0`, require `inc/theme-setup.php`, register `title-tag`, `post-thumbnails`, `custom-logo`, HTML5 support and `primary` menu, enqueue `/assets/css/styles.css` and `/assets/js/main.js`, and add `type="module"` only to the `forma-hotel-main` script tag.

Add recursive URL replacement:

```php
function forma_replace_demo_urls( $value ) {
    if ( is_array( $value ) ) {
        return array_map( 'forma_replace_demo_urls', $value );
    }
    if ( is_string( $value ) && str_starts_with( $value, 'https://example.ru' ) ) {
        return home_url( substr( $value, strlen( 'https://example.ru' ) ) ?: '/' );
    }
    return $value;
}
```

- [ ] **Step 4: Create header and footer partials**

Translate the exact current header/footer/modal/Cookie markup from `index.html` while preserving classes and `data-*` hooks.

Mandatory WordPress substitutions:

- `language_attributes()`, `bloginfo( 'charset' )`, `wp_head()`, `body_class()`, `wp_body_open()`;
- every internal URL uses `esc_url( home_url( '/clean-path/' ) )`;
- icons use `esc_url( get_theme_file_uri( '/assets/icons/...' ) )`;
- header menu uses `wp_nav_menu()` at `theme_location => primary` and `forma_primary_menu_fallback`;
- `footer.php` includes both shared template parts and `wp_footer()`.

- [ ] **Step 5: Create fallback `index.php`**

Use `get_header()`, one `<main id="main-content">`, a normal WordPress Loop with escaped title/permalink and `the_excerpt()`/`the_content()`, then `get_footer()`.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm run test:theme
```

Expected: shell structure tests pass; generator tests still fail only because generator implementation is missing.

- [ ] **Step 7: Commit the shell**

```powershell
git add wordpress-theme/forma-hotel wordpress-theme/tests/theme-structure.test.mjs
git commit -m "feat: add FORMA WordPress theme shell"
```

---

### Task 3: Implement deterministic snapshot generation

**Files:**
- Create: `wordpress-theme/scripts/generate-wordpress-theme.mjs`
- Generate: `wordpress-theme/forma-hotel/inc/generated-routes.php`
- Generate: `wordpress-theme/forma-hotel/front-page.php`
- Generate: `wordpress-theme/forma-hotel/page-*.php`
- Generate: `wordpress-theme/forma-hotel/404.php`
- Generate: `wordpress-theme/forma-hotel/assets/**`
- Modify: `wordpress-theme/tests/generator.test.mjs`

**Interfaces:**
- `generateThemeSnapshot({ projectRoot, themeRoot, routes = ROUTES }): Promise<{ generatedFiles: string[], sourceHashes: Map<string,string> }>`
- `extractMain(html): string`
- `transformMarkup(markup, sourcePath, routes): string`
- `renderPageTemplate(route, html): string`
- `renderGeneratedRoutesPhp(routes): string`

- [ ] **Step 1: Add failing source-integrity and generation tests**

Before calling `generateThemeSnapshot`, SHA-256 every manifest source plus every file under `assets/`. After generation, assert all source hashes remain identical. Also assert:

```js
assert.equal(result.generatedFiles.length, ROUTES.length + CONTAINER_ROUTES.length + 2); // public/container templates + 404 + generated-routes.php
for (const route of ROUTES) await access(path.join(THEME, route.output));
assert.doesNotMatch(await readFile(path.join(THEME, 'front-page.php'), 'utf8'), /href="[^"]+\.html/);
assert.doesNotMatch(await readFile(path.join(THEME, 'front-page.php'), 'utf8'), /(?:src|href)="\/?assets\//);
```

- [ ] **Step 2: Verify RED**

Run `node --test wordpress-theme/tests/generator.test.mjs`.

Expected: missing export or missing generated files.

- [ ] **Step 3: Implement parsing and URL transformation**

Implementation rules:

- Normalize source URLs against `https://static.local/<sourcePath>`.
- Preserve `#`, `mailto:`, `tel:`, `data:` and external `http(s)` destinations other than `https://example.ru`.
- Map legacy/static paths through `LEGACY_PATHS` and `ROUTES`.
- Convert asset attributes to `<?php echo esc_url( get_theme_file_uri( '/assets/...' ) ); ?>`.
- Convert internal hrefs to `<?php echo esc_url( home_url( '/clean-path/' ) ); ?>`.
- Reject any source with zero or multiple `<main>` landmarks.
- Extract title, description, OG type/image and every valid JSON-LD block.
- Serialize schema as a PHP array with a dedicated `toPhpLiteral(value)` function; `forma_replace_demo_urls()` converts demo-domain values at runtime.

Generated page shape:

```php
<?php
/**
 * GENERATED FILE. Edit the static source and rerun the theme generator.
 *
 * Template Name: FORMA Snapshot — Page title
 * Template Post Type: page
 */
$forma_page_meta = array(
    'description' => '...',
    'canonical_path' => '/clean-path/',
    'og_type' => 'website',
    'og_image' => '/assets/images/hero-hotel.webp',
);
$forma_page_schema = array();
get_header();
?>
<main id="main-content">...</main>
<?php get_footer(); ?>
```

Avoid nested `<main>` by emitting the exact extracted `<main>` once.

For `CONTAINER_ROUTES`, generate a small template that calls `wp_safe_redirect( home_url( '/poleznoe/' ), 301 )` and `exit`; these pages exist only to provide the correct WordPress parent hierarchy for article/event/material paths.

- [ ] **Step 4: Generate PHP route data for bootstrap**

`inc/generated-routes.php` mirrors `BOOTSTRAP_ROUTES` and returns a PHP array containing `path`, `slug`, `title`, `parent_path`, `output`, `menu_order` and `menu_label`. The final path segment supplies `slug`; home uses `home`.

- [ ] **Step 5: Copy assets safely**

Copy the exact `assets/css`, `assets/js`, `assets/images` and `assets/icons` trees into the theme. Resolve source and target absolute paths and assert the target stays inside `wordpress-theme/forma-hotel/assets` before clearing/replacing only those four generated subdirectories.

- [ ] **Step 6: Verify GREEN and determinism**

Run the generator twice followed by:

```powershell
node --test wordpress-theme/tests/generator.test.mjs
npm test
git diff --check
```

Expected: generator tests pass, existing 120 static tests pass, no whitespace errors, and the second generation produces no new diff.

- [ ] **Step 7: Commit generator and generated snapshot**

```powershell
git add wordpress-theme/scripts/generate-wordpress-theme.mjs wordpress-theme/forma-hotel wordpress-theme/tests/generator.test.mjs
git commit -m "feat: generate WordPress page snapshots"
```

---

### Task 4: Implement idempotent activation bootstrap

**Files:**
- Create: `wordpress-theme/forma-hotel/inc/theme-setup.php`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`

**Interfaces:**
- `forma_hotel_routes(): array`
- `forma_find_page_by_path(string $path): ?WP_Post`
- `forma_bootstrap_site(): void`
- `forma_bootstrap_admin_notice(): void`
- Option keys: `forma_hotel_bootstrap_version`, `forma_hotel_bootstrap_errors`.

- [ ] **Step 1: Add failing bootstrap contract tests**

Statically require the PHP file to contain `after_switch_theme`, `wp_insert_post`, `get_page_by_path`, `page_on_front`, `show_on_front`, `wp_create_nav_menu`, `set_theme_mod`, `flush_rewrite_rules` and admin notice handling. Assert there is no `wp_delete_post`.

- [ ] **Step 2: Verify RED**

Run `node --test wordpress-theme/tests/theme-structure.test.mjs`.

Expected: failure because `inc/theme-setup.php` is missing.

- [ ] **Step 3: Implement ordered page creation**

Load generated routes, sort by path depth, and for each route:

1. remove leading/trailing slashes to obtain the full page path;
2. find existing page with `get_page_by_path( $path, OBJECT, 'page' )`;
3. when missing, resolve parent ID from previously found/created parent path and call `wp_insert_post()` with `post_status=publish`, confirmed title, final slug and parent;
4. assign the generated `output` through `_wp_page_template` for each newly created non-home page;
5. collect `WP_Error` messages instead of stopping at the first failure;
6. never update post content/title/parent or a non-default template of an existing page.

For home, create/reuse `home`, set `show_on_front=page` and `page_on_front` to its ID.

- [ ] **Step 4: Implement clean permalink and menu setup**

If `permalink_structure` is empty or plain, set it to `/%postname%/`; preserve any existing non-plain custom structure.

Create or reuse `FORMA Primary`. Add only missing page object IDs in manifest menu order. Assign it to the registered `primary` location while preserving other theme locations.

- [ ] **Step 5: Make reruns safe**

Store bootstrap version only after processing. Run `flush_rewrite_rules()` once per `after_switch_theme` invocation, not on every request. A second activation must find all pages/menu items and create zero duplicates.

Store errors in `forma_hotel_bootstrap_errors`; show an escaped admin notice listing failed paths/messages. Clear the option after a fully successful rerun.

- [ ] **Step 6: Verify structural GREEN**

Run:

```powershell
npm run test:theme
git diff --check
```

Expected: all generator and theme-structure tests pass.

- [ ] **Step 7: Commit bootstrap**

```powershell
git add wordpress-theme/forma-hotel/inc/theme-setup.php wordpress-theme/tests/theme-structure.test.mjs
git commit -m "feat: bootstrap WordPress pages and navigation"
```

---

### Task 5: Validate and build a candidate ZIP

**Files:**
- Create: `wordpress-theme/scripts/validate-wordpress-theme.mjs`
- Create: `wordpress-theme/build-theme.ps1`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`
- Generate: `wordpress-theme/.build/forma-hotel.zip`
- Generate after all gates: `wordpress-theme/dist/forma-hotel.zip`

**Interfaces:**
- Validator CLI: `node wordpress-theme/scripts/validate-wordpress-theme.mjs [themeRoot] [zipPath]`.
- Build CLI: `powershell -ExecutionPolicy Bypass -File wordpress-theme/build-theme.ps1 [-SkipE2E]`.

- [ ] **Step 1: Add failing archive tests**

Create a deliberately absent candidate expectation and assert the validator fails before packaging. Required archive assertions:

- every entry begins `forma-hotel/`;
- no second `forma-hotel/forma-hotel/` nesting;
- no `node_modules`, `.build`, tests, docs, cache or source scripts;
- required shell/generated files and all asset references are present;
- `style.css` version equals build manifest version.

- [ ] **Step 2: Verify RED**

Run the validator against `wordpress-theme/.build/forma-hotel.zip`.

Expected: non-zero exit with `candidate ZIP not found`.

- [ ] **Step 3: Implement source and ZIP validator**

Use Node’s filesystem APIs and PowerShell-generated `tar -tf`/`.NET ZipArchive` entry list supplied as JSON if Node lacks ZIP support. Validate PHP source text, transformed links, manifest coverage and archive shape. Print one error per invariant and exit non-zero when any fail.

- [ ] **Step 4: Implement candidate build**

`build-theme.ps1`:

1. resolves repository, theme, `.build`, candidate and final paths;
2. verifies all build/deletion targets remain inside `wordpress-theme/.build` or `wordpress-theme/dist`;
3. runs generator and both Node test files;
4. creates a staging directory containing one `forma-hotel` folder;
5. compresses the staging folder to `.build/forma-hotel.zip`;
6. validates candidate ZIP;
7. when `-SkipE2E` is present, stops successfully with the validated candidate and leaves `dist/forma-hotel.zip` unchanged;
8. otherwise calls `run-playground-e2e.ps1` with the candidate;
9. only after E2E success copies/replaces `dist/forma-hotel.zip`;
10. validates the final archive again.

- [ ] **Step 5: Verify candidate GREEN without E2E**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress-theme\build-theme.ps1 -SkipE2E
```

Expected: candidate structural validation passes, `.build/forma-hotel.zip` has one top-level folder, and `dist/forma-hotel.zip` is not created or changed by the bypassed run.

- [ ] **Step 6: Commit packaging**

Commit scripts/tests but do not commit `.build/`. Commit `dist/forma-hotel.zip` only after Task 6 real activation passes.

```powershell
git add wordpress-theme/scripts/validate-wordpress-theme.mjs wordpress-theme/build-theme.ps1 wordpress-theme/tests/theme-structure.test.mjs
git commit -m "build: package FORMA WordPress theme"
```

---

### Task 6: Install the candidate ZIP in WordPress Playground and run E2E

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `wordpress-theme/playground/blueprint.json`
- Create: `wordpress-theme/scripts/run-playground-e2e.ps1`
- Create: `wordpress-theme/playwright.config.mjs`
- Create: `wordpress-theme/tests/e2e/wordpress-theme.spec.mjs`

**Interfaces:**
- `run-playground-e2e.ps1 -ThemeZip <absolute zip> -Port 9411` starts a temporary Playground, runs E2E and terminates the exact process it started.
- Environment variable `FORMA_WP_BASE_URL` supplies Playwright base URL.

- [ ] **Step 1: Install the local Playground CLI**

Run:

```powershell
npm install --save-dev @wp-playground/cli
```

Add scripts:

```json
"test:theme:e2e": "playwright test --config=wordpress-theme/playwright.config.mjs",
"build:theme": "powershell -ExecutionPolicy Bypass -File wordpress-theme/build-theme.ps1"
```

- [ ] **Step 2: Create a bundled Blueprint**

`blueprint.json`:

```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "preferredVersions": { "php": "8.1", "wp": "latest" },
  "extraLibraries": ["wp-cli"],
  "login": true,
  "landingPage": "/",
  "siteOptions": { "blogname": "FORMA Hotel" },
  "steps": [
    {
      "step": "installTheme",
      "themeData": { "resource": "bundled", "path": "/theme.zip" },
      "options": { "activate": true },
      "ifAlreadyInstalled": "error"
    },
    { "step": "wp-cli", "command": "eval 'forma_bootstrap_site();'" }
  ]
}
```

- [ ] **Step 3: Write failing WordPress E2E tests**

Before the runner exists, add tests that expect:

- active front page contains current FORMA `h1`;
- REST `/wp-json/wp/v2/pages?per_page=100` contains every `BOOTSTRAP_ROUTES` path exactly once with correct parents;
- the three container routes redirect to `/poleznoe/` and are absent from navigation;
- primary desktop/mobile navigation contains six items and clean WordPress links;
- every route returns a page with one `<main>` and one `<h1>`;
- no console errors, page errors or failed local resources;
- no horizontal overflow at `1280`, `360`, `320`;
- header remains pinned while scrolling and does not change width when burger opens;
- burger open/close, Escape, focus and scroll restoration work;
- modal, FAQ and Cookie flows work;
- repeated activation in Blueprint produced no duplicate pages.

- [ ] **Step 4: Verify RED**

Run:

```powershell
npm run test:theme:e2e
```

Expected: connection failure because Playground is not running.

- [ ] **Step 5: Implement isolated runner**

The PowerShell runner:

1. validates the supplied absolute candidate ZIP path;
2. creates a unique temporary Blueprint bundle directory under `$env:TEMP`;
3. copies `blueprint.json` and candidate as `theme.zip`;
4. reads `node_modules/@wp-playground/cli/package.json`, resolves its declared executable entry, and starts that entry directly with Node in a hidden process using `server --blueprint=<bundle> --port=<port> --skip-browser`;
5. waits up to 120 seconds for the site URL;
6. sets `FORMA_WP_BASE_URL` and runs `npm run test:theme:e2e`;
7. captures exit status;
8. terminates only the exact Playground process it started and waits for exit;
9. preserves failure artifacts and returns the Playwright exit code.

Do not use a visible helper window. Resolve and validate temporary paths before any recursive cleanup.

- [ ] **Step 6: Verify GREEN from the candidate ZIP**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File wordpress-theme\scripts\run-playground-e2e.ps1 -ThemeZip wordpress-theme\.build\forma-hotel.zip -Port 9411
```

Expected: theme installs/activates, second activation produces no duplicates, and all WordPress E2E tests pass.

- [ ] **Step 7: Run full build without bypass**

```powershell
npm run build:theme
```

Expected: generator, structural tests, candidate validation, Playground E2E and final archive validation all pass; only then `wordpress-theme/dist/forma-hotel.zip` updates.

- [ ] **Step 8: Commit real-runtime validation and final ZIP**

```powershell
git add package.json package-lock.json wordpress-theme/playground wordpress-theme/scripts/run-playground-e2e.ps1 wordpress-theme/playwright.config.mjs wordpress-theme/tests/e2e wordpress-theme/dist/forma-hotel.zip
git commit -m "test: verify WordPress theme activation"
```

---

### Task 7: Document update workflow and run the release gate

**Files:**
- Create: `wordpress-theme/README.md`
- Modify only if failures require it: theme/generator/test files above.

**Interfaces:**
- Handoff documents static-first editing, regeneration, build command, ZIP path, installation behavior and intentionally non-dynamic features.

- [ ] **Step 1: Write README**

Document:

- current static site remains canonical and untouched;
- `npm run build:theme` is the only supported archive update command;
- activation creates missing pages/menu/front page and never deletes existing content;
- generated `front-page.php`/`page-*.php` must not be edited manually;
- manual shell files and where to edit header/footer/modal/Cookie;
- final ZIP location and WordPress upload steps;
- clean route map;
- form/analytics/payment limitations;
- later dynamic migration path from `docs/wordpress-content-template-map.md`.

- [ ] **Step 2: Capture static-source integrity**

Compare Git diff paths against the pre-task commit. Assert no existing root HTML, `assets/`, static SEO file or current site test changed. Any such change blocks completion unless separately explained and approved.

- [ ] **Step 3: Run fresh full verification**

```powershell
npm test
npm run test:ui
npm run test:theme
npm run build:theme
git diff --check
```

Expected:

- static Node tests: 120/120 or higher if new non-theme tests are added;
- existing Playwright: 10/10;
- all theme generator/structure tests pass;
- candidate/final ZIP validation passes;
- WordPress Playground E2E passes at all target widths;
- no whitespace errors.

- [ ] **Step 4: Inspect final archive and working tree**

List ZIP entries and confirm one `forma-hotel/` root. Report archive size and SHA-256. Confirm only intended WordPress/theme docs are present in the task diff.

- [ ] **Step 5: Commit documentation or final corrections**

```powershell
git add wordpress-theme/README.md
git commit -m "docs: document WordPress theme snapshot"
```

- [ ] **Step 6: Final handoff**

Return:

- clickable `wordpress-theme/dist/forma-hotel.zip` path;
- archive SHA-256 and size;
- test/route/viewports evidence;
- confirmation that the existing static site files were not modified;
- current branch and commits;
- exact future rebuild command;
- list of integrations intentionally left for the dynamic WordPress stage.
