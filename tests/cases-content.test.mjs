import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIR, '..');

async function loadCaseModule() {
  return import('../scripts/generate-case-content.mjs');
}

test('case content exposes seven unique publishable records', async () => {
  const { loadCases, validateCases } = await loadCaseModule();
  const cases = validateCases(await loadCases(PROJECT_ROOT));

  assert.equal(cases.length, 7);
  assert.equal(new Set(cases.map((item) => item.seedId)).size, 7);
  assert.equal(new Set(cases.map((item) => item.slug)).size, 7);
  assert.deepEqual(
    cases.filter((item) => item.featuredRank > 0).map((item) => item.featuredRank),
    [1, 2, 3]
  );
});

test('case metrics preserve every approved numeric claim', async () => {
  const { loadCases, validateCases } = await loadCaseModule();
  const cases = validateCases(await loadCases(PROJECT_ROOT));
  const metrics = Object.fromEntries(
    cases.map((item) => [item.slug, item.metrics.map((metric) => metric.value)])
  );

  assert.deepEqual(metrics['perezagruzka-zagorodnogo-otelya'], ['+20%', '+25%']);
  assert.deepEqual(metrics['antikrizisnaya-strategiya-individualnoe-razmeshchenie-b2b'], ['75%', '100%']);
  assert.deepEqual(metrics['premialnyj-otel-novaya-riga-80-procentov-zagruzki'], ['80%', '+18%']);
  assert.deepEqual(metrics['peresborka-marketinga-gorodskogo-otelya'], ['4 месяца', '+50%', '+4%', '+12%']);
  assert.deepEqual(metrics['zapusk-novogo-korpusa-na-volge'], ['37 → 72', '+56%', '+2%', '+10%']);
  assert.deepEqual(metrics['peresborka-digital-i-kanalov-prodazh'], ['+20%', '+3%', '+8%']);
  assert.deepEqual(metrics['perepozicionirovanie-eko-otelya'], ['15 → 30', '+30%', '+12%', '+7%']);
});

test('case records contain complete editorial and image fields', async () => {
  const { loadCases, validateCases } = await loadCaseModule();
  const cases = validateCases(await loadCases(PROJECT_ROOT));

  for (const item of cases) {
    assert.match(item.seedId, /^case-[1-7]$/);
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(item.title.length >= 20, `${item.slug} title`);
    assert.ok(item.excerpt.length >= 60, `${item.slug} excerpt`);
    assert.ok(item.context.length >= 80, `${item.slug} context`);
    assert.ok(item.task.length >= 40, `${item.slug} task`);
    assert.ok(item.steps.length >= 3, `${item.slug} steps`);
    assert.ok(item.metrics.length >= 2, `${item.slug} metrics`);
    assert.ok(item.conclusion.length >= 60, `${item.slug} conclusion`);
    assert.match(item.fallbackImage, /^assets\/images\/[a-z0-9-]+\.webp$/);
  }
});

test('case renderer builds semantic cards and one complete detail main', async () => {
  const {
    loadCases,
    validateCases,
    renderCaseCard,
    renderCasePageMain
  } = await loadCaseModule();
  const [caseRecord] = validateCases(await loadCases(PROJECT_ROOT));

  const card = renderCaseCard(caseRecord, 'featured');
  assert.match(card, /class="project-card project-card--lead"/);
  assert.match(card, /href="\/kejsy\/perezagruzka-zagorodnogo-otelya\/"/);
  assert.match(card, /<h3>Перезагрузка загородного отеля<\/h3>/);
  assert.match(card, /\+20%/);

  const main = renderCasePageMain(caseRecord);
  assert.equal((main.match(/<main\b/g) ?? []).length, 1);
  assert.equal((main.match(/<h1\b/g) ?? []).length, 1);
  assert.match(main, /id="context"/);
  assert.match(main, /id="task"/);
  assert.match(main, /id="work"/);
  assert.match(main, /id="result"/);
  assert.match(main, /data-modal-title="Обсудить задачу отеля"/);
});

test('static build publishes every case and replaces homepage and archive markers', async () => {
  const { loadCases, validateCases } = await loadCaseModule();
  const cases = validateCases(await loadCases(PROJECT_ROOT));
  const home = await readFile(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
  const archive = await readFile(path.join(PROJECT_ROOT, 'kejsy', 'index.html'), 'utf8');

  assert.match(home, /<!-- forma:featured-cases:start -->/);
  assert.match(home, /<!-- forma:featured-cases:end -->/);
  assert.match(archive, /<!-- forma:case-cards:start -->/);
  assert.match(archive, /<!-- forma:case-cards:end -->/);
  assert.match(home, /<!-- forma:featured-cases:start --><div class="project-grid">[\s\S]*?<\/div><!-- forma:featured-cases:end -->/);
  assert.match(archive, /<!-- forma:case-cards:start --><div class="container project-listing">[\s\S]*?<\/div><!-- forma:case-cards:end -->/);

  for (const item of cases) {
    const html = await readFile(path.join(PROJECT_ROOT, 'kejsy', item.slug, 'index.html'), 'utf8');
    assert.equal((html.match(/<main\b/g) ?? []).length, 1, item.slug);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, item.slug);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://example\\.ru/kejsy/${item.slug}/">`));
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.doesNotMatch(html, /Пример структуры кейса|Шаблон будущего кейса/);
    for (const step of item.steps) assert.match(html, new RegExp(step.title));
    for (const metric of item.metrics) assert.match(html, new RegExp(metric.value.replace(/[+%→]/g, '\\$&')));
  }
});

test('legacy demonstrational case is noindex and points to the real archive', async () => {
  const html = await readFile(
    path.join(PROJECT_ROOT, 'kejsy', 'rost-pryamyh-prodazh', 'index.html'),
    'utf8'
  );

  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/example\.ru\/kejsy\/">/);
  assert.match(html, /href="\/kejsy\/"[^>]*>Смотреть реальные кейсы<\/a>/);
});
