import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EVENT_PATH = '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/';
const LEGACY_EVENT_PATH = '/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/';
const OFFICIAL_URL = 'https://events.kommersant.ru/event/industriya-gostepriimstva_26/';

function extractShell(html) {
  const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
  const footer = html.match(/<footer class="site-footer[\s\S]*$/)?.[0];
  if (!header || !footer) throw new Error('Cannot extract shared event shell');
  return { header, footer };
}

function renderEventSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Event',
        name: 'Индустрия гостеприимства',
        description: 'Деловая встреча о развитии гостиничной индустрии, инвестициях, управлении объектами и изменении спроса.',
        startDate: '2026-09-10',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        url: OFFICIAL_URL,
        location: {
          '@type': 'Place',
          name: 'Бизнес-центр «Алкон III»',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Москва',
            streetAddress: 'Ленинградский проспект, 34А',
            addressCountry: 'RU'
          }
        },
        performer: {
          '@type': 'Person',
          name: 'Виталина Погорила',
          jobTitle: 'Коммерческий директор УК «ДОМ», проект «Экоранчо», эксперт в гостиничной индустрии'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://example.ru/' },
          { '@type': 'ListItem', position: 2, name: 'Полезное', item: 'https://example.ru/poleznoe/' },
          { '@type': 'ListItem', position: 3, name: 'Индустрия гостеприимства', item: `https://example.ru${EVENT_PATH}` }
        ]
      }
    ]
  };
}

function renderEventMain() {
  return `<main id="main-content"><nav class="container breadcrumb" aria-label="Хлебные крошки" data-breadcrumb><a href="/index.html">Главная</a><span aria-hidden="true">/</span><a href="/poleznoe/">Полезное</a><span aria-hidden="true">/</span><span aria-current="page">Индустрия гостеприимства</span></nav><section class="detail-hero detail-hero--long-title"><div class="container detail-hero__grid"><div><span class="content-status" data-event-status>Регистрация на сайте организатора</span><p class="eyebrow">Мероприятие · Недвижимость</p><h1>Индустрия гостеприимства</h1><p>Деловая встреча о состоянии гостиничного рынка, инвестициях, управлении объектами и изменении туристического спроса.</p><div class="content-facts"><div><span>Дата</span><strong data-event-date>10 сентября 2026 года</strong></div><div><span>Место</span><strong>Бизнес-центр «Алкон III»<br>Москва, Ленинградский проспект, 34А</strong></div><div><span>Формат</span><strong data-event-format>Очная деловая встреча</strong></div></div><a class="button" href="${OFFICIAL_URL}" target="_blank" rel="noopener noreferrer">Зарегистрироваться на сайте «Коммерсанта»</a></div><div class="image-frame"><img src="/assets/images/about-workspace.webp" alt="Деловая встреча участников гостиничной индустрии" width="1586" height="992" fetchpriority="high"></div></div></section><section class="section"><div class="container event-speaker"><div class="event-speaker__media image-frame"><img src="/assets/images/client-about-hero.webp" alt="Виталина Погорила" width="1150" height="814" loading="lazy"></div><div class="event-speaker__copy"><p class="eyebrow">Спикер</p><h2>Виталина Погорила — спикер</h2><p class="event-speaker__role">Коммерческий директор УК «ДОМ», проект «Экоранчо», эксперт в гостиничной индустрии</p><p>Виталина участвует в профессиональной дискуссии о развитии гостиничных объектов и практических решениях для отрасли.</p></div></div></section><section class="section section--compact"><div class="container detail-layout"><aside class="detail-aside"><span>В программе</span><a href="#topics">Темы встречи</a><a href="#registration">Регистрация</a></aside><div class="detail-content"><section id="topics" data-event-program><p class="eyebrow">О чём будут говорить</p><h2>Рынок, инвестиции и работа гостиничных объектов</h2><ul class="event-topics"><li><strong>Состояние рынка и спрос</strong><span>Как меняется внутренний туризм и какие форматы востребованы в регионах.</span></li><li><strong>Инвестиции и окупаемость</strong><span>Как стоимость строительства и кредитов влияет на сроки возврата вложений.</span></li><li><strong>Санатории и wellness</strong><span>Как обновлять существующие объекты и превращать их в современные курорты.</span></li><li><strong>Апарт-отели</strong><span>Какие модели сохраняют устойчивость при высокой ключевой ставке.</span></li><li><strong>Управление объектами</strong><span>Как выбирать управляющую компанию и оценивать прозрачность её работы.</span></li><li><strong>Сервис и команда</strong><span>Как отрасль отвечает на дефицит сотрудников и новые ожидания гостей.</span></li></ul></section><section id="registration"><p class="eyebrow">Участие</p><h2>Регистрация у организатора</h2><p>Актуальная программа и состав участников опубликованы на странице «Коммерсанта» и могут обновляться организатором.</p><a class="button" href="${OFFICIAL_URL}" target="_blank" rel="noopener noreferrer">Перейти к регистрации</a></section></div></div></section><section class="section final-section"><div class="container final-grid"><div class="faq-panel" id="faq" aria-labelledby="event-faq-title"><p class="eyebrow">Коротко о главном</p><h2 id="event-faq-title">О мероприятии</h2><div class="accordion"><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="event-faq-1" id="event-faq-1-button">Где пройдёт встреча?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="event-faq-1" role="region" aria-labelledby="event-faq-1-button" aria-hidden="true" hidden><div class="accordion__content"><p>В Москве, в бизнес-центре «Алкон III» по адресу: Ленинградский проспект, 34А.</p></div></div></article><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="event-faq-2" id="event-faq-2-button">Где посмотреть изменения программы?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="event-faq-2" role="region" aria-labelledby="event-faq-2-button" aria-hidden="true" hidden><div class="accordion__content"><p>Актуальные сведения публикует организатор на официальной странице мероприятия.</p></div></div></article></div></div><div class="contact-panel" id="contact" data-reveal><div class="contact-panel__art" aria-hidden="true"></div><div class="contact-panel__content"><p class="eyebrow">Следующий шаг</p><h2>Обсудим задачу вашего отеля</h2><p>Если нужен практический разбор продаж, начнём с короткого разговора о текущей ситуации.</p><button class="button button--light" type="button" data-modal-open data-modal-title="Записаться на бесплатную консультацию" data-modal-description="Опишите текущую ситуацию в отеле. На первом разговоре уточним задачу и возможный формат работы.">Записаться на бесплатную консультацию</button><span class="contact-panel__note">Ответим по телефону или электронной почте</span></div></div></div></section></main>`;
}

