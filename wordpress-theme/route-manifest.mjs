export const THEME_BUILD = Object.freeze({
  slug: 'forma-hotel',
  version: '0.1.0'
});

export const ROUTES = [
  { id: 'home', source: 'index.html', output: 'front-page.php', path: '/', title: 'Главная', parentPath: null, menuOrder: 0, menuLabel: 'Главная', template: 'front-page.php' },
  { id: 'services', source: 'services.html', output: 'page-uslugi.php', path: '/uslugi/', title: 'Услуги', parentPath: null, menuOrder: 10, menuLabel: 'Услуги', template: 'page-uslugi.php' },
  { id: 'service-audit', source: 'service.html', output: 'page-audit-sistemy-prodazh-otelya.php', path: '/uslugi/audit-sistemy-prodazh-otelya/', title: 'Аудит системы продаж отеля', parentPath: '/uslugi/', menuOrder: null, menuLabel: null, template: 'page-audit-sistemy-prodazh-otelya.php' },
  { id: 'about', source: 'about.html', output: 'page-o-proekte.php', path: '/o-proekte/', title: 'О проекте', parentPath: null, menuOrder: 20, menuLabel: 'О проекте', template: 'page-o-proekte.php' },
  { id: 'cases', source: 'kejsy/index.html', output: 'page-kejsy.php', path: '/kejsy/', title: 'Кейсы', parentPath: null, menuOrder: 30, menuLabel: 'Кейсы', template: 'page-kejsy.php' },
  { id: 'useful', source: 'poleznoe/index.html', output: 'page-poleznoe.php', path: '/poleznoe/', title: 'Полезное', parentPath: null, menuOrder: 40, menuLabel: 'Полезное', template: 'page-poleznoe.php' },
  { id: 'article-audit', source: 'poleznoe/stati/kak-provesti-audit-prodazh-otelya/index.html', output: 'page-kak-provesti-audit-prodazh-otelya.php', path: '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/', title: 'Как провести аудит продаж отеля', parentPath: '/poleznoe/stati/', menuOrder: null, menuLabel: null, template: 'page-kak-provesti-audit-prodazh-otelya.php' },
  { id: 'event-hospitality-2026', source: 'poleznoe/meropriyatiya/industriya-gostepriimstva-2026/index.html', output: 'page-industriya-gostepriimstva-2026.php', path: '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/', title: 'Индустрия гостеприимства', parentPath: '/poleznoe/meropriyatiya/', menuOrder: null, menuLabel: null, template: 'page-industriya-gostepriimstva-2026.php' },
  { id: 'material-checklist', source: 'poleznoe/materialy/chek-list-audita-prodazh/index.html', output: 'page-chek-list-audita-prodazh.php', path: '/poleznoe/materialy/chek-list-audita-prodazh/', title: 'Чек-лист аудита продаж отеля', parentPath: '/poleznoe/materialy/', menuOrder: null, menuLabel: null, template: 'page-chek-list-audita-prodazh.php' },
  { id: 'contacts', source: 'contacts.html', output: 'page-kontakty.php', path: '/kontakty/', title: 'Контакты', parentPath: null, menuOrder: 50, menuLabel: 'Контакты', template: 'page-kontakty.php' },
  { id: 'privacy', source: 'privacy.html', output: 'page-politika-konfidencialnosti.php', path: '/politika-konfidencialnosti/', title: 'Политика конфиденциальности', parentPath: null, menuOrder: null, menuLabel: null, template: 'page-politika-konfidencialnosti.php' },
  { id: 'consent', source: 'consent.html', output: 'page-soglasie-na-obrabotku-personalnyh-dannyh.php', path: '/soglasie-na-obrabotku-personalnyh-dannyh/', title: 'Согласие на обработку персональных данных', parentPath: null, menuOrder: null, menuLabel: null, template: 'page-soglasie-na-obrabotku-personalnyh-dannyh.php' },
  { id: 'cookies', source: 'cookies.html', output: 'page-politika-cookie.php', path: '/politika-cookie/', title: 'Политика использования Cookie', parentPath: null, menuOrder: null, menuLabel: null, template: 'page-politika-cookie.php' }
];

export const CONTAINER_ROUTES = [
  { id: 'articles-container', source: null, output: 'page-stati.php', path: '/poleznoe/stati/', title: 'Статьи', parentPath: '/poleznoe/', menuOrder: null, menuLabel: null, template: 'page-stati.php', redirectPath: '/poleznoe/' },
  { id: 'events-container', source: null, output: 'page-meropriyatiya.php', path: '/poleznoe/meropriyatiya/', title: 'Мероприятия', parentPath: '/poleznoe/', menuOrder: null, menuLabel: null, template: 'page-meropriyatiya.php', redirectPath: '/poleznoe/' },
  { id: 'materials-container', source: null, output: 'page-materialy.php', path: '/poleznoe/materialy/', title: 'Материалы', parentPath: '/poleznoe/', menuOrder: null, menuLabel: null, template: 'page-materialy.php', redirectPath: '/poleznoe/' }
];

export const BOOTSTRAP_ROUTES = [...ROUTES, ...CONTAINER_ROUTES];

export const LEGACY_PATHS = new Map([
  ['/index.html', '/'],
  ['/services.html', '/uslugi/'],
  ['/service.html', '/uslugi/audit-sistemy-prodazh-otelya/'],
  ['/about.html', '/o-proekte/'],
  ['/projects.html', '/kejsy/'],
  ['/project.html', '/kejsy/'],
  ['/blog.html', '/poleznoe/'],
  ['/article.html', '/poleznoe/stati/kak-provesti-audit-prodazh-otelya/'],
  ['/kejsy/rost-pryamyh-prodazh/', '/kejsy/'],
  ['/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/', '/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/'],
  ['/contacts.html', '/kontakty/'],
  ['/privacy.html', '/politika-konfidencialnosti/'],
  ['/consent.html', '/soglasie-na-obrabotku-personalnyh-dannyh/'],
  ['/cookies.html', '/politika-cookie/']
]);
