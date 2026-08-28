<?php
/**
 * GENERATED FILE. Edit kejsy/index.html and rerun the theme generator.
 *
 * Template Name: FORMA Snapshot — Кейсы
 * Template Post Type: page
 */
$GLOBALS['forma_page_meta'] = array(
    'description' => 'Примеры структуры кейсов по развитию продаж гостиничных объектов с задачами, решениями и подтверждёнными результатами.',
    'canonical_path' => '/kejsy/',
    'og_type' => 'website',
    'og_image' => '/assets/images/hero-hotel.webp',
);
$GLOBALS['forma_page_schema'] = function_exists( 'forma_case_archive_schema' ) ? array( forma_case_archive_schema() ) : array();
get_header();
?>
<main id="main-content"><section class="page-hero page-hero--center"><div class="page-hero__center"><p class="eyebrow">Опыт и результат</p><h1>Кейсы</h1><p>Единый формат публикаций: контекст объекта, задача, выполненная работа и только подтверждённый результат.</p></div></section><section class="section"><?php get_template_part( 'template-parts/case-archive' ); ?></section><section class="section final-section"><div class="container final-grid"><div class="faq-panel" id="faq" aria-labelledby="cases-faq-title"><p class="eyebrow">Коротко о главном</p><h2 id="cases-faq-title">Часто задаваемые вопросы</h2><div class="accordion"><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="cases-faq-1" id="cases-faq-1-button">Почему часть сведений скрыта?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="cases-faq-1" role="region" aria-labelledby="cases-faq-1-button" aria-hidden="true" hidden><div class="accordion__content"><p>Название объекта, показатели и отзыв публикуются только после согласования.</p></div></div></article><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="cases-faq-2" id="cases-faq-2-button">Как устроен единый шаблон кейса?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="cases-faq-2" role="region" aria-labelledby="cases-faq-2-button" aria-hidden="true" hidden><div class="accordion__content"><p>Каждый кейс показывает контекст, задачу, решения, этапы и подтверждение результата.</p></div></div></article><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="cases-faq-3" id="cases-faq-3-button">Можно обсудить задачу конфиденциально?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="cases-faq-3" role="region" aria-labelledby="cases-faq-3-button" aria-hidden="true" hidden><div class="accordion__content"><p>Да. Публикация кейса не является условием консультации или проекта.</p></div></div></article></div></div><div class="contact-panel" id="contact" data-reveal><div class="contact-panel__art" aria-hidden="true"></div><div class="contact-panel__content"><p class="eyebrow">Следующий шаг</p><h2>Обсудим похожую ситуацию</h2><p>Кейс может быть внутренним и конфиденциальным. Публикация не является условием работы.</p><button class="button button--light" type="button" data-modal-open data-modal-title="Записаться на бесплатную консультацию" data-modal-description="Опишите текущую ситуацию в отеле. На первом разговоре уточним задачу и возможный формат работы.">Записаться на бесплатную консультацию</button><span class="contact-panel__note">Ответим по телефону или электронной почте</span></div></div></div></section></main>
<?php get_footer(); ?>
