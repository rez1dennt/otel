<?php
/**
 * Theme functions for FORMA Hotel.
 *
 * @package Forma_Hotel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'FORMA_HOTEL_VERSION', '0.1.0' );

$forma_setup_file = get_theme_file_path( '/inc/theme-setup.php' );
if ( file_exists( $forma_setup_file ) ) {
    require_once $forma_setup_file;
}

function forma_hotel_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo' );
    add_theme_support(
        'html5',
        array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' )
    );
    register_nav_menus(
        array(
            'primary' => __( 'Основная навигация', 'forma-hotel' ),
        )
    );
}
add_action( 'after_setup_theme', 'forma_hotel_setup' );

function forma_theme_asset_version( $relative_path ) {
    $absolute_path = get_theme_file_path( $relative_path );
    return file_exists( $absolute_path ) ? (string) filemtime( $absolute_path ) : FORMA_HOTEL_VERSION;
}

function forma_hotel_enqueue_assets() {
    wp_enqueue_style(
        'forma-hotel-styles',
        get_theme_file_uri( '/assets/css/styles.css' ),
        array(),
        forma_theme_asset_version( '/assets/css/styles.css' )
    );
    wp_enqueue_script(
        'forma-hotel-main',
        get_theme_file_uri( '/assets/js/main.js' ),
        array(),
        forma_theme_asset_version( '/assets/js/main.js' ),
        true
    );
}
add_action( 'wp_enqueue_scripts', 'forma_hotel_enqueue_assets' );

function forma_hotel_module_script_tag( $tag, $handle ) {
    if ( 'forma-hotel-main' !== $handle ) {
        return $tag;
    }
    return preg_replace( '/^<script /', '<script type="module" ', $tag, 1 );
}
add_filter( 'script_loader_tag', 'forma_hotel_module_script_tag', 10, 2 );

function forma_replace_demo_urls( $value ) {
    if ( is_array( $value ) ) {
        return array_map( 'forma_replace_demo_urls', $value );
    }
    if ( is_string( $value ) && str_starts_with( $value, 'https://example.ru' ) ) {
        $path = substr( $value, strlen( 'https://example.ru' ) );
        return home_url( $path ? $path : '/' );
    }
    return $value;
}

function forma_hotel_render_snapshot_meta() {
    $meta   = isset( $GLOBALS['forma_page_meta'] ) && is_array( $GLOBALS['forma_page_meta'] ) ? $GLOBALS['forma_page_meta'] : array();
    $schema = isset( $GLOBALS['forma_page_schema'] ) && is_array( $GLOBALS['forma_page_schema'] ) ? $GLOBALS['forma_page_schema'] : array();

    if ( ! empty( $meta['description'] ) ) {
        echo '<meta name="description" content="' . esc_attr( $meta['description'] ) . '">' . "\n";
    }
    $canonical_path = isset( $meta['canonical_path'] ) ? $meta['canonical_path'] : '/';
    $canonical_url  = home_url( $canonical_path );
    echo '<link rel="canonical" href="' . esc_url( $canonical_url ) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url( $canonical_url ) . '">' . "\n";
    echo '<meta property="og:type" content="' . esc_attr( $meta['og_type'] ?? 'website' ) . '">' . "\n";
    if ( ! empty( $meta['og_image'] ) ) {
        echo '<meta property="og:image" content="' . esc_url( get_theme_file_uri( $meta['og_image'] ) ) . '">' . "\n";
    }
    foreach ( $schema as $schema_block ) {
        $schema_block = forma_replace_demo_urls( $schema_block );
        echo '<script type="application/ld+json">' . wp_json_encode( $schema_block, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
    }
}
remove_action( 'wp_head', 'rel_canonical' );
add_action( 'wp_head', 'forma_hotel_render_snapshot_meta', 2 );

class Forma_Direct_Nav_Walker extends Walker_Nav_Menu {
    public function start_lvl( &$output, $depth = 0, $args = null ) {}
    public function end_lvl( &$output, $depth = 0, $args = null ) {}
    public function start_el( &$output, $item, $depth = 0, $args = null, $id = 0 ) {
        $classes = is_array( $item->classes ) ? $item->classes : array();
        $class   = in_array( 'current-menu-item', $classes, true ) ? ' class="is-current" aria-current="page"' : '';
        $output .= '<a' . $class . ' href="' . esc_url( $item->url ) . '">' . esc_html( $item->title ) . '</a>';
    }
    public function end_el( &$output, $item, $depth = 0, $args = null ) {}
}

function forma_primary_menu_fallback( $args = array() ) {
    $links = array(
        '/'            => 'Главная',
        '/uslugi/'     => 'Услуги',
        '/o-proekte/'  => 'О проекте',
        '/kejsy/'      => 'Кейсы',
        '/poleznoe/'   => 'Полезное',
        '/kontakty/'   => 'Контакты',
    );
    foreach ( $links as $path => $label ) {
        echo '<a href="' . esc_url( home_url( $path ) ) . '">' . esc_html( $label ) . '</a>';
    }
}

