import { expect, test } from '@playwright/test';
import { BOOTSTRAP_ROUTES, CONTAINER_ROUTES, ROUTES } from '../../route-manifest.mjs';

const MENU_PATHS = ['/', '/uslugi/', '/o-proekte/', '/kejsy/', '/poleznoe/', '/kontakty/'];

function pathname(value, baseURL) {
  return new URL(value, baseURL).pathname.replace(/\/+$/, '') || '/';
}

async function dismissCookieBanner(page) {
  const reject = page.locator('[data-cookie-reject]');
  if (await reject.isVisible()) {
    await reject.click();
  }
}

test('activation creates each route once with the correct hierarchy', async ({ request, baseURL }) => {
  const response = await request.get('/wp-json/wp/v2/pages?per_page=100');
  expect(response.ok()).toBe(true);
  const pages = await response.json();
  const byPath = new Map();

  for (const page of pages) {
    const routePath = pathname(page.link, baseURL);
    const matches = byPath.get(routePath) ?? [];
    matches.push(page);
    byPath.set(routePath, matches);
  }

  for (const route of BOOTSTRAP_ROUTES) {
    const routePath = pathname(route.path, baseURL);
    const matches = byPath.get(routePath) ?? [];
    expect(matches, `${route.path} should exist exactly once`).toHaveLength(1);

    const expectedParent = route.parentPath
      ? byPath.get(pathname(route.parentPath, baseURL))?.[0]?.id
      : 0;
    expect(matches[0].parent, `${route.path} parent`).toBe(expectedParent ?? 0);
  }
});

test('activation seeds seven cases once and dynamic surfaces render them', async ({ page, request, baseURL }) => {
  const response = await request.get('/wp-json/wp/v2/forma_case?per_page=100&orderby=menu_order&order=asc');
  expect(response.ok()).toBe(true);
  const cases = await response.json();
  expect(cases).toHaveLength(7);
  expect(new Set(cases.map((item) => item.slug)).size).toBe(7);

  await page.goto('/');
  await expect(page.locator('.projects-section .project-card')).toHaveCount(3);
  await expect(page.locator('.projects-section')).toContainText('Перезагрузка загородного отеля');

  await page.goto('/kejsy/');
  await expect(page.locator('.project-listing > a')).toHaveCount(7);
  await expect(page.locator('.project-listing')).toContainText('Перепозиционирование экоотеля');

  const firstCasePath = pathname(cases[0].link, baseURL);
  const detailResponse = await page.goto(firstCasePath);
  expect(detailResponse?.status()).toBe(200);
  await expect(page.locator('main h1')).toHaveText(cases[0].title.rendered);
  await expect(page.locator('#context')).toBeVisible();
  await expect(page.locator('#work .case-steps > li')).toHaveCount(4);
  await expect(page.locator('#result .case-metrics > li')).toHaveCount(2);
});

