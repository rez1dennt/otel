# Hotel Consulting Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Создать премиальный адаптивный многостраничный сайт гостиничного консалтинга на чистых HTML, CSS и JavaScript с дизайном и цветовым балансом, максимально близкими к предоставленному референсу.

**Architecture:** Набор самостоятельных HTML-страниц использует общие таблицы стилей, один модуль интерфейсных сценариев и локальные оптимизированные изображения. Автоматические проверки на Node.js контролируют структуру страниц, юридические ссылки, SEO-метаданные и чистые функции валидации; визуальная и интерактивная проверка выполняется в локальном браузере.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js built-in test runner, WebP/AVIF assets.

## Global Constraints

- Не использовать frontend-фреймворки, CMS и сборщик.
- Обязательные цвета: `#F2F1EF`, `#FAF9F7`, `#2D281D`, `#66635B`, `#3E4136`, `#8B745F`, `#D0C5B8`, `#BABCC1`, `#C9B3A4`.
- Чистые насыщенные цвета, холодный белый фон и `#000000` не использовать.
- Дизайн повторяет атмосферу и цветовой баланс референса, но не копирует его контент и композицию.
- Реальные клиенты, отзывы, результаты и реквизиты не выдумывать.
- Подтверждённые реквизиты: ИП Погорила Виталина Петровна, ИНН 502745335560, ОГРНИП 325774600286352, e-mail PWP28@MAIL.RU.
- Формы первой версии работают в демонстрационном режиме и не отправляют персональные данные во внешние системы.
- Необязательная аналитика не запускается без согласия на Cookie.
- Интерфейс должен работать на ширинах 360, 768, 1024 и 1440 пикселей и учитывать `prefers-reduced-motion`.

---

## File Map

- `index.html` — главная страница и полный основной путь к заявке.
- `services.html`, `service.html` — каталог и шаблон направления услуги.
- `about.html` — подход, компетенции и сведения о компании.
- `projects.html`, `project.html` — список и шаблон демонстрационного кейса.
- `blog.html`, `article.html` — список и шаблон экспертного материала.
- `contacts.html` — контакты и расширенная форма.
- `privacy.html`, `consent.html`, `cookies.html` — юридические документы.
- `404.html` — страница ошибки.
- `assets/css/styles.css` — токены, компоненты, макеты и адаптивные состояния.
- `assets/js/core.mjs` — чистые функции проверки формы и Cookie-настроек.
- `assets/js/main.js` — меню, модальное окно, аккордеон, форма, анимации и Cookie-баннер.
- `assets/images/*.webp` — оптимизированные изображения гостиничных пространств.
- `tests/site.test.mjs` — структурные и SEO-проверки HTML.
- `tests/core.test.mjs` — модульные проверки чистой JavaScript-логики.
- `robots.txt`, `sitemap.xml`, `site.webmanifest` — техническая SEO-основа.
- `package.json` — команды автоматической проверки без внешних зависимостей.

### Task 1: Static Site Contract and Page Skeletons

**Files:**
- Create: `package.json`
- Create: `tests/site.test.mjs`
- Create: `index.html`
- Create: `services.html`, `service.html`, `about.html`, `projects.html`, `project.html`
- Create: `blog.html`, `article.html`, `contacts.html`, `privacy.html`, `consent.html`, `cookies.html`, `404.html`

**Interfaces:**
- Produces: HTML pages with `<header>`, `<main>`, `<footer>`, `.site-header`, `.site-nav`, `.site-footer`, `[data-modal-open]` and shared asset references.
- Consumes: none.

- [ ] **Step 1: Add a failing structural test**

Create `tests/site.test.mjs` with Node built-ins. Define the exact page map and assert that every file exists, has Russian language metadata, one `<main>`, one `<h1>`, a description, a canonical URL, shared CSS/JS references and all three legal links.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = {
  'index.html': 'Гостиничный консалтинг',
  'services.html': 'Услуги гостиничного консалтинга',
  'service.html': 'Концепция и позиционирование',
  'about.html': 'О компании',
  'projects.html': 'Проекты',
  'project.html': 'Проект гостиничного объекта',
  'blog.html': 'Блог',
  'article.html': 'Как провести аудит гостиничного проекта',
  'contacts.html': 'Контакты',
  'privacy.html': 'Политика конфиденциальности',
  'consent.html': 'Согласие на обработку персональных данных',
  'cookies.html': 'Политика использования Cookie',
  '404.html': 'Страница не найдена'
};

