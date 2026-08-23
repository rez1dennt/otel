import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const pages = {
  'index.html': 'Продажи отеля работают как система',
  'services.html': 'Услуги по развитию продаж отеля',
  'service.html': 'Аудит системы продаж отеля',
  'about.html': 'О проекте',
  'projects.html': 'Кейсы',
  'project.html': 'Как устроен кейс',
  'blog.html': 'Полезное',
  'article.html': 'Как провести аудит продаж отеля',
  'contacts.html': 'Контакты',
  'privacy.html': 'Политика конфиденциальности',
  'consent.html': 'Согласие на обработку персональных данных',
  'cookies.html': 'Политика использования Cookie',
  '404.html': 'Страница не найдена'
};

const marketingPages = [
  'index.html',
  'services.html',
  'service.html',
  'about.html',
  'projects.html',
  'project.html',
  'blog.html',
  'article.html',
  'contacts.html'
];

for (const [file, heading] of Object.entries(pages)) {
  test(`${file} contains the shared semantic contract`, async () => {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<html lang="ru">/);
    assert.equal((html.match(/<main[\s>]/g) || []).length, 1);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, new RegExp(heading));
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.match(html, /<meta property="og:type" content="(?:website|article)">/);
    assert.match(html, /<meta property="og:url" content="https:\/\/example\.ru\/[^"]*">/);
    assert.match(html, /<meta property="og:image" content="https:\/\/example\.ru\/assets\/images\/hero-hotel\.webp">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/example\.ru\/[^"]*">/);
    assert.match(html, /assets\/css\/styles\.css/);
    assert.match(html, /assets\/js\/main\.js/);
    assert.match(html, /rel="manifest" href="site\.webmanifest"/);
    assert.match(html, /privacy\.html/);
    assert.match(html, /consent\.html/);
    assert.match(html, /cookies\.html/);
    assert.match(html, /class="skip-link" href="#main-content"/);
    assert.match(html, /<main[^>]*id="main-content"/);
  });
}

test('design tokens preserve the reference palette', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  for (const color of ['#F2F1EF', '#FAF9F7', '#2D281D', '#66635B', '#3E4136', '#8B745F', '#D0C5B8', '#BABCC1', '#C9B3A4']) {
    assert.match(css.toUpperCase(), new RegExp(color));
  }
  assert.doesNotMatch(css.toUpperCase(), /#000000|#FFFFFF/);
});

for (const file of Object.keys(pages)) {
  test(`${file} contains cookie controls`, async () => {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /data-cookie-banner/);
    assert.match(html, /data-cookie-accept/);
    assert.match(html, /data-cookie-reject/);
    assert.match(html, /data-cookie-settings/);
    assert.match(html, /data-cookie-reopen/);
    assert.match(html, /data-cookie-accept>Принять все</);
    assert.match(html, /Аналитические Cookie/);
  });
}

for (const file of marketingPages) {
  test(`${file} contains the shared lead dialog`, async () => {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /data-modal-open/);
    assert.match(html, /data-modal[^-]/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /data-lead-form/);
    assert.match(html, /<label for="lead-name/);
    assert.match(html, /<label for="lead-email/);
    assert.match(html, /<label for="lead-phone/);
    assert.match(html, /href="consent\.html"/);
    assert.match(html, /href="privacy\.html"/);
    assert.match(html, /name="message"/);
    assert.match(html, /name="phone" type="tel" autocomplete="tel"/);
    assert.match(html, /name="email" type="email" autocomplete="email"/);
    assert.match(html, /Форма демонстрационная/);
    assert.match(html, /data-menu-toggle/);
    assert.match(html, /data-mobile-menu/);
    assert.match(html, /site-footer--full/);
  });
}

test('homepage contains accessible FAQ controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /data-accordion-button/);
  assert.match(html, /aria-controls="[^"]*faq-/);
});

test('browser module graph uses JavaScript MIME-compatible extensions', async () => {
  const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /from '\.\/core\.js'/);
});

test('homepage contains the complete conversion path', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['services', 'situations', 'process', 'projects', 'about', 'insights', 'faq', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.equal((html.match(/data-service-offer/g) || []).length, 4);
  assert.ok((html.match(/data-process-step/g) || []).length >= 4);
  assert.ok((html.match(/data-project-card/g) || []).length >= 3);
  assert.ok((html.match(/data-article-card/g) || []).length >= 3);
  assert.ok((html.match(/data-accordion-button/g) || []).length >= 4);
  assert.match(html, /Пример структуры кейса/);
  assert.match(html, /Моя миссия/i);
});

