<?php
/** GENERATED FILE. Edit 404.html and rerun the theme generator. */
$GLOBALS['forma_page_meta'] = array(
    'description' => 'Запрошенная страница не найдена. Вернитесь на главную или перейдите к услугам.',
    'canonical_path' => '/404/',
    'og_type' => 'website',
    'og_image' => '/assets/images/hero-hotel.webp',
);
$GLOBALS['forma_page_schema'] = array();
get_header();
?>
<main id="main-content" class="not-found"><div class="not-found__art" aria-hidden="true">404</div><div><p class="eyebrow">Страница не найдена</p><h1>Страница не найдена</h1><p>Возможно, ссылка изменилась. Перейдите на главную или посмотрите направления работы.</p><div><a class="button" href="<?php echo esc_url( home_url( '/' ) ); ?>">На главную</a><a class="button button--secondary" href="<?php echo esc_url( home_url( '/uslugi/' ) ); ?>">Посмотреть услуги</a></div></div></main>
<?php get_footer(); ?>
