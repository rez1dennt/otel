import { spawnSync } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOTSTRAP_ROUTES, THEME_BUILD } from '../route-manifest.mjs';

const REQUIRED_FILES = [
  'style.css',
  'functions.php',
  'header.php',
  'footer.php',
  'index.php',
  'front-page.php',
  '404.php',
  'inc/generated-routes.php',
  'inc/theme-setup.php',
  'template-parts/lead-dialog.php',
  'template-parts/cookie-controls.php'
];

const FORBIDDEN_SEGMENTS = new Set([
  '.build',
  '.cache',
  '.git',
  'docs',
  'node_modules',
  'scripts',
  'tests'
]);

function normalizeRelative(file) {
  return file.split(path.sep).join('/').replace(/^\.\//, '');
}

export function normalizeArchiveEntry(entry) {
  return entry.replaceAll('\\', '/');
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, absolute));
    } else if (entry.isFile()) {
      files.push(normalizeRelative(path.relative(root, absolute)));
    }
  }

  return files.sort();
}

function styleVersion(style) {
  return style.match(/^\s*Version:\s*([^\r\n]+)/mi)?.[1]?.trim() ?? null;
}

function assetReferences(source) {
  return [...source.matchAll(/get_theme_file_uri\(\s*['"]\/([^'"]+)['"]\s*\)/g)]
    .map((match) => normalizeRelative(match[1]));
}

function forbiddenFile(file) {
  return file.toLowerCase().split('/').some((segment) => FORBIDDEN_SEGMENTS.has(segment));
}

export async function validateThemeSource(themeRoot) {
  const root = path.resolve(themeRoot);
  const errors = [];

  if (!await pathExists(root)) {
    return [`theme source not found: ${root}`];
  }

  const files = await listFiles(root);
  const fileSet = new Set(files);
  const expected = new Set([
    ...REQUIRED_FILES,
    ...BOOTSTRAP_ROUTES.map((route) => normalizeRelative(route.output))
  ]);

  for (const file of expected) {
    if (!fileSet.has(file)) {
      errors.push(`required theme file missing: ${file}`);
    }
  }

  for (const file of files.filter(forbiddenFile)) {
    errors.push(`forbidden source file: ${file}`);
  }

  const stylePath = path.join(root, 'style.css');
  if (fileSet.has('style.css')) {
    const version = styleVersion(await readFile(stylePath, 'utf8'));
    if (version !== THEME_BUILD.version) {
      errors.push(`style.css version ${version ?? '(missing)'} does not match build version ${THEME_BUILD.version}`);
    }
  }

  for (const file of files.filter((candidate) => candidate.endsWith('.php'))) {
    const source = await readFile(path.join(root, ...file.split('/')), 'utf8');
    if (/(?:href|src)=["'][^"']*\.html(?:[?#][^"']*)?["']/i.test(source)) {
      errors.push(`unconverted HTML link in ${file}`);
    }

    for (const asset of assetReferences(source)) {
      if (!fileSet.has(asset)) {
        errors.push(`missing referenced asset ${asset} (from ${file})`);
      }
    }
  }

  return [...new Set(errors)].sort();
}

function inspectZip(zipPath) {
  const escapedZip = path.resolve(zipPath).replaceAll("'", "''");
  const script = [
    '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)',
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    `$archive = [System.IO.Compression.ZipFile]::OpenRead('${escapedZip}')`,
    'try {',
    "  $styleEntry = @($archive.Entries | Where-Object { $_.FullName.Replace('\\', '/') -eq 'forma-hotel/style.css' })[0]",
    '  $styleText = $null',
    '  if ($null -ne $styleEntry) {',
    '    $reader = [System.IO.StreamReader]::new($styleEntry.Open())',
    '    try { $styleText = $reader.ReadToEnd() } finally { $reader.Dispose() }',
    '  }',
    '  [ordered]@{',
    "    entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\\', '/') })",
    '    styleCss = $styleText',
    '  } | ConvertTo-Json -Depth 4 -Compress',
    '} finally {',
    '  $archive.Dispose()',
    '}'
  ].join('\n');
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  const result = spawnSync('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-EncodedCommand',
    encoded
  ], { encoding: 'utf8', windowsHide: true });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || 'PowerShell ZIP inspection failed').trim();
    throw new Error(detail);
  }

  return JSON.parse(result.stdout.trim());
}

export async function validateThemeArchive(themeRoot, zipPath) {
  const root = path.resolve(themeRoot);
  const candidate = path.resolve(zipPath);
  const errors = await validateThemeSource(root);

  if (!await pathExists(candidate)) {
    errors.push(`candidate ZIP not found: ${candidate}`);
    return errors;
  }

  let archive;
  try {
    archive = inspectZip(candidate);
  } catch (error) {
    errors.push(`candidate ZIP cannot be read: ${error.message}`);
    return errors;
  }

  const entries = archive.entries.map(normalizeArchiveEntry);
  const archiveFiles = entries.filter((entry) => !entry.endsWith('/'));
  const archiveSet = new Set(archiveFiles);
  const sourceFiles = await listFiles(root);
  const expectedArchiveFiles = new Set(sourceFiles.map((file) => `${THEME_BUILD.slug}/${file}`));

  for (const entry of entries) {
    if (!entry.startsWith(`${THEME_BUILD.slug}/`)) {
      errors.push(`archive entry is outside ${THEME_BUILD.slug}/: ${entry}`);
    }
    if (entry.startsWith(`${THEME_BUILD.slug}/${THEME_BUILD.slug}/`)) {
      errors.push(`archive contains nested theme directory: ${entry}`);
    }
    if (forbiddenFile(entry.slice(`${THEME_BUILD.slug}/`.length))) {
      errors.push(`forbidden archive entry: ${entry}`);
    }
  }

  for (const expected of expectedArchiveFiles) {
    if (!archiveSet.has(expected)) {
      errors.push(`archive file missing: ${expected}`);
    }
  }

  for (const entry of archiveFiles) {
    if (!expectedArchiveFiles.has(entry)) {
      errors.push(`unexpected archive file: ${entry}`);
    }
  }

  const archivedVersion = styleVersion(archive.styleCss ?? '');
  if (archivedVersion !== THEME_BUILD.version) {
    errors.push(`archive style.css version ${archivedVersion ?? '(missing)'} does not match build version ${THEME_BUILD.version}`);
  }

  return [...new Set(errors)].sort();
}

export async function assertThemeArchiveValid(themeRoot, zipPath) {
  const errors = await validateThemeArchive(themeRoot, zipPath);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const themeRoot = path.resolve(process.argv[2] ?? path.join(scriptDir, '../forma-hotel'));
  const zipPath = process.argv[3] ? path.resolve(process.argv[3]) : null;
  const errors = zipPath
    ? await validateThemeArchive(themeRoot, zipPath)
    : await validateThemeSource(themeRoot);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(zipPath
    ? `Validated WordPress theme source and ZIP: ${zipPath}`
    : `Validated WordPress theme source: ${themeRoot}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
