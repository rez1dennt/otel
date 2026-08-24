# Responsive Template Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Уменьшить медиа и связанные карточки шаблонных страниц, исправить навигацию этапов кейса, добавить явную ссылку «Главная», очистить футер и подтвердить адаптивность всего сайта до 320px.

**Architecture:** Правки выполняются через существующие общие HTML- и CSS-контракты без новых компонентов и без JavaScript. Сначала тесты фиксируют одинаковую навигацию, футер, FAQ и размеры шаблонов, затем один общий стилевой слой применяется к legacy- и ЧПУ-страницам; финальный браузерный прогон проверяет фактический reflow всех публичных страниц.

**Tech Stack:** Semantic HTML5, tokenized CSS, vanilla JavaScript ES modules, Node.js built-in test runner, Playwright browser QA, Python static HTTP server.

## Global Constraints

- Сохранять существующую палитру, типографику и визуальную концепцию FORMA.
- Основная и мобильная навигация содержат шесть одинаковых пунктов; «Главная» идёт первой и ведёт на `/index.html`.
- Из футера на всех страницах удаляется только формулировка «Рабочая версия сайта».
- Медиа кейса использует пропорцию `8 / 5`, максимальную ширину `64rem` и не имеет принудительной минимальной высоты.
- Сетка связанных материалов ограничена `60rem`; карточка имеет минимальную высоту `7rem` и внутренний отступ `var(--space-5)`.
- Контрольные ширины: `360px` и `320px`; горизонтальный скролл запрещён.
- Новые зависимости не добавлять.

---

### Task 1: Зафиксировать общие HTML- и CSS-контракты тестами

**Files:**
- Modify: `tests/site.test.mjs:404-419`
- Modify: `tests/site.test.mjs:624-680`

**Interfaces:**
- Consumes: `pages`, `cleanContentPages` и общий CSS-файл `assets/css/styles.css`.
- Produces: регрессионные контракты для Task 2; новых runtime-интерфейсов нет.

- [ ] **Step 1: Расширить тест навигации и добавить тест футера**

Добавить общий список файлов и проверить обе навигации внутри `site-header`:

```js
const allPageFiles = [...Object.keys(pages), ...Object.keys(cleanContentPages)];

test('shared header exposes Home in desktop and mobile navigation', async () => {
  for (const file of allPageFiles) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const header = html.match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[1];
    assert.ok(header, `${file}: site header`);
    assert.equal((header.match(/href="\/index\.html">Главная<\/a>/g) || []).length, 2, `${file}: Home links`);
    for (const label of ['Главная', 'Услуги', 'О проекте', 'Кейсы', 'Полезное', 'Контакты']) {
      assert.match(header, new RegExp(`>${label}<`), `${file}: ${label}`);
    }
  }
});

test('shared footer contains only the public copyright label', async () => {
  for (const file of allPageFiles) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<span>© 2026 FORMA\.<\/span>/, file);
    assert.doesNotMatch(html, /Рабочая версия сайта/, file);
  }
});
```

- [ ] **Step 2: Добавить тесты шаблона кейса, связанных материалов и FAQ**

```js
test('case template uses compact media and separated stage labels', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.case-grid aside a\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*var\(--space-8\) minmax\(0, 1fr\);[^}]*gap:\s*var\(--space-3\);/s);
  assert.match(css, /\.case-hero \.image-frame\s*\{[^}]*width:\s*min\(100%, 64rem\);[^}]*min-height:\s*0;[^}]*aspect-ratio:\s*8 \/ 5;[^}]*margin-inline:\s*auto;/s);
  assert.doesNotMatch(css, /\.detail-hero__grid \.image-frame,\s*\.case-hero \.image-frame\s*\{[^}]*min-height:\s*22rem;/s);
});

test('related materials use the compact centered grid contract', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.related-materials > div\s*\{[^}]*width:\s*min\(100%, 60rem\);[^}]*margin-inline:\s*auto;/s);
  assert.match(css, /\.related-materials a\s*\{[^}]*min-height:\s*7rem;[^}]*padding:\s*var\(--space-5\);/s);
});

test('case FAQ uses the approved stage question', async () => {
  for (const file of ['project.html', 'kejsy/rost-pryamyh-prodazh/index.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /Какие этапы работы показаны в кейсе\?/);
    assert.doesNotMatch(html, /Что входит в структуру кейса\?/);
  }
});
```

