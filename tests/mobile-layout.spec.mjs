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
  '/kejsy/perezagruzka-zagorodnogo-otelya/',
  '/poleznoe/',
  '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
  '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/',
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
    '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/',
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

test('case and event layouts keep text, media and actions inside mobile containers', async ({ page }) => {
  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/kejsy/perezagruzka-zagorodnogo-otelya/',
      '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/'
    ]) {
      await page.goto(route);
      const result = await page.evaluate(() => {
        const target = document.querySelector('main .button');
        const frame = document.querySelector('main .image-frame');
        const image = frame?.querySelector('img');
        return {
          textAlign: getComputedStyle(document.querySelector('main h1')).textAlign,
          buttonRight: target?.getBoundingClientRect().right ?? 0,
          viewport: window.innerWidth,
          frameHeight: frame?.getBoundingClientRect().height ?? 0,
          imageHeight: image?.getBoundingClientRect().height ?? 0,
          objectFit: image ? getComputedStyle(image).objectFit : ''
        };
      });

      expect(result.textAlign, `${route}: h1`).toBe('start');
      expect(result.buttonRight, `${route}: CTA`).toBeLessThanOrEqual(result.viewport - 19.5);
      expect(Math.abs(result.frameHeight - result.imageHeight), `${route}: image fill`).toBeLessThanOrEqual(1);
      expect(result.objectFit, `${route}: object fit`).toBe('cover');
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

  expect(cues).toHaveLength(7);
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

test('case listing descriptions stay separated from actions at every target width', async ({ page }) => {
  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/kejsy/');
    const gaps = await page.locator('.project-listing .card-link-cue').evaluateAll((elements) => elements.map((cue) => (
      cue.getBoundingClientRect().top - cue.previousElementSibling.getBoundingClientRect().bottom
    )));
    expect(gaps).toHaveLength(7);
    expect(Math.min(...gaps), `${width}px action gap`).toBeGreaterThanOrEqual(12);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth);
  }
});

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

    expect.soft(metrics.gap, `${width}px hero gap`).toBeGreaterThanOrEqual(20);
    expect.soft({ width: metrics.imageWidth, height: metrics.imageHeight }).toEqual({ width: 1600, height: 1067 });
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  }
});

test('mission quote shares the content left axis at every target width', async ({ page }) => {
  for (const width of [1280, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about.html');

    const metrics = await page.evaluate(() => {
      const panel = document.querySelector('.mission-panel');
      const body = panel.querySelector('p:not(.eyebrow):not(.script-accent)');
      const quote = panel.querySelector('.script-accent');

      return {
        leftDelta: Math.abs(quote.getBoundingClientRect().left - body.getBoundingClientRect().left),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect.soft(metrics.leftDelta, `${width}px quote left axis`).toBeLessThanOrEqual(1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  }
});

test('article typography stays compact on mobile and unchanged on desktop', async ({ page }) => {
  const cases = [
    { width: 320, h1: 32, lead: 18, h2: 28, body: 16 },
    { width: 360, h1: 36, lead: 18, h2: 28, body: 16 },
    { width: 1280, h1: 76.8, lead: 22, h2: 40.96, body: 18 }
  ];

  for (const expected of cases) {
    await page.setViewportSize({ width: expected.width, height: 900 });
    await page.goto('/poleznoe/stati/kak-provesti-audit-prodazh-otelya/');

    const metrics = await page.evaluate(() => {
      const size = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
      return {
        h1: size('.article-header h1'),
        lead: size('.article-lead'),
        h2: size('.article-body h2'),
        body: size('.article-body section > p:not(.eyebrow)'),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect.soft(metrics.h1, `${expected.width}px h1`).toBeCloseTo(expected.h1, 1);
    expect.soft(metrics.lead, `${expected.width}px lead`).toBeCloseTo(expected.lead, 1);
    expect.soft(metrics.h2, `${expected.width}px h2`).toBeCloseTo(expected.h2, 1);
    expect.soft(metrics.body, `${expected.width}px body`).toBeCloseTo(expected.body, 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  }
});
