import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertThemeArchiveValid,
  isPortableArchiveEntry,
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
  assert.match(functions, /get_stylesheet_uri\(\)/);

  const style = await readFile(path.join(THEME, 'style.css'), 'utf8');
  assert.match(style, /\.admin-bar\s+\.site-header/);
});

test('lead delivery uses server-only SMTP configuration and protected public AJAX', async () => {
  const modulePath = path.join(THEME, 'inc', 'lead-delivery.php');
  await access(modulePath);

  const functions = await readFile(path.join(THEME, 'functions.php'), 'utf8');
  const source = await readFile(modulePath, 'utf8');

  assert.match(functions, /lead-delivery\.php/);
  assert.match(functions, /wp_localize_script\(/);
  assert.match(functions, /forma_hotel_lead_config\(\)/);
  for (const publicField of ['ajaxUrl', 'nonce', 'action', 'messages']) {
    assert.match(source, new RegExp(`'${publicField}'\\s*=>`));
  }

  for (const contract of [
    /wp_ajax_forma_submit_lead/,
    /wp_ajax_nopriv_forma_submit_lead/,
    /check_ajax_referer\(\s*'forma_submit_lead'/,
    /wp_unslash\(/,
    /sanitize_text_field\(/,
    /sanitize_email\(/,
    /sanitize_textarea_field\(/,
    /esc_url_raw\(/,
    /wp_mail\(/,
    /phpmailer_init/,
    /set_transient\(/,
    /get_transient\(/,
    /FORMA_SMTP_USER/,
    /FORMA_SMTP_PASSWORD/,
    /FORMA_LEAD_RECIPIENT/,
    /smtp\.yandex\.ru/,
    /465/
  ]) assert.match(source, contract);

  assert.doesNotMatch(source, /define\s*\(\s*['"]FORMA_SMTP_PASSWORD['"]/);
});

test('native case editor registers a safe plugin-free content model', async () => {
  const casePostTypePath = path.join(THEME, 'inc', 'case-post-type.php');
  const adminScriptPath = path.join(THEME, 'assets', 'js', 'case-admin.js');
  const adminStylePath = path.join(THEME, 'assets', 'css', 'case-admin.css');
  await access(casePostTypePath);
  await access(adminScriptPath);
  await access(adminStylePath);

  const functions = await readFile(path.join(THEME, 'functions.php'), 'utf8');
  const source = await readFile(casePostTypePath, 'utf8');
  const adminScript = await readFile(adminScriptPath, 'utf8');

  assert.match(functions, /require_once\s+\$forma_case_post_type_file/);
  assert.match(functions, /admin_enqueue_scripts/);
  assert.match(source, /register_post_type\(\s*'forma_case'/);
  assert.match(source, /'public'\s*=>\s*true/);
  assert.match(source, /'has_archive'\s*=>\s*false/);
  assert.match(source, /'show_in_rest'\s*=>\s*true/);
  assert.match(source, /'rewrite'\s*=>\s*array\(\s*'slug'\s*=>\s*'kejsy'/s);
  for (const support of ['title', 'excerpt', 'thumbnail', 'revisions', 'page-attributes']) {
    assert.match(source, new RegExp(`'${support}'`));
  }

  for (const securityContract of [
    /wp_nonce_field/,
    /wp_verify_nonce/,
    /current_user_can\(\s*'edit_post'/,
    /DOING_AUTOSAVE/,
    /sanitize_text_field/,
    /wp_kses/
  ]) assert.match(source, securityContract);

  assert.match(source, /forma_case_steps/);
  assert.match(source, /forma_case_metrics/);
  assert.match(adminScript, /<button type="button"/);
  assert.match(adminScript, /\.focus\(\)/);
  assert.match(adminScript, /data-case-add/);
  assert.match(adminScript, /data-case-remove/);
});

test('case seeds and public templates are dynamic and non-destructive', async () => {
  const bootstrapPath = path.join(THEME, 'inc', 'case-bootstrap.php');
  const contentPath = path.join(THEME, 'inc', 'case-content.php');
  const singlePath = path.join(THEME, 'single-forma_case.php');
  const archivePartPath = path.join(THEME, 'template-parts', 'case-archive.php');
  const homePartPath = path.join(THEME, 'template-parts', 'home-cases.php');
  const cardPartPath = path.join(THEME, 'template-parts', 'case-card.php');
  for (const file of [bootstrapPath, contentPath, singlePath, archivePartPath, homePartPath, cardPartPath]) {
    await access(file);
  }

  const functions = await readFile(path.join(THEME, 'functions.php'), 'utf8');
  const setup = await readFile(path.join(THEME, 'inc', 'theme-setup.php'), 'utf8');
  const bootstrap = await readFile(bootstrapPath, 'utf8');
  const content = await readFile(contentPath, 'utf8');
  const single = await readFile(singlePath, 'utf8');

  assert.match(functions, /case-content\.php/);
  assert.match(functions, /case-bootstrap\.php/);
  assert.match(setup, /forma_seed_cases\(\)/);
  assert.equal((setup.match(/flush_rewrite_rules\(/g) ?? []).length, 1);

  for (const contract of [
    /inc\/data\/cases\.json/,
    /_forma_case_seed_id/,
    /get_posts\(/,
    /'name'\s*=>\s*\$record\['slug'\]/,
    /wp_insert_post\(/,
    /forma_register_case_post_type\(\)/
  ]) assert.match(bootstrap, contract);
  assert.doesNotMatch(bootstrap, /wp_update_post|wp_delete_post|delete_post_meta/);

  assert.match(content, /new WP_Query\(/);
  assert.match(content, /_forma_case_featured_rank/);
  assert.match(content, /get_the_post_thumbnail_url/);
  assert.match(content, /forma_case_single_schema/);
  assert.match(content, /forma_case_archive_schema/);
  assert.match(content, /template_redirect/);
  assert.match(content, /wp_safe_redirect\(\s*home_url\(\s*'\/kejsy\/'/);
  assert.match(content, /\/poleznoe\/meropriyatiya\/prodazhi-otelya-kak-sistema\//);
  assert.match(content, /\/poleznoe\/meropriyatiya\/industriya-gostepriimstva-2026\//);

  assert.match(single, /get_header\(\)/);
  assert.match(single, /forma_case_get_fields/);
  assert.match(single, /<main[^>]*id="main-content"/);
  assert.match(single, /id="context"/);
  assert.match(single, /id="task"/);
  assert.match(single, /id="work"/);
  assert.match(single, /id="result"/);
  assert.match(single, /get_footer\(\)/);
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
    /add_option\(\s*'forma_hotel_bootstrap_lock'/,
    /delete_option\(\s*'forma_hotel_bootstrap_lock'/,
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

test('archive validation rejects Windows-only ZIP separators', () => {
  assert.equal(isPortableArchiveEntry('forma-hotel/style.css'), true);
  assert.equal(isPortableArchiveEntry('forma-hotel\\style.css'), false);
});

test('build script keeps candidate and final archive as separate gated outputs', async () => {
  const buildScript = await readFile(path.resolve(TEST_DIR, '../build-theme.ps1'), 'utf8');

  assert.match(buildScript, /\[switch\]\$SkipE2E/);
  assert.match(buildScript, /\.build/);
  assert.match(buildScript, /dist/);
  assert.match(buildScript, /ZipArchive/);
  assert.match(buildScript, /validate-wordpress-theme\.mjs/);
  assert.match(buildScript, /run-playground-e2e\.ps1/);
  assert.match(buildScript, /if \(\$SkipE2E\)/);
});

test('Playground Blueprint installs the candidate and uses current WP-CLI syntax', async () => {
  const blueprint = JSON.parse(await readFile(path.resolve(TEST_DIR, '../playground/blueprint.json'), 'utf8'));
  const installTheme = blueprint.steps.find((step) => step.step === 'installTheme');
  const wpCli = blueprint.steps.find((step) => step.step === 'wp-cli');
  const config = blueprint.steps.find((step) => step.step === 'defineWpConfigConsts');
  const mailInterceptor = blueprint.steps.find(
    (step) => step.step === 'writeFile' && step.path === '/wordpress/wp-content/mu-plugins/forma-lead-mail-test.php'
  );

  assert.equal(installTheme.themeData.resource, 'bundled');
  assert.equal(installTheme.themeData.path, '/theme.zip');
  assert.equal(installTheme.options.activate, true);
  assert.match(wpCli.command, /^wp\s/);
  assert.equal(config.consts.FORMA_SMTP_USER, 'mailbox@example.test');
  assert.equal(config.consts.FORMA_SMTP_PASSWORD, 'PLAYGROUND_ONLY_APP_PASSWORD');
  assert.equal(config.consts.FORMA_LEAD_RECIPIENT, 'recipient@example.test');
  assert.deepEqual(mailInterceptor.data, {
    resource: 'bundled',
    path: '/lead-mail-test.php'
  });

  const interceptor = await readFile(path.resolve(TEST_DIR, '../playground/lead-mail-test.php'), 'utf8');
  assert.match(interceptor, /pre_wp_mail/);
  assert.match(interceptor, /return true;/);

  const runner = await readFile(path.resolve(TEST_DIR, '../scripts/run-playground-e2e.ps1'), 'utf8');
  assert.match(runner, /--php=8\.1/);
  assert.match(runner, /--workers=6/);
  assert.match(runner, /lead-mail-test\.php/);
});

test('deployment guide keeps SMTP credentials outside the theme', async () => {
  const readme = await readFile(path.resolve(TEST_DIR, '../README.md'), 'utf8');

  assert.match(readme, /FORMA_SMTP_USER/);
  assert.match(readme, /FORMA_SMTP_PASSWORD/);
  assert.match(readme, /FORMA_LEAD_RECIPIENT/);
  assert.match(readme, /APP_PASSWORD_FROM_YANDEX/);
  assert.match(readme, /wp-config\.php/);
  assert.match(readme, /вне темы и Git/i);
});
