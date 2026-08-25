# Устанавливаемая WordPress-тема-снимок текущего сайта

Дата: 25 августа 2026 года  
Статус: дизайн согласован, требуется просмотр письменной спецификации перед планом реализации

## 1. Цель

Подготовить отдельную устанавливаемую classic theme WordPress, которая после загрузки ZIP и активации сразу показывает весь текущий сайт с тем же дизайном, содержанием и интерфейсным поведением.

Текущая HTML/CSS/JavaScript-версия остаётся основной рабочей версией для последующих правок и не удаляется. WordPress-тема является отдельным синхронизируемым снимком. После новых правок статического сайта генератор обновляет PHP-шаблоны и assets, а сборщик выпускает новую версию ZIP.

## 2. Границы первой версии

Первая версия темы:

- устанавливается обычной загрузкой ZIP через WordPress;
- содержит весь текущий сайт, а не пустой каркас;
- разделяет общий header, footer, модальную форму и Cookie-контролы;
- автоматически создаёт недостающие страницы, вложенные адреса, главную и меню;
- хранит основной контент страниц статически в генерируемых PHP-шаблонах;
- использует текущие CSS, JavaScript, изображения и иконки;
- сохраняет fixed header и всё подтверждённое адаптивное поведение;
- проходит фактическую активацию и E2E-проверку в изолированном WordPress.

В первую версию не входят полноценное редактирование всех блоков через Gutenberg/ACF, динамические CPT, реальная отправка формы, аналитика, оплата, выдача материалов и серверный production deploy.

## 3. Независимость статического сайта

Исходные HTML-файлы, `assets/`, SEO-файлы и существующие тесты остаются на текущих путях. Генерация темы только читает их.

Новые файлы располагаются отдельно:

```text
wordpress-theme/
├── forma-hotel/
│   ├── style.css
│   ├── functions.php
│   ├── header.php
│   ├── footer.php
│   ├── index.php
│   ├── front-page.php
│   ├── 404.php
│   ├── page-*.php
│   ├── inc/
│   │   └── theme-setup.php
│   ├── template-parts/
│   │   ├── lead-dialog.php
│   │   └── cookie-controls.php
│   └── assets/
├── scripts/
│   ├── generate-wordpress-theme.mjs
│   └── validate-wordpress-theme.mjs
├── build-theme.ps1
├── tests/
└── dist/
    └── forma-hotel.zip
```

Сборка не должна изменять содержимое или timestamp исходных статических файлов. Git diff после генерации ограничивается `wordpress-theme/`, тестами и документацией этой задачи.

## 4. Classic theme shell

### `style.css`

Корневой `style.css` содержит валидный WordPress theme header: название FORMA Hotel, версия, описание, text domain, лицензия и поддерживаемые версии. Основная визуальная таблица стилей остаётся в `assets/css/styles.css` и подключается через `functions.php`.

### `functions.php`

Файл:

- подключает модуль настройки темы;
- регистрирует `title-tag`, HTML5, post thumbnails, custom logo и главное меню;
- подключает CSS и JavaScript через `wp_enqueue_scripts` и `get_theme_file_uri()`;
- передаёт JavaScript корректные WordPress URL, если они нужны;
- сохраняет ES module загрузку текущего `main.js`;
- не содержит контент страниц или большой HTML.

### `header.php`

Файл содержит:

- `<!doctype html>`, `language_attributes()`, charset и viewport;
- динамический title/метаданные текущего снимка;
- обязательный `wp_head()`;
- `body_class()` и `wp_body_open()`;
- skip link;
- текущий fixed full-width header;
- `wp_nav_menu()` с fallback, идентичным текущей навигации.

Header сохраняет стабильную высоту и ширину при открытии burger и блокировке прокрутки. Контент и якоря учитывают его фактическую высоту.

### `footer.php`

Файл содержит текущий общий footer, подключение `lead-dialog.php`, `cookie-controls.php`, обязательный `wp_footer()` и закрывающие HTML-теги.

### Page templates

