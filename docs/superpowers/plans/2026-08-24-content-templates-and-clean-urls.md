# Content Templates and Clean URLs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished static demonstration of reusable article, event, material, and case templates with WordPress-ready clean URLs and technical SEO foundations.

**Architecture:** Add directory-based `index.html` pages so the local server exposes trailing-slash URLs without rewrite configuration. Reuse the current shared HTML shell, tokens, components, modal, FAQ, and responsive patterns; add only the event/material layout primitives that do not already exist. Keep legacy content files as noindex compatibility pages while navigation, canonicals, related links, and sitemap point to the clean URLs.

**Tech Stack:** Static semantic HTML, token-driven vanilla CSS, vanilla JavaScript, JSON-LD, XML sitemap, Node.js built-in test runner.

## Global Constraints

- No PHP, database, CMS, checkout, or WordPress administration code in this phase.
- Do not invent a real domain, event date, external registration URL, price, payment URL, hotel name, metric, testimonial, or legal detail.
- Use `https://example.ru` only as the existing temporary canonical host.
- New public URLs use lowercase transliteration, hyphens, and a trailing slash.
- Preserve the existing reference palette, typography, header/footer, modal, cookies, forms, focus treatment, reduced motion, and responsive behavior.
- Use root-relative asset and navigation URLs in nested pages.
- Event/Product structured data is omitted until its required real fields exist.
- Every behavior change follows RED → GREEN TDD and every task ends with a focused commit.

---

### Task 1: Define the clean content-page and link contracts

**Files:**
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: existing Node `readFile`/`access` tests and current shared semantic contract.
- Produces: `cleanContentPages`, `indexablePaths`, and a filesystem resolver used by all later template tasks.

- [ ] **Step 1: Add the clean-page fixtures and filesystem resolver**

Add after the existing `marketingPages` declaration:

```js
const cleanContentPages = {
  'poleznoe/index.html': 'Полезное',
  'poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html': 'Как провести аудит продаж отеля',
  'poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html': 'Продажи отеля как система',
  'poleznoe/materialy/chek-list-audita-prodazh/index.html': 'Чек-лист аудита продаж отеля',
  'kejsy/index.html': 'Кейсы',
  'kejsy/rost-pryamyh-prodazh/index.html': 'Рост прямых продаж'
};

const cleanPublicPaths = [
  '/poleznoe/',
  '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
  '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
  '/poleznoe/materialy/chek-list-audita-prodazh/',
  '/kejsy/',
  '/kejsy/rost-pryamyh-prodazh/'
];

function projectFileFromReference(pageFile, reference) {
  const path = reference.split(/[?#]/)[0];
  if (!path) return null;
  if (path.startsWith('/')) {
    const relative = path.slice(1);
    return new URL(`../${relative}${path.endsWith('/') ? 'index.html' : ''}`, import.meta.url);
  }
  const pageUrl = new URL(`../${pageFile}`, import.meta.url);
  const resolved = new URL(path, pageUrl);
  if (path.endsWith('/')) return new URL('index.html', resolved);
  return resolved;
}
```

- [ ] **Step 2: Add a test for the test-suite URL resolver**

```js
test('clean URL resolver maps root assets and trailing-slash pages', () => {
  assert.match(projectFileFromReference('index.html', '/assets/css/styles.css').pathname, /assets\/css\/styles\.css$/);
  assert.match(projectFileFromReference('index.html', '/poleznoe/').pathname, /poleznoe\/index\.html$/);
});
```

- [ ] **Step 3: Run the resolver test and verify GREEN**

Run:

```powershell
node --test --test-name-pattern="clean URL resolver" tests\site.test.mjs
```

Expected: PASS. This is test-only infrastructure; no production behavior is added.

- [ ] **Step 4: Commit the test contract**

```powershell
git add tests/site.test.mjs
git commit -m "test: add clean url fixtures"
```

---

### Task 2: Create the clean «Полезное» and «Кейсы» archives

**Files:**
- Create: `poleznoe/index.html`
- Create: `kejsy/index.html`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: the shared shell from `blog.html`/`projects.html`, `.insight-grid`, `.project-listing`, `.card-link-cue`, modal, FAQ, and footer.
- Produces: stable archive entry points for the six clean public paths.

