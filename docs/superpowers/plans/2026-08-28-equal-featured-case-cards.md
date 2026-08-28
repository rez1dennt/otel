# Equal Featured Case Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать три избранных кейса на главной равными по ширине и изображению, уменьшить визуальный разнобой текста и привести компактные кнопки к общей линии.

**Architecture:** Общий источник разметки кейсов и CMS-модель не меняются; исправление выполняется в shared CSS и защищается измерительным Playwright-тестом. После генерации WordPress-темы тот же проверенный CSS копируется в локальную тему, а `wp-config.php` остаётся нетронутым.

**Tech Stack:** Vanilla CSS, Node test runner, Playwright, classic WordPress theme, WordPress Playground.

## Global Constraints

- На десктопе от 1024 px используются три одинаковые колонки и изображения `4 / 3`.
- На 768–1023 px первые две карточки равны, третья сохраняет ту же ширину и центрируется.
- На 360 и 320 px используется одна колонка без горизонтального переполнения.
- Полные заголовки, описания и метрики сохраняются без line-clamp и скрытия данных.
- Кнопки остаются на общей нижней линии, используют существующий `.card-link-cue` и не меняют геометрию в hover/focus/active.
- Локальный `C:\Users\bahti\Local Sites\otel\app\public\wp-config.php` не копируется и не изменяется.
- Изменения синхронизируются в локальную тему и затем отправляются обычным fast-forward push в `origin/main`.
- Неотслеживаемый `wordpress-theme/forma-hotel.zip` не относится к задаче и не добавляется в commit.

---

### Task 1: Зафиксировать дефект измерительным браузерным тестом

**Files:**
- Modify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: `.project-grid`, `.project-card`, `.image-frame`, `.card-link-cue` на `/index.html`.
- Produces: один Playwright-тест `featured case cards use a balanced responsive grid`, который измеряет геометрию на 1280, 768, 360 и 320 px.

- [ ] **Step 1: Добавить тест десктопной и планшетной геометрии**

Добавить в `tests/mobile-layout.spec.mjs`:

```js
test('featured case cards use a balanced responsive grid', async ({ page }) => {
  for (const width of [1280, 768, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/index.html');

    const geometry = await page.evaluate(() => {
      const grid = document.querySelector('.project-grid');
      const cards = [...grid.querySelectorAll('.project-card')];
      const boxes = cards.map((card) => card.getBoundingClientRect());
      const images = cards.map((card) => card.querySelector('.image-frame').getBoundingClientRect());
      const actions = cards.map((card) => card.querySelector('.card-link-cue').getBoundingClientRect());
      return {
        grid: grid.getBoundingClientRect().toJSON(),
        cards: boxes.map((box) => box.toJSON()),
        images: images.map((box) => box.toJSON()),
        actions: actions.map((box) => box.toJSON()),
        titleSizes: cards.map((card) => getComputedStyle(card.querySelector('h3')).fontSize),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    const spread = (values) => Math.max(...values) - Math.min(...values);
    expect(geometry.cards).toHaveLength(3);
    expect(spread(geometry.cards.map((box) => box.width))).toBeLessThanOrEqual(1);
    expect(spread(geometry.images.map((box) => box.height))).toBeLessThanOrEqual(1);
    for (const image of geometry.images) expect(image.height / image.width).toBeCloseTo(0.75, 2);
    expect(spread(geometry.actions.map((box) => box.height))).toBeLessThanOrEqual(1);
    expect(geometry.titleSizes).toEqual(geometry.titleSizes.map(() => '22px'));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);

    if (width === 1280) {
      expect(spread(geometry.actions.map((box) => box.bottom))).toBeLessThanOrEqual(1);
      expect(geometry.actions[0].height).toBeCloseTo(40, 0);
    }
    if (width === 768) {
      const gridCenter = geometry.grid.left + geometry.grid.width / 2;
      const lastCenter = geometry.cards[2].left + geometry.cards[2].width / 2;
      expect(Math.abs(lastCenter - gridCenter)).toBeLessThanOrEqual(1);
    }
  }
});
```

- [ ] **Step 2: Запустить только новый тест и подтвердить правильное падение**

Run: `npm run test:ui -- --grep "featured case cards use a balanced responsive grid"`

Expected: FAIL на 1280 px, потому что текущие колонки имеют коэффициенты `1.4fr 0.8fr 0.8fr`, а изображения используют разные пропорции.

- [ ] **Step 3: Зафиксировать падающий регрессионный тест**

```powershell
git add tests/mobile-layout.spec.mjs
git commit -m "test: define balanced featured case grid"
```

---

### Task 2: Реализовать равную сетку и компактные действия

**Files:**
- Modify: `assets/css/styles.css`
- Generated: `wordpress-theme/forma-hotel/assets/css/styles.css`

**Interfaces:**
- Consumes: существующую HTML/PHP-разметку `.project-grid > .project-card`.
- Produces: одинаковую desktop/tablet/mobile геометрию без изменения контента или CMS.

- [ ] **Step 1: Исправить базовую desktop-сетку**

В `assets/css/styles.css` заменить правила блока кейсов на:

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  gap: var(--space-5);
}

.project-card .image-frame {
  aspect-ratio: 4 / 3;
}

