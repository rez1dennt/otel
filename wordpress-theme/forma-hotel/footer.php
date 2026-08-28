<?php
/**
 * Shared site footer.
 *
 * @package Forma_Hotel
 */
?>
<footer class="site-footer site-footer--full">
    <div class="container footer-grid">
        <div class="footer-brand"><a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>"><span class="brand__mark" aria-hidden="true">F</span><span class="brand__name">FORMA <small>hotel advisory</small></span></a><p>Гостиничный консалтинг для проектов на разных стадиях развития.</p></div>
        <nav aria-label="Навигация в подвале"><strong>Разделы</strong><a href="<?php echo esc_url( home_url( '/uslugi/' ) ); ?>">Услуги</a><a href="<?php echo esc_url( home_url( '/o-proekte/' ) ); ?>">О проекте</a><a href="<?php echo esc_url( home_url( '/kejsy/' ) ); ?>">Кейсы</a><a href="<?php echo esc_url( home_url( '/poleznoe/' ) ); ?>">Полезное</a><a href="<?php echo esc_url( home_url( '/kontakty/' ) ); ?>">Контакты</a></nav>
        <div class="footer-contact"><strong>Связаться</strong><a href="tel:+79065039428">+7 906 503-94-28</a><a href="mailto:vitalinapogorila@yandex.ru">vitalinapogorila@yandex.ru</a><button class="text-link" type="button" data-modal-open data-modal-title="Оставить заявку" data-modal-description="Коротко расскажите о задаче. Мы свяжемся с вами и предложим следующий шаг.">Оставить заявку</button><div class="social-links" aria-label="Социальные сети"><a class="social-link" href="https://t.me/Vitalina_Pogorila" target="_blank" rel="noopener noreferrer" aria-label="Telegram Виталины Погорилы">Telegram</a><span class="social-link" aria-disabled="true" title="Ссылка будет добавлена">MAX</span><span class="social-link" aria-disabled="true" title="Ссылка будет добавлена">Дзен</span></div></div>
        <div class="footer-legal"><strong>Информация</strong><p>ИП Погорила Виталина Петровна<br>ИНН 502745335560<br>ОГРНИП 325774600286352</p></div>
    </div>
    <div class="container footer-bottom"><span>© 2026 FORMA.</span><div><a href="<?php echo esc_url( home_url( '/politika-konfidencialnosti/' ) ); ?>">Политика конфиденциальности</a><a href="<?php echo esc_url( home_url( '/soglasie-na-obrabotku-personalnyh-dannyh/' ) ); ?>">Согласие на обработку данных</a><a href="<?php echo esc_url( home_url( '/politika-cookie/' ) ); ?>">Cookie</a><button class="footer-settings" type="button" data-cookie-reopen>Настроить Cookie</button></div></div>
</footer>
<?php get_template_part( 'template-parts/lead-dialog' ); ?>
<?php get_template_part( 'template-parts/cookie-controls' ); ?>
<?php wp_footer(); ?>
</body>
</html>

