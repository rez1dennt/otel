<?php
/**
 * Three featured cases on the front page.
 *
 * @package Forma_Hotel
 */

$featured_cases = forma_case_archive_query( 3, true );
?>
<?php if ( $featured_cases->have_posts() ) : ?>
    <div class="project-grid">
        <?php while ( $featured_cases->have_posts() ) : ?>
            <?php $featured_cases->the_post(); ?>
            <?php get_template_part( 'template-parts/case-card', null, array( 'context' => 'featured' ) ); ?>
        <?php endwhile; ?>
    </div>
<?php endif; ?>
<?php wp_reset_postdata(); ?>

