<?php
/**
 * Native case post type and editor fields.
 *
 * @package Forma_Hotel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function forma_register_case_post_type() {
    $labels = array(
        'name'               => __( 'Кейсы', 'forma-hotel' ),
        'singular_name'      => __( 'Кейс', 'forma-hotel' ),
        'add_new'            => __( 'Добавить кейс', 'forma-hotel' ),
        'add_new_item'       => __( 'Добавить кейс', 'forma-hotel' ),
        'edit_item'          => __( 'Редактировать кейс', 'forma-hotel' ),
        'new_item'           => __( 'Новый кейс', 'forma-hotel' ),
        'view_item'          => __( 'Смотреть кейс', 'forma-hotel' ),
        'search_items'       => __( 'Найти кейсы', 'forma-hotel' ),
        'not_found'          => __( 'Кейсы не найдены', 'forma-hotel' ),
        'not_found_in_trash' => __( 'В корзине нет кейсов', 'forma-hotel' ),
        'menu_name'          => __( 'Кейсы', 'forma-hotel' ),
    );

    register_post_type(
        'forma_case',
        array(
            'labels'             => $labels,
            'public'             => true,
            'has_archive'        => false,
            'show_in_rest'       => true,
            'menu_icon'          => 'dashicons-chart-line',
            'rewrite'            => array(
                'slug'       => 'kejsy',
                'with_front' => false,
            ),
            'supports'           => array( 'title', 'excerpt', 'thumbnail', 'revisions', 'page-attributes' ),
            'publicly_queryable' => true,
            'show_in_nav_menus'  => true,
        )
    );
}
add_action( 'init', 'forma_register_case_post_type' );

function forma_case_add_meta_boxes() {
    add_meta_box(
        'forma-case-data',
        __( 'Данные кейса', 'forma-hotel' ),
        'forma_case_render_data_meta_box',
        'forma_case',
        'normal',
        'high'
    );
    add_meta_box(
        'forma-case-steps',
        __( 'Что сделали', 'forma-hotel' ),
        'forma_case_render_steps_meta_box',
        'forma_case',
        'normal',
        'default'
    );
    add_meta_box(
        'forma-case-metrics',
        __( 'Результаты', 'forma-hotel' ),
        'forma_case_render_metrics_meta_box',
        'forma_case',
        'normal',
        'default'
    );
}
add_action( 'add_meta_boxes_forma_case', 'forma_case_add_meta_boxes' );

function forma_case_meta_value( $post_id, $key, $default = '' ) {
    $value = get_post_meta( $post_id, '_forma_case_' . $key, true );
    return '' === $value ? $default : $value;
}

function forma_case_render_text_field( $post_id, $key, $label, $description = '' ) {
    $id    = 'forma-case-' . str_replace( '_', '-', $key );
    $value = forma_case_meta_value( $post_id, $key );
    ?>
    <p class="forma-case-field">
        <label for="<?php echo esc_attr( $id ); ?>"><strong><?php echo esc_html( $label ); ?></strong></label>
        <input class="widefat" id="<?php echo esc_attr( $id ); ?>" name="forma_case[<?php echo esc_attr( $key ); ?>]" type="text" value="<?php echo esc_attr( $value ); ?>">
        <?php if ( $description ) : ?>
            <span class="description"><?php echo esc_html( $description ); ?></span>
        <?php endif; ?>
    </p>
    <?php
}

function forma_case_render_textarea( $post_id, $key, $label, $description = '' ) {
    $id    = 'forma-case-' . str_replace( '_', '-', $key );
    $value = forma_case_meta_value( $post_id, $key );
    ?>
    <p class="forma-case-field">
        <label for="<?php echo esc_attr( $id ); ?>"><strong><?php echo esc_html( $label ); ?></strong></label>
        <textarea class="widefat" id="<?php echo esc_attr( $id ); ?>" name="forma_case[<?php echo esc_attr( $key ); ?>]" rows="6"><?php echo esc_textarea( $value ); ?></textarea>
        <?php if ( $description ) : ?>
            <span class="description"><?php echo esc_html( $description ); ?></span>
        <?php endif; ?>
    </p>
    <?php
}

function forma_case_render_data_meta_box( $post ) {
    wp_nonce_field( 'forma_save_case_meta', 'forma_case_nonce' );
    echo '<div class="forma-case-fields">';
    forma_case_render_text_field( $post->ID, 'object_type', __( 'Тип объекта', 'forma-hotel' ), __( 'Например: загородный отель.', 'forma-hotel' ) );
    forma_case_render_text_field( $post->ID, 'product', __( 'Продукт', 'forma-hotel' ), __( 'Номерной фонд, коттеджи или другая подтверждённая характеристика.', 'forma-hotel' ) );
    forma_case_render_text_field( $post->ID, 'location', __( 'Расположение', 'forma-hotel' ), __( 'Оставьте пустым, если локацию нельзя публиковать.', 'forma-hotel' ) );
    forma_case_render_text_field( $post->ID, 'format', __( 'Формат', 'forma-hotel' ), __( 'Например: городской отель или MICE.', 'forma-hotel' ) );
    forma_case_render_textarea( $post->ID, 'context', __( 'Контекст', 'forma-hotel' ), __( 'Исходная ситуация до начала работы.', 'forma-hotel' ) );
    forma_case_render_textarea( $post->ID, 'task', __( 'Задача', 'forma-hotel' ), __( 'Проблема или ограничение, которое требовалось снять.', 'forma-hotel' ) );
    forma_case_render_textarea( $post->ID, 'conclusion', __( 'Вывод', 'forma-hotel' ), __( 'Краткий вывод без новых неподтверждённых показателей.', 'forma-hotel' ) );
    ?>
    <p class="forma-case-field">
        <label for="forma-case-privacy-mode"><strong><?php esc_html_e( 'Режим публикации', 'forma-hotel' ); ?></strong></label>
        <?php $privacy_mode = forma_case_meta_value( $post->ID, 'privacy_mode', 'public' ); ?>
        <select id="forma-case-privacy-mode" name="forma_case[privacy_mode]">
            <option value="public" <?php selected( $privacy_mode, 'public' ); ?>><?php esc_html_e( 'Публичный кейс', 'forma-hotel' ); ?></option>
            <option value="anonymous_object" <?php selected( $privacy_mode, 'anonymous_object' ); ?>><?php esc_html_e( 'Анонимный объект', 'forma-hotel' ); ?></option>
            <option value="hide_metrics" <?php selected( $privacy_mode, 'hide_metrics' ); ?>><?php esc_html_e( 'Скрыть числовые показатели', 'forma-hotel' ); ?></option>
        </select>
    </p>
    <p class="forma-case-field">
        <label for="forma-case-featured-rank"><strong><?php esc_html_e( 'Позиция на главной', 'forma-hotel' ); ?></strong></label>
        <?php $featured_rank = (int) forma_case_meta_value( $post->ID, 'featured_rank', 0 ); ?>
        <select id="forma-case-featured-rank" name="forma_case[featured_rank]">
            <option value="0" <?php selected( $featured_rank, 0 ); ?>><?php esc_html_e( 'Не показывать на главной', 'forma-hotel' ); ?></option>
            <?php for ( $rank = 1; $rank <= 3; $rank++ ) : ?>
                <option value="<?php echo esc_attr( (string) $rank ); ?>" <?php selected( $featured_rank, $rank ); ?>><?php echo esc_html( sprintf( __( 'Позиция %d', 'forma-hotel' ), $rank ) ); ?></option>
            <?php endfor; ?>
        </select>
    </p>
    <?php
    echo '</div>';
}

function forma_case_render_repeater_row( $type, $index, $row ) {
    $is_steps    = 'steps' === $type;
    $first_key   = $is_steps ? 'title' : 'value';
    $second_key  = $is_steps ? 'body' : 'label';
    $first_label = $is_steps ? __( 'Название шага', 'forma-hotel' ) : __( 'Значение', 'forma-hotel' );
    $second_label = $is_steps ? __( 'Описание', 'forma-hotel' ) : __( 'Подпись', 'forma-hotel' );
    $first_value = isset( $row[ $first_key ] ) ? $row[ $first_key ] : '';
    $second_value = isset( $row[ $second_key ] ) ? $row[ $second_key ] : '';
    ?>
    <div class="forma-case-repeater__row" data-case-row>
        <p>
            <label><strong><?php echo esc_html( $first_label ); ?></strong>
                <input class="widefat" name="forma_case[<?php echo esc_attr( $type ); ?>][<?php echo esc_attr( (string) $index ); ?>][<?php echo esc_attr( $first_key ); ?>]" type="text" value="<?php echo esc_attr( $first_value ); ?>">
            </label>
        </p>
        <p>
            <label><strong><?php echo esc_html( $second_label ); ?></strong>
                <?php if ( $is_steps ) : ?>
                    <textarea class="widefat" name="forma_case[<?php echo esc_attr( $type ); ?>][<?php echo esc_attr( (string) $index ); ?>][<?php echo esc_attr( $second_key ); ?>]" rows="4"><?php echo esc_textarea( $second_value ); ?></textarea>
                <?php else : ?>
                    <input class="widefat" name="forma_case[<?php echo esc_attr( $type ); ?>][<?php echo esc_attr( (string) $index ); ?>][<?php echo esc_attr( $second_key ); ?>]" type="text" value="<?php echo esc_attr( $second_value ); ?>">
                <?php endif; ?>
            </label>
        </p>
        <button class="button-link-delete" type="button" data-case-remove><?php echo esc_html( $is_steps ? __( 'Удалить шаг', 'forma-hotel' ) : __( 'Удалить показатель', 'forma-hotel' ) ); ?></button>
    </div>
    <?php
}

function forma_case_render_repeater( $post_id, $type ) {
    $rows = forma_case_meta_value( $post_id, $type, array() );
    if ( ! is_array( $rows ) || empty( $rows ) ) {
        $rows = array( array() );
    }
    $is_steps = 'steps' === $type;
    ?>
    <div class="forma-case-repeater" data-case-repeater data-case-type="<?php echo esc_attr( $type ); ?>" data-case-limit="<?php echo esc_attr( $is_steps ? '8' : '6' ); ?>">
        <div data-case-rows>
            <?php foreach ( $rows as $index => $row ) : ?>
                <?php forma_case_render_repeater_row( $type, $index, is_array( $row ) ? $row : array() ); ?>
            <?php endforeach; ?>
        </div>
        <template data-case-template>
            <?php forma_case_render_repeater_row( $type, '__INDEX__', array() ); ?>
        </template>
        <button class="button" type="button" data-case-add><?php echo esc_html( $is_steps ? __( 'Добавить шаг', 'forma-hotel' ) : __( 'Добавить показатель', 'forma-hotel' ) ); ?></button>
        <p class="description" data-case-limit-message hidden><?php echo esc_html( $is_steps ? __( 'Можно добавить до 8 шагов.', 'forma-hotel' ) : __( 'Можно добавить до 6 показателей.', 'forma-hotel' ) ); ?></p>
    </div>
    <?php
}

function forma_case_render_steps_meta_box( $post ) {
    forma_case_render_repeater( $post->ID, 'steps' );
}

function forma_case_render_metrics_meta_box( $post ) {
    forma_case_render_repeater( $post->ID, 'metrics' );
}

function forma_case_allowed_html() {
    return array(
        'p'      => array(),
        'br'     => array(),
        'strong' => array(),
        'em'     => array(),
        'ul'     => array(),
        'ol'     => array(),
        'li'     => array(),
        'a'      => array(
            'href'   => array(),
            'target' => array(),
            'rel'    => array(),
        ),
    );
}

function forma_case_sanitize_repeater( $rows, $type ) {
    if ( ! is_array( $rows ) ) {
        return array();
    }
    $is_steps = 'steps' === $type;
    $limit    = $is_steps ? 8 : 6;
    $clean    = array();

    foreach ( array_slice( $rows, 0, $limit ) as $row ) {
        if ( ! is_array( $row ) ) {
            continue;
        }
        if ( $is_steps ) {
            $item = array(
                'title' => sanitize_text_field( $row['title'] ?? '' ),
                'body'  => wp_kses( $row['body'] ?? '', forma_case_allowed_html() ),
            );
        } else {
            $item = array(
                'value' => sanitize_text_field( $row['value'] ?? '' ),
                'label' => sanitize_text_field( $row['label'] ?? '' ),
            );
        }
        if ( implode( '', array_values( $item ) ) !== '' ) {
            $clean[] = $item;
        }
    }
    return $clean;
}

function forma_save_case_meta( $post_id ) {
    if ( ! isset( $_POST['forma_case_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['forma_case_nonce'] ) ), 'forma_save_case_meta' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( 'forma_case' !== get_post_type( $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    $input = isset( $_POST['forma_case'] ) && is_array( $_POST['forma_case'] ) ? wp_unslash( $_POST['forma_case'] ) : array();
    foreach ( array( 'object_type', 'product', 'location', 'format' ) as $key ) {
        update_post_meta( $post_id, '_forma_case_' . $key, sanitize_text_field( $input[ $key ] ?? '' ) );
    }
    foreach ( array( 'context', 'task', 'conclusion' ) as $key ) {
        update_post_meta( $post_id, '_forma_case_' . $key, wp_kses( $input[ $key ] ?? '', forma_case_allowed_html() ) );
    }
    update_post_meta( $post_id, '_forma_case_steps', forma_case_sanitize_repeater( $input['steps'] ?? array(), 'steps' ) );
    update_post_meta( $post_id, '_forma_case_metrics', forma_case_sanitize_repeater( $input['metrics'] ?? array(), 'metrics' ) );

    $privacy_modes = array( 'public', 'anonymous_object', 'hide_metrics' );
    $privacy_mode  = sanitize_key( $input['privacy_mode'] ?? 'public' );
    update_post_meta( $post_id, '_forma_case_privacy_mode', in_array( $privacy_mode, $privacy_modes, true ) ? $privacy_mode : 'public' );
    $featured_rank = min( 3, max( 0, absint( $input['featured_rank'] ?? 0 ) ) );
    update_post_meta( $post_id, '_forma_case_featured_rank', $featured_rank );
}
add_action( 'save_post_forma_case', 'forma_save_case_meta' );

