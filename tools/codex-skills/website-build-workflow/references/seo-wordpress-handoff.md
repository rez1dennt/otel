# SEO baseline and optional WordPress handoff

Read the SEO baseline for every public website. Read the WordPress section only when a CMS handoff is requested or confirmed.

## Static SEO baseline

- One descriptive `title`, meta description and logical `h1` per public page.
- Semantic heading hierarchy and landmarks.
- Stable lowercase clean URLs with transliterated, human-readable slugs when routes allow it.
- Correct canonical and Open Graph URL/image values for the final domain; keep demo domains easy to replace.
- Descriptive alt text for meaningful images.
- Breadcrumbs on nested detail pages.
- `robots.txt` and `sitemap.xml` containing the intended public routes.
- JSON-LD only for supported entity types and confirmed values; omit unavailable properties instead of inventing them.
- Legacy demonstration URLs either redirect to the canonical route or use `noindex` plus canonical until server redirects exist.

## Content template contract

For each article, event, material, case or service define:

- archive card fields;
- detail-page hero fields;
- body sections and repeatable blocks;
- action state and destination;
- related-content rules;
- breadcrumb, canonical and structured-data mapping.

Do not show dates, prices, availability, performance figures or download/payment promises before those values are confirmed.

## WordPress activation rule

Activate this section only when the user requests WordPress, confirms a later transfer, or needs editors to publish entries through the CMS. Otherwise finish the static site without CMS artifacts.

## WordPress map

- Use standard `post` for ordinary articles when its editorial behavior fits.
- Add a custom post type only for a content type with distinct fields, archive behavior or permissions.
- Add taxonomies only when editors need meaningful filtering or grouping.
- Map archive/detail contracts to WordPress template hierarchy files.
- Define each editable field, type, required state, fallback and sanitization/escaping rule.
- Preserve clean slugs and document redirects from any static legacy URL.
- Keep shared theme components independent of entry content.
- Use dynamic canonical, breadcrumbs and JSON-LD generated from confirmed record fields.

## Handoff document

Return a table with content type, public URL pattern, WordPress object, template, editable fields, structured data and migration/redirect note. Mark integrations that still require hosting, plugins, endpoint credentials or client decisions.

