# Compact Mobile Cookie Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Уменьшить мобильный Cookie-баннер и его кнопки без изменения логики согласия и desktop-компоновки.

**Architecture:** Все изменения ограничиваются существующим мобильным media query и используют действующие токены размеров. Регрессионный тест фиксирует плотность баннера, а локальный Playwright измеряет итоговую геометрию двух состояний.

**Tech Stack:** Tokenized CSS, Node.js test runner, local Playwright Chromium.

## Global Constraints

- Изменять только мобильную компоновку Cookie-баннера.
- Сохранять минимальную высоту кнопок 48px.
- Не менять Cookie JavaScript и HTML.
- Не добавлять новые зависимости.

---

### Task 1: Зафиксировать мобильный контракт тестом

**Files:**
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `assets/css/styles.css`.
- Produces: проверяемый мобильный CSS-контракт для Task 2.

- [ ] **Step 1: Добавить регрессионный тест**

```js
test('mobile Cookie banner uses compact touch-safe density', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-banner\s*\{[^}]*inset-inline:\s*var\(--space-2\);[^}]*width:\s*calc\(100% - var\(--space-4\)\);[^}]*padding:\s*var\(--space-4\);[^}]*gap:\s*var\(--space-3\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-banner__actions\s*\{[^}]*gap:\s*var\(--space-2\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-banner \.button\s*\{[^}]*min-height:\s*var\(--control-md\);[^}]*padding-inline:\s*var\(--space-4\);[^}]*font-size:\s*var\(--text-xs\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-options__inner\s*\{[^}]*gap:\s*var\(--space-3\);[^}]*padding-block-start:\s*var\(--space-3\);/s);
});
```

- [ ] **Step 2: Подтвердить красную фазу**

```powershell
node --test --test-name-pattern="mobile Cookie banner" tests/site.test.mjs
```

Expected: FAIL по отсутствующим компактным правилам.

- [ ] **Step 3: Сохранить тест**

```powershell
git add tests/site.test.mjs
git commit -m "test: cover compact mobile Cookie banner"
```

---

### Task 2: Реализовать и проверить мобильную плотность

**Files:**
- Modify: `assets/css/styles.css:3302-3309`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: существующие `.cookie-banner`, `.cookie-banner__actions`, `.cookie-options__inner` и `.button`.
- Produces: компактный мобильный баннер с touch-safe кнопками.

- [ ] **Step 1: Обновить мобильные CSS-правила**

```css
.cookie-banner {
  inset-inline: var(--space-2);
  inset-block-end: var(--space-2);
  grid-template-columns: 1fr;
  width: calc(100% - var(--space-4));
  max-height: calc(100vh - var(--space-4));
  gap: var(--space-3);
  overflow-y: auto;
  padding: var(--space-4);
}

.cookie-banner__actions {
  gap: var(--space-2);
}

.cookie-banner .button {
  min-height: var(--control-md);
  padding-inline: var(--space-4);
  font-size: var(--text-xs);
}

.cookie-options__inner {
  gap: var(--space-3);
  padding-block-start: var(--space-3);
}
```

- [ ] **Step 2: Запустить целевые и полные тесты**

```powershell
node --test --test-name-pattern="mobile Cookie banner" tests/site.test.mjs
npm test
```

Expected: целевой и полный набор PASS.

- [ ] **Step 3: Измерить рендер локальным Playwright**

При ширинах 320 и 360px измерить закрытый и открытый баннер:

- высота каждой кнопки не менее 48px;
- `scrollWidth <= clientWidth`;
- закрытый баннер ниже исходных 398px при 320px;
- открытый баннер ниже исходных 540px при 320px.

- [ ] **Step 4: Сохранить реализацию**

```powershell
git add assets/css/styles.css
git commit -m "fix: compact mobile Cookie controls"
```

- [ ] **Step 5: Выполнить финальные проверки**

```powershell
npm test
git diff --check
git status --short
```

Expected: все тесты PASS; diff-check без вывода; рабочее дерево чистое.