- [ ] **Step 1: Add failing archive-card assertions**

```js
test('clean archives link every card to its matching template', async () => {
  const useful = await readFile(new URL('../poleznoe/index.html', import.meta.url), 'utf8');
  const cases = await readFile(new URL('../kejsy/index.html', import.meta.url), 'utf8');

  for (const href of [
    '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
    '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
    '/poleznoe/materialy/chek-list-audita-prodazh/'
  ]) assert.match(useful, new RegExp(`href="${href}"`));

  assert.equal((useful.match(/class="insight-card"/g) || []).length, 3);
  assert.match(cases, /href="\/kejsy\/rost-pryamyh-prodazh\/"/);
  assert.ok((cases.match(/data-project-link/g) || []).length >= 3);
});
```

- [ ] **Step 2: Run the archive test and verify RED**

Run:

```powershell
node --test --test-name-pattern="clean archives" tests\site.test.mjs
```

Expected: FAIL because both archive files are missing.

- [ ] **Step 3: Create `poleznoe/index.html`**

Use the complete shared shell from `blog.html` with root-relative assets and legal links. Set:

```html
<title>Полезное для продаж отеля | Статьи, события и материалы</title>
<meta name="description" content="Статьи, анонсы мероприятий, чек-листы, методики и стандарты для развития продаж гостиничных объектов.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.ru/poleznoe/">
<link rel="canonical" href="https://example.ru/poleznoe/">
```

The archive card body must contain exactly these destinations and actions:

```html
<a class="insight-card" href="/poleznoe/stati/kak-provesti-audit-prodazh-otelya/" data-article-link><div class="image-frame"><img src="/assets/images/article-guest-experience.webp" alt="Материал об аудите продаж отеля" width="1200" height="900"></div><div><span>Статья</span><h2>Как провести аудит продаж отеля</h2><p>Проверяем тарифы, каналы, заявки и работу команды в одной логике.</p><span class="card-link-cue">Читать статью</span></div></a>
<a class="insight-card" href="/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/" data-article-link><div class="image-frame"><img src="/assets/images/about-workspace.webp" alt="Анонс профессионального мероприятия" width="1586" height="992"></div><div><span>Мероприятие</span><h2>Продажи отеля как система</h2><p>Программа будущей встречи о диагностике, каналах и внедрении решений.</p><span class="card-link-cue">Смотреть анонс</span></div></a>
<a class="insight-card" href="/poleznoe/materialy/chek-list-audita-prodazh/" data-article-link><div class="image-frame"><img src="/assets/images/service-concept.webp" alt="Обложка чек-листа аудита продаж" width="1200" height="900"></div><div><span>Материал</span><h2>Чек-лист аудита продаж отеля</h2><p>Структура проверки тарифов, каналов, заявок и работы команды.</p><span class="card-link-cue">Открыть материал</span></div></a>
```

All three cards are links. No archive card directly opens the modal.

- [ ] **Step 4: Create `kejsy/index.html`**

Use the complete shared shell from `projects.html`, set canonical/OG URL to `https://example.ru/kejsy/`, and make the first case destination:

```html
<a href="/kejsy/rost-pryamyh-prodazh/" data-project-link>
  <div class="image-frame"><img src="/assets/images/case-lobby.webp" alt="Лобби гостиничного объекта" width="1586" height="992"></div>
  <div><span class="eyebrow">Пример структуры кейса</span><h2>Рост прямых продаж</h2><p>Исходная ситуация, решения по каналам и подтверждённая динамика без вымышленных показателей.</p><span class="card-link-cue">Смотреть кейс</span></div>
</a>
```

The remaining demonstration cards may point to the same single clean case template until additional approved case content exists.

- [ ] **Step 5: Run the archive test and verify GREEN**

```powershell
node --test --test-name-pattern="clean archives" tests\site.test.mjs
```

Expected: archive test passes.

- [ ] **Step 6: Commit archives**

```powershell
git add poleznoe/index.html kejsy/index.html tests/site.test.mjs
git commit -m "feat: add clean content archives"
```

