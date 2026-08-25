<?php
/**
 * Shared site header.
 *
 * @package Forma_Hotel
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main-content"><?php esc_html_e( 'Перейти к содержанию', 'forma-hotel' ); ?></a>
<header class="site-header">
    <a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="FORMA, на главную">
        <span class="brand__mark" aria-hidden="true">F</span>
        <span class="brand__name">FORMA <small>hotel advisory</small></span>
    </a>

    <nav class="site-nav" aria-label="Основная навигация">
        <?php
        wp_nav_menu(
            array(
                'theme_location' => 'primary',
                'container'      => false,
                'items_wrap'     => '%3$s',
                'fallback_cb'    => 'forma_primary_menu_fallback',
                'walker'         => new Forma_Direct_Nav_Walker(),
                'depth'          => 1,
            )
        );
        ?>
    </nav>

    <div class="site-header__actions">
        <button class="button button--header" type="button" data-modal-open>Обсудить проект</button>
        <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu" aria-label="Открыть меню">
            <span class="menu-toggle__icon" aria-hidden="true"><span class="menu-toggle__line"></span><span class="menu-toggle__line"></span><span class="menu-toggle__line"></span></span>
        </button>
    </div>

    <div class="mobile-menu" id="mobile-menu" data-mobile-menu hidden aria-hidden="true">
        <nav aria-label="Мобильная навигация">
            <?php
            wp_nav_menu(
                array(
                    'theme_location' => 'primary',
                    'container'      => false,
                    'items_wrap'     => '%3$s',
                    'fallback_cb'    => 'forma_primary_menu_fallback',
                    'walker'         => new Forma_Direct_Nav_Walker(),
                    'depth'          => 1,
                )
            );
            ?>
        </nav>
        <button class="button" type="button" data-modal-open>Обсудить проект</button>
    </div>
</header>

