# Карта переноса контентных шаблонов в WordPress

## Общая модель

Статические HTML-страницы являются эталонами вывода. При переносе WordPress подставляет значения записи в те же визуальные зоны, а общий header, footer, формы, FAQ и карточки становятся переиспользуемыми частями темы.

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

## Мероприятие (`forma_event`)

- Title, excerpt и featured image → hero и карточка.
- `event_status` → `data-event-status`.
- `event_date` → `data-event-date`.
- `event_time` и `event_timezone` → строка времени.
- `event_format` → `data-event-format`.
- `event_location` → место или онлайн-платформа.
- `registration_url` → кнопка регистрации.
- `event_program` → `data-event-program`.
- Speaker fields → блок спикера.

Шаблон темы: `single-forma_event.php`. Rewrite slug: `poleznoe/meropriyatiya`. `Event` JSON-LD выводится только при заполненных реальных date и format/location.

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

- Title, excerpt и featured image → hero и карточка.
- `object_type` → тип объекта без несогласованного названия.
- `context` → секция `#context`.
- `task` → секция `#task`.
- `work` → секция `#work`.
- `result` → секция `#result`.
- `period` → период работы при разрешении на публикацию.
- `metrics` → подтверждённые показатели.
- `privacy_mode` → правила скрытия объекта и значений.
- `testimonial` → согласованный отзыв.
- `related_services` → связанные услуги.

Шаблоны темы: `archive-forma_case.php` и `single-forma_case.php`. Rewrite slug: `kejsy`. Неподтверждённые metrics и testimonial не выводятся.

## Единый архив «Полезное»

`page-poleznoe.php` собирает стандартные записи, `forma_event` и `forma_material` в единую сетку. Тип записи определяет метку, действие карточки и детальный шаблон. Отдельные публичные архивы мероприятий и материалов на первом этапе не нужны.

## SEO и миграция

- Canonical, Open Graph и JSON-LD собираются из полей записи.
- `BreadcrumbList` формируется для каждой детальной страницы.
- Старые `.html` адреса получают 301-редиректы на чистые URL.
- Sitemap включает только индексируемые WordPress URL.
- Slug записи редактируется до публикации и после запуска не меняется без 301-редиректа.
- Валидация обязательных Event/Product полей выполняется до вывода соответствующего JSON-LD.