- [ ] **Step 3: Запустить новые тесты и подтвердить ожидаемое падение**

Run:

```powershell
node --test --test-name-pattern="shared header|shared footer|case template|related materials|case FAQ" tests/site.test.mjs
```

Expected: FAIL по отсутствующей «Главной», старой подписи футера, старым размерам CSS и старому вопросу FAQ.

- [ ] **Step 4: Сохранить тестовый контракт**

```powershell
git add tests/site.test.mjs
git commit -m "test: cover responsive template polish"
```

---

### Task 2: Реализовать общие навигационные и визуальные правки

**Files:**
- Modify: `assets/css/styles.css:1748-1769`
- Modify: `assets/css/styles.css:1861-1876`
- Modify: `assets/css/styles.css:3156-3159`
- Modify: `404.html`
- Modify: `about.html`
- Modify: `article.html`
- Modify: `blog.html`
- Modify: `consent.html`
- Modify: `contacts.html`
- Modify: `cookies.html`
- Modify: `index.html`
- Modify: `privacy.html`
- Modify: `project.html`
- Modify: `projects.html`
- Modify: `service.html`
- Modify: `services.html`
- Modify: `kejsy/index.html`
- Modify: `kejsy/rost-pryamyh-prodazh/index.html`
- Modify: `poleznoe/index.html`
- Modify: `poleznoe/materialy/chek-list-audita-prodazh/index.html`
- Modify: `poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html`
- Modify: `poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: существующие классы `.site-nav`, `[data-mobile-menu]`, `.case-hero`, `.case-grid`, `.related-materials`.
- Produces: общий HTML-порядок `Главная → Услуги → О проекте → Кейсы → Полезное → Контакты` и единый CSS-контракт шаблонных страниц.

- [ ] **Step 1: Добавить «Главную» в desktop- и mobile-меню всех страниц**

В каждом `header.site-header` привести начало навигаций к одному виду:

```html
<nav class="site-nav" aria-label="Основная навигация"><a href="/index.html">Главная</a><a href="/services.html">Услуги</a>
```

```html
<div class="mobile-menu" id="mobile-menu" data-mobile-menu hidden aria-hidden="true"><nav aria-label="Мобильная навигация"><a href="/index.html">Главная</a><a href="/services.html">Услуги</a>
```

- [ ] **Step 2: Очистить подпись футера во всех страницах**

Заменить точную строку:

```html
<span>© 2026 FORMA. Рабочая версия сайта.</span>
```

на:

```html
<span>© 2026 FORMA.</span>
```

- [ ] **Step 3: Заменить вопрос FAQ в обоих шаблонах кейса**

```html
Какие этапы работы показаны в кейсе?
```

Существующий ответ оставить без изменения.

- [ ] **Step 4: Исправить компоновку этапов и медиа кейса**

Обновить `assets/css/styles.css`:

```css
.case-hero .image-frame {
  width: min(100%, 64rem);
  min-height: 0;
  aspect-ratio: 8 / 5;
  margin-block-start: var(--space-10);
  margin-inline: auto;
}

.case-grid aside a {
  display: grid;
  grid-template-columns: var(--space-8) minmax(0, 1fr);
  gap: var(--space-3);
  align-items: baseline;
  color: inherit;
  text-decoration: none;
}

.case-grid aside span {
  margin-block-start: 0;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}
