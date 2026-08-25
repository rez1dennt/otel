import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOTSTRAP_ROUTES, CONTAINER_ROUTES, ROUTES } from '../route-manifest.mjs';
import {
  extractMain,
  generateThemeSnapshot,
  renderPageTemplate,
  transformMarkup
} from '../scripts/generate-wordpress-theme.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIR, '../..');

test('manifest covers every intended public WordPress route', () => {
  assert.equal(ROUTES.length, 14);
  assert.equal(CONTAINER_ROUTES.length, 3);
  assert.equal(new Set(ROUTES.map((route) => route.path)).size, ROUTES.length);
  assert.equal(new Set(BOOTSTRAP_ROUTES.map((route) => route.path)).size, BOOTSTRAP_ROUTES.length);
  assert.ok(BOOTSTRAP_ROUTES.every((route) => route.path.startsWith('/') && route.path.endsWith('/')));
});

test('extractMain returns one complete main landmark', () => {
  assert.equal(
    extractMain('<body><main id="main-content"><h1>A</h1></main></body>'),
    '<main id="main-content"><h1>A</h1></main>'
  );
  assert.throws(() => extractMain('<body></body>'), /exactly one <main>/);
});

test('transformMarkup resolves source-relative assets and clean internal routes', () => {
  const html = '<a href="../../../../services.html">A</a><img src="../../../../assets/images/x.webp">';
  const result = transformMarkup(html, 'poleznoe/stati/x/index.html', ROUTES);
  assert.match(result, /esc_url\( home_url\( '\/uslugi\/' \) \)/);
  assert.match(result, /esc_url\( get_theme_file_uri\( '\/assets\/images\/x\.webp' \) \)/);
});

test('renderPageTemplate wraps generated main with the shared shell', () => {
  const output = renderPageTemplate(
    ROUTES[0],
    '<html><head><title>X</title></head><body><main id="main-content"><h1>X</h1></main></body></html>'
  );
  assert.match(output, /get_header\(\);/);
  assert.match(output, /get_footer\(\);/);
  assert.match(output, /GENERATED FILE/);
});

test('generation preserves static sources and creates every snapshot template', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'forma-theme-generator-'));
  const themeRoot = path.join(workspace, 'forma-hotel');
  try {
    const result = await generateThemeSnapshot({ projectRoot: PROJECT_ROOT, themeRoot });
    assert.equal(result.generatedFiles.length, ROUTES.length + CONTAINER_ROUTES.length + 2);
    for (const route of BOOTSTRAP_ROUTES) {
      assert.ok(result.generatedFiles.includes(route.output));
    }
    const home = await readFile(path.join(themeRoot, 'front-page.php'), 'utf8');
    assert.doesNotMatch(home, /href="[^"]+\.html/);
    assert.doesNotMatch(home, /(?:src|href)="\/?assets\//);
    assert.ok(result.sourceHashes.size > ROUTES.length);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
