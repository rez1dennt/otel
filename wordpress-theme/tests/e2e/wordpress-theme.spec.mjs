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
