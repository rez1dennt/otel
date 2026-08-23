# Client Content and UX Redesign Specification

**Date:** 2026-08-23  
**Status:** Approved direction  
**Project:** FORMA hotel advisory static multi-page website

## 1. Goal

Refine the existing hotel consulting website into a calmer, more compact and interaction-polished experience while preserving the exact visual language derived from the supplied reference. Replace placeholder positioning with the client's confirmed mission, biography, four services, contact details and desired information architecture. Keep the implementation in semantic HTML, shared CSS and vanilla JavaScript.

The redesign must solve the concrete defects shown in the supplied screenshots: abrupt mobile navigation, a hamburger that does not become a close icon, compressed service card `04`, abrupt FAQ expansion, the adjacent FAQ call-to-action stretching with the accordion, an incoherent Cookie settings action, oversized contact presentation, internal modal scrolling, oversized headings and insufficient mobile gutters.

## 2. Visual direction

The reference palette remains unchanged and is consumed through the existing shared semantic tokens:

- page milk: `#F2F1EF`;
- elevated surface: `#FAF9F7`;
- primary ink: `#2D281D`;
- muted text: `#66635B`;
- action olive: `#3E4136`;
- warm accent: `#8B745F`;
- border sand: `#D0C5B8`;
- mist: `#BABCC1`;
- blush accent: `#C9B3A4`.

The mood stays editorial, quiet and premium: hairline borders, soft rounded cards, restrained shadows, serif display typography and compact sans-serif body copy. Display sizes are reduced globally, especially at widths below 768 px. Containers receive stronger mobile gutters so headings never appear pressed against the viewport edge.

A handwritten accent is used only for short emotional phrases, never for paragraphs, controls or legal text. It uses a local cursive stack (`Segoe Script`, `Bradley Hand`, cursive) and falls back gracefully. The main information hierarchy remains readable in the existing serif/sans-serif pairing.

## 3. Information architecture

The public navigation labels become:

1. `О проекте` — mission and founder biography;
2. `Услуги` — four services and work stages;
3. `Кейсы` — object experience and confirmed results when supplied;
4. `Полезное` — articles, event announcements and purchasable materials;
5. `Контакты`.

Existing filenames remain stable to avoid broken local links and future SEO migration work:

- `about.html` represents `О проекте`;
- `projects.html` / `project.html` represent `Кейсы`;
- `blog.html` / `article.html` represent `Полезное`;
- `services.html` / `service.html` represent services and one detailed service;
- legal and technical pages remain available.

The home page becomes a concise overview of this structure and sends visitors to the appropriate detail page or lead form.

## 4. Confirmed content

### Mission

The mission is to increase hotel revenue by building a clear, transparent and working sales system. The copy explains that sales technology and team training turn fragmented actions into a coordinated process where every employee understands their contribution to the financial result.

### Founder biography

The `О проекте` page presents the confirmed path without invented figures:

- entry into hospitality in 2013 as a waiter, with first practical experience in sales and reading guest needs;
- work as a reception administrator, banquet manager, sales manager and executive director;
- participation in opening banquet halls and additional buildings and in constructing and launching cottages and houses;
- leadership of sales for city and country hotels;
- current work as commercial director in a management company with responsibility for several properties;
- speaker experience for HLB magazine (Skolkovo) and the Kommersant conference, as supplied by the client.

The biography is edited only for clarity, punctuation and web readability. It must not gain unsupported awards, results, client names or revenue figures.

### Services

The old six-direction concept is replaced by four confirmed offers:

1. **Аудит системы продаж** — commercial-service diagnostics, tariff policy, channel mix, request handling, booking scripts and sales-team work; outcome: current-state picture, profit leakage, corrective steps and motivation recommendations.
2. **Индивидуальная консультация** — a focused strategic session for owners or managers; outcome: situation analysis, adapted scripts and standards, direct answers and a 1–3 month action strategy.
3. **Ведение внешних каналов продаж** — OTA, tour operators, agencies and geoservices; outcome: seasonal occupancy support, balanced commissions, local-search visibility and competitive price control.
4. **Ведение прямых каналов продаж** — website booking, messengers and guest database; outcome: lower aggregator dependence, more repeat sales, stronger additional-service sales and reduced commission costs.

Every service card and detail section contains two actions: `Оставить заявку` and `Записаться на бесплатную консультацию`. Both open the shared lead dialog with context-specific heading/copy.

### Contacts and legal operator

- telephone: `+7 906 503-94-28`, clickable as `tel:+79065039428`;
- public email: `vitalinapogorila@yandex.ru`;
- operator: `ИП Погорила Виталина Петровна`;
- INN: `502745335560`;
- OGRNIP: `325774600286352`.

The new public email is used in contact and legal feedback contexts because it was directly supplied by the client. No physical address is invented. Meeting text states that the format and place are agreed in advance.

Telegram, MAX and Dzen controls are shown in a consistent social-links group. Until exact URLs are provided, they are explicitly disabled/non-navigating and labelled as awaiting links; no `#` links or guessed accounts are used.

### Cases and useful materials

No client cases, metrics, event dates, prices or payment destinations have been supplied. The cases page therefore uses polished clearly-labelled examples of the future format without claiming real results. `Полезное` is divided into articles, event announcements, and checklists/methods/standards. Purchase controls open an enquiry modal until a real catalogue, price and payment workflow are supplied; the interface must not imply that payment is currently processed.

## 5. Interaction design

### Mobile navigation