`front-page.php`, `page-*.php`, `index.php` и `404.php` используют `get_header()`/`get_footer()`. Основной `<main>` генерируется из канонического статического источника. Генерируемые файлы имеют предупреждение, что ручные изменения будут перезаписаны следующей синхронизацией.

## 5. Карта маршрутов

| WordPress URL | Статический источник | Назначение |
|---|---|---|
| `/` | `index.html` | Главная |
| `/uslugi/` | `services.html` | Архив услуг |
| `/uslugi/audit-sistemy-prodazh-otelya/` | `service.html` | Страница услуги |
| `/o-proekte/` | `about.html` | О проекте |
| `/kejsy/` | `kejsy/index.html` | Кейсы |
| `/kejsy/rost-pryamyh-prodazh/` | `kejsy/rost-pryamyh-prodazh/index.html` | Пример кейса |
| `/poleznoe/` | `poleznoe/index.html` | Единый архив полезного |
| `/poleznoe/stati/kak-provesti-audit-prodazh-otelya/` | соответствующий clean HTML | Статья |
| `/poleznoe/meropriyatiya/prodazhi-otelya-kak-sistema/` | соответствующий clean HTML | Мероприятие |
| `/poleznoe/materialy/chek-list-audita-prodazh/` | соответствующий clean HTML | Материал |
| `/kontakty/` | `contacts.html` | Контакты |
| `/politika-konfidencialnosti/` | `privacy.html` | Политика конфиденциальности |
| `/soglasie-na-obrabotku-personalnyh-dannyh/` | `consent.html` | Согласие |
| `/politika-cookie/` | `cookies.html` | Cookie |
| WordPress 404 | `404.html` | Страница ошибки |

Legacy `.html` ссылки внутри снимка преобразуются в эти чистые WordPress URL. Старый статический сайт продолжает использовать свои текущие адреса.

## 6. Генерация и синхронизация

`generate-wordpress-theme.mjs` использует явный route manifest.

Для каждой страницы генератор:

1. читает канонический HTML;
2. извлекает `<main>`;
3. переносит page-specific metadata и подтверждённую JSON-LD;
4. преобразует внутренние ссылки в escaped `home_url()`;
5. преобразует theme assets в escaped `get_theme_file_uri()`;
6. создаёт PHP-шаблон с `get_header()` и `get_footer()`;
7. копирует актуальные CSS, JS, изображения и иконки в theme assets;
8. сохраняет manifest созданных файлов и исходников.

Ручные shell-файлы — `style.css`, `functions.php`, `header.php`, `footer.php`, `inc/theme-setup.php` и shared template parts — генератор не перезаписывает.

Обычный цикл обновления:

```text
правки статического сайта
→ статические тесты и Playwright
→ генерация WordPress-снимка
→ WordPress validation/E2E
→ новый forma-hotel.zip
```

## 7. Автоматическая настройка после активации

`after_switch_theme` запускает идемпотентную настройку:

1. создаёт родительские страницы, затем дочерние;
2. использует точные slug из route manifest;
3. перед созданием ищет существующую страницу по полному path;
4. не дублирует и не перезаписывает существующие страницы;
5. назначает созданным страницам соответствующие шаблоны;
6. создаёт/назначает главную и устанавливает `show_on_front=page`;
7. создаёт главное меню в подтверждённом порядке или повторно использует существующее;
8. назначает меню зарегистрированной header-location;
9. сохраняет версию bootstrap;
10. выполняет `flush_rewrite_rules()` один раз после завершения.

Bootstrap не удаляет страницы при деактивации темы. Если WordPress API возвращает ошибку, тема сохраняет подробный результат настройки и показывает администратору уведомление со списком несозданных страниц. Частично созданное состояние можно безопасно повторить: существующие paths пропускаются, отсутствующие создаются.

## 8. Контент и будущая динамическая натяжка

В первой версии созданные WordPress Pages служат маршрутизаторами и административными сущностями, а текущий контент выводится из статических PHP-шаблонов. Это обеспечивает визуальное совпадение сразу после активации.

