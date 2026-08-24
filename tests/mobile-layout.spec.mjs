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

        const headingsOutsideGutter = [...document.querySelectorAll('main h1, main h2, main h3')]
          .filter(visible)
          .filter((heading) => {
            const rect = heading.getBoundingClientRect();
            return rect.left < 19.5 || rect.right > window.innerWidth - 19.5;
          })
          .map((heading) => heading.textContent.trim().replace(/\s+/g, ' '));

        const arrowActions = [...document.querySelectorAll('.card-link-cue, .service-card__actions .text-link')]
          .filter(visible)
          .filter((action) => getComputedStyle(action, '::after').content.includes('→'))
          .map((action) => action.textContent.trim());

        return {
          nonLeftHeadings,
          headingsOutsideGutter,
          arrowActions,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        };
      });

      expect(audit.nonLeftHeadings, `${route}: heading alignment`).toEqual([]);
      expect(audit.headingsOutsideGutter, `${route}: 20px heading gutter`).toEqual([]);
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
    const parentStyle = getComputedStyle(element.parentElement);
    const parentContentWidth = element.parentElement.clientWidth
      - parseFloat(parentStyle.paddingLeft)
      - parseFloat(parentStyle.paddingRight);
    return {
      minHeight: style.minHeight,
      borderTopWidth: style.borderTopWidth,
      width: element.getBoundingClientRect().width,
      parentContentWidth
    };
  });
  const actionGeometry = await page.locator('.service-card__actions').first().evaluate((row) => {
    const button = row.querySelector('.text-link');
    return { rowWidth: row.getBoundingClientRect().width, buttonWidth: button.getBoundingClientRect().width };
  });

  expect(sectionPadding).toBe('48px');
  expect(cue.minHeight).toBe('48px');
  expect(cue.borderTopWidth).toBe('1px');
  expect(cue.width).toBeLessThan(cue.parentContentWidth);
  expect(actionGeometry.buttonWidth).toBeLessThan(actionGeometry.rowWidth);

  await page.goto('/kejsy/rost-pryamyh-prodazh/');
  await expect(page.locator('.case-hero')).toHaveCSS('padding-bottom', '0px');

  await page.goto('/poleznoe/');
  await expect(page.locator('.contact-panel')).toHaveCSS('min-height', '0px');
});

test('desktop card actions are centered, bottom-aligned and separated from copy', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/index.html');

  const geometry = await page.evaluate(() => {
    const gapAfterPrevious = (cue) => cue.getBoundingClientRect().top - cue.previousElementSibling.getBoundingClientRect().bottom;
    const projectCues = [...document.querySelectorAll('.project-card .card-link-cue')];
    const projectBottoms = projectCues.map((cue) => Math.round(cue.getBoundingClientRect().bottom));
    const projectStyles = projectCues.map((cue) => {
      const style = getComputedStyle(cue);
      return { display: style.display, alignItems: style.alignItems, justifyContent: style.justifyContent };
    });

    return {
      projectBottoms,
      projectStyles,
      serviceGaps: [...document.querySelectorAll('.service-card .card-link-cue')].map(gapAfterPrevious),
      insightGaps: [...document.querySelectorAll('.insight-card .card-link-cue')].map(gapAfterPrevious)
    };
  });

  expect(Math.max(...geometry.projectBottoms) - Math.min(...geometry.projectBottoms)).toBeLessThanOrEqual(1);
  expect(geometry.projectStyles).toEqual(geometry.projectStyles.map(() => ({ display: 'flex', alignItems: 'center', justifyContent: 'center' })));
  expect(Math.min(...geometry.serviceGaps)).toBeGreaterThanOrEqual(12);
  expect(Math.min(...geometry.insightGaps)).toBeGreaterThanOrEqual(12);
});

test('detail hero images fill their complete frames at every target width', async ({ page }) => {
  const detailRoutes = [
    '/service.html',
    '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/',
    '/poleznoe/materialy/chek-list-audita-prodazh/'
  ];

  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of detailRoutes) {
      await page.goto(route);
      const media = await page.locator('.detail-hero__grid .image-frame').evaluate((frame) => {
        const image = frame.querySelector('img');
        return {
          frameHeight: frame.getBoundingClientRect().height,
          imageHeight: image.getBoundingClientRect().height,
          objectFit: getComputedStyle(image).objectFit
        };
      });
      expect(Math.abs(media.frameHeight - media.imageHeight), `${route} at ${width}px`).toBeLessThanOrEqual(1);
      expect(media.objectFit).toBe('cover');
    }
  }
});

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
  expect(cues.every((cue) => cue.display === 'inline-flex' && cue.alignItems === 'center' && cue.justifyContent === 'center')).toBe(true);
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