---

### Task 3: Add the reusable article and case detail examples

**Files:**
- Create: `poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html`
- Create: `kejsy/rost-pryamyh-prodazh/index.html`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `.article-header`, `.article-layout`, `.article-body`, `.related-materials`, `.case-hero`, `.case-grid`, FAQ, CTA, modal.
- Produces: the standard article and case detail structures to map to `single.php` and `single-forma_case.php`.

- [ ] **Step 1: Add failing detail-structure assertions**

```js
test('article and case examples expose reusable field zones', async () => {
  const article = await readFile(new URL('../poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html', import.meta.url), 'utf8');
  const casePage = await readFile(new URL('../kejsy/rost-pryamyh-prodazh/index.html', import.meta.url), 'utf8');

  for (const id of ['data', 'channels', 'team']) assert.match(article, new RegExp(`id="${id}"`));
  assert.match(article, /"@type":"Article"/);
  assert.ok((article.match(/data-related-material/g) || []).length >= 2);

  for (const id of ['context', 'task', 'work', 'result']) assert.match(casePage, new RegExp(`id="${id}"`));
  assert.match(casePage, /"@type":"CreativeWork"/);
  assert.doesNotMatch(casePage, /\+\d+%|₽|руб(?:\.|лей)/i);
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test --test-name-pattern="article and case examples" tests\site.test.mjs
```

Expected: FAIL with missing files.

- [ ] **Step 3: Create the clean article page**

Move the visible structure and approved text from `article.html` into the shared nested-page shell. Required head blocks:

```html
<meta property="og:type" content="article">
<meta property="og:url" content="https://example.ru/poleznoe/stati/kak-provesti-audit-prodazh-otelya/">
<link rel="canonical" href="https://example.ru/poleznoe/stati/kak-provesti-audit-prodazh-otelya/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Как провести аудит продаж отеля","inLanguage":"ru-RU","author":{"@type":"Person","name":"Виталина Погорила"},"publisher":{"@type":"Organization","name":"FORMA hotel advisory"},"mainEntityOfPage":"https://example.ru/poleznoe/stati/kak-provesti-audit-prodazh-otelya/"}</script>
```

Keep the `data`, `channels`, and `team` sections, then link related cards to the clean event and material URLs.

- [ ] **Step 4: Create the clean case page**

Use the existing case layout, title it «Рост прямых продаж», and provide four explicit field zones:

```html
<section id="context"><p class="eyebrow">Контекст</p><h2>С какой системой продаж работал объект</h2><p>Здесь указываются тип объекта, исходные каналы и условия без раскрытия несогласованных сведений.</p></section>
<section id="task"><p class="eyebrow">Задача</p><h2>Что требовалось изменить</h2><p>Раздел фиксирует согласованную бизнес-задачу и критерии результата.</p></section>
<section id="work"><p class="eyebrow">Работа</p><h2>Какие решения внедрили</h2><p>Показываются диагностика, последовательность действий и материалы для команды.</p></section>
<section id="result"><p class="eyebrow">Результат</p><h2>Как подтверждается эффект</h2><p>Публикуются только согласованные факты и показатели; до их появления шаблон не выводит цифры.</p></section>
```

Add `CreativeWork` and `BreadcrumbList` JSON-LD with the clean case URL.

- [ ] **Step 5: Run focused tests and verify GREEN**

```powershell
node --test --test-name-pattern="article and case examples" tests\site.test.mjs
```

Expected: article/case assertions pass.

- [ ] **Step 6: Commit detail templates**

```powershell
git add poleznoe/stati kejsy/rost-pryamyh-prodazh tests/site.test.mjs
git commit -m "feat: add article and case templates"
```

---

### Task 4: Add distinct event and material templates

**Files:**
- Create: `poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html`
- Create: `poleznoe/materialy/chek-list-audita-prodazh/index.html`
- Modify: `assets/css/styles.css`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `.detail-hero`, `.detail-hero__grid`, `.detail-layout`, `.detail-aside`, `.detail-content`, `.detail-cards`, `.result-list`, `.related-materials`.
- Produces: `.content-status`, `.content-facts`, `.program-list`, and `.material-preview` shared WordPress-ready layout primitives.

