<?php
/**
 * Single case template.
 *
 * @package Forma_Hotel
 */

get_header();
?>
<?php while ( have_posts() ) : ?>
    <?php the_post(); ?>
    <?php $case_fields = forma_case_get_fields( get_the_ID() ); ?>
    <main id="main-content">
        <nav class="container breadcrumb" aria-label="<?php esc_attr_e( 'Хлебные крошки', 'forma-hotel' ); ?>" data-breadcrumb>
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Главная', 'forma-hotel' ); ?></a><span aria-hidden="true">/</span>
            <a href="<?php echo esc_url( home_url( '/kejsy/' ) ); ?>"><?php esc_html_e( 'Кейсы', 'forma-hotel' ); ?></a><span aria-hidden="true">/</span>
            <span aria-current="page"><?php the_title(); ?></span>
        </nav>
        <section class="case-hero"><div class="container">
            <p class="eyebrow"><?php echo esc_html( sprintf( __( 'Кейс · %s', 'forma-hotel' ), $case_fields['object_type'] ) ); ?></p>
            <h1><?php the_title(); ?></h1>
            <p class="article-lead"><?php echo esc_html( get_the_excerpt() ); ?></p>
            <?php if ( $case_fields['metrics'] ) : ?>
                <ul class="case-metrics case-metrics--hero">
                    <?php foreach ( $case_fields['metrics'] as $metric ) : ?>
                        <li><strong><?php echo esc_html( $metric['value'] ?? '' ); ?></strong><span><?php echo esc_html( $metric['label'] ?? '' ); ?></span></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
            <div class="image-frame"><img src="<?php echo esc_url( forma_case_image_url( get_the_ID() ) ); ?>" alt="<?php echo esc_attr( forma_case_image_alt( get_the_ID() ) ); ?>" width="1200" height="900" fetchpriority="high"></div>
        </div></section>
        <section class="section"><div class="container case-grid">
            <aside><a href="#context"><span>01</span><strong><?php esc_html_e( 'Контекст', 'forma-hotel' ); ?></strong></a><a href="#task"><span>02</span><strong><?php esc_html_e( 'Задача', 'forma-hotel' ); ?></strong></a><a href="#work"><span>03</span><strong><?php esc_html_e( 'Что сделали', 'forma-hotel' ); ?></strong></a><a href="#result"><span>04</span><strong><?php esc_html_e( 'Результат', 'forma-hotel' ); ?></strong></a></aside>
            <div>
                <?php $facts = array( __( 'Объект', 'forma-hotel' ) => $case_fields['object_type'], __( 'Продукт', 'forma-hotel' ) => $case_fields['product'], __( 'Локация', 'forma-hotel' ) => $case_fields['location'], __( 'Формат', 'forma-hotel' ) => $case_fields['format'] ); ?>
                <dl class="case-facts">
                    <?php foreach ( $facts as $label => $value ) : ?>
                        <?php if ( $value ) : ?><div><dt><?php echo esc_html( $label ); ?></dt><dd><?php echo esc_html( $value ); ?></dd></div><?php endif; ?>
                    <?php endforeach; ?>
                </dl>
                <section id="context"><p class="eyebrow"><?php esc_html_e( 'Контекст', 'forma-hotel' ); ?></p><h2><?php esc_html_e( 'С чего началась работа', 'forma-hotel' ); ?></h2><?php echo wp_kses_post( wpautop( $case_fields['context'] ) ); ?></section>
                <section id="task"><p class="eyebrow"><?php esc_html_e( 'Задача', 'forma-hotel' ); ?></p><h2><?php esc_html_e( 'Что требовалось изменить', 'forma-hotel' ); ?></h2><?php echo wp_kses_post( wpautop( $case_fields['task'] ) ); ?></section>
                <section id="work"><p class="eyebrow"><?php esc_html_e( 'Что сделали', 'forma-hotel' ); ?></p><h2><?php esc_html_e( 'Последовательность решений', 'forma-hotel' ); ?></h2>
                    <?php if ( $case_fields['steps'] ) : ?><ol class="case-steps"><?php foreach ( $case_fields['steps'] as $index => $step ) : ?><li><span><?php echo esc_html( str_pad( (string) ( $index + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span><div><h3><?php echo esc_html( $step['title'] ?? '' ); ?></h3><?php echo wp_kses_post( wpautop( $step['body'] ?? '' ) ); ?></div></li><?php endforeach; ?></ol><?php endif; ?>
                </section>
                <section id="result"><p class="eyebrow"><?php esc_html_e( 'Результат', 'forma-hotel' ); ?></p><h2><?php esc_html_e( 'Подтверждённые показатели', 'forma-hotel' ); ?></h2>
                    <?php if ( $case_fields['metrics'] ) : ?><ul class="case-metrics"><?php foreach ( $case_fields['metrics'] as $metric ) : ?><li><strong><?php echo esc_html( $metric['value'] ?? '' ); ?></strong><span><?php echo esc_html( $metric['label'] ?? '' ); ?></span></li><?php endforeach; ?></ul><?php endif; ?>
                    <?php if ( $case_fields['conclusion'] ) : ?><div class="case-conclusion"><span><?php esc_html_e( 'Вывод', 'forma-hotel' ); ?></span><?php echo wp_kses_post( wpautop( $case_fields['conclusion'] ) ); ?></div><?php endif; ?>
                </section>
                <button class="button" type="button" data-modal-open data-modal-title="<?php esc_attr_e( 'Обсудить задачу отеля', 'forma-hotel' ); ?>" data-modal-description="<?php esc_attr_e( 'Опишите ситуацию. Разберём, какой формат работы подойдёт вашему объекту.', 'forma-hotel' ); ?>"><?php esc_html_e( 'Обсудить задачу отеля', 'forma-hotel' ); ?></button>
            </div>
        </div></section>
        <section class="section final-section"><div class="container final-grid"><div class="faq-panel" id="faq" aria-labelledby="single-case-faq-title"><p class="eyebrow"><?php esc_html_e( 'Коротко о главном', 'forma-hotel' ); ?></p><h2 id="single-case-faq-title"><?php esc_html_e( 'О работе с кейсами', 'forma-hotel' ); ?></h2><div class="accordion"><article><h3><button type="button" data-accordion-button aria-expanded="false" aria-controls="single-case-faq-1" id="single-case-faq-1-button"><?php esc_html_e( 'Почему не указано название отеля?', 'forma-hotel' ); ?><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></h3><div class="accordion__panel" id="single-case-faq-1" role="region" aria-labelledby="single-case-faq-1-button" aria-hidden="true" hidden><div class="accordion__content"><p><?php esc_html_e( 'Название раскрывается только после отдельного согласования.', 'forma-hotel' ); ?></p></div></div></article></div></div><div class="contact-panel" id="contact" data-reveal><div class="contact-panel__art" aria-hidden="true"></div><div class="contact-panel__content"><p class="eyebrow"><?php esc_html_e( 'Следующий шаг', 'forma-hotel' ); ?></p><h2><?php esc_html_e( 'Обсудим задачу вашего отеля', 'forma-hotel' ); ?></h2><p><?php esc_html_e( 'Начнём с короткого разговора о ситуации и ожидаемом результате.', 'forma-hotel' ); ?></p><button class="button button--light" type="button" data-modal-open><?php esc_html_e( 'Записаться на бесплатную консультацию', 'forma-hotel' ); ?></button><span class="contact-panel__note"><?php esc_html_e( 'Ответим по телефону или электронной почте', 'forma-hotel' ); ?></span></div></div></div></section>
    </main>
<?php endwhile; ?>
<?php get_footer(); ?>

