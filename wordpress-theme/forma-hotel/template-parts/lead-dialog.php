<?php
/** Shared demonstration lead dialog. */
?>
<div class="modal" data-modal hidden aria-hidden="true">
    <div class="modal__backdrop" data-modal-close></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="lead-dialog-title" aria-describedby="lead-dialog-description">
        <button class="modal__close" type="button" data-modal-close aria-label="Закрыть форму"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        <p class="eyebrow">Первый разговор</p>
        <h2 id="lead-dialog-title" data-modal-title-target>Оставить заявку</h2>
        <p id="lead-dialog-description" data-modal-description-target>Коротко расскажите о задаче. Мы свяжемся с вами и предложим следующий шаг.</p>
        <form id="modal-lead-form" data-lead-form novalidate>
            <div class="form-trap" aria-hidden="true"><label for="lead-website">Не заполняйте это поле</label><input id="lead-website" name="website" tabindex="-1" autocomplete="off"></div>
            <label for="lead-name">Имя</label><input id="lead-name" name="name" autocomplete="name"><span data-error-for="name"></span>
            <label for="lead-phone">Телефон</label><input id="lead-phone" name="phone" type="tel" autocomplete="tel"><span data-error-for="phone"></span>
            <label for="lead-email">Электронная почта</label><input id="lead-email" name="email" type="email" autocomplete="email"><span data-error-for="email"></span>
            <label for="lead-message">Коротко о задаче</label><textarea id="lead-message" name="message" rows="3"></textarea>
            <label class="checkbox" for="lead-consent"><input id="lead-consent" name="consent" type="checkbox"> <span>Согласен с <a href="<?php echo esc_url( home_url( '/soglasie-na-obrabotku-personalnyh-dannyh/' ) ); ?>">условиями обработки персональных данных</a> и <a href="<?php echo esc_url( home_url( '/politika-konfidencialnosti/' ) ); ?>">политикой конфиденциальности</a></span></label><span data-error-for="consent"></span>
            <button class="button" type="submit">Отправить заявку</button>
            <p class="form-status" data-form-status role="status">Форма демонстрационная и пока не отправляет данные.</p>
        </form>
    </div>
</div>
