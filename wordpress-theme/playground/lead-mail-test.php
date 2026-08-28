<?php
/**
 * Test-only mail interceptor for the isolated WordPress Playground build.
 *
 * This file is copied into mu-plugins by the Playground bundle. It is never
 * included in the production theme archive.
 */

add_filter(
    'pre_wp_mail',
    static function () {
        return true;
    }
);