На следующем этапе шаблоны заменяются по одному:

- статьи → `post`/`single.php`;
- мероприятия → `forma_event`;
- материалы → `forma_material`;
- кейсы → `forma_case`;
- архивы и связанные материалы → WordPress queries;
- редактируемые поля → Gutenberg/ACF или нативные meta fields после отдельного согласования.

Карта из `docs/wordpress-content-template-map.md` остаётся целевым контрактом динамической версии.

## 9. SEO и достоверность

- Один `h1`, семантическая иерархия и текущие alt сохраняются.
- Canonical, Open Graph, breadcrumbs и JSON-LD используют чистые WordPress URLs.
- Статические demo-значения не превращаются в подтверждённые факты.
- Event/Product schema выводится только при наличии обязательных реальных полей.
- Реальная отправка формы, analytics и платёжные сценарии остаются выключенными и обозначенными как демонстрационные.
- После выбора production domain временный домен заменяется централизованно.

## 10. Проверка

### Структурные тесты

- ZIP содержит ровно одну корневую папку `forma-hotel/`.
- В корне темы присутствуют `style.css` и `index.php`.
- Присутствуют `functions.php`, `header.php`, `footer.php`, page templates и shared partials.
- Theme header парсится и содержит обязательные поля.
- Все page templates вызывают `get_header()` и `get_footer()`.
- `header.php` содержит `wp_head()` и `wp_body_open()`.
- `footer.php` содержит `wp_footer()`.
- Assets и template references разрешаются внутри темы.
- Все генерируемые страницы соответствуют route manifest.
- Генератор детерминирован и не изменяет статические источники.

### PHP и WordPress smoke

- PHP-файлы проходят syntax lint в WordPress Playground.
- ZIP устанавливается и тема активируется в чистом WordPress.
- Bootstrap создаёт все paths, front page и menu.
- Повторный запуск bootstrap не создаёт дубликаты.
- Каждый публичный URL возвращает успешную страницу без PHP notice/fatal.

### Browser E2E

WordPress Playground используется как изолированный runtime без Docker и внешней базы. Playwright проверяет:

- все публичные маршруты;
- desktop, `360px` и `320px`;
- fixed header и anchor offsets;
- burger opening/closing, scrollbar compensation, scroll/focus restore;
- modal, forms, FAQ и Cookie;
- отсутствие horizontal overflow;
- загрузку изображений, CSS, JS и icons;
- console errors, page errors и failed requests;
- совпадение ключевых визуальных контрактов статической и WordPress-версии.

Официальные ссылки:

- https://developer.wordpress.org/themes/releasing-your-theme/required-theme-files/
- https://developer.wordpress.org/themes/classic-themes/basics/template-files/
- https://developer.wordpress.org/playground/handbook/guides/e2e-testing-with-playwright/

## 11. Сборка ZIP

`build-theme.ps1` выполняет генерацию, структурную валидацию, PHP/WordPress smoke и E2E. ZIP создаётся только после успешных обязательных проверок.

Архив:

- сохраняется как `wordpress-theme/dist/forma-hotel.zip`;
- содержит папку `forma-hotel/` на первом уровне;
- не содержит test artifacts, Node modules, source docs, cache или локальные runtime-файлы;
- получает версию, совпадающую с `style.css` и build manifest.

## 12. Критерии готовности

- Текущий статический сайт и его публичные файлы не изменены.
- Тема устанавливается из ZIP и активируется без ошибки.
- После активации весь текущий сайт доступен по чистым WordPress URL.
- Страницы, front page и navigation создаются автоматически и без дубликатов.
- Header/footer/modal/Cookie разделены и подключаются WordPress API.
- Assets подключаются через theme URL, а внутренние ссылки — через home URL.
- Fixed header и адаптивное поведение сохраняются до `320px`.
- Повторная генерация после будущей правки статического сайта обновляет снимок и ZIP.
- Структурные, PHP, WordPress и browser tests проходят на финальном архиве.
