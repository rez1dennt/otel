import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