The button is built from three independent visual strokes. When `aria-expanded="true"`, the outer strokes rotate into a cross and the middle stroke fades and scales down. The same state changes the accessible label from `Открыть меню` to `Закрыть меню`.

The menu is progressively enhanced. Without JavaScript it stays absent and the fallback navigation remains available. With JavaScript it remains mounted for animation and uses `visibility`, `opacity`, `translate` and `pointer-events` for a 280–360 ms enter/exit. Menu links receive a short stagger that does not delay usability. Closing through the button, Escape, navigation or opening the modal plays the exit state before the menu becomes inert. Focus is returned correctly and the body remains locked only while an overlay is active.

### FAQ

FAQ panels no longer toggle the `hidden` attribute as the visual mechanism. Each answer uses a collapsible grid wrapper that transitions from a zero row to a full row, with opacity and a rotating plus icon. Keyboard and ARIA behavior remain native and correct.

Desktop FAQ/CTA layouts use `align-items: start`; the right card keeps its own intrinsic/minimum height and does not stretch when answers open. Mobile FAQ is single-column and the same motion is preserved. Every major marketing page ends with 3–4 page-relevant questions.

### Modal

The lead dialog is vertically compact enough for a normal 375 × 850 viewport: reduced heading, field height, gaps, padding and textarea height. The panel itself has no internal scrollbar at that viewport. The overlay may scroll only as a defensive fallback on unusually short screens. Stable scrollbar behavior prevents layout shift.

The form keeps visible labels, name, phone, email, short task description, consent links and demo-mode feedback. CTA context may update the dialog title and supporting copy. Escape, backdrop, close control, focus trap and focus return continue to work.

### Cookie controls

Cookie consent is a single coherent floating card rather than a text block with a visually detached settings action. Primary, secondary and settings controls share the same button system. Settings expand smoothly inside the card, present necessary/analytics choices clearly, and provide one strong `Сохранить выбор` action.

The footer `Настроить Cookie` control becomes an intentional compact action with the same typography, hover, focus and target-size rules as other footer controls.

## 6. Layout corrections

- The text-only `04` card receives a dedicated one-row layout and generous internal alignment instead of being forced into the image-card row template.
- Contact layouts use a narrower information column and a wider form column on desktop; headings and direct-contact links have bounded fluid sizes and safe wrapping.
- Legal display headings use the same reduced scale as marketing pages and no longer dominate the viewport.
- Mobile cards reduce fixed minimum heights where they create empty space.
- Main mobile containers use at least 18–20 px effective gutters.
- The home FAQ companion card and desktop content grids opt out of default grid-item stretching where content expands independently.

## 7. JavaScript architecture

`assets/js/main.js` remains the DOM orchestration layer but gains small single-purpose helpers for animated disclosure and overlay state. `assets/js/core.js` remains the pure logic layer and may expose state helpers that can be tested without a browser.

State contracts:

- menu: `aria-expanded`, `aria-hidden`, `.is-open`, body lock and accessible label stay synchronized;
- accordion: `aria-expanded` and `.is-open` stay synchronized, with the panel always present after enhancement;
- modal: only one overlay owns the body lock and focus trap at a time;
- Cookie: stored preferences are normalized before rendering; opening settings never silently changes consent.

All interactions honor `prefers-reduced-motion: reduce` by collapsing transition duration without breaking final state.

## 8. SEO and legal boundaries

Marketing page titles, descriptions, headings, internal labels and structured data are updated for hotel sales consulting, hotel revenue systems, sales-channel management and direct bookings. Content remains natural and does not add unsupported claims or keyword stuffing. Existing canonical URLs keep placeholder-domain warnings until the final domain is known.

Legal pages retain working-template warnings. They are updated with the public contact email and confirmed operator details, but no processors, hosting company, analytics identifier, delivery terms, prices or payment provider are invented.

## 9. Error handling and accessibility

- All interactive controls retain visible focus states and at least 44 × 44 px primary touch targets; compact inline legal controls retain at least 24 px with adequate spacing.
- Form errors continue to explain what happened and how to correct it.
- Disabled social/purchase controls state why they are unavailable.
- Images keep intrinsic dimensions, meaningful alternative text and lazy loading below the fold.
- No interaction depends on hover, color or motion alone.
- No emoji is introduced as an interface icon.

## 10. Verification

Implementation follows test-first changes. Automated tests must cover:

- new navigation labels and client contact details on all shared surfaces;
- exactly four confirmed service offers and their two CTA types;
- mission and biography content;
- menu icon/state contract and animated-menu classes;
- FAQ disclosure markup on major marketing pages;
- independent FAQ companion layout contract;
- compact modal contract and absence of panel `overflow: auto` at the base style;
- coherent Cookie action classes and expanded-settings contract;
- updated SEO metadata and valid structured data;
- no broken local links or missing assets.

Manual browser verification covers 1440 px desktop and 768, 390, 375 and 320 px widths. The checks include menu open/close animation, cross transformation, Escape/focus return, FAQ motion and neighbour height, both CTA contexts, modal at 375 × 850 without internal scroll, Cookie first visit/settings/reopen, contacts wrapping, horizontal overflow, console errors and reduced motion.

## 11. Out of scope until client data arrives

- working form submission endpoint;
- live payment or digital-delivery system;
- real cases, metrics and testimonials;
- exact Telegram, MAX and Dzen URLs;
- final domain, analytics provider and production Cookie inventory;
- final legal review after production services are selected.
