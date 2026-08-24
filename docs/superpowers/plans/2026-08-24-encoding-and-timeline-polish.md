# Encoding and Timeline Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить mojibake в подписи этапов работы и наложение длинной метки таймлайна на заголовок.

**Architecture:** Русский текст итоговой подписи становится HTML-данными, а CSS отвечает только за его отображение через `attr()`. Таймлайн использует контент-зависимую первую колонку и больше не сжимается небезопасным мобильным переопределением.

**Tech Stack:** Semantic HTML5, tokenized CSS, Node.js test runner, local Playwright Chromium.

## Global Constraints

- Не менять визуальную стилистику блоков.
- Не менять утверждённый русский текст подписи.
- Использовать существующие CSS-токены.
- Проверить 320, 360, 720 и 1280px.
- Новые зависимости не добавлять.

---

### Task 1: Зафиксировать оба дефекта регрессионными тестами

**Files:**
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `services.html`, `assets/css/styles.css`.
- Produces: HTML/CSS-контракты для Task 2.

- [ ] **Step 1: Добавить тест источника подписи**

```js
test('process summary keeps Russian copy in HTML instead of CSS', async () => {
  const html = await readFile(new URL('../services.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(html, /data-process-summary="Прозрачно на каждом этапе — вы всегда знаете, что происходит и на каком мы этапе\."/);
  assert.match(css, /\.process-list--six::after\s*\{[^}]*content:\s*attr\(data-process-summary\);/s);
  assert.doesNotMatch(css, /content:\s*"Прозрачно на каждом этапе/);
});
```

- [ ] **Step 2: Добавить тест безопасной сетки таймлайна**

```js
test('biography timeline reserves the intrinsic label width', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.bio-timeline article\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-20\), max-content\) minmax\(0, 1fr\);/s);
  assert.doesNotMatch(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.bio-timeline article\s*\{[^}]*grid-template-columns:\s*4rem minmax\(0, 1fr\);/s);
});
```

- [ ] **Step 3: Запустить тесты и подтвердить красную фазу**

```powershell
node --test --test-name-pattern="process summary|biography timeline" tests/site.test.mjs
```

Expected: оба теста FAIL по текущему CSS/HTML.

- [ ] **Step 4: Сохранить тесты**

```powershell
git add tests/site.test.mjs
git commit -m "test: cover encoding and timeline regressions"
```

---

### Task 2: Исправить источник текста и сетку таймлайна

**Files:**
- Modify: `services.html`
- Modify: `assets/css/styles.css:2537-2551`
- Modify: `assets/css/styles.css:2663-2676`
- Modify: `assets/css/styles.css:3297-3299`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `data-process-summary` и существующие классы `.process-list--six`, `.bio-timeline`.
- Produces: читаемую подпись и таймлайн без пересечения колонок.

- [ ] **Step 1: Перенести подпись в HTML**

```html
<ol class="process-list process-list--six" data-process-summary="Прозрачно на каждом этапе — вы всегда знаете, что происходит и на каком мы этапе.">
```

- [ ] **Step 2: Подключить HTML-данные в псевдоэлементе**

```css
.process-list--six::after {
  /* Существующие визуальные свойства сохраняются. */
  content: attr(data-process-summary);
}
```

- [ ] **Step 3: Исправить сетку таймлайна**

```css
.bio-timeline article {
  display: grid;
  grid-template-columns: minmax(var(--space-20), max-content) minmax(0, 1fr);
  gap: var(--space-5);
  padding-block: var(--space-6);
  border-block-start: var(--line-thin) solid var(--color-border);
}
```

Удалить мобильный блок:

```css
.bio-timeline article {
  grid-template-columns: 4rem minmax(0, 1fr);
}
```

- [ ] **Step 4: Запустить целевые и полные тесты**

```powershell
node --test --test-name-pattern="process summary|biography timeline" tests/site.test.mjs
npm test
```

Expected: целевые тесты PASS; полный набор PASS.

- [ ] **Step 5: Проверить фактический рендер локальным Playwright**

Для `services.html` при каждой ширине проверить точное значение `getComputedStyle(element, '::after').content`. Для `about.html` вычислить визуальную правую границу метки и левую границу текстового блока; пересечение должно равняться `0`.

```js
for (const width of [320, 360, 720, 1280]) {
  await page.setViewportSize({ width, height: 900 });
  // services.html: точный читаемый текст подписи
  // about.html: labelRight <= bodyLeft
}
```

- [ ] **Step 6: Сохранить реализацию**

```powershell
git add services.html assets/css/styles.css
git commit -m "fix: stabilize process copy and timeline labels"
```

- [ ] **Step 7: Выполнить финальные проверки**

```powershell
npm test
git diff --check
git status --short
```

Expected: все тесты PASS; diff-check без вывода; рабочее дерево чистое.

