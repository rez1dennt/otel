import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_TEXT_FIELDS = [
  'seedId',
  'slug',
  'title',
  'excerpt',
  'objectType',
  'product',
  'context',
  'task',
  'conclusion',
  'fallbackImage'
];

function assertText(record, field) {
  if (typeof record[field] !== 'string' || record[field].trim() === '') {
    throw new Error(`Case ${record.slug ?? record.seedId ?? '(unknown)'} requires ${field}`);
  }
}

function assertRepeater(record, field, limit, requiredFields) {
  const rows = record[field];
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > limit) {
    throw new Error(`Case ${record.slug} requires 1-${limit} ${field}`);
  }
  for (const [index, row] of rows.entries()) {
    for (const requiredField of requiredFields) {
      if (typeof row?.[requiredField] !== 'string' || row[requiredField].trim() === '') {
        throw new Error(`Case ${record.slug} ${field}[${index}] requires ${requiredField}`);
      }
    }
  }
}

export async function loadCases(projectRoot) {
  const file = path.join(projectRoot, 'content', 'cases.json');
  return JSON.parse(await readFile(file, 'utf8'));
}

export function validateCases(cases) {
  if (!Array.isArray(cases) || cases.length !== 7) {
    throw new Error('Case content must contain exactly seven initial records');
  }

  const seedIds = new Set();
  const slugs = new Set();
  const orders = new Set();
  const featuredRanks = [];

  for (const record of cases) {
    for (const field of REQUIRED_TEXT_FIELDS) assertText(record, field);
    if (!/^case-[1-7]$/.test(record.seedId)) throw new Error(`Invalid seedId: ${record.seedId}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error(`Invalid slug: ${record.slug}`);
    if (!/^assets\/images\/[a-z0-9-]+\.webp$/.test(record.fallbackImage)) {
      throw new Error(`Invalid fallback image: ${record.fallbackImage}`);
    }
    if (!Number.isInteger(record.menuOrder) || record.menuOrder < 10 || record.menuOrder % 10 !== 0) {
      throw new Error(`Invalid menuOrder for ${record.slug}`);
    }
    if (!Number.isInteger(record.featuredRank) || record.featuredRank < 0 || record.featuredRank > 3) {
      throw new Error(`Invalid featuredRank for ${record.slug}`);
    }

    assertRepeater(record, 'steps', 8, ['title', 'body']);
    assertRepeater(record, 'metrics', 6, ['value', 'label']);

    if (seedIds.has(record.seedId)) throw new Error(`Duplicate seedId: ${record.seedId}`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate slug: ${record.slug}`);
    if (orders.has(record.menuOrder)) throw new Error(`Duplicate menuOrder: ${record.menuOrder}`);
    seedIds.add(record.seedId);
    slugs.add(record.slug);
    orders.add(record.menuOrder);
    if (record.featuredRank > 0) featuredRanks.push(record.featuredRank);
  }

  if (featuredRanks.join(',') !== '1,2,3') {
    throw new Error('Featured case ranks must be unique and ordered 1,2,3');
  }

  return cases;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMetrics(metrics, className = 'case-metrics') {
  return `<ul class="${className}">${metrics.map((metric) => `<li><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></li>`).join('')}</ul>`;
}

export function renderCaseCard(record, variant = 'archive') {
  const url = `/kejsy/${record.slug}/`;
  const image = `/${record.fallbackImage}`;
  const metricList = renderMetrics(record.metrics.slice(0, 3), 'case-card-metrics');
  if (variant === 'featured') {
    const leadClass = record.featuredRank === 1 ? ' project-card--lead' : '';
    return `<a class="project-card${leadClass}" href="${url}" data-project-card data-reveal><div class="image-frame"><img src="${image}" alt="Иллюстрация: ${escapeHtml(record.title)}" width="1200" height="900" loading="lazy"></div><div class="project-card__caption"><span>${escapeHtml(record.objectType)}</span><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.excerpt)}</p>${metricList}<span class="card-link-cue">Смотреть кейс</span></div></a>`;
  }
  return `<a href="${url}" data-project-link><div class="image-frame"><img src="${image}" alt="Иллюстрация: ${escapeHtml(record.title)}" width="1200" height="900" loading="lazy"></div><div><span class="eyebrow">${escapeHtml(record.objectType)}</span><h2>${escapeHtml(record.title)}</h2><p>${escapeHtml(record.excerpt)}</p>${metricList}<span class="card-link-cue">Смотреть кейс</span></div></a>`;
}

function renderFacts(record) {
  const facts = [
    ['Объект', record.objectType],
    ['Продукт', record.product],
    ['Локация', record.location],
    ['Формат', record.format]
  ].filter(([, value]) => typeof value === 'string' && value.trim() !== '');
  return `<dl class="case-facts">${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>`;
}

function renderSteps(steps) {
  return `<ol class="case-steps">${steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></div></li>`).join('')}</ol>`;
}

function renderCaseFaq() {
  return `<section class="section final-section"><div class="container final-grid"><div class="faq-panel" id="faq" aria-labelledby="case-faq-title"><p class="eyebrow">Коротко о главном</p><h2 id="case-faq-title">Часто задаваемые вопросы</h2><div class="accordion"><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="case-faq-1" id="case-faq-1-button">Какие данные показаны в кейсе?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="case-faq-1" role="region" aria-labelledby="case-faq-1-button" aria-hidden="true" hidden><div class="accordion__content"><p>Контекст объекта, задача, выполненные действия и подтверждённые показатели результата.</p></div></div></article><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="case-faq-2" id="case-faq-2-button">Почему не указано название отеля?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="case-faq-2" role="region" aria-labelledby="case-faq-2-button" aria-hidden="true" hidden><div class="accordion__content"><p>Название объекта раскрывается только после отдельного согласования. Факты и показатели можно показать без идентификации отеля.</p></div></div></article><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="case-faq-3" id="case-faq-3-button">Можно обсудить похожую задачу конфиденциально?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="case-faq-3" role="region" aria-labelledby="case-faq-3-button" aria-hidden="true" hidden><div class="accordion__content"><p>Да. Публичная публикация не является условием консультации или проекта.</p></div></div></article></div></div><div class="contact-panel" id="contact" data-reveal><div class="contact-panel__art" aria-hidden="true"></div><div class="contact-panel__content"><p class="eyebrow">Следующий шаг</p><h2>Обсудим задачу вашего отеля</h2><p>Начнём с короткого разговора о ситуации, ограничениях и ожидаемом результате.</p><button class="button button--light" type="button" data-modal-open data-modal-title="Записаться на бесплатную консультацию" data-modal-description="Опишите текущую ситуацию в отеле. На первом разговоре уточним задачу и возможный формат работы.">Записаться на бесплатную консультацию</button><span class="contact-panel__note">Ответим по телефону или электронной почте</span></div></div></div></section>`;
}

export function renderCasePageMain(record) {
  return `<main id="main-content"><nav class="container breadcrumb" aria-label="Хлебные крошки" data-breadcrumb><a href="/index.html">Главная</a><span aria-hidden="true">/</span><a href="/kejsy/">Кейсы</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(record.title)}</span></nav><section class="case-hero"><div class="container"><p class="eyebrow">Кейс · ${escapeHtml(record.objectType)}</p><h1>${escapeHtml(record.title)}</h1><p class="article-lead">${escapeHtml(record.excerpt)}</p>${renderMetrics(record.metrics, 'case-metrics case-metrics--hero')}<div class="image-frame"><img src="/${record.fallbackImage}" alt="Иллюстрация: ${escapeHtml(record.title)}" width="1200" height="900" fetchpriority="high"></div></div></section><section class="section"><div class="container case-grid"><aside><a href="#context"><span>01</span><strong>Контекст</strong></a><a href="#task"><span>02</span><strong>Задача</strong></a><a href="#work"><span>03</span><strong>Что сделали</strong></a><a href="#result"><span>04</span><strong>Результат</strong></a></aside><div>${renderFacts(record)}<section id="context"><p class="eyebrow">Контекст</p><h2>С чего началась работа</h2><p>${escapeHtml(record.context)}</p></section><section id="task"><p class="eyebrow">Задача</p><h2>Что требовалось изменить</h2><p>${escapeHtml(record.task)}</p></section><section id="work"><p class="eyebrow">Что сделали</p><h2>Последовательность решений</h2>${renderSteps(record.steps)}</section><section id="result"><p class="eyebrow">Результат</p><h2>Подтверждённые показатели</h2>${renderMetrics(record.metrics)}<div class="case-conclusion"><span>Вывод</span><p>${escapeHtml(record.conclusion)}</p></div></section><button class="button" type="button" data-modal-open data-modal-title="Обсудить задачу отеля" data-modal-description="Опишите ситуацию. Разберём, какой формат работы подойдёт вашему объекту.">Обсудить задачу отеля</button></div></div></section>${renderCaseFaq()}</main>`;
}

function extractSharedShell(archiveHtml) {
  const header = archiveHtml.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  const footer = archiveHtml.match(/<footer class="site-footer[\s\S]*$/)?.[0];
  if (!header || !footer) throw new Error('Cannot extract the shared static shell from kejsy/index.html');
  return { header, footer };
}

function renderSchema(record) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: record.title,
        description: record.excerpt,
        url: `https://example.ru/kejsy/${record.slug}/`,
        image: `https://example.ru/${record.fallbackImage}`,
        inLanguage: 'ru-RU',
        author: { '@type': 'Person', name: 'Виталина Погорила' }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://example.ru/' },
          { '@type': 'ListItem', position: 2, name: 'Кейсы', item: 'https://example.ru/kejsy/' },
          { '@type': 'ListItem', position: 3, name: record.title, item: `https://example.ru/kejsy/${record.slug}/` }
        ]
      }
    ]
  };
}

