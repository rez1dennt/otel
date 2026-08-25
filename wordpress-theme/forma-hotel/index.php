<?php
/**
 * Fallback template.
 *
 * @package Forma_Hotel
 */
get_header();
?>
<main id="main-content" class="section">
    <div class="container article-body">
        <?php if ( have_posts() ) : ?>
            <?php while ( have_posts() ) : the_post(); ?>
                <article <?php post_class(); ?>>
                    <h1><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1>
                    <?php if ( is_singular() ) : ?>
                        <?php the_content(); ?>
                    <?php else : ?>
                        <?php the_excerpt(); ?>
                    <?php endif; ?>
                </article>
            <?php endwhile; ?>
        <?php else : ?>
            <h1><?php esc_html_e( 'Материалы пока не опубликованы', 'forma-hotel' ); ?></h1>
        <?php endif; ?>
    </div>
</main>
<?php get_footer(); ?>