function renderEventDocument(shell) {
  const canonical = `https://example.ru${EVENT_PATH}`;
  const schema = JSON.stringify(renderEventSchema()).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="ru"><head>\n  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#F2F1EF"><title>Индустрия гостеприимства — 10 сентября 2026 | Виталина Погорила</title>\n  <meta name="description" content="Виталина Погорила выступит на деловой встрече «Индустрия гостеприимства» 10 сентября 2026 года в Москве."><meta property="og:title" content="Индустрия гостеприимства — 10 сентября 2026"><meta property="og:description" content="Деловая встреча о гостиничном рынке, инвестициях и управлении объектами."><meta property="og:type" content="event"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://example.ru/assets/images/client-about-hero.webp"><link rel="canonical" href="${canonical}"><link rel="manifest" href="/site.webmanifest"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/styles.css">\n</head><body>\n  <a class="skip-link" href="#main-content">К содержанию</a>\n  ${shell.header}\n  ${renderEventMain()}\n  ${shell.footer}`;
}

function renderLegacyEvent(html) {
  let next = html.replaceAll(`https://example.ru${LEGACY_EVENT_PATH}`, `https://example.ru${EVENT_PATH}`);
  next = next.replaceAll(LEGACY_EVENT_PATH, EVENT_PATH);
  if (!next.includes('<meta name="robots" content="noindex, follow">')) {
    next = next.replace('<meta charset="utf-8">', '<meta name="robots" content="noindex, follow">\n  <meta charset="utf-8">');
  }
  if (!next.includes('>Смотреть актуальное мероприятие</a>')) {
    next = next.replace(
      '<a class="skip-link" href="#main-content">К содержанию</a>',
      `<a class="skip-link" href="#main-content">К содержанию</a>\n  <a class="legacy-forward button" href="${EVENT_PATH}">Смотреть актуальное мероприятие</a>`
    );
  }
  return next;
}

