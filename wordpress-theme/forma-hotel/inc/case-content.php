<?php
/**
 * Public case helpers, metadata and redirects.
 *
 * @package Forma_Hotel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function forma_case_get_fields( $post_id ) {
    $fields = array();
    foreach ( array( 'object_type', 'product', 'location', 'format', 'context', 'task', 'steps', 'metrics', 'conclusion', 'privacy_mode', 'featured_rank', 'fallback_image' ) as $key ) {
        $fields[ $key ] = forma_case_meta_value( $post_id, $key, in_array( $key, array( 'steps', 'metrics' ), true ) ? array() : '' );
    }
    if ( ! is_array( $fields['steps'] ) ) {
        $fields['steps'] = array();
    }
    if ( ! is_array( $fields['metrics'] ) ) {
        $fields['metrics'] = array();
    }
    if ( 'hide_metrics' === $fields['privacy_mode'] ) {
        $fields['metrics'] = array();
    }
    return $fields;
}

function forma_case_image_url( $post_id ) {
    $thumbnail = get_the_post_thumbnail_url( $post_id, 'large' );
    if ( $thumbnail ) {
        return $thumbnail;
    }
    $fallback = (string) forma_case_meta_value( $post_id, 'fallback_image', 'assets/images/case-lobby.webp' );
    if ( ! str_starts_with( $fallback, 'assets/images/' ) ) {
        $fallback = 'assets/images/case-lobby.webp';
    }
    return get_theme_file_uri( '/' . ltrim( $fallback, '/' ) );
}

function forma_case_image_alt( $post_id ) {
    $thumbnail_id = get_post_thumbnail_id( $post_id );
    if ( $thumbnail_id ) {
        $alt = get_post_meta( $thumbnail_id, '_wp_attachment_image_alt', true );
        if ( $alt ) {
            return $alt;
        }
    }
    return sprintf( __( 'Иллюстрация: %s', 'forma-hotel' ), get_the_title( $post_id ) );
}

function forma_case_archive_query( $limit = -1, $featured = false ) {
    $args = array(
        'post_type'           => 'forma_case',
        'post_status'         => 'publish',
        'posts_per_page'      => (int) $limit,
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
        'order'               => 'ASC',
        'orderby'             => array( 'menu_order' => 'ASC', 'date' => 'ASC' ),
    );
    if ( $featured ) {
        $args['meta_key'] = '_forma_case_featured_rank';
        $args['orderby']  = array( 'meta_value_num' => 'ASC', 'menu_order' => 'ASC' );
        $args['meta_query'] = array(
            array(
                'key'     => '_forma_case_featured_rank',
                'value'   => 0,
                'compare' => '>',
                'type'    => 'NUMERIC',
            ),
        );
    }
    return new WP_Query( $args );
}

function forma_case_single_schema( $post ) {
    $post_id = $post instanceof WP_Post ? $post->ID : (int) $post;
    return array(
        '@context' => 'https://schema.org',
        '@graph'   => array(
            array(
                '@type'        => 'Article',
                'headline'     => get_the_title( $post_id ),
                'description'  => get_the_excerpt( $post_id ),
                'url'          => get_permalink( $post_id ),
                'image'        => forma_case_image_url( $post_id ),
                'inLanguage'   => 'ru-RU',
                'datePublished'=> get_the_date( 'c', $post_id ),
                'dateModified' => get_the_modified_date( 'c', $post_id ),
                'author'       => array(
                    '@type' => 'Person',
                    'name'  => 'Виталина Погорила',
                ),
            ),
            array(
                '@type'           => 'BreadcrumbList',
                'itemListElement' => array(
                    array( '@type' => 'ListItem', 'position' => 1, 'name' => __( 'Главная', 'forma-hotel' ), 'item' => home_url( '/' ) ),
                    array( '@type' => 'ListItem', 'position' => 2, 'name' => __( 'Кейсы', 'forma-hotel' ), 'item' => home_url( '/kejsy/' ) ),
                    array( '@type' => 'ListItem', 'position' => 3, 'name' => get_the_title( $post_id ), 'item' => get_permalink( $post_id ) ),
                ),
            ),
        ),
    );
}

function forma_case_archive_schema( $posts = null ) {
    if ( null === $posts ) {
        $query = forma_case_archive_query();
        $posts = $query->posts;
        wp_reset_postdata();
    }
    $items = array();
    foreach ( is_array( $posts ) ? $posts : array() as $index => $post ) {
        $items[] = array(
            '@type'    => 'ListItem',
            'position' => $index + 1,
            'name'     => get_the_title( $post ),
            'url'      => get_permalink( $post ),
        );
    }
    return array(
        '@context' => 'https://schema.org',
        '@graph'   => array(
            array(
                '@type'       => 'CollectionPage',
                'name'        => __( 'Кейсы гостиничного консалтинга', 'forma-hotel' ),
                'url'         => home_url( '/kejsy/' ),
                'inLanguage'  => 'ru-RU',
            ),
            array(
                '@type'           => 'ItemList',
                'itemListElement' => $items,
            ),
        ),
    );
}

function forma_case_prepare_runtime_meta() {
    if ( ! is_singular( 'forma_case' ) ) {
        return;
    }
    $post = get_queried_object();
    if ( ! $post instanceof WP_Post ) {
        return;
    }
    $GLOBALS['forma_page_meta'] = array(
        'description'    => get_the_excerpt( $post ),
        'canonical_url'  => get_permalink( $post ),
        'og_type'        => 'article',
        'og_image_url'   => forma_case_image_url( $post->ID ),
    );
    $GLOBALS['forma_page_schema'] = array( forma_case_single_schema( $post ) );
}
add_action( 'wp', 'forma_case_prepare_runtime_meta' );

function forma_case_legacy_redirect() {
    if ( is_admin() || ! isset( $_SERVER['REQUEST_URI'] ) ) {
        return;
    }
    $request_uri = sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) );
    $path        = wp_parse_url( $request_uri, PHP_URL_PATH );
    if ( '/kejsy/rost-pryamyh-prodazh/' === trailingslashit( $path ) ) {
        wp_safe_redirect( home_url( '/kejsy/' ), 301 );
        exit;
    }
}
add_action( 'template_redirect', 'forma_case_legacy_redirect', 1 );

