# Карта переноса контентных шаблонов в WordPress

## Общая модель

Статические HTML-страницы являются эталонами вывода. Общие header, footer, формы, FAQ и Cookie-контролы вынесены в переиспользуемые части темы. Раздел кейсов уже работает как динамическая WordPress-модель; остальные публикационные типы пока остаются страницами-снимками.

Чистые публичные адреса:

```text
/poleznoe/
/poleznoe/stati/{post-slug}/
/poleznoe/meropriyatiya/{event-slug}/
/poleznoe/materialy/{material-slug}/
/kejsy/
/kejsy/{case-slug}/
```

## Статья (`post`)

- `post_title` → H1 и заголовок карточки.
- `post_excerpt` → lead, meta description и описание карточки.
- Featured image + alt → hero и Open Graph image.
- Gutenberg headings/blocks → содержание и `.article-body`.
- Post date, modified date и author → метаданные и `Article` JSON-LD.
- Category → метка карточки и eyebrow.
- Related content → блок «Продолжить изучение».

Шаблон темы: `single.php`. База постоянных ссылок для стандартных записей: `/poleznoe/stati/%postname%/`.

## Мероприятие — текущая реализация

- Ближайшее подтверждённое мероприятие опубликовано по адресу `/poleznoe/meropriyatiya/industriya-gostepriimstva-2026/`.
- Виталина Погорила указана именно как спикер; должность и ссылка ведут на официальную страницу «Коммерсанта».
- Title, описание, дата, время, место, программа и блок спикера входят в сгенерированный шаблон страницы.
- `Event` JSON-LD содержит только подтверждённые официальным источником значения.

Сейчас это WordPress Page со сгенерированным `page-industriya-gostepriimstva-2026.php`, а не отдельный `forma_event`. Самостоятельный редактор мероприятий остаётся следующим этапом.

## Материал (`forma_material`)

- Title, excerpt и featured image → hero, карточка и превью.
- `material_type` → `data-material-type`.
- `access_status` → `data-material-access`.
- `price` и `currency` → цена только при подтверждённом платном доступе.
- `file_format` → `data-material-format`.
- `page_count` → объём только после подготовки файла.
- `contents` → `data-material-contents`.
- `audience` → блок «Для кого».
- `purchase_url` → кнопка покупки или получения.

Шаблон темы: `single-forma_material.php`. Rewrite slug: `poleznoe/materialy`. `Product` JSON-LD выводится только при реальной цене и активной покупке; до этого используется `CreativeWork`.

## Кейс (`forma_case`)

- `post_title`, slug и featured image → H1, URL, hero и карточка.
- `object_type` → тип объекта без несогласованного названия.
- `product` → подтверждённый номерной фонд или характеристика продукта.
- `location` → расположение, если его можно публиковать.
- `format` → формат объекта или работы.
- `context` → секция `#context`.
- `task` → секция `#task`.
- `steps` → повторяемые строки секции `#work`, до 8 шагов.
- `metrics` → повторяемые подтверждённые показатели секции `#result`, до 6 строк.
- `conclusion` → итоговый вывод.
- `privacy_mode` → публичный объект, анонимный объект или скрытые числовые показатели.
- `featured_rank` → позиция карточки на главной от 1 до 3; значение 0 скрывает её с главной.
- `menu_order` → порядок в общем архиве.

Страница `/kejsy/` остаётся обычной WordPress Page и выводит записи через `page-kejsy.php` и `template-parts/case-archive.php`. Детальную страницу выводит `single-forma_case.php`; CPT использует rewrite slug `kejsy` и `has_archive => false`, поэтому конфликтов маршрутов нет.

При первой активации `inc/case-bootstrap.php` импортирует семь записей из `inc/data/cases.json`. Поиск выполняется сначала по `_forma_case_seed_id`, затем по slug. Найденные записи пропускаются без обновления: повторная активация не перезаписывает клиентские правки, а новые записи из админки не удаляются.

Для детальной страницы формируются `Article` и `BreadcrumbList`, для `/kejsy/` — `CollectionPage` и `ItemList`. Старый демонстрационный URL `/kejsy/rost-pryamyh-prodazh/` перенаправляется на `/kejsy/`.

## Единый архив «Полезное»

`page-poleznoe.php` пока выводит подготовленные карточки статей, мероприятия и материала из HTML-снимка. Отдельные CPT для мероприятий и материалов в текущий архив темы не входят.

## SEO и миграция

- Canonical, Open Graph и JSON-LD собираются из полей записи.
- `BreadcrumbList` формируется для каждой детальной страницы.
- Старые `.html` адреса и демонстрационные маршруты получают редиректы или совместимые `noindex`-страницы на чистые URL.
- Sitemap включает только индексируемые WordPress URL.
- Slug записи редактируется до публикации и после запуска не меняется без 301-редиректа.
- Валидация обязательных Event/Product полей выполняется до вывода соответствующего JSON-LD.
