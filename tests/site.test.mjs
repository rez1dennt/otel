import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const pages = {
  'index.html': 'Гостиничный консалтинг',
  'services.html': 'Услуги гостиничного консалтинга',
  'service.html': 'Концепция и позиционирование',
  'about.html': 'О компании',
  'projects.html': 'Проекты',
  'project.html': 'Проект гостиничного объекта',
  'blog.html': 'Блог',
  'article.html': 'Как провести аудит гостиничного проекта',
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
    assert.match(html, /<link rel="canonical" href="https:\/\/example\.ru\/[^"]*">/);
    assert.match(html, /assets\/css\/styles\.css/);
    assert.match(html, /assets\/js\/main\.js/);
    assert.match(html, /privacy\.html/);
    assert.match(html, /consent\.html/);
    assert.match(html, /cookies\.html/);
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
  });
}

test('homepage contains accessible FAQ controls', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /data-accordion-button/);
  assert.match(html, /aria-controls="faq-/);
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
  assert.ok((html.match(/data-service-card/g) || []).length >= 6);
  assert.ok((html.match(/data-process-step/g) || []).length >= 4);
  assert.ok((html.match(/data-project-card/g) || []).length >= 3);
  assert.ok((html.match(/data-article-card/g) || []).length >= 3);
  assert.ok((html.match(/data-accordion-button/g) || []).length >= 5);
  assert.match(html, /Пример кейса/);
  assert.match(html, /Здесь будет отзыв клиента/);
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
  }
});

test('listing pages contain complete card sets', async () => {
  const services = await readFile(new URL('../services.html', import.meta.url), 'utf8');
  const projects = await readFile(new URL('../projects.html', import.meta.url), 'utf8');
  const blog = await readFile(new URL('../blog.html', import.meta.url), 'utf8');
  assert.ok((services.match(/data-service-link/g) || []).length >= 6);
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
      if (/^(?:https?:|mailto:|#)/.test(reference)) continue;
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
  assert.match(css, /\.site-header:not\(:has\(\.menu-toggle\)\) \.site-nav/);
});
