<?php
/**
 * Idempotent first-run site bootstrap.
 *
 * @package Forma_Hotel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function forma_hotel_routes() {
    $routes_file = get_theme_file_path( '/inc/generated-routes.php' );
    if ( ! file_exists( $routes_file ) ) {
        return array();
    }
    $routes = require $routes_file;
    return is_array( $routes ) ? $routes : array();
}

function forma_route_lookup_path( $path ) {
    if ( '/' === $path ) {
        return 'home';
    }
    return trim( $path, '/' );
}

function forma_find_page_by_path( $path ) {
    $page = get_page_by_path( forma_route_lookup_path( $path ), OBJECT, 'page' );
    return $page instanceof WP_Post ? $page : null;
}

function forma_hotel_route_depth( $route ) {
    return count( array_filter( explode( '/', trim( $route['path'], '/' ) ) ) );
}

function forma_hotel_bootstrap_site() {
    $routes = forma_hotel_routes();
    $errors = array();
    $pages  = array();

    if ( function_exists( 'forma_seed_cases' ) ) {
        $case_result = forma_seed_cases();
        if ( ! empty( $case_result['errors'] ) && is_array( $case_result['errors'] ) ) {
            $errors = array_merge( $errors, $case_result['errors'] );
        }
    }

    if ( empty( $routes ) ) {
        $errors[] = array(
            'path'    => 'manifest',
            'message' => __( 'Не найден сгенерированный список маршрутов темы.', 'forma-hotel' ),
        );
    }

    usort(
        $routes,
        function ( $left, $right ) {
            return forma_hotel_route_depth( $left ) <=> forma_hotel_route_depth( $right );
        }
    );

    foreach ( $routes as $route ) {
        $path = $route['path'];
        $page = forma_find_page_by_path( $path );
        if ( $page ) {
            $pages[ $path ] = (int) $page->ID;
            continue;
        }

        $parent_id = 0;
        if ( ! empty( $route['parent_path'] ) ) {
            $parent_id = isset( $pages[ $route['parent_path'] ] ) ? (int) $pages[ $route['parent_path'] ] : 0;
            if ( ! $parent_id ) {
                $parent = forma_find_page_by_path( $route['parent_path'] );
                $parent_id = $parent ? (int) $parent->ID : 0;
            }
            if ( ! $parent_id ) {
                $errors[] = array(
                    'path'    => $path,
                    'message' => sprintf( __( 'Не найдена родительская страница %s.', 'forma-hotel' ), $route['parent_path'] ),
                );
                continue;
            }
        }

        $post_id = wp_insert_post(
            array(
                'post_type'    => 'page',
                'post_status'  => 'publish',
                'post_title'   => $route['title'],
                'post_name'    => $route['slug'],
                'post_parent'  => $parent_id,
                'post_content' => '',
            ),
            true
        );

        if ( is_wp_error( $post_id ) ) {
            $errors[] = array(
                'path'    => $path,
                'message' => $post_id->get_error_message(),
            );
            continue;
        }

        $pages[ $path ] = (int) $post_id;
        if ( '/' !== $path && ! empty( $route['output'] ) ) {
            update_post_meta( $post_id, '_wp_page_template', sanitize_file_name( $route['output'] ) );
        }
    }

    if ( isset( $pages['/'] ) ) {
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', (int) $pages['/'] );
    } else {
        $errors[] = array(
            'path'    => '/',
            'message' => __( 'Главная страница не была создана.', 'forma-hotel' ),
        );
    }

    $permalink_structure = (string) get_option( 'permalink_structure', '' );
    if ( '' === $permalink_structure || '/?p=%post_id%' === $permalink_structure ) {
        update_option( 'permalink_structure', '/%postname%/' );
    }

    $menu_name = 'FORMA Primary';
    $menu      = wp_get_nav_menu_object( $menu_name );
    $menu_id   = $menu ? (int) $menu->term_id : wp_create_nav_menu( $menu_name );
    if ( is_wp_error( $menu_id ) ) {
        $errors[] = array(
            'path'    => 'menu',
            'message' => $menu_id->get_error_message(),
        );
    } else {
        $existing_items = wp_get_nav_menu_items( $menu_id );
        $existing_ids   = array();
        foreach ( is_array( $existing_items ) ? $existing_items : array() as $item ) {
            if ( 'page' === $item->object ) {
                $existing_ids[] = (int) $item->object_id;
            }
        }

        $menu_routes = array_values(
            array_filter(
                $routes,
                function ( $route ) {
                    return null !== $route['menu_order'];
                }
            )
        );
        usort(
            $menu_routes,
            function ( $left, $right ) {
                return (int) $left['menu_order'] <=> (int) $right['menu_order'];
            }
        );

        foreach ( $menu_routes as $position => $route ) {
            $page_id = $pages[ $route['path'] ] ?? 0;
            if ( ! $page_id || in_array( (int) $page_id, $existing_ids, true ) ) {
                continue;
            }
            $item_id = wp_update_nav_menu_item(
                $menu_id,
                0,
                array(
                    'menu-item-object-id' => (int) $page_id,
                    'menu-item-object'    => 'page',
                    'menu-item-type'      => 'post_type',
                    'menu-item-status'    => 'publish',
                    'menu-item-title'     => $route['menu_label'],
                    'menu-item-position'  => $position + 1,
                )
            );
            if ( is_wp_error( $item_id ) ) {
                $errors[] = array(
                    'path'    => 'menu:' . $route['path'],
                    'message' => $item_id->get_error_message(),
                );
            }
        }

        $locations            = get_theme_mod( 'nav_menu_locations', array() );
        $locations['primary'] = (int) $menu_id;
        set_theme_mod( 'nav_menu_locations', $locations );
    }

    update_option( 'forma_hotel_bootstrap_version', FORMA_HOTEL_VERSION );
    if ( empty( $errors ) ) {
        delete_option( 'forma_hotel_bootstrap_errors' );
    } else {
        update_option( 'forma_hotel_bootstrap_errors', $errors );
    }
    flush_rewrite_rules( false );
}
add_action( 'after_switch_theme', 'forma_hotel_bootstrap_site' );

function forma_bootstrap_admin_notice() {
    $errors = get_option( 'forma_hotel_bootstrap_errors', array() );
    if ( empty( $errors ) || ! current_user_can( 'manage_options' ) ) {
        return;
    }
    echo '<div class="notice notice-error"><p><strong>' . esc_html__( 'FORMA Hotel: не все страницы удалось подготовить.', 'forma-hotel' ) . '</strong></p><ul>';
    foreach ( $errors as $error ) {
        echo '<li><code>' . esc_html( $error['path'] ?? '' ) . '</code>: ' . esc_html( $error['message'] ?? '' ) . '</li>';
    }
    echo '</ul></div>';
}
add_action( 'admin_notices', 'forma_bootstrap_admin_notice' );