for (const [file, heading] of Object.entries(pages)) {
  test(`${file} contains the shared semantic contract`, async () => {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<html lang="ru">/);
    assert.equal((html.match(/<main[\s>]/g) || []).length, 1);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, new RegExp(heading));
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/example\.ru\/[^"]*">/);
    assert.match(html, /assets\/css\/styles\.css/);
    assert.match(html, /assets\/js\/main\.js/);
    assert.match(html, /privacy\.html/);
    assert.match(html, /consent\.html/);
    assert.match(html, /cookies\.html/);
  });
}
```

- [ ] **Step 2: Verify the test fails**

Run: `node --test tests/site.test.mjs`  
Expected: FAIL because the HTML pages do not exist.

- [ ] **Step 3: Create package scripts and semantic page shells**

Create `package.json`:

```json
{
  "name": "hotel-consulting-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs",
    "serve": "python -m http.server 4173"
  }
}
```

For every page in the map, add an exact Russian `<title>`, a description longer than 40 characters, canonical URL under `https://example.ru/`, Open Graph title/description, shared header, one page-specific `<h1>`, shared footer and `<script type="module" src="assets/js/main.js"></script>`. Use the navigation labels `Услуги`, `О компании`, `Проекты`, `Блог`, `Контакты` and the CTA `Обсудить проект`.

- [ ] **Step 4: Verify the structural contract passes**

Run: `node --test tests/site.test.mjs`  
Expected: 13 passing tests.

- [ ] **Step 5: Commit the skeleton**

```powershell
git add package.json tests/site.test.mjs *.html
git commit -m "feat: scaffold hotel consulting site"
```

### Task 2: Reference-Matched Design System and Image Set

**Files:**
- Create: `assets/css/styles.css`
- Create: `assets/images/hero-hotel.webp`
- Create: `assets/images/service-concept.webp`
- Create: `assets/images/service-audit.webp`
- Create: `assets/images/service-marketing.webp`
- Create: `assets/images/case-lobby.webp`
- Create: `assets/images/about-workspace.webp`
- Create: `assets/images/article-guest-experience.webp`
- Modify: all HTML pages

**Interfaces:**
- Produces: CSS tokens `--color-bg`, `--color-surface`, `--color-ink`, `--color-muted`, `--color-primary`, `--color-warm`, `--color-line`, `--color-mist`, `--color-blush`; shared classes `.container`, `.section`, `.button`, `.card`, `.eyebrow`, `.display-title`, `.image-frame`.
- Consumes: semantic shells from Task 1.

- [ ] **Step 1: Extend the structural test with palette assertions**

Add a test that reads `assets/css/styles.css` and checks every required hexadecimal value:

```js
test('design tokens preserve the reference palette', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  for (const color of ['#F2F1EF', '#FAF9F7', '#2D281D', '#66635B', '#3E4136', '#8B745F', '#D0C5B8', '#BABCC1', '#C9B3A4']) {
    assert.match(css.toUpperCase(), new RegExp(color));
  }
  assert.doesNotMatch(css.toUpperCase(), /#000000|#FFFFFF/);
});
```

- [ ] **Step 2: Verify the palette test fails**

Run: `node --test tests/site.test.mjs`  
Expected: FAIL because `assets/css/styles.css` does not exist.

- [ ] **Step 3: Generate and optimize a coherent hotel image set**

Use the image generation skill to create seven distinct 16:10 or 4:3 hospitality images: refined lobby, calm guest room details, consulting materials on a table, reception/service moment without visible brands, and editorial hotel interiors. Require warm stone, misty gray, olive and walnut grading; exclude text, logos, mountains, dental imagery and oversaturated colors. Save local WebP assets with the exact filenames listed above and verify every crop visually.

- [ ] **Step 4: Implement the tokenized CSS foundation**

Start `styles.css` with the exact variables below, then define typography, container widths, 48px/32px/20px radii, subtle borders, reference-like shadows, buttons, cards, focus rings and responsive type using `clamp()`.

```css
:root {
  --color-bg: #F2F1EF;
  --color-surface: #FAF9F7;
  --color-ink: #2D281D;
  --color-muted: #66635B;
  --color-primary: #3E4136;
  --color-warm: #8B745F;
  --color-line: #D0C5B8;
  --color-mist: #BABCC1;
  --color-blush: #C9B3A4;
  --radius-xl: 48px;
  --radius-lg: 32px;
  --radius-md: 20px;
  --shadow-soft: 0 24px 70px rgb(45 40 29 / 0.09);
  --container: min(1180px, calc(100% - 40px));
}
```

