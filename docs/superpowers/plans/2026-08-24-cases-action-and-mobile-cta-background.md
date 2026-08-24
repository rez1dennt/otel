# Cases Action and Mobile CTA Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Центрировать надпись в CTA карточек страницы «Кейсы» и заменить пересекающую текст мобильную декорацию CTA-панелей спокойным оливковым градиентом.

**Architecture:** Исправление остаётся в общей CSS-системе без изменения HTML и JavaScript. Специфичное правило восстанавливает flex-геометрию `.project-listing .card-link-cue`, а мобильный breakpoint переключает `.contact-panel` на отдельный токен градиента и скрывает контурную декорацию.

**Tech Stack:** HTML5, CSS custom properties, Node.js `node:test`, Playwright.

## Global Constraints

- HTML, тексты, ссылки, модальные окна, изображения и JavaScript-логика не меняются.
- Изменения применяются к `.project-listing > a` на `/kejsy/` и `projects.html`.
- Мобильный фон применяется к `.contact-panel` только при ширине до `47.9375rem`.
- На десктопе текущая декоративная композиция CTA сохраняется.
- Минимальная высота кнопки кейса остаётся `var(--control-md)` — 48 px.
- На 320 px и 360 px не должно быть перекрытия текста или горизонтального переполнения.

---

### Task 1: Регрессионные проверки геометрии CTA

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: существующие селекторы `.project-listing .card-link-cue`, `.contact-panel` и `.contact-panel__art`.
- Produces: статический контракт CSS и браузерные измерения, которые до исправления воспроизводят оба дефекта.

- [ ] **Step 1: Добавить падающий статический тест**

Добавить в `tests/site.test.mjs`:

```js
test('case listing cues and mobile contact panels use their approved visual contracts', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.project-listing \.card-link-cue\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*margin-block-end:\s*0;/s);
  assert.match(css, /--gradient-contact-mobile:\s*radial-gradient\(circle at 100% 100%,[^;]+linear-gradient\(145deg, var\(--ref-olive\), var\(--ref-olive-hover\)\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.contact-panel\s*\{[^}]*background:\s*var\(--gradient-contact-mobile\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.contact-panel__art\s*\{[^}]*display:\s*none;/s);
});
```

- [ ] **Step 2: Запустить статический тест и подтвердить красную фазу**

Run:

```powershell
node --test --test-name-pattern="case listing cues and mobile contact panels" tests/site.test.mjs
```

Expected: FAIL, потому что специфичного flex-правила, мобильного токена и скрытия `.contact-panel__art` ещё нет.

- [ ] **Step 3: Добавить падающий Playwright-тест**

Добавить в `tests/mobile-layout.spec.mjs`:

```js
test('case listing cues stay centered and mobile contact art stays clear of copy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/kejsy/');

  const cues = await page.locator('.project-listing .card-link-cue').evaluateAll((elements) => elements.map((cue) => {
    const style = getComputedStyle(cue);
    const cueRect = cue.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(cue);
    const textRect = range.getBoundingClientRect();
    return {
      display: style.display,
      alignItems: style.alignItems,
      justifyContent: style.justifyContent,
      insetDifference: Math.abs((textRect.top - cueRect.top) - (cueRect.bottom - textRect.bottom))
    };
  }));

  expect(cues).toHaveLength(3);
  expect(cues.every((cue) => cue.display === 'flex' && cue.alignItems === 'center' && cue.justifyContent === 'center')).toBe(true);
  expect(Math.max(...cues.map((cue) => cue.insetDifference))).toBeLessThanOrEqual(1);

  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/kejsy/');
    const panel = page.locator('.contact-panel');
    await expect(panel.locator('.contact-panel__art')).toHaveCSS('display', 'none');
    await expect(panel).toHaveCSS('background-image', /100% 100%/);
    const geometry = await panel.evaluate((element) => ({
      right: element.getBoundingClientRect().right,
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport);
  }
});
```

- [ ] **Step 4: Запустить браузерный тест и подтвердить красную фазу**

Run:

```powershell
npm run test:ui -- --grep "case listing cues stay centered"
```

Expected: FAIL: desktop cue вычисляется как `display: block`, а мобильная декорация остаётся видимой.

- [ ] **Step 5: Зафиксировать регрессионные тесты**

```powershell
git add tests/site.test.mjs tests/mobile-layout.spec.mjs
git commit -m "test: cover case cue and mobile cta background"
```

---

### Task 2: CSS-исправление кнопки кейсов и мобильного фона

**Files:**
- Modify: `assets/css/styles.css`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: существующие примитивы `--ref-olive`, `--ref-olive-hover`, `--ref-blush` и breakpoint `47.9375rem`.
- Produces: новый токен `--gradient-contact-mobile` и специфичные правила двух общих компонентов.

- [ ] **Step 1: Добавить мобильный градиентный токен**

Рядом с `--gradient-contact` в `:root` добавить:

```css
--gradient-contact-mobile: radial-gradient(circle at 100% 100%, rgb(201 179 164 / 0.18), transparent 44%), linear-gradient(145deg, var(--ref-olive), var(--ref-olive-hover));
```

- [ ] **Step 2: Восстановить flex-геометрию CTA архива кейсов**

После общего правила `.project-listing span` добавить:

```css
.project-listing .card-link-cue {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 0;
}
```

- [ ] **Step 3: Переключить мобильный фон и скрыть контурную декорацию**

Внутри `@media (max-width: 47.9375rem)` после правила `.faq-panel, .contact-panel` добавить:

```css
.contact-panel {
  background: var(--gradient-contact-mobile);
}

.contact-panel__art {
  display: none;
}
```

- [ ] **Step 4: Запустить сфокусированные проверки и подтвердить зелёную фазу**

Run:

```powershell
node --test --test-name-pattern="case listing cues and mobile contact panels" tests/site.test.mjs
npm run test:ui -- --grep "case listing cues stay centered"
```

Expected: оба теста PASS; три CTA имеют flex-центрирование, мобильная декорация скрыта на 360 px и 320 px.

- [ ] **Step 5: Зафиксировать CSS-исправление**

```powershell
git add assets/css/styles.css
git commit -m "fix: center case cues and quiet mobile cta"
```

---

### Task 3: Полная адаптивная проверка и публикация ветки

**Files:**
- Verify: `assets/css/styles.css`
- Verify: `tests/site.test.mjs`
- Verify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: результаты Tasks 1–2.
- Produces: подтверждённую чистую ветку `feature/hotel-site`, готовую к отправке в `origin`.

- [ ] **Step 1: Запустить полный статический набор**

Run:

```powershell
npm test
```

Expected: все Node-тесты PASS, 0 failures.

- [ ] **Step 2: Запустить полный Playwright-набор**

Run:

```powershell
npm run test:ui
```

Expected: все UI-тесты PASS, включая 19 маршрутов на 360 px и 320 px.

- [ ] **Step 3: Проверить форматирование и чистоту рабочей копии**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` завершается с кодом 0; `git status --short` не показывает незакоммиченных файлов.

- [ ] **Step 4: Отправить новые коммиты в существующую ветку**

Run:

```powershell
git push origin feature/hotel-site
```

Expected: `origin/feature/hotel-site` обновляется до локального `HEAD` без force-push.
