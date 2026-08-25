import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { BOOTSTRAP_ROUTES, CONTAINER_ROUTES, LEGACY_PATHS, ROUTES } from '../route-manifest.mjs';

const ASSET_DIRS = ['css', 'js', 'images', 'icons'];

function phpString(value) {
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

export function toPhpLiteral(value, indent = 0) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return phpString(value);

  const spacing = ' '.repeat(indent);
  const childSpacing = ' '.repeat(indent + 4);
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array()';
    return `array(\n${value.map((item) => `${childSpacing}${toPhpLiteral(item, indent + 4)},`).join('\n')}\n${spacing})`;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return 'array()';
  return `array(\n${entries.map(([key, item]) => `${childSpacing}${phpString(key)} => ${toPhpLiteral(item, indent + 4)},`).join('\n')}\n${spacing})`;
}

export function extractMain(html) {
  const matches = [...html.matchAll(/<main\b[^>]*>[\s\S]*?<\/main>/gi)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one <main>, found ${matches.length}`);
  }
  return matches[0][0];
}

function extractMetaContent(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const attrs = Object.fromEntries(
      [...tag.matchAll(/([:\w-]+)=(?:"([^"]*)"|'([^']*)')/g)].map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? ''])
    );
    if (attrs[key] === value && typeof attrs.content === 'string') return attrs.content;
  }
  return '';
}

function extractSchemas(html) {
  const schemas = [];
  for (const match of html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      schemas.push(JSON.parse(match[1]));
    } catch (error) {
      throw new Error(`Invalid JSON-LD in source: ${error.message}`);
    }
  }
  return schemas;
}

function normalizedStaticPath(source) {
  return `/${source.replaceAll('\\', '/')}`;
}

function createStaticRouteMap(routes) {
  const map = new Map(LEGACY_PATHS);
  for (const route of routes) {
    const sourcePath = normalizedStaticPath(route.source);
    map.set(sourcePath, route.path);
    if (sourcePath.endsWith('/index.html')) {
      map.set(sourcePath.slice(0, -'index.html'.length), route.path);
    }
  }
  return map;
}

function phpHomeUrl(pathname) {
  return `<?php echo esc_url( home_url( ${phpString(pathname)} ) ); ?>`;
}

function phpThemeUrl(pathname) {
  return `<?php echo esc_url( get_theme_file_uri( ${phpString(pathname)} ) ); ?>`;
}

export function transformMarkup(markup, sourcePath, routes = ROUTES) {
  const routeMap = createStaticRouteMap(routes);
  const base = new URL(normalizedStaticPath(sourcePath), 'https://static.local');

  return markup.replace(/\b(href|src)=("|')([^"']+)\2/gi, (full, attribute, quote, value) => {
    if (/^(?:#|mailto:|tel:|data:|javascript:)/i.test(value)) return full;

    let resolved;
    try {
      resolved = new URL(value, base);
    } catch {
      return full;
    }

    const isStatic = resolved.origin === 'https://static.local';
    const isDemo = resolved.origin === 'https://example.ru';
    if (!isStatic && !isDemo) return full;

    const pathname = resolved.pathname.replace(/\/{2,}/g, '/');
    const suffix = `${resolved.search}${resolved.hash}`;
    if (pathname.startsWith('/assets/')) {
      return `${attribute}="${phpThemeUrl(`${pathname}${suffix}`)}"`;
    }

    const cleanPath = routeMap.get(pathname) ?? (BOOTSTRAP_ROUTES.some((route) => route.path === pathname) ? pathname : null);
    if (cleanPath) return `${attribute}="${phpHomeUrl(`${cleanPath}${suffix}`)}"`;

    if (attribute.toLowerCase() === 'href' && pathname.endsWith('.html')) {
      throw new Error(`No WordPress route mapping for ${value} in ${sourcePath}`);
    }
    return full;
  });
}

function extractOgImagePath(html, sourcePath) {
  const value = extractMetaContent(html, 'property', 'og:image');
  if (!value) return '';
  const resolved = new URL(value, new URL(normalizedStaticPath(sourcePath), 'https://static.local'));
  return resolved.pathname.startsWith('/assets/') ? resolved.pathname : '';
}

export function renderPageTemplate(route, html) {
  const main = transformMarkup(extractMain(html), route.source, ROUTES);
  const meta = {
    description: extractMetaContent(html, 'name', 'description'),
    canonical_path: route.path,
    og_type: extractMetaContent(html, 'property', 'og:type') || 'website',
    og_image: extractOgImagePath(html, route.source)
  };
  const schema = extractSchemas(html);

  return `<?php
/**
 * GENERATED FILE. Edit ${route.source} and rerun the theme generator.
 *
 * Template Name: FORMA Snapshot — ${route.title}
 * Template Post Type: page
 */
$GLOBALS['forma_page_meta'] = ${toPhpLiteral(meta)};
$GLOBALS['forma_page_schema'] = ${toPhpLiteral(schema)};
get_header();
?>
${main}
<?php get_footer(); ?>
`;
}

function renderContainerTemplate(route) {
  return `<?php
/**
 * GENERATED FILE. Technical parent route for nested WordPress pages.
 *
 * Template Name: FORMA Container — ${route.title}
 * Template Post Type: page
 */
wp_safe_redirect( home_url( ${phpString(route.redirectPath)} ), 301 );
exit;
`;
}

function render404Template(html) {
  const route = { source: '404.html', path: '/404/', title: 'Страница не найдена' };
  const main = transformMarkup(extractMain(html), route.source, ROUTES);
  const meta = {
    description: extractMetaContent(html, 'name', 'description'),
    canonical_path: '/404/',
    og_type: 'website',
    og_image: extractOgImagePath(html, route.source)
  };
  return `<?php
/** GENERATED FILE. Edit 404.html and rerun the theme generator. */
$GLOBALS['forma_page_meta'] = ${toPhpLiteral(meta)};
$GLOBALS['forma_page_schema'] = array();
get_header();
?>
${main}
<?php get_footer(); ?>
`;
}

function slugFromPath(route) {
  if (route.path === '/') return 'home';
  return route.path.split('/').filter(Boolean).at(-1);
}

export function renderGeneratedRoutesPhp(routes = BOOTSTRAP_ROUTES) {
  const phpRoutes = routes.map((route) => ({
    path: route.path,
    slug: slugFromPath(route),
    title: route.title,
    parent_path: route.parentPath,
    output: route.output,
    menu_order: route.menuOrder,
    menu_label: route.menuLabel
  }));
  return `<?php
/** GENERATED FILE. Source: wordpress-theme/route-manifest.mjs. */
return ${toPhpLiteral(phpRoutes)};
`;
}

async function listFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(absolute));
    else if (entry.isFile()) output.push(absolute);
  }
  return output.sort();
}

async function hashFile(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function sourceHashes(projectRoot) {
  const files = new Set(ROUTES.map((route) => path.join(projectRoot, route.source)));
  files.add(path.join(projectRoot, '404.html'));
  for (const file of await listFiles(path.join(projectRoot, 'assets'))) files.add(file);
  const hashes = new Map();
  for (const file of [...files].sort()) hashes.set(file, await hashFile(file));
  return hashes;
}

function assertInside(parent, target) {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe generated target: ${target}`);
  }
}

