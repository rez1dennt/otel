# Case Listing Action Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить системный интервал 12 px между описанием и CTA во всех карточках страницы «Кейсы».

**Architecture:** Изменение ограничивается новым специфичным CSS-правилом `.project-listing p`, чтобы не затронуть другие listing-компоненты из текущего группового селектора. Статический тест фиксирует токен, а Playwright измеряет реальную геометрию на трёх целевых ширинах.

**Tech Stack:** CSS custom properties, Node.js `node:test`, Playwright.

## Global Constraints

- Интервал равен `var(--space-3)` — 12 px.
- Правило применяется к `/kejsy/` и `projects.html` через общий `.project-listing`.
- Размер, контур, радиус и выравнивание `.card-link-cue` не меняются.
- HTML, тексты, изображения, ссылки, анимации и JavaScript не меняются.
- На 1280 px, 360 px и 320 px минимальный измеренный интервал равен 12 px.
- Горизонтальное переполнение не появляется.

---

### Task 1: TDD-контракт и CSS-интервал

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/mobile-layout.spec.mjs`
- Modify: `assets/css/styles.css`

**Interfaces:**
- Consumes: `.project-listing p`, `.project-listing .card-link-cue`, `--space-3`.
- Produces: единый измеряемый интервал 12 px на обоих архивах кейсов.

- [ ] **Step 1: Добавить падающий статический тест**

Добавить в `tests/site.test.mjs`:

```js
test('case listing descriptions keep a twelve pixel action gap', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.project-listing p\s*\{[^}]*margin-block-end:\s*var\(--space-3\);/s);
});
```

- [ ] **Step 2: Подтвердить красную фазу статического теста**

Run:

```powershell
node --test --test-name-pattern="case listing descriptions keep a twelve pixel action gap" tests/site.test.mjs
```

Expected: FAIL, потому что текущий групповой селектор задаёт `margin-block-end: 0`.

- [ ] **Step 3: Добавить падающий браузерный тест**

Добавить в `tests/mobile-layout.spec.mjs`:

```js
test('case listing descriptions stay separated from actions at every target width', async ({ page }) => {
  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/kejsy/');
    const gaps = await page.locator('.project-listing .card-link-cue').evaluateAll((elements) => elements.map((cue) => (
      cue.getBoundingClientRect().top - cue.previousElementSibling.getBoundingClientRect().bottom
    )));
    expect(gaps).toHaveLength(3);
    expect(Math.min(...gaps), `${width}px action gap`).toBeGreaterThanOrEqual(12);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth);
  }
});
```

- [ ] **Step 4: Подтвердить красную фазу Playwright**

Run:

```powershell
npm run test:ui -- --grep "case listing descriptions stay separated"
```

Expected: FAIL с измеренным интервалом `0`, а не минимум `12`.

- [ ] **Step 5: Добавить минимальное специфичное CSS-правило**

После общего правила для `.listing-card p, .project-listing p, .article-listing p` добавить:

```css
.project-listing p {
  margin-block-end: var(--space-3);
}
```

- [ ] **Step 6: Подтвердить зелёную фазу**

Run:

```powershell
node --test --test-name-pattern="case listing descriptions keep a twelve pixel action gap" tests/site.test.mjs
npm run test:ui -- --grep "case listing descriptions stay separated"
```

Expected: оба теста PASS; все три значения gap на каждой ширине не меньше 12 px.

- [ ] **Step 7: Зафиксировать тесты и CSS**

```powershell
git add tests/site.test.mjs tests/mobile-layout.spec.mjs assets/css/styles.css
git commit -m "fix: space case listing actions"
```

---

### Task 2: Полная проверка и публикация

**Files:**
- Verify: `assets/css/styles.css`
- Verify: `tests/site.test.mjs`
- Verify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: результат Task 1.
- Produces: чистую ветку `feature/hotel-site`, синхронизированную с `origin/feature/hotel-site`.

- [ ] **Step 1: Запустить полный набор Node-тестов**

Run: `npm test`

Expected: все тесты PASS, 0 failures.

- [ ] **Step 2: Запустить полный Playwright-набор**

Run: `npm run test:ui`

Expected: все UI-тесты PASS, включая аудит 19 маршрутов на 360 px и 320 px.

- [ ] **Step 3: Проверить чистоту Git**

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` завершается с кодом 0; `git status --short` пуст.

- [ ] **Step 4: Отправить коммиты в GitHub**

Run: `git push origin feature/hotel-site`

Expected: удалённая ветка обновляется до локального `HEAD` без force-push.