- [ ] **Step 5: Run the test and inspect a component sheet**

Run: `node --test tests/site.test.mjs`  
Expected: all tests pass. Serve the project and inspect header, buttons, headings, card, form field and image frame at 360px and 1440px.

- [ ] **Step 6: Commit the design system**

```powershell
git add assets index.html services.html service.html about.html projects.html project.html blog.html article.html contacts.html privacy.html consent.html cookies.html 404.html tests/site.test.mjs
git commit -m "feat: add reference matched visual system"
```

### Task 3: Testable Form and Cookie Core

**Files:**
- Create: `assets/js/core.mjs`
- Create: `tests/core.test.mjs`

**Interfaces:**
- Produces: `validateLead(values) -> Record<string,string>`, `normalizeCookiePreferences(value) -> {necessary:true,analytics:boolean}`, `serializeCookiePreferences(value) -> string`.
- Consumes: none.

- [ ] **Step 1: Write failing unit tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, normalizeCookiePreferences, serializeCookiePreferences } from '../assets/js/core.mjs';

test('valid lead has no errors', () => {
  assert.deepEqual(validateLead({ name: 'Анна', email: 'anna@example.ru', phone: '+7 900 000-00-00', consent: true }), {});
});

test('invalid lead exposes exact field errors', () => {
  assert.deepEqual(validateLead({ name: '', email: 'bad', phone: '12', consent: false }), {
    name: 'Укажите имя',
    email: 'Проверьте электронную почту',
    phone: 'Проверьте номер телефона',
    consent: 'Нужно согласие на обработку данных'
  });
});