function renderCaseDocument(record, shell) {
  const canonical = `https://example.ru/kejsy/${record.slug}/`;
  const schema = JSON.stringify(renderSchema(record)).replaceAll('<', '\\u003c');
  return `<!doctype html>\n<html lang="ru">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="theme-color" content="#F2F1EF">\n  <title>${escapeHtml(record.title)} | Виталина Погорила</title>\n  <meta name="description" content="${escapeHtml(record.excerpt)}">\n  <meta property="og:title" content="${escapeHtml(record.title)} | Виталина Погорила">\n  <meta property="og:description" content="${escapeHtml(record.excerpt)}">\n  <meta property="og:type" content="article">\n  <meta property="og:url" content="${canonical}">\n  <meta property="og:image" content="https://example.ru/${record.fallbackImage}">\n  <link rel="canonical" href="${canonical}">\n  <link rel="manifest" href="/site.webmanifest">\n  <script type="application/ld+json">${schema}</script>\n  <link rel="stylesheet" href="/assets/css/styles.css">\n</head>\n<body>\n  <a class="skip-link" href="#main-content">К содержанию</a>\n  ${shell.header}\n  ${renderCasePageMain(record)}\n  ${shell.footer}`;
}

function renderLegacyCasePage(html) {
  const canonical = 'https://example.ru/kejsy/';
  let next = html.replaceAll(
    'https://example.ru/kejsy/rost-pryamyh-prodazh/',
    canonical
  );
  if (!next.includes('<meta name="robots" content="noindex, follow">')) {
    next = next.replace(
      '<meta charset="utf-8">',
      '<meta name="robots" content="noindex, follow">\n  <meta charset="utf-8">'
    );
  }
  if (!next.includes('>Смотреть реальные кейсы</a>')) {
    next = next.replace(
      '<a class="skip-link" href="#main-content">К содержанию</a>',
      '<a class="skip-link" href="#main-content">К содержанию</a>\n  <a class="legacy-forward button" href="/kejsy/">Смотреть реальные кейсы</a>'
    );
  }
  return next;
}

