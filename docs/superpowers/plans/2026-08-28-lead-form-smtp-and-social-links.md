# Lead Form SMTP and Social Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать WordPress-формы реально отправляющими заявки через Яндекс SMTP, активировать подтверждённый Telegram и сохранить статическую версию безопасной демонстрацией.

**Architecture:** Серверная часть темы принимает AJAX-заявку, повторно валидирует её, ограничивает спам и передаёт письмо в `wp_mail`; PHPMailer получает SMTP-настройки только из констант `wp-config.php`. Общий модуль JavaScript переключается между WordPress-режимом и статическим fallback, а источник HTML остаётся источником разметки для сгенерированных PHP-шаблонов.

**Tech Stack:** WordPress 6.4+, PHP 8.1+, vanilla HTML/CSS/JavaScript, Node test runner, Playwright, WordPress Playground CLI.

## Global Constraints

- SMTP-пароль никогда не сохраняется в репозитории, ZIP, документации, тестах, логах или браузерном JavaScript.
- Реальная отправка доступна только в WordPress; статический сайт продолжает показывать честный демонстрационный статус.
- Telegram использует `https://t.me/Vitalina_Pogorila`; MAX и Дзен остаются неактивными до подтверждённых прямых URL.
- Яндекс SMTP использует `smtp.yandex.ru`, SMTPS, порт `465`, авторизацию и адрес отправителя, совпадающий с `FORMA_SMTP_USER`.
- Все публичные ошибки нейтральны и не раскрывают серверные или SMTP-детали.
- Существующие визуальная геометрия социальных иконок, доступность формы и адаптивная матрица 1280/768/360/320 px сохраняются.

---

### Task 1: Закрепить контракт тестами