function updateHome(html) {
  return html
    .replaceAll(LEGACY_EVENT_PATH, EVENT_PATH)
    .replace(
      '<span>Мероприятия</span><h3>Анонсы встреч и выступлений</h3><p>Темы, даты и условия участия будут публиковаться здесь.</p>',
      '<span>Мероприятие</span><h3>Индустрия гостеприимства</h3><p>10 сентября 2026 года · Москва · Виталина Погорила выступит как спикер.</p>'
    );
}

function updateUseful(html) {
  return html
    .replaceAll(LEGACY_EVENT_PATH, EVENT_PATH)
    .replace(
      '<span>Мероприятие</span><h2>Продажи отеля как система</h2><p>Программа будущей встречи о диагностике, каналах и внедрении решений.</p>',
      '<span>Мероприятие</span><h2>Индустрия гостеприимства</h2><p>10 сентября 2026 года в Москве. Виталина Погорила участвует как спикер.</p>'
    );
}

function updateMaterial(html) {
  return html
    .replaceAll(LEGACY_EVENT_PATH, EVENT_PATH)
    .replace('<strong>Продажи отеля как система</strong>', '<strong>Индустрия гостеприимства</strong>');
}

function updateArticle(html) {
  return html
    .replaceAll(LEGACY_EVENT_PATH, EVENT_PATH)
    .replace('<strong>Продажи отеля как система</strong>', '<strong>Индустрия гостеприимства</strong>');
}

function renderSitemap(html, caseSlugs) {
  const urls = [...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const filtered = urls.filter((url) => {
    const pathname = new URL(url).pathname;
    return pathname !== LEGACY_EVENT_PATH
      && pathname !== '/kejsy/rost-pryamyh-prodazh/'
      && !(/^\/kejsy\/[^/]+\/$/.test(pathname));
  });
  const eventUrl = `https://example.ru${EVENT_PATH}`;
  if (!filtered.includes(eventUrl)) filtered.splice(filtered.indexOf('https://example.ru/poleznoe/') + 1, 0, eventUrl);
  const archiveIndex = filtered.indexOf('https://example.ru/kejsy/');
  filtered.splice(archiveIndex + 1, 0, ...caseSlugs.map((slug) => `https://example.ru/kejsy/${slug}/`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filtered.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export async function generateStaticEvent({ projectRoot }) {
  const legacyFile = path.join(projectRoot, 'poleznoe', 'meropriyatiya', 'prodazhi-otelya-kak-sistema', 'index.html');
  const outputDirectory = path.join(projectRoot, 'poleznoe', 'meropriyatiya', 'industriya-gostepriimstva-2026');
  const outputFile = path.join(outputDirectory, 'index.html');
  const legacy = await readFile(legacyFile, 'utf8');
  const cases = JSON.parse(await readFile(path.join(projectRoot, 'content', 'cases.json'), 'utf8'));

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputFile, renderEventDocument(extractShell(legacy)), 'utf8');
  await writeFile(legacyFile, renderLegacyEvent(legacy), 'utf8');

  const homeFile = path.join(projectRoot, 'index.html');
  const usefulFile = path.join(projectRoot, 'poleznoe', 'index.html');
  const materialFile = path.join(projectRoot, 'poleznoe', 'materialy', 'chek-list-audita-prodazh', 'index.html');
  const articleFile = path.join(projectRoot, 'poleznoe', 'stati', 'kak-provesti-audit-prodazh-otelya', 'index.html');
  const sitemapFile = path.join(projectRoot, 'sitemap.xml');
  await writeFile(homeFile, updateHome(await readFile(homeFile, 'utf8')), 'utf8');
  await writeFile(usefulFile, updateUseful(await readFile(usefulFile, 'utf8')), 'utf8');
  await writeFile(materialFile, updateMaterial(await readFile(materialFile, 'utf8')), 'utf8');
  await writeFile(articleFile, updateArticle(await readFile(articleFile, 'utf8')), 'utf8');
  await writeFile(sitemapFile, renderSitemap(await readFile(sitemapFile, 'utf8'), cases.map((item) => item.slug)), 'utf8');

  return path.relative(projectRoot, outputFile).replaceAll('\\', '/');
}

async function main() {
  const scriptPath = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(scriptPath), '..');
  const output = await generateStaticEvent({ projectRoot });
  process.stdout.write(`Generated ${output}.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