.project-card h3 {
  margin-block-end: var(--space-3);
  overflow-wrap: anywhere;
  font-size: var(--text-xl);
}

.project-card .card-link-cue {
  display: inline-flex;
  min-height: calc(var(--control-md) - var(--space-2));
  align-items: center;
  justify-content: center;
  margin-block-end: 0;
  padding-inline: var(--space-4);
  font-size: var(--text-xs);
}
```

Удалить отдельную пропорцию `.project-card--lead .image-frame`, чтобы первый кейс больше не отличался по геометрии.

- [ ] **Step 2: Исправить tablet breakpoint**

В `@media (max-width: 63.9375rem)` заменить неравные колонки и растянутую третью карточку на:

```css
.project-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.project-card:last-child {
  width: calc((100% - var(--space-5)) / 2);
  justify-self: center;
  grid-column: 1 / -1;
}

.project-card:last-child .image-frame {
  aspect-ratio: 4 / 3;
}
```

- [ ] **Step 3: Сбросить tablet-ширину на мобильном**

В `@media (max-width: 47.9375rem)` сохранить одну колонку и добавить:

```css
.project-card:last-child {
  width: 100%;
  grid-column: auto;
}
```

- [ ] **Step 4: Сгенерировать WordPress assets**

Run: `node wordpress-theme/scripts/generate-wordpress-theme.mjs`

Expected: `Generated 19 WordPress theme files.` и hash двух CSS-файлов совпадает.

- [ ] **Step 5: Запустить новый тест и полную браузерную матрицу**

Run: `npm run test:ui -- --grep "featured case cards use a balanced responsive grid"`

Expected: `1 passed`.

Run: `npm run test:ui`

Expected: все браузерные тесты PASS, включая 1280/768/360/320 и существующие header/menu/card проверки.

- [ ] **Step 6: Зафиксировать CSS-реализацию**

```powershell
git add assets/css/styles.css wordpress-theme/forma-hotel/assets/css/styles.css
git commit -m "fix: balance featured case cards"
```

---

### Task 3: Проверить, собрать и синхронизировать локальную тему

**Files:**
- Modify: `wordpress-theme/dist/forma-hotel.zip`
- Modify outside repository: `C:\Users\bahti\Local Sites\otel\app\public\wp-content\themes\forma-hotel\assets\css\styles.css`
- Verify only: `C:\Users\bahti\Local Sites\otel\app\public\wp-config.php`

**Interfaces:**
- Consumes: проверенный CSS и текущий локальный WordPress.
- Produces: одинаковый блок кейсов в Git-версии, ZIP и локальном сайте без изменения SMTP-конфигурации.

- [ ] **Step 1: Запустить полные статические и структурные тесты**

Run: `npm test`

Expected: все Node tests PASS.

Run: `npm run test:theme`

Expected: все theme structure tests PASS.

- [ ] **Step 2: Пересобрать проверенный ZIP темы**

Run: `npm run build:theme`

Expected: WordPress Playground E2E PASS и `wordpress-theme/dist/forma-hotel.zip` обновлён.

- [ ] **Step 3: Синхронизировать только CSS в локальную тему**

После проверки абсолютных путей скопировать:

```powershell
Copy-Item -LiteralPath 'wordpress-theme/forma-hotel/assets/css/styles.css' `
  -Destination 'C:\Users\bahti\Local Sites\otel\app\public\wp-content\themes\forma-hotel\assets\css\styles.css' `
  -Force
```

Не копировать каталог темы целиком и не затрагивать `wp-config.php`.

- [ ] **Step 4: Проверить локальный WordPress**

На `http://otel.localhost/` измерить ту же геометрию на 1280, 768, 360 и 320 px. Подтвердить совпадение hash локального CSS с `wordpress-theme/forma-hotel/assets/css/styles.css`, наличие по одному определению `FORMA_SMTP_USER`, `FORMA_SMTP_PASSWORD`, `FORMA_LEAD_RECIPIENT`, отсутствие консольных ошибок и горизонтального переполнения. Снять итоговый screenshot блока кейсов.

- [ ] **Step 5: Зафиксировать обновлённый ZIP**

```powershell
git add wordpress-theme/dist/forma-hotel.zip
git commit -m "build: refresh balanced WordPress theme"
```

---

### Task 4: Финальный GitHub handoff

**Files:**
- Verify only: repository commits and `origin/main`

**Interfaces:**
- Consumes: чистую проверенную ветку `feature/hotel-site`.
- Produces: fast-forward `origin/main`, совпадающий с локальным HEAD.

- [ ] **Step 1: Проверить scope и чистоту**

Run: `git status --short`

Expected: только неотслеживаемый `wordpress-theme/forma-hotel.zip`; он не добавляется.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 2: Обновить удалённый ref и подтвердить fast-forward**

Run: `git fetch origin main`

Run: `git merge-base --is-ancestor origin/main HEAD`

Expected: exit code 0.

- [ ] **Step 3: Отправить изменения без force-push**

Run: `git push origin HEAD:main`

Expected: `HEAD -> main`.

- [ ] **Step 4: Проверить удалённый hash**

Run: `git ls-remote origin refs/heads/main`

Expected: remote hash равен `git rev-parse HEAD`.