test('cookie preferences always keep necessary cookies', () => {
  assert.deepEqual(normalizeCookiePreferences({ necessary: false, analytics: true }), { necessary: true, analytics: true });
  assert.equal(serializeCookiePreferences({ analytics: false }), '{"necessary":true,"analytics":false}');
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `node --test tests/core.test.mjs`  
Expected: FAIL because `core.mjs` does not exist.

- [ ] **Step 3: Implement the pure functions**

Use trimmed input, a simple e-mail expression, at least 7 phone digits and an explicit boolean consent. `normalizeCookiePreferences` must coerce analytics to boolean and force necessary to `true`; serialization must use the normalized object.

- [ ] **Step 4: Verify the tests pass**

Run: `node --test tests/core.test.mjs`  
Expected: 3 passing tests.

- [ ] **Step 5: Commit the core logic**

```powershell
git add assets/js/core.mjs tests/core.test.mjs
git commit -m "test: add lead and cookie preference core"
```

### Task 4: Shared Interface Behaviors

**Files:**
- Create: `assets/js/main.js`
- Modify: all HTML pages
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `validateLead`, `normalizeCookiePreferences`, `serializeCookiePreferences` from Task 3.
- Produces: `[data-menu-toggle]`, `[data-modal]`, `[data-modal-open]`, `[data-accordion-button]`, `[data-lead-form]`, `[data-cookie-banner]`, `[data-cookie-settings]` behaviors.

- [ ] **Step 1: Add markup-contract tests**

Extend `tests/site.test.mjs` so every non-legal marketing page contains a modal opener and shared modal, the home page contains FAQ controls, and every page contains a Cookie banner with accept, reject and settings actions. Assert that form labels use `for` attributes and the consent checkbox links to `consent.html`.

- [ ] **Step 2: Verify the contract fails**

Run: `node --test tests/site.test.mjs`  
Expected: FAIL on missing modal, form or Cookie attributes.

- [ ] **Step 3: Implement navigation and modal accessibility**

In `main.js`, synchronize `aria-expanded`, trap focus inside the open modal or mobile menu, close on Escape and overlay click, restore focus to the opener and lock background scrolling while overlays are active.

- [ ] **Step 4: Implement form and Cookie flows**

Validate fields through `validateLead`, render messages next to fields with `aria-describedby`, show a brief in-place success state without network submission, persist Cookie choices under `hotel-consulting-cookie-preferences`, and let the footer reopen settings.

- [ ] **Step 5: Add accordion and reveal animations**

Use button-controlled panels with `aria-expanded` and `hidden`. Reveal `[data-reveal]` elements with `IntersectionObserver`; show them immediately when reduced motion is requested or the API is unavailable.

- [ ] **Step 6: Run automated and keyboard checks**

Run: `npm test`  
Expected: all tests pass. In the browser, navigate menu → modal → every form field → close button using only Tab, Shift+Tab, Enter and Escape.

- [ ] **Step 7: Commit shared behaviors**

```powershell
git add assets/js assets/css tests *.html
git commit -m "feat: add accessible site interactions"
```

### Task 5: Build the Full Homepage

**Files:**
- Modify: `index.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: shared components and image assets from Tasks 2 and 4.
- Produces: section anchors `#services`, `#situations`, `#process`, `#projects`, `#about`, `#insights`, `#faq`, `#contact`.

- [ ] **Step 1: Add homepage content assertions**

Assert that `index.html` contains all eight section IDs, at least six service cards, four process steps, three project cards, three article cards and five FAQ buttons. Assert that project/quote content includes visible qualifiers such as `Пример кейса` or `Здесь будет отзыв клиента`.

- [ ] **Step 2: Verify the homepage test fails**

Run: `node --test tests/site.test.mjs`  
Expected: FAIL on the missing sections and card counts.

- [ ] **Step 3: Implement the hero and benefit bridge**

Build a 75–90vh hero with the headline `Помогаем гостиничным проектам становиться сильнее`, supporting copy, two CTAs and the generated hero image under a milk-and-olive overlay. Overlap three compact benefit cards with the lower edge, matching the rhythm of the reference without copying its exact layout.

- [ ] **Step 4: Implement services, situations and process**

Use the six approved service titles, a diagnostic situations panel and a four-step horizontal/vertical process. Alternate light surfaces and full-width atmospheric panels so the page retains the calm editorial rhythm of the reference.

- [ ] **Step 5: Implement projects, expertise, quotes, blog and FAQ**

Use honest sample labels, no fabricated brands or results. Add an editorial split block for company expertise, three publication cards, a five-item accessible accordion and a final dark-olive CTA.

- [ ] **Step 6: Verify responsive composition**

Serve at port 4173 and inspect 360, 768, 1024 and 1440 widths. Expected: no horizontal scroll, hero CTAs remain visible, cards collapse to one/two/four columns appropriately and no heading creates a single orphaned character.

- [ ] **Step 7: Commit the homepage**

```powershell
git add index.html assets/css/styles.css tests/site.test.mjs
git commit -m "feat: build premium consulting homepage"
```

### Task 6: Build Internal Marketing Pages

**Files:**
- Modify: `services.html`, `service.html`, `about.html`, `projects.html`, `project.html`
- Modify: `blog.html`, `article.html`, `contacts.html`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: shared header, footer, modal, cards, buttons and image frames.
- Produces: working page-to-page navigation and breadcrumbs.

- [ ] **Step 1: Add internal-page assertions**

Assert breadcrumbs on `service.html`, `project.html` and `article.html`; at least six service links on `services.html`; at least three project links on `projects.html`; at least three article links on `blog.html`; and a labeled lead form on `contacts.html`.

- [ ] **Step 2: Verify the assertions fail**

Run: `node --test tests/site.test.mjs`  
Expected: FAIL on missing page content.

- [ ] **Step 3: Build service and company content**

Create a services index, a detailed concept/positioning template and an about page covering approach, principles and owner role. Use cautious copy such as `Адаптируем формат работы к стадии и задачам гостиничного проекта` instead of absolute promises.

- [ ] **Step 4: Build project and editorial templates**

Mark all cases as demonstrational structure. The article page must have author/date placeholders expressed as `Редакция проекта` and `23 августа 2026`, a readable 65–75 character text column and links to two related materials.

- [ ] **Step 5: Build contacts**

Show the confirmed e-mail and IP details, a full lead form, working legal links and neutral placeholders `Телефон будет добавлен` and `Адрес для встреч — по предварительной договорённости` without inventing data.

- [ ] **Step 6: Run tests and verify navigation**

Run: `npm test`  
Expected: all tests pass. Click every header, card, breadcrumb and footer link from a local server and confirm no destination returns 404.

- [ ] **Step 7: Commit internal pages**

```powershell
git add services.html service.html about.html projects.html project.html blog.html article.html contacts.html assets/css/styles.css tests/site.test.mjs
git commit -m "feat: add consulting content pages"
```

### Task 7: Legal Pages and Technical SEO

**Files:**
- Modify: `privacy.html`, `consent.html`, `cookies.html`, `404.html`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `site.webmanifest`
- Modify: all HTML pages
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: confirmed IP details and shared page shell.
- Produces: crawlable page graph and working legal disclosures.

- [ ] **Step 1: Add legal and SEO assertions**

Assert the exact INN/OGRNIP on all three legal pages, the owner name on privacy and consent pages, all public URLs in `sitemap.xml`, a Sitemap declaration in `robots.txt`, theme color `#F2F1EF` in the manifest and JSON-LD on home, service, project and article pages.

- [ ] **Step 2: Verify the assertions fail**

Run: `node --test tests/site.test.mjs`  
Expected: FAIL on legal text, sitemap, manifest and JSON-LD.

- [ ] **Step 3: Complete the legal pages**

Use the confirmed IP data and the site e-mail. Describe the demonstration form accurately: before backend integration it does not transmit entries. List necessary Cookie/localStorage behavior separately from optional analytics. Do not add a postal address or telephone number.

- [ ] **Step 4: Add technical SEO files and metadata**

Create `robots.txt` allowing crawling and pointing to `https://example.ru/sitemap.xml`. List every public page in sitemap. Add consistent Open Graph tags, manifest link, theme color, canonical links and JSON-LD types `WebSite`, `ProfessionalService`, `Service`, `BreadcrumbList`, `Article` and `CreativeWork` where semantically appropriate.

- [ ] **Step 5: Build the 404 page**

Use the shared visual system, concise copy and two links: `На главную` and `Посмотреть услуги`. The page must not contain a canonical URL to a non-existent dynamic route; canonical should be `https://example.ru/404.html`.

- [ ] **Step 6: Run the complete automated suite**

Run: `npm test`  
Expected: all tests pass with no warnings or unhandled rejections.

- [ ] **Step 7: Commit legal and SEO work**

```powershell
git add privacy.html consent.html cookies.html 404.html robots.txt sitemap.xml site.webmanifest *.html tests/site.test.mjs
git commit -m "feat: add legal pages and seo foundation"
```

### Task 8: Visual QA, Accessibility and Delivery Verification

**Files:**
- Modify: files identified by verification only.
- Create: `README.md`

**Interfaces:**
- Consumes: the complete site.
- Produces: verified static deliverable and local run instructions.

- [ ] **Step 1: Write delivery instructions**

Document exact commands `npm test` and `python -m http.server 4173`, explain that `https://example.ru/` must be replaced after domain selection, and list the remaining business inputs: logo/name, phone, confirmed experience, real cases, client quotes, analytics ID and form delivery endpoint.

- [ ] **Step 2: Run automated verification**

Run: `npm test`  
Expected: all structural, SEO, palette and core-logic tests pass.

- [ ] **Step 3: Perform browser QA at four widths**

Check home, service, project, article, contacts, privacy and 404 pages at 360, 768, 1024 and 1440 pixels. Verify crop quality, text contrast, focus visibility, sticky header behavior, overlays, no horizontal scrolling and visual proximity to the reference palette.

- [ ] **Step 4: Verify interaction states**

Test mobile menu, modal open/close, invalid form, valid demonstration success, every FAQ item, Cookie accept/reject/settings and footer reopening. Reload after each Cookie choice and confirm the persisted state is respected.

- [ ] **Step 5: Verify reduced motion and no-JavaScript baseline**

Enable reduced motion and confirm reveal transitions are removed. Disable JavaScript and confirm page content, navigation, contact details and legal links remain readable even though enhanced overlays are unavailable.

- [ ] **Step 6: Inspect all generated images**

Open every WebP at full resolution and confirm there are no warped objects, embedded text, logos, dental elements, unwanted mountain scenery or inconsistent color grading.

- [ ] **Step 7: Re-run verification after any fixes**

Run: `npm test`  
Expected: all tests pass after the final visual corrections.

- [ ] **Step 8: Commit the verified deliverable**

```powershell
git add README.md index.html services.html service.html about.html projects.html project.html blog.html article.html contacts.html privacy.html consent.html cookies.html 404.html assets tests robots.txt sitemap.xml site.webmanifest package.json
git commit -m "chore: verify hotel consulting site"
```