async function copyGeneratedAssets(projectRoot, themeRoot) {
  const targetRoot = path.join(themeRoot, 'assets');
  await mkdir(targetRoot, { recursive: true });
  for (const name of ASSET_DIRS) {
    const source = path.join(projectRoot, 'assets', name);
    const target = path.join(targetRoot, name);
    assertInside(targetRoot, target);
    try {
      const info = await stat(source);
      if (!info.isDirectory()) continue;
    } catch {
      continue;
    }
    await rm(target, { recursive: true, force: true });
    await cp(source, target, { recursive: true, force: true });
  }
}

export async function generateThemeSnapshot({ projectRoot, themeRoot, routes = ROUTES }) {
  const before = await sourceHashes(projectRoot);
  await mkdir(themeRoot, { recursive: true });
  await mkdir(path.join(themeRoot, 'inc'), { recursive: true });
  const generatedFiles = [];

  for (const route of routes) {
    const html = await readFile(path.join(projectRoot, route.source), 'utf8');
    await writeFile(path.join(themeRoot, route.output), renderPageTemplate(route, html), 'utf8');
    generatedFiles.push(route.output);
  }

  for (const route of CONTAINER_ROUTES) {
    await writeFile(path.join(themeRoot, route.output), renderContainerTemplate(route), 'utf8');
    generatedFiles.push(route.output);
  }

  const notFound = await readFile(path.join(projectRoot, '404.html'), 'utf8');
  await writeFile(path.join(themeRoot, '404.php'), render404Template(notFound), 'utf8');
  generatedFiles.push('404.php');

  await writeFile(path.join(themeRoot, 'inc', 'generated-routes.php'), renderGeneratedRoutesPhp(), 'utf8');
  generatedFiles.push('inc/generated-routes.php');

  await copyGeneratedAssets(projectRoot, themeRoot);

  const after = await sourceHashes(projectRoot);
  for (const [file, hash] of before) {
    if (after.get(file) !== hash) throw new Error(`Static source changed during generation: ${file}`);
  }

  return { generatedFiles, sourceHashes: before };
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const scriptDir = path.dirname(modulePath);
  const projectRoot = path.resolve(scriptDir, '../..');
  const themeRoot = path.resolve(scriptDir, '../forma-hotel');
  const result = await generateThemeSnapshot({ projectRoot, themeRoot });
  process.stdout.write(`Generated ${result.generatedFiles.length} WordPress theme files.\n`);
}
