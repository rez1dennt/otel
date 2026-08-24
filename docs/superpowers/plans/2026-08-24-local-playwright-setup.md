# Local Playwright Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Установить в проект `@playwright/test` и локальный Chromium для последующих браузерных проверок.

**Architecture:** npm хранит версию Playwright в `package.json` и `package-lock.json`; соответствующий Chromium устанавливается штатным CLI в пользовательский кэш вне репозитория. Постоянные E2E-файлы и конфигурация не создаются.

**Tech Stack:** Node.js, npm, `@playwright/test`, Chromium.

## Global Constraints

- Установить последнюю стабильную версию `@playwright/test` как dev dependency.
- Установить только Chromium.
- Не запускать `npm init playwright@latest`.
- Не создавать `playwright.config` и демонстрационные E2E-тесты.
- Не изменять HTML, CSS и JavaScript сайта.

---

### Task 1: Добавить Playwright в зависимости проекта

**Files:**
- Modify: `package.json`
- Create or modify: `package-lock.json`

**Interfaces:**
- Consumes: существующий npm-проект и Node.js.
- Produces: локальную CLI-команду `npx playwright` и пакет `@playwright/test` в `node_modules`.

- [ ] **Step 1: Проверить исходное состояние**

```powershell
npm test
git status --short
```

Expected: существующие тесты PASS; рабочее дерево чистое.

- [ ] **Step 2: Установить dev dependency**

```powershell
npm install --save-dev @playwright/test@latest
```

Expected: `package.json` содержит `devDependencies.@playwright/test`; npm создаёт или обновляет `package-lock.json`.

- [ ] **Step 3: Проверить CLI**

```powershell
npx playwright --version
```

Expected: команда возвращает номер версии Playwright и exit code `0`.

- [ ] **Step 4: Сохранить npm-зависимость**

```powershell
git add package.json package-lock.json
git commit -m "build: add Playwright test dependency"
```

---

### Task 2: Установить и проверить Chromium

**Files:**
- External cache: `%LOCALAPPDATA%\ms-playwright`
- Verify: `package.json`
- Verify: `package-lock.json`

**Interfaces:**
- Consumes: локальную CLI-команду Playwright из Task 1.
- Produces: запускаемый Chromium, совместимый с установленной версией Playwright.

- [ ] **Step 1: Установить Chromium**

```powershell
npx playwright install chromium
```

Expected: CLI загружает Chromium и завершается с exit code `0`.

- [ ] **Step 2: Проверить список браузеров**

```powershell
npx playwright install --list
```

Expected: в списке присутствует Chromium текущей установки.

- [ ] **Step 3: Проверить реальный headless-запуск**

```powershell
node --input-type=module -e "import { chromium } from '@playwright/test'; const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto('about:blank'); console.log(await page.title()); await browser.close();"
```

Expected: процесс завершается с exit code `0` без ошибок запуска браузера.

- [ ] **Step 4: Выполнить финальные проверки проекта**

```powershell
npm test
git diff --check
git status --short
```

Expected: все тесты PASS; `git diff --check` без вывода; рабочее дерево чистое после коммита Task 1.