**Files:**
- Modify: `tests/site.test.mjs`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`
- Modify: `wordpress-theme/tests/e2e/wordpress-theme.spec.mjs`

**Interfaces:**
- Consumes: существующие статические страницы, `assets/js/main.js`, исходники темы и Playground.
- Produces: проверки ссылки Telegram, неактивных MAX/Дзен, SMTP-констант, AJAX-хуков, honeypot и успешной отправки формы в изолированном WordPress.

- [ ] **Step 1: Добавить падающие статические проверки**

В `tests/site.test.mjs` расширить тест соцсетей: для каждой публичной страницы требовать ссылку
`<a class="social-link" href="https://t.me/Vitalina_Pogorila" target="_blank" rel="noopener noreferrer" aria-label="Telegram Виталины Погорилы">Telegram</a>` и два неактивных `span`. Для `contacts.html` дополнительно требовать honeypot `name="website"` и новый ответ FAQ о Telegram.

- [ ] **Step 2: Добавить падающий контракт темы**

В `wordpress-theme/tests/theme-structure.test.mjs` проверить наличие `inc/lead-delivery.php`, его подключение из `functions.php`, оба `wp_ajax_*forma_submit_lead` хука, `check_ajax_referer`, `wp_unslash`, sanitization, `wp_mail`, `phpmailer_init`, transient rate-limit и отсутствие literal-секретов. Проверить, что `wp_localize_script` отдаёт `ajaxUrl`, `nonce`, `action` и публичные сообщения.

- [ ] **Step 3: Добавить падающий E2E-сценарий**

В `wordpress-theme/tests/e2e/wordpress-theme.spec.mjs` открыть `/kontakty/`, заполнить имя, телефон, email, согласие, отправить форму и ожидать текст `Заявка отправлена. Свяжемся с вами по указанным контактам`, снятый `aria-busy`, включённую кнопку и очищенные поля.

- [ ] **Step 4: Убедиться, что новые проверки падают по правильной причине**

Run: `npm test`

Expected: FAIL на отсутствии активной ссылки Telegram и honeypot.

Run: `npm run test:theme`

Expected: FAIL на отсутствии `inc/lead-delivery.php` и SMTP/AJAX-контракта.

- [ ] **Step 5: Зафиксировать тесты**

```powershell
git add tests/site.test.mjs wordpress-theme/tests/theme-structure.test.mjs wordpress-theme/tests/e2e/wordpress-theme.spec.mjs
git commit -m "test: define lead delivery contract"
```

---

### Task 2: Реализовать безопасный WordPress-обработчик

**Files:**
- Create: `wordpress-theme/forma-hotel/inc/lead-delivery.php`
- Modify: `wordpress-theme/forma-hotel/functions.php`

**Interfaces:**
- Consumes: `FORMA_SMTP_USER`, `FORMA_SMTP_PASSWORD`, optional `FORMA_LEAD_RECIPIENT` из `wp-config.php`; POST fields `action`, `nonce`, `name`, `phone`, `email`, `message`, `page_url`, `website`, `consent`.
- Produces: `forma_hotel_lead_config()` для браузера, AJAX action `forma_submit_lead`, JSON `{success,data:{message}}`, PHPMailer SMTP configuration.

- [ ] **Step 1: Подключить изолированный модуль**

В `functions.php` подключить `inc/lead-delivery.php` через `require_once`, а после enqueue `forma-hotel-main` вызвать:

```php
wp_localize_script(
    'forma-hotel-main',
    'formaLeadConfig',
    forma_hotel_lead_config()
);
```

- [ ] **Step 2: Реализовать конфигурацию и SMTP**

В `inc/lead-delivery.php` определить `forma_hotel_smtp_is_configured()`, `forma_hotel_lead_config()` и `forma_hotel_configure_phpmailer( $phpmailer )`. Конфигурация браузера содержит только `ajaxUrl`, nonce `forma_submit_lead`, action и три публичных сообщения. PHPMailer настраивается только когда обе секретные константы определены и непустые: host `smtp.yandex.ru`, port `465`, `SMTPSecure = 'ssl'`, `SMTPAuth = true`, username/password из констант, From совпадает с username.

- [ ] **Step 3: Реализовать защиту и серверную валидацию**

Обработчик должен:

```php
if ( 'POST' !== strtoupper( $_SERVER['REQUEST_METHOD'] ?? '' ) ) { /* JSON 405 */ }
if ( ! check_ajax_referer( 'forma_submit_lead', 'nonce', false ) ) { /* JSON 403 */ }
if ( ! empty( $_POST['website'] ) ) { /* fake success */ }
```

Затем прочитать только известные поля через `wp_unslash`, применить `sanitize_text_field`, `sanitize_email`, `sanitize_textarea_field`, `esc_url_raw`, проверить имя, `is_email`, минимум семь цифр телефона и согласие. Rate-limit хранить как transient с ключом из `wp_hash( $_SERVER['REMOTE_ADDR'] )`, без сырого IP.

- [ ] **Step 4: Сформировать и отправить безопасное письмо**

Собрать текстовое письмо с источником страницы и полями заявки, добавить `Reply-To` только из уже проверенного email, отправить через `wp_mail`. При успехе поставить transient и вернуть success JSON; при ошибке вернуть только публичный error message. Зарегистрировать:

```php
add_action( 'wp_ajax_forma_submit_lead', 'forma_hotel_submit_lead' );
add_action( 'wp_ajax_nopriv_forma_submit_lead', 'forma_hotel_submit_lead' );
add_action( 'phpmailer_init', 'forma_hotel_configure_phpmailer' );
```

- [ ] **Step 5: Добавить администраторское уведомление**

Если SMTP-константы отсутствуют, показывать уведомление только пользователю с `manage_options`; публичная форма получает нейтральную ошибку, но никаких имён констант или SMTP-деталей.

- [ ] **Step 6: Проверить PHP и структурные тесты**

Run: `php -l wordpress-theme/forma-hotel/inc/lead-delivery.php`

Expected: `No syntax errors detected`.

Run: `php -l wordpress-theme/forma-hotel/functions.php`

Expected: `No syntax errors detected`.

Run: `npm run test:theme`

Expected: SMTP/AJAX structural contract PASS; E2E ещё не запускается на этом шаге.

- [ ] **Step 7: Зафиксировать серверную часть**

```powershell
git add wordpress-theme/forma-hotel/inc/lead-delivery.php wordpress-theme/forma-hotel/functions.php wordpress-theme/tests/theme-structure.test.mjs
git commit -m "feat: add secure WordPress lead delivery"
```

---

### Task 3: Подключить клиентскую отправку и формы

**Files:**
- Modify: `assets/js/main.js`
- Modify: `assets/css/styles.css`
- Modify: `contacts.html`
- Modify: `wordpress-theme/forma-hotel/template-parts/lead-dialog.php`
- Generated: `wordpress-theme/forma-hotel/page-kontakty.php`
- Generated: `wordpress-theme/forma-hotel/assets/js/main.js`
- Generated: `wordpress-theme/forma-hotel/assets/css/styles.css`

**Interfaces:**
- Consumes: optional `window.formaLeadConfig` with `{ajaxUrl, nonce, action, messages}`.
- Produces: loading/success/error status, disabled submit state, `aria-busy`, FormData POST and static fallback.

- [ ] **Step 1: Добавить honeypot в обе исходные формы**

Перед первой видимой меткой добавить:

```html
<div class="form-trap" aria-hidden="true"><label for="...-website">Не заполняйте это поле</label><input id="...-website" name="website" tabindex="-1" autocomplete="off"></div>
```

Добавить `.form-trap` в общий CSS как внеэкранный, не влияющий на сетку элемент, используя существующие токены/паттерны скрытого контента.

- [ ] **Step 2: Реализовать WordPress-режим в `setupForms()`**

После клиентской валидации проверить наличие корректного `window.formaLeadConfig`. В статическом режиме оставить текущий честный demo message. В WordPress-режиме добавить `action`, `nonce`, `page_url`, установить button `disabled` и `aria-busy="true"`, показать loading message, выполнить `fetch(ajaxUrl, {method:'POST', credentials:'same-origin', body:data})`, разобрать JSON, показать success/error, сбросить форму только при успехе и всегда восстановить кнопку и её исходный текст.

- [ ] **Step 3: Сгенерировать тему из статического источника**

Run: `node wordpress-theme/scripts/generate-wordpress-theme.mjs`

Expected: `Generated ... WordPress theme files.`; `page-kontakty.php` содержит преобразованные WordPress URL и honeypot, assets темы совпадают с источником.

- [ ] **Step 4: Проверить статический fallback и форму**

Run: `npm test`

Expected: PASS, включая валидацию, Telegram, honeypot и demo fallback.

Run: `npm run test:theme`

Expected: PASS.

- [ ] **Step 5: Зафиксировать формы**

```powershell
git add assets/js/main.js assets/css/styles.css contacts.html wordpress-theme/forma-hotel/template-parts/lead-dialog.php wordpress-theme/forma-hotel/page-kontakty.php wordpress-theme/forma-hotel/assets
git commit -m "feat: submit WordPress lead forms"
```

---

### Task 4: Активировать Telegram во всех публичных поверхностях

**Files:**
- Modify: all public `*.html` files containing `.social-links`
- Modify: `wordpress-theme/forma-hotel/footer.php`
- Generated: `wordpress-theme/forma-hotel/page-kontakty.php`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: confirmed Telegram URL and existing first-position Telegram icon CSS.
- Produces: one accessible external Telegram link plus inactive MAX/Dzen controls, with unchanged order and size.

- [ ] **Step 1: Заменить общий Telegram `span` на ссылку**

Во всех статических страницах и в footer темы использовать:

```html
<a class="social-link" href="https://t.me/Vitalina_Pogorila" target="_blank" rel="noopener noreferrer" aria-label="Telegram Виталины Погорилы">Telegram</a><span class="social-link" aria-disabled="true" title="Ссылка будет добавлена">MAX</span><span class="social-link" aria-disabled="true" title="Ссылка будет добавлена">Дзен</span>
```

- [ ] **Step 2: Обновить контактный FAQ**

Заменить устаревшую фразу на: `Да, напишите Виталине в Telegram. Для MAX прямая ссылка пока ожидается; также доступны телефон и электронная почта.`

- [ ] **Step 3: Пересобрать контент и тему**

Run: `npm run build:content`

Expected: генераторы завершаются без ошибок и не возвращают старые социальные заглушки.

Run: `node wordpress-theme/scripts/generate-wordpress-theme.mjs`

Expected: сгенерированные шаблоны сохраняют активный Telegram.

- [ ] **Step 4: Запустить тесты**

Run: `npm test`

Expected: PASS.

Run: `npm run test:theme`

Expected: PASS.

- [ ] **Step 5: Зафиксировать соцсети**

```powershell
git add -- '*.html' assets wordpress-theme/forma-hotel tests/site.test.mjs
git commit -m "feat: activate Telegram contact links"
```

---

### Task 5: Настроить безопасный Playground и документацию

**Files:**
- Modify: `wordpress-theme/playground/blueprint.json`
- Create: `wordpress-theme/playground/lead-mail-test.php`
- Modify: `wordpress-theme/scripts/run-playground-e2e.ps1`
- Modify: `wordpress-theme/tests/theme-structure.test.mjs`
- Modify: `wordpress-theme/README.md`

**Interfaces:**
- Consumes: candidate theme ZIP and local test-only placeholder configuration.
- Produces: Playground, который перехватывает `pre_wp_mail` и возвращает success без внешней сети; безопасная hosting-инструкция с placeholder values.

- [ ] **Step 1: Добавить тестовый перехватчик почты**

Создать MU-plugin только в `wordpress-theme/playground/lead-mail-test.php`, который через `pre_wp_mail` возвращает `true`. Он не копируется в тему и не попадает в production ZIP.

- [ ] **Step 2: Обновить Playground bundle**

В blueprint добавить `defineWpConfigConsts` с фиктивными `FORMA_SMTP_USER`, `FORMA_SMTP_PASSWORD`, `FORMA_LEAD_RECIPIENT`. В runner копировать test MU-plugin в bundle; blueprint создаёт `/wordpress/wp-content/mu-plugins` и устанавливает его через `writeFile` с bundled resource. Никакой внешний SMTP-вызов в E2E не выполняется.

- [ ] **Step 3: Документировать установку без секрета**

В `wordpress-theme/README.md` добавить пример:

```php
define( 'FORMA_SMTP_USER', 'mailbox@example.ru' );
define( 'FORMA_SMTP_PASSWORD', 'APP_PASSWORD_FROM_YANDEX' );
define( 'FORMA_LEAD_RECIPIENT', 'recipient@example.ru' );
```

Указать, что значения добавляются только в `wp-config.php` на хостинге, вне темы и Git; отправитель должен совпадать с SMTP-логином; после настройки нужна пробная заявка.

- [ ] **Step 4: Запустить полную сборку и E2E**

Run: `npm run build:theme`

Expected: Node tests PASS, theme structure PASS, PHP source validation PASS, Playground E2E PASS, final archive создан в `wordpress-theme/dist/forma-hotel.zip`.

- [ ] **Step 5: Проверить отсутствие секретов и артефакты**

Run: `git diff --check`

Expected: no output.

Run: `git status --short`

Expected: только ожидаемые исходники, тесты, документация и обновлённый ZIP.

- [ ] **Step 6: Зафиксировать готовую тему**

```powershell
git add wordpress-theme/playground wordpress-theme/scripts/run-playground-e2e.ps1 wordpress-theme/README.md wordpress-theme/dist/forma-hotel.zip
git commit -m "docs: add secure SMTP deployment setup"
```

---

### Task 6: Финальная проверка перед передачей

**Files:**
- Verify only: repository and `wordpress-theme/dist/forma-hotel.zip`

**Interfaces:**
- Consumes: completed implementation.
- Produces: evidence that static demo, WordPress AJAX delivery, social links and responsive UI all meet the approved contract.

- [ ] **Step 1: Запустить все автоматические проверки**

Run: `npm test`

Expected: all static tests PASS.

Run: `npm run test:theme`

Expected: all theme structural tests PASS.

Run: `npm run test:ui`

Expected: static browser suite PASS.

Run: `npm run build:theme`

Expected: Playground WordPress E2E PASS and final ZIP validated.

- [ ] **Step 2: Проверить доступность состояний формы**

В браузере подтвердить: status объявляется через `role="status"`, loading использует `aria-busy`, submit действительно disabled только во время запроса, Telegram имеет различимое имя, MAX/Дзен не входят в tab order.

- [ ] **Step 3: Проверить репозиторий**

Run: `git diff --check`

Expected: no output.

Run: `git status --short`

Expected: clean after final commit.

- [ ] **Step 4: Зафиксировать только если финальная проверка изменила артефакты**

```powershell
git add wordpress-theme/dist/forma-hotel.zip
git commit -m "build: refresh verified WordPress theme"
```