export function replaceMarkedRegion(html, marker, content) {
  const start = `<!-- forma:${marker}:start -->`;
  const end = `<!-- forma:${marker}:end -->`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) throw new Error(`Missing ${marker} marker region`);
  return `${html.slice(0, startIndex + start.length)}${content}${html.slice(endIndex)}`;
}

function ensureElementMarker(html, marker, openingTag) {
  if (html.includes(`<!-- forma:${marker}:start -->`)) return html;
  const startIndex = html.indexOf(openingTag);
  if (startIndex < 0) throw new Error(`Cannot find ${openingTag} for ${marker} markers`);

  const divPattern = /<div\b[^>]*>|<\/div>/gi;
  divPattern.lastIndex = startIndex;
  let depth = 0;
  let match;
  while ((match = divPattern.exec(html))) {
    depth += /^<div\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) {
      const endIndex = divPattern.lastIndex;
      return `${html.slice(0, startIndex)}<!-- forma:${marker}:start -->${html.slice(startIndex, endIndex)}<!-- forma:${marker}:end -->${html.slice(endIndex)}`;
    }
  }
  throw new Error(`Cannot find closing div for ${marker} markers`);
}

export async function generateStaticCases({ projectRoot }) {
  const cases = validateCases(await loadCases(projectRoot));
  const homePath = path.join(projectRoot, 'index.html');
  const archivePath = path.join(projectRoot, 'kejsy', 'index.html');
  const legacyPath = path.join(projectRoot, 'kejsy', 'rost-pryamyh-prodazh', 'index.html');
  const home = ensureElementMarker(
    await readFile(homePath, 'utf8'),
    'featured-cases',
    '<div class="project-grid">'
  );
  const archive = ensureElementMarker(
    await readFile(archivePath, 'utf8'),
    'case-cards',
    '<div class="container project-listing">'
  );
  const featured = cases.filter((record) => record.featuredRank > 0);
  const nextHome = replaceMarkedRegion(home, 'featured-cases', featured.map((record) => renderCaseCard(record, 'featured')).join(''));
  const nextArchive = replaceMarkedRegion(archive, 'case-cards', cases.map((record) => renderCaseCard(record, 'archive')).join(''));
  const shell = extractSharedShell(nextArchive);
  const outputs = [];

  await writeFile(homePath, nextHome, 'utf8');
  await writeFile(archivePath, nextArchive, 'utf8');
  await writeFile(legacyPath, renderLegacyCasePage(await readFile(legacyPath, 'utf8')), 'utf8');

  for (const record of cases) {
    const directory = path.join(projectRoot, 'kejsy', record.slug);
    const output = path.join(directory, 'index.html');
    await mkdir(directory, { recursive: true });
    await writeFile(output, renderCaseDocument(record, shell), 'utf8');
    outputs.push(path.relative(projectRoot, output).replaceAll('\\', '/'));
  }

  return outputs;
}

async function main() {
  const scriptPath = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(scriptPath), '..');
  const outputs = await generateStaticCases({ projectRoot });
  process.stdout.write(`Generated ${outputs.length} case pages.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