test('homepage benefit icons use one aligned icon system', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  for (const icon of ['chart', 'system', 'check']) {
    assert.match(html, new RegExp(`data-benefit-icon="${icon}"`));
  }
  assert.equal((html.match(/data-benefit-icon=/g) || []).length, 3);
  assert.match(css, /\.benefit-card__icon svg,[\s\S]*?stroke-width:\s*1\.75;/);
});

test('reveal motion progressively enhances visible content', async () => {
  const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(main, /document\.documentElement\.classList\.add\('js'\)/);
  assert.match(css, /\.js \[data-reveal\]/);
});

test('detail pages contain breadcrumbs', async () => {
  for (const file of ['service.html', 'project.html', 'article.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /data-breadcrumb/);
    assert.match(html, /aria-label="Хлебные крошки"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
  }
});

test('listing pages contain complete card sets', async () => {
  const services = await readFile(new URL('../services.html', import.meta.url), 'utf8');
  const projects = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
  const blog = await readFile(new URL('../blog.html', import.meta.url), 'utf8');
  assert.equal((services.match(/data-service-offer/g) || []).length, 4);
  assert.ok((projects.match(/data-project-link/g) || []).length >= 3);
  assert.ok((blog.match(/data-article-link/g) || []).length >= 3);
});

test('contacts page contains a labeled lead form', async () => {
  const html = await readFile(new URL('../contacts.html', import.meta.url), 'utf8');
  assert.match(html, /data-contact-form/);
  assert.match(html, /<label for="contact-name/);
  assert.match(html, /<label for="contact-email/);
  assert.match(html, /<label for="contact-phone/);
});

test('article page links to two related materials', async () => {
  const html = await readFile(new URL('../article.html', import.meta.url), 'utf8');
  assert.ok((html.match(/data-related-material/g) || []).length >= 2);
});

test('mobile detail grid can shrink below content intrinsic width', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.detail-hero__grid\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test('legal pages use confirmed operator details', async () => {
  for (const file of ['privacy.html', 'consent.html', 'cookies.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /ИП Погорила Виталина Петровна/);
    assert.match(html, /502745335560/);
    assert.match(html, /325774600286352/);
  }
});

test('technical SEO files expose every public page', async () => {
  const robots = await readFile(new URL('../robots.txt', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const manifest = await readFile(new URL('../site.webmanifest', import.meta.url), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/example\.ru\/sitemap\.xml/);
  for (const file of Object.keys(pages).filter((file) => file !== '404.html')) {
    const path = file === 'index.html' ? '' : file;
    assert.match(sitemap, new RegExp(`https://example\\.ru/${path}`));
  }
  assert.match(manifest, /"theme_color"\s*:\s*"#F2F1EF"/);
});

test('key content types include structured data', async () => {
  for (const file of ['index.html', 'service.html', 'project.html', 'article.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /application\/ld\+json/);
    assert.match(html, /"@context"\s*:\s*"https:\/\/schema\.org"/);
  }
});

test('base layout can reflow below 320 pixels without a forced minimum', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /body\s*\{[^}]*min-width:\s*0;/s);
});

test('footer action buttons meet the 24 pixel target minimum', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.footer-contact button,[\s\S]*?\.footer-bottom button\s*\{[^}]*min-height:/);
});

test('all local links and images resolve to project files', async () => {
  for (const file of Object.keys(pages)) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const references = [
      ...[...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
      ...[...html.matchAll(/src="([^"]+)"/g)].map((match) => match[1])
    ];
    for (const reference of references) {
      if (/^(?:https?:|mailto:|tel:|#)/.test(reference)) continue;
      const localPath = reference.split('#')[0];
      if (!localPath) continue;
      await access(new URL(`../${localPath}`, import.meta.url));
    }
  }
});

test('structured data blocks contain valid JSON', async () => {
  for (const file of ['index.html', 'service.html', 'project.html', 'article.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length > 0);
    for (const block of blocks) assert.doesNotThrow(() => JSON.parse(block[1]));
  }
});

test('navigation links keep accessible targets and remain available without a menu toggle', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.site-nav a\s*\{[^}]*min-height:/s);
  assert.match(css, /@media \(max-width: 64rem\)[\s\S]*?\.site-nav\s*\{[^}]*display:\s*flex/);
});

test('mobile navigation is hidden only after JavaScript enhancement', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.js \.site-header:has\(\.menu-toggle\) \.site-nav\s*\{\s*display:\s*none/);
});

test('opening a modal from the mobile menu closes and synchronizes the menu', async () => {
  const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /closeMenu\(\{ restoreFocus: false \}\)/);
  assert.match(main, /returnTarget/);
});

test('shared navigation marks the current page at runtime', async () => {
  const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /function setupCurrentNavigation\(\)/);
});

test('shared navigation uses the client information architecture', async () => {
  for (const file of Object.keys(pages)) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const label of ['О проекте', 'Услуги', 'Кейсы', 'Полезное', 'Контакты']) {
      assert.match(html, new RegExp(`>${label}<`), `${file}: ${label}`);
    }
  }
});

test('public contact details are consistent', async () => {
  for (const file of marketingPages) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /tel:\+79065039428/);
    assert.match(html, /vitalinapogorila@yandex\.ru/i);
  }
});