- [ ] **Step 1: Add failing event/material assertions**

```js
test('event and material templates expose distinct field contracts', async () => {
  const event = await readFile(new URL('../poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html', import.meta.url), 'utf8');
  const material = await readFile(new URL('../poleznoe/materialy/chek-list-audita-prodazh/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  for (const field of ['data-event-status', 'data-event-date', 'data-event-format', 'data-event-program']) assert.match(event, new RegExp(field));
  assert.match(event, /Дата будет объявлена/);
  assert.doesNotMatch(event, /"@type":"Event"/);

  for (const field of ['data-material-type', 'data-material-access', 'data-material-format', 'data-material-contents']) assert.match(material, new RegExp(field));
  assert.match(material, /data-modal-open/);
  assert.doesNotMatch(material, /"@type":"Product"/);

  for (const selector of ['content-status', 'content-facts', 'program-list', 'material-preview']) assert.match(css, new RegExp(`\\.${selector}`));
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test --test-name-pattern="event and material templates" tests\site.test.mjs
```

Expected: FAIL because event/material pages and layout primitives do not exist.

- [ ] **Step 3: Add token-driven template primitives**

Append before responsive media queries:

```css
.content-status {
  display: inline-flex;
  min-height: var(--space-8);
  align-items: center;
  align-self: flex-start;
  padding-inline: var(--space-4);
  border: var(--line-thin) solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.content-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin-block: var(--space-8);
}

.content-facts > div,
.program-list li,
.material-preview {
  padding: var(--space-5);
  border: var(--line-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.content-facts span {
  display: block;
  margin-block-end: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.program-list {
  display: grid;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.program-list li {
  display: grid;
  grid-template-columns: var(--control-md) minmax(0, 1fr);
  gap: var(--space-4);
}

.material-preview {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-6);
  align-items: center;
}
```

Inside the mobile media query, collapse `.content-facts`, `.program-list li`, and `.material-preview` to one column.

- [ ] **Step 4: Create the event template**

Use a `detail-hero` followed by `detail-layout`. Required content:

```html
<span class="content-status" data-event-status>Анонс</span>
<h1>Продажи отеля как система</h1>
<div class="content-facts">
  <div><span>Дата</span><strong data-event-date>Дата будет объявлена</strong></div>
  <div><span>Формат</span><strong data-event-format>Формат уточняется</strong></div>
  <div><span>Участие</span><strong>Регистрация откроется после анонса</strong></div>
</div>
<ol class="program-list" data-event-program>
  <li><span>01</span><div><h3>Диагностика продаж</h3><p>Какие данные показывают реальные потери выручки.</p></div></li>
  <li><span>02</span><div><h3>Каналы и команда</h3><p>Как соединить тарифы, обработку заявок и действия сотрудников.</p></div></li>
  <li><span>03</span><div><h3>План внедрения</h3><p>Как превратить выводы в последовательные действия.</p></div></li>
</ol>
```

Use only `BreadcrumbList` structured data. Do not output `Event` JSON-LD until a real date and format exist.

- [ ] **Step 5: Create the material template**

Required content and state:

```html
<span class="content-status" data-material-access>Материал готовится</span>
<h1>Чек-лист аудита продаж отеля</h1>
<div class="content-facts">
  <div><span>Тип</span><strong data-material-type>Чек-лист</strong></div>
  <div><span>Формат</span><strong data-material-format>Будет указан при публикации</strong></div>
  <div><span>Доступ</span><strong>Условия появятся после подготовки</strong></div>
</div>
<div class="material-preview" data-material-contents><div class="image-frame"><img src="/assets/images/service-concept.webp" alt="Предварительная обложка чек-листа" width="1200" height="900"></div><div><p class="eyebrow">Что будет внутри</p><h2>Единая структура проверки продаж</h2><ul class="result-list"><li>Тарифная политика</li><li>Внешние и прямые каналы</li><li>Обработка заявок</li><li>Работа и контроль команды</li></ul></div></div>
<button class="button" type="button" data-modal-open data-modal-title="Запросить материал" data-modal-description="Оставьте контакты — сообщим, когда чек-лист будет готов.">Запросить материал</button>
```