test('native case editor can publish a new case with repeatable fields', async ({ page }) => {
  test.setTimeout(120_000);
  const caseTitle = 'Тестовый кейс редактора';
  await page.goto('/wp-admin/post-new.php?post_type=forma_case');

  const title = page.locator('#title, .editor-post-title__input').first();
  await expect(title).toBeVisible();
  await title.fill(caseTitle);
  await page.locator('#forma-case-object-type').fill('Городской отель');
  await page.locator('#forma-case-product').fill('48 номеров');
  await page.locator('#forma-case-context').fill('Отелю требовалось объединить разрозненные каналы продаж в одну управляемую систему.');
  await page.locator('#forma-case-task').fill('Настроить единый процесс работы с обращениями и контролем результата.');
  await page.locator('#forma-case-conclusion').fill('Единый процесс помогает команде видеть связь действий с коммерческим результатом.');

  const stepRows = page.locator('[data-case-type="steps"] [data-case-row]');
  await stepRows.first().locator('input').fill('Собрали исходные данные');
  await stepRows.first().locator('textarea').fill('Проверили каналы, заявки и действующие правила работы команды.');
  const addStep = page.getByRole('button', { name: 'Добавить шаг', exact: true });
  await addStep.click();
  await expect(stepRows).toHaveCount(2);
  await stepRows.last().getByRole('button', { name: 'Удалить шаг', exact: true }).click();
  await expect(stepRows).toHaveCount(1);
  await expect(addStep).toBeFocused();

  const metricRow = page.locator('[data-case-type="metrics"] [data-case-row]').first();
  await metricRow.locator('input').nth(0).fill('+15%');
  await metricRow.locator('input').nth(1).fill('выручка');

  const classicPublish = page.locator('#publish');
  if (await classicPublish.isVisible()) {
    const form = page.locator('#post');
    expect(await form.evaluate((element) => element.checkValidity())).toBe(true);
    await Promise.all([
      page.waitForURL(/post\.php\?post=\d+/),
      form.evaluate((element) => element.requestSubmit(element.querySelector('#publish')))
    ]);
  } else {
    await page.locator('.editor-post-publish-panel__toggle').click();
    await page.locator('.editor-post-publish-button').click();
    await expect(page.locator('.components-snackbar__content')).toContainText(/published|опубликован/i);
  }

  await page.goto('/kejsy/');
  const card = page.locator('.project-listing > a').filter({ hasText: caseTitle });
  await expect(card).toHaveCount(1);
  const href = await card.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href);
  await expect(page.locator('main h1')).toHaveText(caseTitle);
  await expect(page.locator('#work .case-steps > li')).toHaveCount(1);
  await expect(page.locator('#result .case-metrics > li')).toHaveCount(1);
});

test('theme reactivation preserves editor changes and does not duplicate cases', async ({ page, request }) => {
  test.setTimeout(120_000);
  const seededResponse = await request.get('/wp-json/wp/v2/forma_case?per_page=1&orderby=menu_order&order=asc');
  expect(seededResponse.ok()).toBe(true);
  const [seededCase] = await seededResponse.json();
  const editedTitle = `${seededCase.title.rendered} — редакция клиента`;

  await page.goto(`/wp-admin/post.php?post=${seededCase.id}&action=edit`);
  const title = page.locator('#title, .editor-post-title__input').first();
  await expect(title).toBeVisible();
  await title.fill(editedTitle);

  const form = page.locator('#post');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    form.evaluate((element) => element.requestSubmit(element.querySelector('#publish')))
  ]);

  await page.goto('/wp-admin/themes.php');
  const alternateActivation = page.locator('.theme:not(.active) a.activate').first();
  const alternateHref = await alternateActivation.getAttribute('href');
  expect(alternateHref).toBeTruthy();
  await page.goto(alternateHref);

  await page.goto('/wp-admin/themes.php');
  const formaTheme = page.locator('.theme').filter({ hasText: 'FORMA Hotel' }).first();
  const formaActivation = formaTheme.locator('a.activate');
  const formaHref = await formaActivation.getAttribute('href');
  expect(formaHref).toBeTruthy();
  await page.goto(formaHref);

  const editedResponse = await request.get(`/wp-json/wp/v2/forma_case/${seededCase.id}`);
  expect(editedResponse.ok()).toBe(true);
  expect((await editedResponse.json()).title.rendered).toBe(editedTitle);

  const allCasesResponse = await request.get('/wp-json/wp/v2/forma_case?per_page=100');
  expect(allCasesResponse.ok()).toBe(true);
  expect(await allCasesResponse.json()).toHaveLength(8);
});

test('technical container pages redirect and primary menus expose six clean routes', async ({ page, request, baseURL }) => {
  for (const route of CONTAINER_ROUTES) {
    const response = await request.get(route.path);
    expect(response.ok()).toBe(true);
    expect(pathname(response.url(), baseURL)).toBe('/poleznoe');
  }

  await page.goto('/');
  const desktopPaths = await page.locator('.site-nav > a').evaluateAll(
    (links) => links.map((link) => new URL(link.href).pathname)
  );
  const mobilePaths = await page.locator('[data-mobile-menu] nav > a').evaluateAll(
    (links) => links.map((link) => new URL(link.href).pathname)
  );

  expect(desktopPaths).toEqual(MENU_PATHS);
  expect(mobilePaths).toEqual(MENU_PATHS);
  for (const route of CONTAINER_ROUTES) {
    expect(desktopPaths).not.toContain(route.path);
  }
});