test('services present the four confirmed offers', async () => {
  const html = await readFile(new URL('../services.html', import.meta.url), 'utf8');
  const offers = [
    'Аудит системы продаж',
    'Индивидуальная консультация',
    'Ведение внешних каналов продаж',
    'Ведение прямых каналов продаж'
  ];
  for (const offer of offers) assert.match(html, new RegExp(offer));
  assert.equal((html.match(/data-service-offer/g) || []).length, 4);
});

test('project page contains the confirmed mission and biography anchors', async () => {
  const html = await readFile(new URL('../about.html', import.meta.url), 'utf8');
  assert.match(html, /увеличивать доход и выручку отелей/i);
  assert.match(html, /2013/);
  assert.match(html, /коммерческ(?:ий|ого|им) директор/i);
  assert.match(html, /HLB/);
  assert.match(html, /Коммерсантъ/);
});

test('service pages expose both approved conversion actions', async () => {
  for (const file of ['services.html', 'service.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /Оставить заявку/);
    assert.match(html, /Записаться на бесплатную консультацию/);
    assert.match(html, /data-modal-title/);
    assert.match(html, /data-modal-description/);
  }
});

test('mobile menu exposes three animated strokes and an open class contract', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const js = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  const core = await readFile(new URL('../assets/js/core.js', import.meta.url), 'utf8');
  assert.equal((html.match(/menu-toggle__line/g) || []).length, 3);
  assert.match(css, /menu-toggle\[aria-expanded="true"\]/);
  assert.match(css, /\.mobile-menu\.is-open/);
  assert.match(`${js}\n${core}`, /Закрыть меню/);
});

test('mobile menu covers the viewport and enters from right to left', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const closedRule = css.match(/\.mobile-menu\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const openRule = css.match(/\.mobile-menu\.is-open\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  assert.match(closedRule, /inset:\s*0;/);
  assert.match(closedRule, /border:\s*0;/);
  assert.match(closedRule, /border-radius:\s*0;/);
  assert.match(closedRule, /translate:\s*100% 0;/);
  assert.match(closedRule, /background:\s*var\(--color-surface\);/);
  assert.match(openRule, /translate:\s*0 0;/);
});

test('FAQ and companion card have independent animated layout contracts', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const js = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  assert.match(css, /\.final-grid\s*\{[^}]*align-items:\s*start/s);
  assert.match(css, /\.accordion__panel\.is-open/);
  assert.doesNotMatch(js, /panel\.hidden\s*=\s*expanded/);
});

test('marketing pages end with relevant FAQ controls', async () => {
  for (const file of marketingPages) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.ok((html.match(/data-accordion-button/g) || []).length >= 3, file);
  }
});

test('lead dialog avoids an internal scrolling panel', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const panelRule = css.match(/\.modal__panel\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  assert.doesNotMatch(panelRule, /overflow:\s*auto/);
  assert.match(css, /\.modal\s*\{[^}]*overflow-y:\s*auto/s);
});

test('Cookie settings use the shared button system', async () => {
  for (const file of Object.keys(pages)) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<button class="button button--ghost"[^>]*data-cookie-settings/);
    assert.match(html, /<div class="cookie-options"[^>]*data-cookie-options/);
  }
});

test('text-only service card opts out of the image-card row template', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(html, /service-card--text/);
  assert.match(css, /\.service-card--text\s*\{[^}]*grid-template-rows:\s*1fr/s);
  assert.match(css, /\.service-card--text\s*\{[^}]*grid-column:\s*span 2/s);
});

test('contact layout uses bounded typography and safe wrapping', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.contact-details > a[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(css, /\.contact-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*0\.7fr\)\s+minmax\(0,\s*1\.3fr\)/s);
});

test('mobile hero type stays compact enough for narrow screens', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.hero h1\s*\{[^}]*max-width:\s*11ch;[^}]*font-size:\s*clamp\(2\.5rem,\s*11vw,\s*3\.25rem\)/s);
});

test('mobile modal removes empty error rows and uses compact density', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-error-for\]:empty\s*\{\s*display:\s*none;/);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.modal__panel h2\s*\{[^}]*font-size:\s*var\(--text-2xl\)/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\[data-lead-form\]\s*\{[^}]*gap:\s*var\(--space-2\)/s);
});
