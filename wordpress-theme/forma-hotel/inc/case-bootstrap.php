<?php
/**
 * Non-destructive initial case import.
 *
 * @package Forma_Hotel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function forma_load_case_seed_data() {
    $file = get_theme_file_path( '/inc/data/cases.json' );
    if ( ! file_exists( $file ) ) {
        return new WP_Error( 'forma_case_seed_missing', __( 'Не найден файл начальных кейсов.', 'forma-hotel' ) );
    }
    $contents = file_get_contents( $file );
    if ( false === $contents ) {
        return new WP_Error( 'forma_case_seed_unreadable', __( 'Не удалось прочитать файл начальных кейсов.', 'forma-hotel' ) );
    }
    $records = json_decode( $contents, true );
    if ( ! is_array( $records ) || JSON_ERROR_NONE !== json_last_error() ) {
        return new WP_Error( 'forma_case_seed_invalid', __( 'Файл начальных кейсов содержит некорректный JSON.', 'forma-hotel' ) );
    }
    return $records;
}

function forma_find_seeded_case( $record ) {
    $seed_matches = get_posts(
        array(
            'post_type'      => 'forma_case',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_key'       => '_forma_case_seed_id',
            'meta_value'     => sanitize_text_field( $record['seedId'] ?? '' ),
        )
    );
    if ( ! empty( $seed_matches ) ) {
        return (int) $seed_matches[0];
    }

    $slug_matches = get_posts(
        array(
            'post_type'      => 'forma_case',
            'post_status'    => 'any',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'name'           => $record['slug'],
        )
    );
    return empty( $slug_matches ) ? 0 : (int) $slug_matches[0];
}

function forma_seed_case_meta( $post_id, $record ) {
    $text_map = array(
        'object_type' => 'objectType',
        'product'     => 'product',
        'location'    => 'location',
        'format'      => 'format',
    );
    foreach ( $text_map as $meta_key => $record_key ) {
        update_post_meta( $post_id, '_forma_case_' . $meta_key, sanitize_text_field( $record[ $record_key ] ?? '' ) );
    }

    foreach ( array( 'context', 'task', 'conclusion' ) as $key ) {
        update_post_meta( $post_id, '_forma_case_' . $key, wp_kses( $record[ $key ] ?? '', forma_case_allowed_html() ) );
    }
    update_post_meta( $post_id, '_forma_case_steps', forma_case_sanitize_repeater( $record['steps'] ?? array(), 'steps' ) );
    update_post_meta( $post_id, '_forma_case_metrics', forma_case_sanitize_repeater( $record['metrics'] ?? array(), 'metrics' ) );
    update_post_meta( $post_id, '_forma_case_privacy_mode', 'public' );
    update_post_meta( $post_id, '_forma_case_featured_rank', min( 3, max( 0, absint( $record['featuredRank'] ?? 0 ) ) ) );
    update_post_meta( $post_id, '_forma_case_seed_id', sanitize_text_field( $record['seedId'] ?? '' ) );
    update_post_meta( $post_id, '_forma_case_fallback_image', sanitize_text_field( $record['fallbackImage'] ?? 'assets/images/case-lobby.webp' ) );
}

function forma_seed_cases() {
    if ( ! post_type_exists( 'forma_case' ) ) {
        forma_register_case_post_type();
    }
    $records = forma_load_case_seed_data();
    if ( is_wp_error( $records ) ) {
        return array(
            'created' => array(),
            'errors'  => array(
                array(
                    'path'    => 'cases',
                    'message' => $records->get_error_message(),
                ),
            ),
        );
    }

    $created = array();
    $errors  = array();
    foreach ( $records as $record ) {
        if ( ! is_array( $record ) || empty( $record['seedId'] ) || empty( $record['slug'] ) || empty( $record['title'] ) ) {
            $errors[] = array(
                'path'    => 'cases',
                'message' => __( 'Пропущен кейс с неполными обязательными данными.', 'forma-hotel' ),
            );
            continue;
        }
        if ( forma_find_seeded_case( $record ) ) {
            continue;
        }

        $post_id = wp_insert_post(
            array(
                'post_type'    => 'forma_case',
                'post_status'  => 'publish',
                'post_title'   => sanitize_text_field( $record['title'] ),
                'post_name'    => sanitize_title( $record['slug'] ),
                'post_excerpt' => sanitize_textarea_field( $record['excerpt'] ?? '' ),
                'menu_order'   => absint( $record['menuOrder'] ?? 0 ),
            ),
            true
        );
        if ( is_wp_error( $post_id ) ) {
            $errors[] = array(
                'path'    => 'case:' . sanitize_title( $record['slug'] ),
                'message' => $post_id->get_error_message(),
            );
            continue;
        }
        forma_seed_case_meta( $post_id, $record );
        $created[] = (int) $post_id;
    }

    return array(
        'created' => $created,
        'errors'  => $errors,
    );
}

