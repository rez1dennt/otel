import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertThemeArchiveValid,
  normalizeArchiveEntry,
  validateThemeSource
} from '../scripts/validate-wordpress-theme.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const THEME = path.resolve(TEST_DIR, '../forma-hotel');

test('classic theme shell exposes required files and metadata', async () => {
  for (const file of ['style.css', 'functions.php', 'header.php', 'footer.php', 'index.php']) {
    await access(path.join(THEME, file));
  }

  const style = await readFile(path.join(THEME, 'style.css'), 'utf8');
  assert.match(style, /Theme Name:\s*FORMA Hotel/);
  assert.match(style, /Version:\s*0\.1\.0/);
  assert.match(style, /Requires PHP:\s*8\.1/);
});

test('header and footer expose mandatory WordPress hooks', async () => {
  const header = await readFile(path.join(THEME, 'header.php'), 'utf8');
  const footer = await readFile(path.join(THEME, 'footer.php'), 'utf8');

  assert.match(header, /language_attributes\(\)/);
  assert.match(header, /wp_head\(\)/);
  assert.match(header, /body_class\(\)/);
  assert.match(header, /wp_body_open\(\)/);
  assert.match(header, /wp_nav_menu\(/);
  assert.match(footer, /get_template_part\(\s*'template-parts\/lead-dialog'/);
  assert.match(footer, /get_template_part\(\s*'template-parts\/cookie-controls'/);
  assert.match(footer, /wp_footer\(\)/);
});

test('functions register supports, menu and module assets', async () => {
  const functions = await readFile(path.join(THEME, 'functions.php'), 'utf8');

  assert.match(functions, /add_theme_support\(\s*'title-tag'/);
  assert.match(functions, /register_nav_menus\(/);
  assert.match(functions, /wp_enqueue_scripts/);
  assert.match(functions, /forma-hotel-main/);
  assert.match(functions, /type="module"/);
  assert.match(functions, /forma_replace_demo_urls/);
});

test('fallback index uses shared shell and one main landmark', async () => {
  const index = await readFile(path.join(THEME, 'index.php'), 'utf8');
  assert.match(index, /get_header\(\)/);
  assert.match(index, /<main[^>]*id="main-content"/);
  assert.match(index, /have_posts\(\)/);
  assert.match(index, /get_footer\(\)/);
});

test('activation bootstrap is idempotent and never deletes client content', async () => {
  const setup = await readFile(path.join(THEME, 'inc', 'theme-setup.php'), 'utf8');

  for (const contract of [
    /after_switch_theme/,
    /get_page_by_path/,
    /wp_insert_post/,
    /_wp_page_template/,
    /show_on_front/,
    /page_on_front/,
    /permalink_structure/,
    /wp_create_nav_menu/,
    /wp_update_nav_menu_item/,
    /set_theme_mod/,
    /flush_rewrite_rules/,
    /forma_hotel_bootstrap_errors/,
    /admin_notices/
  ]) {
    assert.match(setup, contract);
  }
  assert.doesNotMatch(setup, /wp_delete_post/);
});

test('theme source is structurally complete and self-contained', async () => {
  const errors = await validateThemeSource(THEME);
  assert.deepEqual(errors, []);
});

test('archive validation rejects an absent candidate with a clear error', async () => {
  const absentCandidate = path.resolve(TEST_DIR, '../.build/missing-forma-hotel.zip');

  await assert.rejects(
    assertThemeArchiveValid(THEME, absentCandidate),
    /candidate ZIP not found/
  );
});

test('archive validation treats Windows ZIP separators as portable paths', () => {
  assert.equal(normalizeArchiveEntry('forma-hotel\\style.css'), 'forma-hotel/style.css');
});

test('build script keeps candidate and final archive as separate gated outputs', async () => {
  const buildScript = await readFile(path.resolve(TEST_DIR, '../build-theme.ps1'), 'utf8');

  assert.match(buildScript, /\[switch\]\$SkipE2E/);
  assert.match(buildScript, /\.build/);
  assert.match(buildScript, /dist/);
  assert.match(buildScript, /Compress-Archive/);
  assert.match(buildScript, /validate-wordpress-theme\.mjs/);
  assert.match(buildScript, /run-playground-e2e\.ps1/);
  assert.match(buildScript, /if \(\$SkipE2E\)/);
});