```

В мобильном media query заменить объединённое правило с `min-height: 22rem` на правило только для `.detail-hero__grid .image-frame`; `.case-hero .image-frame` наследует `min-height: 0` и `aspect-ratio: 8 / 5`.

- [ ] **Step 5: Уменьшить сетку связанных материалов**

```css
.related-materials > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 60rem);
  margin-inline: auto;
  gap: var(--space-4);
}

.related-materials a {
  display: grid;
  gap: var(--space-3);
  min-height: 7rem;
  align-content: end;
  padding: var(--space-5);
  border: var(--line-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-decoration: none;
}
```

Существующее мобильное правило `grid-template-columns: 1fr` оставить.

- [ ] **Step 6: Запустить целевые и полные тесты**

Run:

```powershell
node --test --test-name-pattern="shared header|shared footer|case template|related materials|case FAQ" tests/site.test.mjs
npm test
```

Expected: целевые тесты PASS; полный набор тестов PASS без регрессий.

- [ ] **Step 7: Сохранить реализацию**

```powershell
git add assets/css/styles.css *.html kejsy poleznoe
git commit -m "fix: polish responsive content templates"
```

---

### Task 3: Проверить фактический адаптив и интерактивные состояния

**Files:**
- Verify: все 19 публичных HTML-страниц
- Verify: `assets/css/styles.css`
- Verify: `assets/js/main.js`

**Interfaces:**
- Consumes: локальный сервер `http://127.0.0.1:4190` и готовые HTML/CSS-контракты Task 2.
- Produces: измеренный адаптивный результат без изменений runtime-интерфейсов.

- [ ] **Step 1: Прогнать все маршруты на 360px и 320px**

Для каждой ширины выполнить в браузере:

```js
const paths = [
  '/index.html', '/services.html', '/service.html', '/about.html', '/projects.html',
  '/project.html', '/blog.html', '/article.html', '/contacts.html', '/privacy.html',
  '/consent.html', '/cookies.html', '/404.html', '/kejsy/',
  '/kejsy/rost-pryamyh-prodazh/', '/poleznoe/',
  '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
  '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
  '/poleznoe/materialy/chek-list-audita-prodazh/'
];

for (const width of [360, 320]) {
  await page.setViewportSize({ width, height: 800 });
  for (const path of paths) {
    const response = await page.goto(`http://127.0.0.1:4190${path}`);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    if (response.status() !== 200 || metrics.scrollWidth > metrics.clientWidth) throw new Error(path);
  }
}
```

Expected: 38 комбинаций маршрута и ширины имеют status `200`; `scrollWidth <= clientWidth`.

- [ ] **Step 2: Проверить ключевые геометрические размеры**

На странице `/kejsy/rost-pryamyh-prodazh/` при 360px:

```js
const frame = document.querySelector('.case-hero .image-frame').getBoundingClientRect();
const image = document.querySelector('.case-hero .image-frame img').getBoundingClientRect();
const links = [...document.querySelectorAll('.case-grid aside a')].map((element) => getComputedStyle(element).gap);
```

Expected: разница `frame.height - image.height` не превышает `1px`; каждая ссылка имеет ненулевой `gap`.

На desktop 1280px у связанных материалов Expected: ширина сетки не превышает `960px`, высота каждой карточки находится в диапазоне `112–140px`.

- [ ] **Step 3: Проверить интерактивы на 360px**

Вручную через Playwright:

1. Открыть и закрыть мобильное меню; убедиться, что «Главная» видна и ведёт на `/index.html`.
2. Открыть и закрыть первый FAQ; ответ плавно появляется и снова не занимает место.
3. Зафиксировать `window.scrollY`, открыть и закрыть модальное окно, сравнить позицию прокрутки с допуском `1px`.
4. Проверить Tab-фокус на меню, FAQ, кнопке модального окна и ссылках футера.

- [ ] **Step 4: Выполнить финальные проверки репозитория**

Run:

```powershell
npm test
git diff --check
git status --short
```

Expected: все тесты PASS; `git diff --check` без вывода; рабочее дерево чистое после коммитов.

