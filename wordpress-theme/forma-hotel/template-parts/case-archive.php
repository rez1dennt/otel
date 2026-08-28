<?php
/**
 * Dynamic case archive grid for the /kejsy/ Page.
 *
 * @package Forma_Hotel
 */

$case_query = forma_case_archive_query();
?>
<?php if ( $case_query->have_posts() ) : ?>
    <div class="container project-listing">
        <?php while ( $case_query->have_posts() ) : ?>
            <?php $case_query->the_post(); ?>
            <?php get_template_part( 'template-parts/case-card', null, array( 'context' => 'archive' ) ); ?>
        <?php endwhile; ?>
    </div>
<?php else : ?>
    <div class="container editorial-cta">
        <div><p class="eyebrow"><?php esc_html_e( 'Кейсы', 'forma-hotel' ); ?></p><h2><?php esc_html_e( 'Новые кейсы готовятся к публикации', 'forma-hotel' ); ?></h2></div>
        <p><?php esc_html_e( 'Обсудить задачу можно конфиденциально — публикация не является условием работы.', 'forma-hotel' ); ?></p>
        <button class="button" type="button" data-modal-open><?php esc_html_e( 'Обсудить задачу', 'forma-hotel' ); ?></button>
    </div>
<?php endif; ?>
<?php wp_reset_postdata(); ?>

