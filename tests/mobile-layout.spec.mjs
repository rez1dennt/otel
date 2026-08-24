import { expect, test } from '@playwright/test';

const routes = [
  '/index.html',
  '/about.html',
  '/services.html',
  '/service.html',
  '/projects.html',
  '/project.html',
  '/blog.html',
  '/article.html',
  '/contacts.html',
  '/kejsy/',
  '/kejsy/rost-pryamyh-prodazh/',
  '/poleznoe/',
  '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
  '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
  '/poleznoe/materialy/chek-list-audita-prodazh/',
  '/privacy.html',
  '/consent.html',
  '/cookies.html',
  '/404.html'
];

for (const width of [360, 320]) {
  test(`all public pages keep compact left-aligned mobile layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });

    for (const route of routes) {
      await page.goto(route);

      const audit = await page.evaluate(() => {
        const visible = (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };

        const nonLeftHeadings = [...document.querySelectorAll('main h1, main h2, main h3')]
          .filter(visible)
          .filter((heading) => getComputedStyle(heading).textAlign !== 'start')
          .map((heading) => heading.textContent.trim().replace(/\s+/g, ' '));

        const arrowActions = [...document.querySelectorAll('.card-link-cue, .service-card__actions .text-link')]
          .filter(visible)
          .filter((action) => getComputedStyle(action, '::after').content.includes('→'))
          .map((action) => action.textContent.trim());

        return {
          nonLeftHeadings,
          arrowActions,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        };
      });

      expect(audit.nonLeftHeadings, `${route}: heading alignment`).toEqual([]);
      expect(audit.arrowActions, `${route}: arrow actions`).toEqual([]);
      expect(audit.scrollWidth, `${route}: horizontal overflow`).toBeLessThanOrEqual(audit.viewportWidth);
    }
  });
}

test('mobile section and action geometry uses the compact tokens', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/index.html');

  const sectionPadding = await page.locator('.services-section').evaluate((element) => getComputedStyle(element).paddingBlockStart);
  const cue = await page.locator('.card-link-cue').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { minHeight: style.minHeight, borderTopWidth: style.borderTopWidth };
  });
  const actionGeometry = await page.locator('.service-card__actions').first().evaluate((row) => {
    const button = row.querySelector('.text-link');
    return { rowWidth: row.getBoundingClientRect().width, buttonWidth: button.getBoundingClientRect().width };
  });

  expect(sectionPadding).toBe('48px');
  expect(cue).toEqual({ minHeight: '48px', borderTopWidth: '1px' });
  expect(actionGeometry.buttonWidth).toBeLessThan(actionGeometry.rowWidth);

  await page.goto('/kejsy/rost-pryamyh-prodazh/');
  await expect(page.locator('.case-hero')).toHaveCSS('padding-bottom', '0px');

  await page.goto('/poleznoe/');
  await expect(page.locator('.contact-panel')).toHaveCSS('min-height', '0px');
});