Use `CreativeWork` and `BreadcrumbList` JSON-LD. Do not output `Product`, price, currency, or purchase URL.

- [ ] **Step 6: Run focused tests and verify GREEN**

```powershell
node --test --test-name-pattern="event and material templates" tests\site.test.mjs
```

Expected: event/material assertions pass.

- [ ] **Step 7: Commit event/material work**

```powershell
git add poleznoe/meropriyatiya poleznoe/materialy assets/css/styles.css tests/site.test.mjs
git commit -m "feat: add event and material templates"
```

---

### Task 5: Switch shared navigation, SEO files, and legacy pages to clean destinations

**Files:**
- Modify: all root `*.html` marketing and legal pages.
- Modify: `assets/js/main.js`
- Modify: `sitemap.xml`
- Modify: `blog.html`
- Modify: `article.html`
- Modify: `projects.html`
- Modify: `project.html`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: clean archives and detail pages from Tasks 2–4.
- Produces: one internal link graph, correct section highlighting, legacy noindex/canonical behavior, and a clean sitemap.

- [ ] **Step 1: Add failing shared semantic, navigation, sitemap, legacy, and link-resolution tests**

```js
for (const [file, heading] of Object.entries(cleanContentPages)) {
  test(`${file} exposes the clean content-template contract`, async () => {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<html lang="ru">/);
    assert.equal((html.match(/<main[\s>]/g) || []).length, 1);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, new RegExp(heading));
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/example\.ru\/[^".]+\/">/);
    assert.match(html, /href="\/assets\/css\/styles\.css"/);
    assert.match(html, /src="\/assets\/js\/main\.js"/);
    assert.match(html, /href="\/kejsy\/"/);
    assert.match(html, /href="\/poleznoe\/"/);
  });
}

test('shared navigation points to clean content archives', async () => {
  for (const file of [...Object.keys(pages), ...Object.keys(cleanContentPages)]) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /href="\/kejsy\/">Кейсы<\/a>/);
    assert.match(html, /href="\/poleznoe\/">Полезное<\/a>/);
  }
});

test('sitemap publishes clean content URLs and excludes legacy content URLs', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const path of cleanPublicPaths) assert.match(sitemap, new RegExp(`https://example\\.ru${path}`));
  for (const path of ['blog.html', 'article.html', 'projects.html', 'project.html']) assert.doesNotMatch(sitemap, new RegExp(path));
});

test('legacy content pages are noindex and canonicalize to clean URLs', async () => {
  const mapping = {
    'blog.html': '/poleznoe/',
    'article.html': '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
    'projects.html': '/kejsy/',
    'project.html': '/kejsy/rost-pryamyh-prodazh/'
  };
  for (const [file, path] of Object.entries(mapping)) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://example\\.ru${path}">`));
  }
});
```

Replace the old local-link test body with:

```js
for (const file of [...Object.keys(pages), ...Object.keys(cleanContentPages)]) {
  const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const references = [
    ...[...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
    ...[...html.matchAll(/src="([^"]+)"/g)].map((match) => match[1])
  ];
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|#)/.test(reference)) continue;
    const target = projectFileFromReference(file, reference);
    if (target) await access(target);
  }
}
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
node --test --test-name-pattern="shared navigation points|sitemap publishes|legacy content pages|local links" tests\site.test.mjs
```

Expected: FAIL on old `.html` links, sitemap entries, and missing noindex declarations.

- [ ] **Step 3: Update shared navigation and current-section logic**

Across all HTML files, replace navigation/footer destinations for content sections with root-relative `/kejsy/` and `/poleznoe/`.

Replace `setupCurrentNavigation()` with:

```js
function setupCurrentNavigation() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.site-nav a, [data-mobile-menu] a').forEach((link) => {
    const destination = new URL(link.href, window.location.origin).pathname;
    const exact = destination === currentPath;
    const section = destination !== '/' && destination.endsWith('/') && currentPath.startsWith(destination);
    link.toggleAttribute('aria-current', exact || section);
  });
}
```

- [ ] **Step 4: Update legacy content metadata and content destinations**

Add `<meta name="robots" content="noindex,follow">` and the clean canonical from the mapping above. Change archive/detail card links to their clean destinations. Do not add JavaScript redirects in the prototype.

- [ ] **Step 5: Replace content URLs in `sitemap.xml`**

Remove four legacy content locations and add exactly:

```xml
  <url><loc>https://example.ru/poleznoe/</loc></url>
  <url><loc>https://example.ru/poleznoe/stati/kak-provesti-audit-prodazh-otelya/</loc></url>
  <url><loc>https://example.ru/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/</loc></url>
  <url><loc>https://example.ru/poleznoe/materialy/chek-list-audita-prodazh/</loc></url>
  <url><loc>https://example.ru/kejsy/</loc></url>
  <url><loc>https://example.ru/kejsy/rost-pryamyh-prodazh/</loc></url>
