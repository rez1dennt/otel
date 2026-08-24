# About Hero Spacing and Photo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить верхний отступ 20 px у split-hero страницы «О проекте» и заменить размытый вертикальный фон на оптимизированный горизонтальный кадр `IMG_3161`.

**Architecture:** HTML и существующая CSS-ссылка на `client-about-hero.webp` сохраняются. Тесты фиксируют геометрию и физические параметры изображения, ImageMagick потоково читает один JPG из ZIP без копирования исходника в проект, а CSS получает один токенизированный логический margin.

**Tech Stack:** HTML5, vanilla CSS, Node.js `node:test`, Playwright, PowerShell ZipArchive, ImageMagick 7.

## Global Constraints

- Источник — `IMG_3161.JPG` из `C:\Users\bahti\Downloads\3 ноября 18-19 (3).zip`.
- Финальный файл — `assets/images/client-about-hero.webp` размером `1600×1067`.
- WebP quality — `82`, `webp:method=6`, метаданные удаляются.
- Вес финального файла не превышает `200 КБ`.
- Верхний отступ `.page-hero--split` — `var(--space-5)`, то есть 20 px.
- HTML, текст, CTA, радиусы, высота hero, header и остальные изображения не меняются.
- На 1280, 360 и 320 px отсутствует горизонтальное переполнение.

---

### Task 1: Регрессионные контракты hero

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: `.page-hero--split`, `.page-hero__media`, `assets/images/client-about-hero.webp`.
- Produces: статический контракт margin/веса и браузерный контракт gap/физического разрешения.

- [ ] **Step 1: Добавить `stat` в импорт Node-теста**

В `tests/site.test.mjs` заменить импорт:

```js
import { access, readFile } from 'node:fs/promises';
```

на:

```js
import { access, readFile, stat } from 'node:fs/promises';
```

- [ ] **Step 2: Добавить падающий статический тест**

Добавить в `tests/site.test.mjs`:

```js
test('about split hero uses the approved gutter and optimized portrait asset', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const asset = await stat(new URL('../assets/images/client-about-hero.webp', import.meta.url));

  assert.match(css, /\.page-hero--split\s*\{[^}]*margin-inline:\s*var\(--space-5\);[^}]*margin-block-start:\s*var\(--space-5\);/s);
  assert.ok(asset.size <= 200 * 1024, `about hero is ${asset.size} bytes`);
});
```

- [ ] **Step 3: Подтвердить красную фазу статического теста**

Run:

```powershell
node --test --test-name-pattern="about split hero uses the approved gutter" tests/site.test.mjs
```

Expected: FAIL, потому что `.page-hero--split` ещё не содержит `margin-block-start`.

- [ ] **Step 4: Добавить падающий Playwright-тест**

Добавить в `tests/mobile-layout.spec.mjs`:

```js
test('about hero keeps its gutter and optimized background at every target width', async ({ page }) => {
  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about.html');

    const metrics = await page.evaluate(async () => {
      const header = document.querySelector('.site-header');
      const hero = document.querySelector('.page-hero--split');
      const media = hero.querySelector('.page-hero__media');
      const backgroundImage = getComputedStyle(media).backgroundImage;
      const backgroundUrl = backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      const image = new Image();
      image.src = backgroundUrl;
      await image.decode();
      return {
        gap: hero.getBoundingClientRect().top - header.getBoundingClientRect().bottom,
        imageWidth: image.naturalWidth,
        imageHeight: image.naturalHeight,
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect(metrics.gap, `${width}px hero gap`).toBeGreaterThanOrEqual(20);
    expect({ width: metrics.imageWidth, height: metrics.imageHeight }).toEqual({ width: 1600, height: 1067 });
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  }
});
```

- [ ] **Step 5: Подтвердить красную фазу Playwright**

Run:

```powershell
npm run test:ui -- --grep "about hero keeps its gutter"
```

Expected: FAIL: текущий gap равен 0 px, а фон имеет физическое разрешение `800×1200`.

- [ ] **Step 6: Зафиксировать падающие тесты**

```powershell
git add tests/site.test.mjs tests/mobile-layout.spec.mjs
git commit -m "test: cover about hero spacing and photo"
```

---

### Task 2: Конвертация IMG_3161 и CSS-отступ

**Files:**
- Modify: `assets/images/client-about-hero.webp`
- Modify: `assets/css/styles.css`
- Test: `tests/site.test.mjs`
- Test: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: ZIP-entry `IMG_3161.JPG`, `--space-5`, существующую ссылку CSS на `client-about-hero.webp`.
- Produces: WebP `1600×1067` до 200 КБ и вычисленный верхний gap 20 px.