test('every public WordPress route renders one main and h1 without client failures', async ({ page }) => {
  test.setTimeout(180_000);
  const failures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => failures.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => failures.push(`request: ${request.url()} ${request.failure()?.errorText ?? ''}`));

  for (const route of ROUTES) {
    const response = await page.goto(route.path, { waitUntil: 'load' });
    expect(response?.status(), route.path).toBe(200);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('main h1')).toHaveCount(1);
  }

  expect(failures).toEqual([]);
});

for (const width of [1280, 768, 360, 320]) {
  test(`all routes avoid horizontal overflow at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });

    for (const route of ROUTES) {
      await page.goto(route.path, { waitUntil: 'load' });
      const geometry = await page.evaluate(() => ({
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));
      expect(geometry.scrollWidth, route.path).toBeLessThanOrEqual(geometry.viewport);
    }
  });
}

test('mobile header stays pinned and burger keeps width, scroll and focus stable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await dismissCookieBanner(page);

  await page.evaluate(() => window.scrollTo(0, 700));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const before = await page.locator('.site-header').evaluate((header) => ({
    width: header.getBoundingClientRect().width,
    top: header.getBoundingClientRect().top,
    scrollY: window.scrollY,
    fixedToolbarHeight: (() => {
      const toolbar = document.querySelector('#wpadminbar');
      return toolbar && getComputedStyle(toolbar).position === 'fixed'
        ? toolbar.getBoundingClientRect().height
        : 0;
    })()
  }));
  expect(before.top).toBeGreaterThanOrEqual(before.fixedToolbarHeight - 1);
  expect(before.top).toBeLessThanOrEqual(before.fixedToolbarHeight + 1);

  const toggle = page.locator('[data-menu-toggle]');
  const toggleBox = await toggle.boundingBox();
  expect(toggleBox).not.toBeNull();
  await page.mouse.click(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-mobile-menu]')).toHaveClass(/is-open/);
  await expect(page.locator('body')).toHaveClass(/is-locked/);
  await expect(page.locator('[data-mobile-menu] a').first()).toBeFocused();

  const open = await page.locator('.site-header').evaluate((header) => ({
    width: header.getBoundingClientRect().width,
    scrollY: window.scrollY
  }));
  expect(Math.abs(open.width - before.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(open.scrollY - before.scrollY)).toBeLessThanOrEqual(1);

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  expect(Math.abs(await page.evaluate(() => window.scrollY) - before.scrollY)).toBeLessThanOrEqual(1);
});

test('modal, FAQ and Cookie controls preserve their interaction contracts', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const banner = page.locator('[data-cookie-banner]');
  await expect(banner).toBeVisible();
  await page.locator('[data-cookie-settings]').click();
  await expect(page.locator('[data-cookie-options]')).toHaveClass(/is-open/);
  await page.locator('[data-cookie-reject]').click();
  await expect(banner).toBeHidden();

  const faqButton = page.locator('[data-accordion-button]').first();
  await faqButton.click();
  await expect(faqButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(`#${await faqButton.getAttribute('aria-controls')}`)).toHaveClass(/is-open/);

  const trigger = page.locator('.situations-intro [data-modal-open]');
  await trigger.scrollIntoViewIfNeeded();
  const beforeModal = await page.evaluate(() => window.scrollY);
  await trigger.click();
  const modal = page.locator('[data-modal]');
  await expect(modal).toHaveAttribute('aria-hidden', 'false');
  await expect(modal.locator('[data-modal-close]').last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveAttribute('aria-hidden', 'true');
  await expect(trigger).toBeFocused();
  expect(Math.abs(await page.evaluate(() => window.scrollY) - beforeModal)).toBeLessThanOrEqual(1);
});