```

- [ ] **Step 6: Run focused and complete tests**

```powershell
node --test --test-name-pattern="shared navigation points|sitemap publishes|legacy content pages|local links|shared navigation marks" tests\site.test.mjs
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit link/SEO migration**

```powershell
git add -- '*.html' poleznoe kejsy assets/js/main.js sitemap.xml tests/site.test.mjs
git commit -m "feat: switch content pages to clean urls"
```

---

### Task 6: Validate rendered templates and document WordPress field mapping

**Files:**
- Create: `docs/wordpress-content-template-map.md`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: all clean templates and specification field lists.
- Produces: a handoff map for the later WordPress implementation and final verified static prototype.

- [ ] **Step 1: Create the field-mapping document**

Document these exact mappings:

```markdown
# Карта переноса контентных шаблонов в WordPress

## Статья (`post`)
- `post_title` → H1 и карточка
- `post_excerpt` → lead/meta description
- featured image + alt → hero/OG image
- Gutenberg headings → содержание и article body
- post date/modified/author → meta + Article JSON-LD

## Мероприятие (`forma_event`)
- title/excerpt/featured image
- `event_status`, `event_date`, `event_time`, `event_timezone`
- `event_format`, `event_location`, `registration_url`, `event_program`
- Event JSON-LD выводится только при заполненных date + format/location

## Материал (`forma_material`)
- title/excerpt/featured image
- `material_type`, `access_status`, `price`, `currency`
- `file_format`, `page_count`, `contents`, `audience`, `purchase_url`
- Product JSON-LD выводится только при реальной цене и активной покупке

## Кейс (`forma_case`)
- title/excerpt/featured image
- `object_type`, `context`, `task`, `work`, `result`, `period`
- `metrics`, `privacy_mode`, `testimonial`, `related_services`
- неподтверждённые metrics/testimonial не выводятся
```

- [ ] **Step 2: Add JSON-LD validation for all clean detail pages**

```js
test('clean detail templates contain valid conditional structured data', async () => {
  const files = Object.keys(cleanContentPages).filter((file) => file !== 'poleznoe/index.html' && file !== 'kejsy/index.html');
  for (const file of files) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length > 0, file);
    for (const block of blocks) assert.doesNotThrow(() => JSON.parse(block[1]), file);
  }
});
```

- [ ] **Step 3: Run automated gates**

```powershell
npm test
& "C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" "C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py" assets\css\styles.css
& "C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" "C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py" assets\css\styles.css assets\css\styles.css
```

Expected: all tests pass, no hardcoded component values, and every CSS variable resolves.

- [ ] **Step 4: Run browser verification**

At a fresh local origin:

- open all six clean URLs and confirm HTTP 200;
- inspect every archive and detail template at desktop width;
- inspect all six at 375px and confirm `scrollWidth <= clientWidth`;
- verify each archive card reaches its expected detail URL;
- verify sticky header, burger menu, modal, FAQ, footer, and cookies still work;
- verify no console errors;
- reset any temporary viewport and leave `/poleznoe/` open for review.

- [ ] **Step 5: Commit documentation and final verification contract**

```powershell
git add docs/wordpress-content-template-map.md tests/site.test.mjs
git commit -m "docs: map content templates to WordPress"
```
