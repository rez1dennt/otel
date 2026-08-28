import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';

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

const cleanContentPages = {
  'poleznoe/index.html': 'Полезное',
  'poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html': 'Как провести аудит продаж отеля',
  'poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html': 'Продажи отеля как система',
  'poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html': 'Индустрия гостеприимства',
  'poleznoe/materialy/chek-list-audita-prodazh/index.html': 'Чек-лист аудита продаж отеля',
  'kejsy/index.html': 'Кейсы',
  'kejsy/rost-pryamyh-prodazh/index.html': 'Рост прямых продаж',
  'kejsy/perezagruzka-zagorodnogo-otelya/index.html': 'Перезагрузка загородного отеля',
  'kejsy/antikrizisnaya-strategiya-individualnoe-razmeshchenie-b2b/index.html': 'Антикризисная стратегия: индивидуальное размещение и B2B',
  'kejsy/premialnyj-otel-novaya-riga-80-procentov-zagruzki/index.html': 'Как премиальный отель на Новой Риге вышел на загрузку 80%',
  'kejsy/peresborka-marketinga-gorodskogo-otelya/index.html': 'Пересборка маркетинга городского отеля',
  'kejsy/zapusk-novogo-korpusa-na-volge/index.html': 'Запуск нового корпуса загородного отеля на Волге',
  'kejsy/peresborka-digital-i-kanalov-prodazh/index.html': 'Комплексная пересборка digital и каналов продаж городского отеля',
  'kejsy/perepozicionirovanie-eko-otelya/index.html': 'Перепозиционирование экоотеля через аутентичность и контент'
};

const allPageFiles = [...Object.keys(pages), ...Object.keys(cleanContentPages)];

const cleanPublicPaths = [
  '/poleznoe/',
  '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
  '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/',
  '/poleznoe/materialy/chek-list-audita-prodazh/',
  '/kejsy/',
  '/kejsy/perezagruzka-zagorodnogo-otelya/',
  '/kejsy/antikrizisnaya-strategiya-individualnoe-razmeshchenie-b2b/',
  '/kejsy/premialnyj-otel-novaya-riga-80-procentov-zagruzki/',
  '/kejsy/peresborka-marketinga-gorodskogo-otelya/',
  '/kejsy/zapusk-novogo-korpusa-na-volge/',
  '/kejsy/peresborka-digital-i-kanalov-prodazh/',
  '/kejsy/perepozicionirovanie-eko-otelya/'
];

