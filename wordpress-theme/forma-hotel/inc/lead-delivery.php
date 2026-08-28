<?php
/**
 * Secure lead delivery for the public forms.
 *
 * Credentials are read from wp-config.php and never exposed to the browser.
 *
 * @package Forma_Hotel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const FORMA_HOTEL_LEAD_ACTION = 'forma_submit_lead';
const FORMA_HOTEL_LEAD_RATE_TTL = 60;

/**
 * Return messages that are safe to display to a public visitor.
 *
 * @return array<string, string>
 */
function forma_hotel_lead_messages() {
    return array(
        'loading' => 'Отправляем заявку…',
        'success' => 'Заявка отправлена. Свяжемся с вами по указанным контактам',
        'error'   => 'Не удалось отправить заявку. Позвоните или напишите на электронную почту',
    );
}

/**
 * Return the public browser configuration. No SMTP value belongs here.
 *
 * @return array<string, mixed>
 */
function forma_hotel_lead_config() {
    return array(
        'ajaxUrl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( FORMA_HOTEL_LEAD_ACTION ),
        'action'  => FORMA_HOTEL_LEAD_ACTION,
        'messages' => forma_hotel_lead_messages(),
    );
}

/**
 * Determine whether the host has a usable server-side SMTP configuration.
 */
function forma_hotel_smtp_is_configured() {
    return defined( 'FORMA_SMTP_USER' )
        && defined( 'FORMA_SMTP_PASSWORD' )
        && is_string( FORMA_SMTP_USER )
        && is_string( FORMA_SMTP_PASSWORD )
        && '' !== trim( FORMA_SMTP_USER )
        && '' !== FORMA_SMTP_PASSWORD
        && (bool) is_email( FORMA_SMTP_USER );
}

/**
 * Resolve a validated recipient without exposing it publicly.
 */
function forma_hotel_lead_recipient() {
    $recipient = defined( 'FORMA_LEAD_RECIPIENT' ) ? FORMA_LEAD_RECIPIENT : FORMA_SMTP_USER;
    $recipient = is_string( $recipient ) ? sanitize_email( $recipient ) : '';

    return is_email( $recipient ) ? $recipient : '';
}

/**
 * Configure WordPress PHPMailer for Yandex SMTPS.
 *
 * @param PHPMailer\PHPMailer\PHPMailer $phpmailer WordPress mailer instance.
 */
function forma_hotel_configure_phpmailer( $phpmailer ) {
    if ( ! forma_hotel_smtp_is_configured() ) {
        return;
    }

    $phpmailer->isSMTP();
    $phpmailer->Host        = 'smtp.yandex.ru';
    $phpmailer->Port        = 465;
    $phpmailer->SMTPAuth    = true;
    $phpmailer->SMTPSecure  = 'ssl';
    $phpmailer->SMTPAutoTLS = false;
    $phpmailer->Username    = FORMA_SMTP_USER;
    $phpmailer->Password    = FORMA_SMTP_PASSWORD;
    $phpmailer->From        = FORMA_SMTP_USER;
    $phpmailer->FromName    = 'FORMA hotel advisory';
    $phpmailer->CharSet     = 'UTF-8';
}
add_action( 'phpmailer_init', 'forma_hotel_configure_phpmailer' );

/**
 * Build a short-lived, irreversible rate-limit key for the visitor address.
 */
function forma_hotel_lead_rate_key() {
    $remote_address = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
    return 'forma_lead_' . substr( wp_hash( $remote_address ), 0, 40 );
}

/**
 * Return one public JSON error and stop request processing.
 *
 * @param int $status HTTP status.
 */
function forma_hotel_lead_error( $status = 400 ) {
    $messages = forma_hotel_lead_messages();
    wp_send_json_error( array( 'message' => $messages['error'] ), $status );
}

/**
 * Process an unauthenticated or authenticated public lead request.
 */
function forma_hotel_submit_lead() {
    if ( 'POST' !== strtoupper( (string) ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) ) {
        forma_hotel_lead_error( 405 );
    }

    if ( ! check_ajax_referer( 'forma_submit_lead', 'nonce', false ) ) {
        forma_hotel_lead_error( 403 );
    }

    if ( ! array_key_exists( 'website', $_POST ) ) {
        forma_hotel_lead_error( 400 );
    }

    $honeypot = sanitize_text_field( wp_unslash( $_POST['website'] ) );
    if ( '' !== $honeypot ) {
        $messages = forma_hotel_lead_messages();
        wp_send_json_success( array( 'message' => $messages['success'] ) );
    }

    $rate_key = forma_hotel_lead_rate_key();
    if ( get_transient( $rate_key ) ) {
        forma_hotel_lead_error( 429 );
    }

    if ( ! forma_hotel_smtp_is_configured() || ! forma_hotel_lead_recipient() ) {
        forma_hotel_lead_error( 503 );
    }

    $name     = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
    $phone    = sanitize_text_field( wp_unslash( $_POST['phone'] ?? '' ) );
    $email    = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
    $message  = sanitize_textarea_field( wp_unslash( $_POST['message'] ?? '' ) );
    $page_url = esc_url_raw( wp_unslash( $_POST['page_url'] ?? '' ) );
    $consent  = sanitize_text_field( wp_unslash( $_POST['consent'] ?? '' ) );
    $digits   = preg_replace( '/\D+/u', '', $phone );

    if (
        '' === $name
        || ! is_email( $email )
        || strlen( (string) $digits ) < 7
        || ! in_array( $consent, array( 'on', '1' ), true )
        || strlen( $name ) > 240
        || strlen( $phone ) > 80
        || strlen( $email ) > 254
        || strlen( $message ) > 6000
    ) {
        forma_hotel_lead_error( 422 );
    }

    set_transient( $rate_key, 1, FORMA_HOTEL_LEAD_RATE_TTL );

    $body = implode(
        "\n",
        array(
            'Новая заявка с сайта FORMA Hotel',
            '',
            'Имя: ' . $name,
            'Телефон: ' . $phone,
            'Электронная почта: ' . $email,
            'Страница: ' . ( $page_url ?: home_url( '/' ) ),
            '',
            'Сообщение:',
            $message ?: 'Не указано',
        )
    );
    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . $email,
    );
    $sent = wp_mail(
        forma_hotel_lead_recipient(),
        'Новая заявка с сайта FORMA Hotel',
        $body,
        $headers
    );

    if ( ! $sent ) {
        forma_hotel_lead_error( 500 );
    }

    $messages = forma_hotel_lead_messages();
    wp_send_json_success( array( 'message' => $messages['success'] ) );
}
add_action( 'wp_ajax_forma_submit_lead', 'forma_hotel_submit_lead' );
add_action( 'wp_ajax_nopriv_forma_submit_lead', 'forma_hotel_submit_lead' );

/**
 * Tell administrators when host-only configuration is still missing.
 */
function forma_hotel_lead_configuration_notice() {
    if ( forma_hotel_smtp_is_configured() || ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="notice notice-warning"><p><?php esc_html_e( 'FORMA Hotel: добавьте SMTP-константы в wp-config.php, чтобы заявки отправлялись на почту.', 'forma-hotel' ); ?></p></div>
    <?php
}
add_action( 'admin_notices', 'forma_hotel_lead_configuration_notice' );
