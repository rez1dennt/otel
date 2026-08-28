<?php
/**
 * Shared case card.
 *
 * @package Forma_Hotel
 */

$context = isset( $args['context'] ) ? $args['context'] : 'archive';
$fields  = forma_case_get_fields( get_the_ID() );
$metrics = array_slice( $fields['metrics'], 0, 3 );
$is_home = 'featured' === $context;
?>
<a<?php echo $is_home ? ' class="project-card' . ( 1 === (int) $fields['featured_rank'] ? ' project-card--lead' : '' ) . '" data-project-card data-reveal' : ' data-project-link'; ?> href="<?php the_permalink(); ?>">
    <div class="image-frame">
        <img src="<?php echo esc_url( forma_case_image_url( get_the_ID() ) ); ?>" alt="<?php echo esc_attr( forma_case_image_alt( get_the_ID() ) ); ?>" width="1200" height="900" loading="lazy">
    </div>
    <div<?php echo $is_home ? ' class="project-card__caption"' : ''; ?>>
        <span<?php echo $is_home ? '' : ' class="eyebrow"'; ?>><?php echo esc_html( $fields['object_type'] ); ?></span>
        <?php if ( $is_home ) : ?>
            <h3><?php the_title(); ?></h3>
        <?php else : ?>
            <h2><?php the_title(); ?></h2>
        <?php endif; ?>
        <p><?php echo esc_html( get_the_excerpt() ); ?></p>
        <?php if ( $metrics ) : ?>
            <ul class="case-card-metrics">
                <?php foreach ( $metrics as $metric ) : ?>
                    <li><strong><?php echo esc_html( $metric['value'] ?? '' ); ?></strong><span><?php echo esc_html( $metric['label'] ?? '' ); ?></span></li>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
        <span class="card-link-cue"><?php esc_html_e( 'Смотреть кейс', 'forma-hotel' ); ?></span>
    </div>
</a>