function projectFileFromReference(pageFile, reference) {
  const path = reference.split(/[?#]/)[0];
  if (!path) return null;
  if (path.startsWith('/')) {
    const relative = path.slice(1);
    return new URL(`../${relative}${path.endsWith('/') ? 'index.html' : ''}`, import.meta.url);
  }
  const pageUrl = new URL(`../${pageFile}`, import.meta.url);
  const resolved = new URL(path, pageUrl);
  if (path.endsWith('/')) return new URL('index.html', resolved);
  return resolved;
}

test('clean URL resolver maps root assets and trailing-slash pages', () => {
  assert.match(projectFileFromReference('index.html', '/assets/css/styles.css').pathname, /assets\/css\/styles\.css$/);
  assert.match(projectFileFromReference('index.html', '/poleznoe/').pathname, /poleznoe\/index\.html$/);
});

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

for (const [file, heading] of Object.entries(cleanContentPages)) {
  test(`${file} exposes the clean content-template contract`, async () => {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<html lang="ru">/);
    assert.equal((html.match(/<main[\s>]/g) || []).length, 1);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, new RegExp(heading));
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/example\.ru\/[^".]+\/">/);
    assert.match(html, /href="\/assets\/css\/styles\.css"/);
    assert.match(html, /src="\/assets\/js\/main\.js"/);
    assert.match(html, /href="\/kejsy\/"/);
    assert.match(html, /href="\/poleznoe\/"/);
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
  assert.match(html, /Перезагрузка загородного отеля/);
  assert.match(html, /Пересборка маркетинга городского отеля/);
  assert.match(html, /Перепозиционирование экоотеля/);
  assert.doesNotMatch(html, /Пример структуры кейса|Шаблон будущего кейса/);
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

test('clean archives link every card to its matching template', async () => {
  const useful = await readFile(new URL('../poleznoe/index.html', import.meta.url), 'utf8');
  const cases = await readFile(new URL('../kejsy/index.html', import.meta.url), 'utf8');

  for (const href of [
    '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
    '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/',
    '/poleznoe/materialy/chek-list-audita-prodazh/'
  ]) assert.match(useful, new RegExp(`href="${href}"`));

  assert.equal((useful.match(/class="insight-card"/g) || []).length, 3);
  assert.match(cases, /href="\/kejsy\/perezagruzka-zagorodnogo-otelya\/"/);
  assert.equal((cases.match(/data-project-link/g) || []).length, 7);
  assert.doesNotMatch(cases, /href="\/kejsy\/rost-pryamyh-prodazh\/"/);
});

test('services page uses equal cards with one bottom-aligned action', async () => {
  const services = await readFile(new URL('../services.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.equal((services.match(/class="cta-row"/g) || []).length, 4);
  assert.match(css, /\.service-listing\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*grid-auto-rows:\s*1fr;/s);
  assert.match(css, /\.service-listing \.listing-card--lead\s*\{[^}]*grid-column:\s*auto;/s);
  assert.match(css, /\.service-listing \.cta-row\s*\{[^}]*width:\s*100%;[^}]*margin-block-start:\s*auto;[^}]*border-block-start:\s*var\(--line-thin\) solid var\(--color-border\)/s);
  assert.match(css, /\.service-listing \.cta-row > :not\(:first-child\)\s*\{[^}]*display:\s*none;/s);
});

test('six-step services process matches the bordered card reference', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.process-section:has\(\.process-list--six\)\s*\{[^}]*background:\s*radial-gradient/s);
  assert.match(css, /\.process-list--six\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*gap:\s*var\(--space-5\)/s);
  assert.match(css, /\.process-list--six li,\s*\.process-list--six li:nth-child\(3n\),\s*\.process-list--six li:nth-child\(n \+ 4\)\s*\{[^}]*min-height:\s*18rem;[^}]*border:\s*var\(--line-thin\) solid var\(--ref-muted\);[^}]*border-radius:\s*var\(--radius-md\)/s);
  assert.match(css, /\.process-list--six li > span\s*\{[^}]*width:\s*var\(--control-md\);[^}]*border-radius:\s*var\(--radius-pill\)/s);
  assert.match(css, /\.process-list--six li::before\s*\{[^}]*linear-gradient\(90deg,\s*var\(--ref-blush\) 0 50%,\s*var\(--ref-muted\) 50% 100%\)/s);
  assert.match(css, /\.process-list--six::after\s*\{[^}]*content:\s*attr\(data-process-summary\);/s);
  assert.equal((css.match(/\.process-list--six li:nth-child\(\d\)::after\s*\{\s*mask-image:\s*url\("\.\.\/icons\/process-/g) || []).length, 6);

  const iconNames = ['conversation', 'document', 'diagnostics', 'solution', 'plan', 'support'];
  for (const name of iconNames) {
    const svg = await readFile(new URL(`../assets/icons/process-${name}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /<svg/);
  }
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

test('article and case examples expose reusable field zones', async () => {
  const article = await readFile(new URL('../poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html', import.meta.url), 'utf8');
  const casePage = await readFile(new URL('../kejsy/rost-pryamyh-prodazh/index.html', import.meta.url), 'utf8');

  for (const id of ['data', 'channels', 'team']) assert.match(article, new RegExp(`id="${id}"`));
  assert.match(article, /"@type":"Article"/);
  assert.ok((article.match(/data-related-material/g) || []).length >= 2);

  for (const id of ['context', 'task', 'work', 'result']) assert.match(casePage, new RegExp(`id="${id}"`));
  assert.match(casePage, /"@type":"CreativeWork"/);
  assert.doesNotMatch(casePage, /\+\d+%|₽|руб(?:\.|лей)/i);
});

test('event and material templates expose distinct field contracts', async () => {
  const event = await readFile(new URL('../poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html', import.meta.url), 'utf8');
  const material = await readFile(new URL('../poleznoe/materialy/chek-list-audita-prodazh/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  for (const field of ['data-event-status', 'data-event-date', 'data-event-format', 'data-event-program']) assert.match(event, new RegExp(field));
  assert.match(event, /Дата будет объявлена/);
  assert.doesNotMatch(event, /"@type":"Event"/);

  for (const field of ['data-material-type', 'data-material-access', 'data-material-format', 'data-material-contents']) assert.match(material, new RegExp(field));
  assert.match(material, /data-modal-open/);
  assert.doesNotMatch(material, /"@type":"Product"/);

  for (const selector of ['content-status', 'content-facts', 'program-list', 'material-preview']) assert.match(css, new RegExp(`\\.${selector}`));
});

test('confirmed Kommersant event exposes exact source facts and schema', async () => {
  const event = await readFile(
    new URL('../poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html', import.meta.url),
    'utf8'
  );
  const legacy = await readFile(
    new URL('../poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/index.html', import.meta.url),
    'utf8'
  );
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const useful = await readFile(new URL('../poleznoe/index.html', import.meta.url), 'utf8');
  const material = await readFile(
    new URL('../poleznoe/materialy/chek-list-audita-prodazh/index.html', import.meta.url),
    'utf8'
  );
  const article = await readFile(
    new URL('../poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html', import.meta.url),
    'utf8'
  );
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  const eventPath = '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/';
  const officialUrl = 'https://events.kommersant.ru/event/industriya-gostepriimstva_26/';

  for (const fact of [
    'Виталина Погорила — спикер',
    '10 сентября 2026 года',
    'Бизнес-центр «Алкон III»',
    'Ленинградский проспект, 34А',
    'УК «ДОМ»',
    'проект «Экоранчо»'
  ]) assert.match(event, new RegExp(fact));

  assert.match(event, new RegExp(officialUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(event, /rel="noopener noreferrer"/);
  assert.match(event, /"@type":"Event"/);
  assert.match(event, /"startDate":"2026-09-10"/);
  assert.match(event, /"eventStatus":"https:\/\/schema\.org\/EventScheduled"/);
  assert.doesNotMatch(event, /"endDate"|"offers"|"price"/);

  assert.match(legacy, /<meta name="robots" content="noindex, follow">/);
  assert.match(legacy, new RegExp(`<link rel="canonical" href="https://example\\.ru${eventPath}">`));
  for (const html of [home, useful, material, article]) assert.match(html, new RegExp(eventPath));
  assert.match(article, /<strong>Индустрия гостеприимства<\/strong>/);
  assert.match(sitemap, new RegExp(`https://example\\.ru${eventPath}`));
  assert.doesNotMatch(sitemap, /prodazhi-otelya-kak-sistema|rost-pryamyh-prodazh/);
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
  const legacyContent = new Set(['blog.html', 'article.html', 'projects.html', 'project.html']);
  for (const file of Object.keys(pages).filter((file) => file !== '404.html' && !legacyContent.has(file))) {
    const path = file === 'index.html' ? '' : file;
    assert.match(sitemap, new RegExp(`https://example\\.ru/${path}`));
  }
  for (const path of cleanPublicPaths) assert.match(sitemap, new RegExp(`https://example\\.ru${path}`));
  for (const file of legacyContent) assert.doesNotMatch(sitemap, new RegExp(file));
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
  for (const file of [...Object.keys(pages), ...Object.keys(cleanContentPages)]) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const references = [
      ...[...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]),
      ...[...html.matchAll(/src="([^"]+)"/g)].map((match) => match[1])
    ];
    for (const reference of references) {
      if (/^(?:https?:|mailto:|tel:|#)/.test(reference)) continue;
      const target = projectFileFromReference(file, reference);
      if (target) await access(target);
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

test('clean detail templates contain valid conditional structured data', async () => {
  const files = Object.keys(cleanContentPages).filter((file) => file !== 'poleznoe/index.html' && file !== 'kejsy/index.html');
  for (const file of files) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length > 0, file);
    for (const block of blocks) assert.doesNotThrow(() => JSON.parse(block[1]), file);
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

test('closing a modal restores focus without moving the page', async () => {
  const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /lastFocused\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);
  assert.match(main, /setDocumentScrollLocked\(false\)/);
  assert.match(main, /behavior:\s*'instant'/);
});

test('closing the mobile menu restores toggle focus without moving the page', async () => {
  const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
  assert.match(main, /toggle\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);
  assert.match(main, /setDocumentScrollLocked\(false\)/);
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

test('shared header exposes Home in desktop and mobile navigation', async () => {
  for (const file of allPageFiles) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const header = html.match(/<header class="site-header">([\s\S]*?)<\/header>/)?.[1];
    assert.ok(header, `${file}: site header`);
    assert.equal((header.match(/href="\/index\.html">Главная<\/a>/g) || []).length, 2, `${file}: Home links`);
    for (const label of ['Главная', 'Услуги', 'О проекте', 'Кейсы', 'Полезное', 'Контакты']) {
      assert.match(header, new RegExp(`>${label}<`), `${file}: ${label}`);
    }
  }
});

test('shared footer contains only the public copyright label', async () => {
  for (const file of allPageFiles) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<span>© 2026 FORMA\.<\/span>/, file);
    assert.doesNotMatch(html, /Рабочая версия сайта/, file);
  }
});

test('shared navigation points to clean content archives', async () => {
  for (const file of [...Object.keys(pages), ...Object.keys(cleanContentPages)]) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /href="\/kejsy\/">Кейсы<\/a>/);
    assert.match(html, /href="\/poleznoe\/">Полезное<\/a>/);
  }
});

test('legacy content pages are noindex and canonicalize to clean URLs', async () => {
  const mapping = {
    'blog.html': '/poleznoe/',
    'article.html': '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/',
    'projects.html': '/kejsy/',
    'project.html': '/kejsy/rost-pryamyh-prodazh/'
  };
  for (const [file, path] of Object.entries(mapping)) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://example\\.ru${path}">`));
  }
});

test('public contact details are consistent', async () => {
  for (const file of marketingPages) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /tel:\+79065039428/);
    assert.match(html, /vitalinapogorila@yandex\.ru/i);
  }
});

test('social controls use logo-only Telegram, MAX and Dzen assets', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const socialLinksRule = css.match(/\.social-links\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(socialLinksRule, /display:\s*flex;/);
  assert.match(socialLinksRule, /width:\s*100%;/);
  assert.match(socialLinksRule, /flex-wrap:\s*wrap;/);
  assert.doesNotMatch(socialLinksRule, /justify-content:/);
  assert.match(css, /\.social-link\s*\{[^}]*width:\s*var\(--control-md\);[^}]*height:\s*var\(--control-md\);[^}]*padding:\s*0;[^}]*font-size:\s*0;/s);
  assert.match(css, /\.social-link::before\s*\{[^}]*display:\s*block;[^}]*width:\s*var\(--space-5\);[^}]*height:\s*var\(--space-5\);[^}]*background-position:\s*center;[^}]*translate:\s*0 var\(--space-1\);/s);
  assert.match(css, /\.social-link:nth-child\(1\)::before\s*\{[^}]*url\("\.\.\/icons\/social-telegram\.svg"\)/s);
  assert.match(css, /\.social-link:nth-child\(2\)::before\s*\{[^}]*url\("\.\.\/icons\/social-max\.svg"\)/s);
  assert.match(css, /\.social-link:nth-child\(3\)::before\s*\{[^}]*url\("\.\.\/icons\/social-dzen\.svg"\)/s);

  for (const name of ['telegram', 'max', 'dzen']) {
    const svg = await readFile(new URL(`../assets/icons/social-${name}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /<svg/);
    assert.doesNotMatch(svg, /<text/);
  }

  for (const file of allPageFiles) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(
      html,
      /<a class="social-link" href="https:\/\/t\.me\/Vitalina_Pogorila" target="_blank" rel="noopener noreferrer" aria-label="Telegram Виталины Погорилы">Telegram<\/a>/,
      `${file} should expose the confirmed Telegram profile`
    );
    assert.match(
      html,
      /<span class="social-link" aria-disabled="true" title="Ссылка будет добавлена">MAX<\/span><span class="social-link" aria-disabled="true" title="Ссылка будет добавлена">Дзен<\/span>/,
      `${file} should keep unconfirmed social profiles inactive`
    );
  }
});

test('contact forms include a bot trap and confirmed messenger guidance', async () => {
  const html = await readFile(new URL('../contacts.html', import.meta.url), 'utf8');

  assert.match(html, /class="form-trap"[^>]*aria-hidden="true"/);
  assert.match(html, /name="website"[^>]*tabindex="-1"[^>]*autocomplete="off"/);
  assert.match(html, /напишите Виталине в Telegram/i);
  assert.doesNotMatch(html, /Ссылки на Telegram и MAX будут добавлены/);
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
  assert.match(css, /\.faq-panel\s*\{[^}]*min-height:\s*0;/s);
  assert.match(css, /\.contact-panel\s*\{[^}]*min-height:\s*42rem;[^}]*position:\s*relative;/s);
  assert.match(css, /\.accordion__panel\s*\{[^}]*grid-template-rows:\s*0fr;[^}]*transition:\s*grid-template-rows var\(--duration-base\)/s);
  assert.match(css, /\.accordion__panel\.is-open\s*\{[^}]*grid-template-rows:\s*1fr;[^}]*visibility:\s*visible;[^}]*opacity:\s*1;/s);
  assert.match(css, /\.accordion__panel > p,\s*\.accordion__content\s*\{[^}]*padding-block-end:\s*0;[^}]*transition:\s*padding-block-end var\(--duration-base\)/s);
  assert.match(css, /\.accordion__panel\.is-open > p,\s*\.accordion__panel\.is-open \.accordion__content\s*\{[^}]*padding-block-end:\s*var\(--space-5\)/s);
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

test('homepage services use a balanced two by two visual card grid', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.equal((html.match(/data-service-card/g) || []).length, 4);
  assert.match(css, /\.service-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.service-card\s*\{[^}]*min-height:\s*25rem;[^}]*grid-template-rows:\s*12rem 1fr/s);
  assert.match(css, /\.service-card--wide,\s*\.service-card--text\s*\{[^}]*grid-column:\s*auto;/s);
  assert.match(css, /\.service-card--text::before\s*\{[^}]*background-image:\s*url\("\.\.\/images\/article-guest-experience\.webp"\)/s);
  assert.match(css, /\.service-card h3\s*\{[^}]*max-width:\s*none;[^}]*text-wrap:\s*pretty;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.service-card\s*\{[^}]*min-height:\s*24rem;[^}]*grid-template-rows:\s*12rem 1fr/s);
});

test('service cards expose one aligned minimalist action row', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.equal((html.match(/class="service-card__actions"/g) || []).length, 4);
  assert.match(css, /\.service-card__body\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0,\s*1fr\) auto auto;[^}]*align-content:\s*stretch;/s);
  assert.match(css, /\.service-card__actions\s*\{[^}]*width:\s*100%;[^}]*border-block-start:\s*var\(--line-thin\) solid var\(--color-border\)/s);
  assert.match(css, /\.service-card__actions > :not\(:first-child\)\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /\.service-card__actions \.text-link\s*\{[^}]*width:\s*max-content;[^}]*min-height:\s*var\(--control-md\);[^}]*padding-inline:\s*var\(--space-4\);[^}]*border-radius:\s*var\(--radius-pill\);[^}]*background:\s*var\(--color-action\);[^}]*color:\s*var\(--color-on-action\);/s);
  assert.match(css, /\.service-card__actions \.text-link::after\s*\{[^}]*content:\s*none;/s);
});

test('navigable cards expose persistent destination cues without duplicating buttons', async () => {
  const home = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const projects = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
  const blog = await readFile(new URL('../blog.html', import.meta.url), 'utf8');

  assert.equal((home.match(/class="card-link-cue"/g) || []).length, 10);
  assert.equal((home.match(/>Подробнее об услуге<\/span>/g) || []).length, 4);
  assert.equal((home.match(/>Смотреть кейс<\/span>/g) || []).length, 3);
  assert.equal((projects.match(/>Смотреть кейс<\/span>/g) || []).length, 3);
  assert.equal((blog.match(/class="card-link-cue"/g) || []).length, 3);
  assert.equal((blog.match(/<a class="insight-card"/g) || []).length, 3);
  assert.doesNotMatch(blog, /<article class="insight-card"/);
});

test('card navigation cues expose desktop, keyboard and touch affordances', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.card-link-cue\s*\{[^}]*display:\s*inline-flex;[^}]*width:\s*max-content;[^}]*max-width:\s*100%;[^}]*min-height:\s*var\(--control-md\);[^}]*justify-self:\s*start;[^}]*padding-inline:\s*var\(--space-4\);[^}]*border:\s*var\(--line-thin\) solid var\(--color-border\);[^}]*border-radius:\s*var\(--radius-pill\);/s);
  assert.match(css, /\.card-link-cue::after\s*\{[^}]*content:\s*none;/s);
  assert.match(css, /\.service-card h3 a::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*content:\s*"";/s);
  assert.match(css, /\.service-card__actions\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/s);
  assert.match(css, /\.service-card:has\(h3 a:focus-visible\)\s*\{[^}]*box-shadow:\s*var\(--focus-ring\);/s);
  assert.match(css, /@media \(hover: hover\)[\s\S]*?:is\(\.service-card, \.insight-card\[href\]\):hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);[^}]*border-color:\s*var\(--color-accent\);[^}]*box-shadow:\s*var\(--shadow-float\);/s);
  assert.match(css, /@media \(hover: hover\)[\s\S]*?\.project-card\[data-reveal\]:hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);[^}]*\}/s);
  assert.doesNotMatch(css, /\.project-card\[data-reveal\]:hover\s*\{[^}]*(?:border-color|box-shadow):/s);
  assert.match(css, /@media \(hover: hover\)[\s\S]*?:is\(\.service-card, \.project-card, \.insight-card\[href\], \.project-listing > a\):hover \.card-link-cue,\s*\.service-card:has\(h3 a:focus-visible\) \.card-link-cue\s*\{[^}]*border-color:\s*var\(--color-action\);[^}]*background:\s*var\(--color-surface-subtle\);[^}]*color:\s*var\(--color-action\);/s);
  assert.match(css, /a:hover \.image-frame img\s*\{[^}]*scale:\s*1\.025;/s);
  assert.match(css, /:is\(\.service-card, \.project-card, \.insight-card\[href\], \.project-listing > a\):active\s*\{[^}]*translate:\s*0 var\(--space-1\);/s);
});

test('wide case rows stay unboxed while material actions share one cue style', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const blog = await readFile(new URL('../blog.html', import.meta.url), 'utf8');

  assert.match(blog, /<a class="insight-card" href="\/poleznoe\/materialy\/chek-list-audita-prodazh\/"[^>]*>[\s\S]*?<span class="card-link-cue">Открыть материал<\/span>[\s\S]*?<\/a>/);
  assert.match(css, /\.insight-card \.card-link-cue\s*\{[^}]*min-height:\s*var\(--control-md\);[^}]*margin-block-end:\s*0;[^}]*padding-inline:\s*var\(--space-4\);[^}]*font-size:\s*var\(--text-xs\);[^}]*letter-spacing:\s*0\.1em;[^}]*text-transform:\s*uppercase;/s);
  assert.match(css, /\.project-listing > a\s*\{[^}]*transition:\s*translate var\(--duration-fast\) var\(--ease-out\);/s);
  assert.doesNotMatch(css, /\.project-listing > a,\s*\.article-listing > a\s*\{[^}]*border:/s);
  assert.match(css, /@media \(hover: hover\)[\s\S]*?\.project-listing > a:hover\s*\{[^}]*translate:\s*0 calc\(var\(--space-1\) \* -1\);/s);
});

test('client photography is used in personal brand sections', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.about-panel__media\s*\{[^}]*background-image:\s*url\("\.\.\/images\/client-home-about\.webp"\)/s);
  assert.match(css, /body:has\(\.mission-panel\) \.page-hero__media\s*\{[^}]*background-image:\s*url\("\.\.\/images\/client-about-hero\.webp"\)/s);
  assert.match(css, /body:has\(\.contact-form\) \.contact-details::before\s*\{[^}]*background-image:\s*url\("\.\.\/images\/client-contact\.webp"\)/s);
});

test('contact layout uses bounded typography and safe wrapping', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.contact-details > a[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(css, /\.contact-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*0\.8fr\)\s+minmax\(0,\s*1\.2fr\)/s);
});

test('shared layout uses sticky header, aligned footer controls and wider contact details', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /html\s*\{[^}]*scroll-padding-top:\s*calc\(var\(--header-height\) \+ var\(--space-4\)\);/s);
  assert.match(css, /\.site-header\s*\{[^}]*position:\s*sticky;[^}]*inset-block-start:\s*0;[^}]*width:\s*100%;[^}]*border-block-end:\s*var\(--line-thin\) solid var\(--color-border\);[^}]*background:\s*var\(--color-page\);/s);
  assert.match(css, /\.footer-bottom > div\s*\{[^}]*align-items:\s*center;/s);
  assert.match(css, /\.footer-bottom > div > :is\(a, button\)\s*\{[^}]*display:\s*inline-flex;[^}]*min-height:\s*var\(--space-8\);[^}]*align-items:\s*center;[^}]*line-height:\s*1;/s);
  assert.match(css, /\.contact-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.8fr\) minmax\(0, 1\.2fr\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.site-header\s*\{[^}]*width:\s*100%;[^}]*padding-inline:\s*var\(--space-5\);/s);
});

test('case template uses compact media and separated stage labels', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.case-grid aside a\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*var\(--space-8\) minmax\(0, 1fr\);[^}]*gap:\s*var\(--space-3\);/s);
  assert.match(css, /\.case-hero \.image-frame\s*\{[^}]*width:\s*min\(100%, 64rem\);[^}]*min-height:\s*0;[^}]*aspect-ratio:\s*8 \/ 5;[^}]*margin-inline:\s*auto;/s);
  assert.doesNotMatch(css, /\.detail-hero__grid \.image-frame,\s*\.case-hero \.image-frame\s*\{[^}]*min-height:\s*22rem;/s);
});

test('related materials use the compact centered grid contract', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.related-materials > div\s*\{[^}]*width:\s*min\(100%, 60rem\);[^}]*margin-inline:\s*auto;/s);
  assert.match(css, /\.related-materials a\s*\{[^}]*min-height:\s*7rem;[^}]*padding:\s*var\(--space-5\);/s);
});

test('case FAQ uses the approved stage question', async () => {
  for (const file of ['project.html', 'kejsy/rost-pryamyh-prodazh/index.html']) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /Какие этапы работы показаны в кейсе\?/);
    assert.doesNotMatch(html, /Что входит в структуру кейса\?/);
  }
});

test('contact section uses a compact bounded layout contract', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.contact-grid\s*\{[^}]*width:\s*min\(calc\(var\(--container\) - \(var\(--space-20\) \* 2\)\), calc\(100% - var\(--space-10\)\)\);[^}]*gap:\s*clamp\(var\(--space-6\), 4vw, var\(--space-10\)\);/s);
  assert.match(css, /\.contact-details\s*\{[^}]*padding:\s*var\(--space-6\);/s);
  assert.match(css, /body:has\(\.contact-form\) \.contact-details::before\s*\{[^}]*height:\s*calc\(\(var\(--space-20\) \* 2\) \+ var\(--space-10\)\);/s);
  assert.match(css, /\.contact-form\s*\{[^}]*padding:\s*clamp\(var\(--space-5\), 3vw, var\(--space-8\)\);/s);
  assert.match(css, /\.contact-form\[data-lead-form\]\s*\{[^}]*gap:\s*var\(--space-2\);[^}]*margin-block-start:\s*0;/s);
  assert.match(css, /\.contact-form\[data-lead-form\] textarea\s*\{[^}]*min-height:\s*var\(--space-16\);/s);
});

test('mobile hero type uses the available content width', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.hero h1\s*\{[^}]*max-width:\s*none;[^}]*font-size:\s*clamp\(2\.5rem,\s*11vw,\s*3\.25rem\)/s);
});

test('mobile headings keep twenty pixel gutters and expand beyond narrow desktop measures', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.container\s*\{[^}]*width:\s*min\(100% - var\(--space-10\),\s*var\(--container\)\)/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.section-heading h2,\s*\.service-card h3\s*\{[^}]*max-width:\s*none;/s);
  assert.match(css, /\.page-hero--split\s*\{[^}]*margin-inline:\s*var\(--space-5\)/s);
  assert.match(css, /\.process-section\s*\{[^}]*margin-inline:\s*var\(--space-5\)/s);
});

test('mobile content headings share one left-aligned axis', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?main :where\(h1, h2, h3\)\s*\{[^}]*width:\s*100%;[^}]*text-align:\s*start;[^}]*text-wrap:\s*pretty;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.page-hero__center\s*\{[^}]*width:\s*min\(100% - var\(--space-10\), var\(--container\)\);[^}]*justify-items:\s*start;[^}]*margin-inline:\s*auto;[^}]*text-align:\s*start;/s);
});

test('mobile sections use the compact shared vertical rhythm', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.section,\s*\.section--compact\s*\{[^}]*padding-block:\s*var\(--space-12\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.case-hero\s*\{[^}]*padding-block:\s*var\(--space-10\) 0;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.related-materials\s*\{[^}]*padding-block-end:\s*var\(--space-16\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.faq-panel,\s*\.contact-panel\s*\{[^}]*padding:\s*var\(--space-6\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.contact-panel\s*\{[^}]*min-height:\s*0;/s);
});

test('mobile final panels use a zero-minimum grid track', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.final-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s);
});

test('process summary keeps Russian copy in HTML instead of CSS', async () => {
  const html = await readFile(new URL('../services.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(html, /data-process-summary="Прозрачно на каждом этапе — вы всегда знаете, что происходит и на каком мы этапе\."/);
  assert.match(css, /\.process-list--six::after\s*\{[^}]*content:\s*attr\(data-process-summary\);/s);
  assert.doesNotMatch(css, /content:\s*"Прозрачно на каждом этапе/);
});

test('biography timeline reserves the intrinsic label width', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.bio-timeline article\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-20\), max-content\) minmax\(0, 1fr\);/s);
  assert.doesNotMatch(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.bio-timeline article\s*\{[^}]*grid-template-columns:\s*4rem minmax\(0, 1fr\);/s);
});

test('mobile Cookie banner uses compact touch-safe density', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-banner\s*\{[^}]*inset-inline:\s*var\(--space-2\);[^}]*width:\s*calc\(100% - var\(--space-4\)\);[^}]*gap:\s*var\(--space-3\);[^}]*padding:\s*var\(--space-4\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-banner__actions\s*\{[^}]*gap:\s*var\(--space-2\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-banner \.button\s*\{[^}]*min-height:\s*var\(--control-md\);[^}]*padding-inline:\s*var\(--space-4\);[^}]*font-size:\s*var\(--text-xs\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.cookie-options__inner\s*\{[^}]*gap:\s*var\(--space-3\);[^}]*padding-block-start:\s*var\(--space-3\);/s);
});

test('lead modal uses compact density on desktop and mobile', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-error-for\]:empty\s*\{\s*display:\s*none;/);
  assert.match(css, /\.modal\s*\{[^}]*padding:\s*var\(--space-3\);[^}]*overflow-y:\s*auto;/s);
  assert.match(css, /\.modal__panel\s*\{[^}]*width:\s*min\(100%,\s*30rem\);[^}]*padding:\s*var\(--space-6\)/s);
  assert.match(css, /\.modal__panel h2\s*\{[^}]*max-width:\s*none;[^}]*margin-block-end:\s*var\(--space-2\);[^}]*font-size:\s*var\(--text-2xl\)/s);
  assert.match(css, /\.modal \[data-lead-form\]\s*\{[^}]*gap:\s*var\(--space-2\);[^}]*margin-block-start:\s*var\(--space-3\)/s);
  assert.match(css, /\.modal \[data-lead-form\] input:not\(\[type="checkbox"\]\)\s*\{[^}]*min-height:\s*calc\(var\(--control-md\) - var\(--space-2\)\)/s);
  assert.match(css, /\.modal \[data-lead-form\] textarea\s*\{[^}]*min-height:\s*var\(--space-16\)/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.modal__panel\s*\{[^}]*padding:\s*var\(--space-5\)/s);
});

test('card actions use centered bottom alignment and a twelve pixel content gap', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.project-card\s*\{[^}]*grid-template-rows:\s*auto 1fr;/s);
  assert.match(css, /\.project-card__caption\s*\{[^}]*display:\s*flex;[^}]*height:\s*100%;[^}]*flex-direction:\s*column;/s);
  assert.match(css, /\.project-card \.card-link-cue\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*margin-block-end:\s*0;/s);
  assert.match(css, /\.service-card__body > \.card-link-cue\s*\{[^}]*margin-block-start:\s*var\(--space-3\);/s);
  assert.match(css, /\.insight-card p\s*\{[^}]*margin-block-end:\s*var\(--space-3\);/s);
});

test('detail hero media uses definite responsive block sizes', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.detail-hero__grid \.image-frame\s*\{[^}]*min-height:\s*0;[^}]*block-size:\s*34rem;/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.detail-hero__grid \.image-frame\s*\{[^}]*min-height:\s*0;[^}]*block-size:\s*22rem;/s);
});

test('long event title uses a scoped fit modifier', async () => {
  const event = await readFile(new URL('../poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(event, /class="detail-hero detail-hero--long-title"/);
  assert.match(css, /--detail-long-title-size:\s*clamp\(/);
  assert.match(css, /\.detail-hero--long-title h1\s*\{[^}]*font-size:\s*var\(--detail-long-title-size\);[^}]*text-wrap:\s*balance;/s);
  assert.doesNotMatch(css, /html,\s*body\s*\{[^}]*overflow-x:\s*hidden;/s);
});

test('case listing cues and mobile contact panels use their approved visual contracts', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /\.project-listing \.card-link-cue\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*margin-block-end:\s*0;/s);
  assert.match(css, /--gradient-contact-mobile:\s*radial-gradient\(circle at 100% 100%,[^;]+linear-gradient\(145deg, var\(--ref-olive\), var\(--ref-olive-hover\)\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.contact-panel\s*\{[^}]*background:\s*var\(--gradient-contact-mobile\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.contact-panel__art\s*\{[^}]*display:\s*none;/s);
});

test('case listing descriptions keep a twelve pixel action gap', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.project-listing p\s*\{[^}]*margin-block-end:\s*var\(--space-3\);/s);
});

test('about split hero uses the approved gutter and optimized portrait asset', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
  const asset = await stat(new URL('../assets/images/client-about-hero.webp', import.meta.url));

  assert.match(css, /\.page-hero--split\s*\{[^}]*margin-inline:\s*var\(--space-5\);[^}]*margin-block-start:\s*var\(--space-5\);/s);
  assert.ok(asset.size <= 200 * 1024, `about hero is ${asset.size} bytes`);
});

test('mission quote keeps its visual tokens and aligns from the left', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(
    css,
    /\.mission-panel \.script-accent\s*\{[^}]*max-width:\s*30ch;[^}]*margin:\s*var\(--space-4\) auto 0 0;[^}]*color:\s*var\(--color-accent\);[^}]*font-size:\s*var\(--text-2xl\);[^}]*line-height:\s*1\.45;/s
  );
});

test('mobile article typography uses the compact token scale', async () => {
  const css = await readFile(new URL('../assets/css/styles.css', import.meta.url), 'utf8');

  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-header h1\s*\{[^}]*font-size:\s*clamp\(var\(--text-2xl\), 10vw, var\(--text-display\)\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-lead\s*\{[^}]*font-size:\s*var\(--text-lg\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-body h2\s*\{[^}]*font-size:\s*var\(--text-2xl\);/s);
  assert.match(css, /@media \(max-width: 47\.9375rem\)[\s\S]*?\.article-body p\s*\{[^}]*font-size:\s*var\(--text-base\);/s);
});