- [ ] **Step 1: Потоково экспортировать IMG_3161 в WebP**

Run from the worktree root:

```powershell
$zipPath = 'C:\Users\bahti\Downloads\3 ноября 18-19 (3).zip'
$outputPath = (Resolve-Path 'assets\images').Path + '\client-about-hero.webp'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  $entry = $archive.Entries | Where-Object Name -eq 'IMG_3161.JPG' | Select-Object -First 1
  if (-not $entry) { throw 'IMG_3161.JPG not found' }
  $processInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $processInfo.FileName = 'magick'
  $processInfo.UseShellExecute = $false
  $processInfo.CreateNoWindow = $true
  $processInfo.RedirectStandardInput = $true
  $processInfo.RedirectStandardError = $true
  foreach ($arg in @('jpg:-','-auto-orient','-resize','1600x1067^','-gravity','center','-extent','1600x1067','-strip','-quality','82','-define','webp:method=6',$outputPath)) {
    [void]$processInfo.ArgumentList.Add($arg)
  }
  $process = [System.Diagnostics.Process]::Start($processInfo)
  $entryStream = $entry.Open()
  try { $entryStream.CopyTo($process.StandardInput.BaseStream) }
  finally { $entryStream.Dispose(); $process.StandardInput.Close() }
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw $process.StandardError.ReadToEnd() }
}
finally { $archive.Dispose() }
```

- [ ] **Step 2: Проверить фактические размеры и вес**

Run:

```powershell
magick identify assets/images/client-about-hero.webp
Get-Item assets/images/client-about-hero.webp | Select-Object Length
```

Expected: `WEBP 1600x1067`; вес около `44 КБ` и не более `204800` bytes.

- [ ] **Step 3: Добавить системный верхний отступ**

В `.page-hero--split` после `margin-inline` добавить:

```css
margin-block-start: var(--space-5);
```

- [ ] **Step 4: Подтвердить зелёную фазу**

Run:

```powershell
node --test --test-name-pattern="about split hero uses the approved gutter" tests/site.test.mjs
npm run test:ui -- --grep "about hero keeps its gutter"
```

Expected: оба теста PASS на 1280, 360 и 320 px.

- [ ] **Step 5: Зафиксировать изображение и CSS**

```powershell
git add assets/images/client-about-hero.webp assets/css/styles.css
git commit -m "fix: space and sharpen about hero"
```

---

### Task 3: Визуальная проверка, полный аудит и публикация

**Files:**
- Verify: `about.html`
- Verify: `assets/css/styles.css`
- Verify: `assets/images/client-about-hero.webp`
- Verify: `tests/site.test.mjs`
- Verify: `tests/mobile-layout.spec.mjs`

**Interfaces:**
- Consumes: результат Tasks 1–2.
- Produces: проверенную чистую ветку `feature/hotel-site`, синхронизированную с GitHub.

- [ ] **Step 1: Сделать desktop и mobile снимки hero**

Run while the local server is available at port 4190:

```powershell
node --input-type=module -e "import { chromium } from '@playwright/test'; import { mkdir } from 'node:fs/promises'; await mkdir('.playwright-cache/about-hero-qa', { recursive: true }); const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await page.goto('http://127.0.0.1:4190/about.html'); await page.locator('.page-hero--split').screenshot({ path: '.playwright-cache/about-hero-qa/desktop.png' }); await page.setViewportSize({ width: 360, height: 800 }); await page.reload(); await page.locator('.page-hero--split').screenshot({ path: '.playwright-cache/about-hero-qa/mobile.png' }); await browser.close();"
```

Expected: оба PNG созданы; на desktop и mobile между header и hero виден ровный отступ, лицо не обрезано, фон не растянут.

- [ ] **Step 2: Запустить полный Node-набор**

Run: `npm test`

Expected: все тесты PASS, 0 failures.

- [ ] **Step 3: Запустить полный Playwright-набор**

Run: `npm run test:ui`

Expected: все UI-тесты PASS, включая аудит 19 маршрутов на 360 и 320 px.

- [ ] **Step 4: Проверить Git**

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` exit 0; `git status --short` пуст.

- [ ] **Step 5: Отправить коммиты в GitHub**

Run: `git push origin feature/hotel-site`

Expected: удалённая ветка обновляется до локального `HEAD` без force-push.
