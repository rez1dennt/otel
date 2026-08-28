import assert from 'node:assert/strict';
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
