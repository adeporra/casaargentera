# Dynamic features — detected (2026-11-24T09:48:25.456Z)

Pages probed: /, /es/el-entorno/, /es/el-atico/, /es/eventos/, /es/experiencias/, /es/contacto/, /es/reservas/, /ca/politica-de-privacidad-y-cookies/ · settle 5000 ms · width 1440 · reach from 70/70 crawled pages

Evidence only. Every row must receive a disposition in `stardust/dynamic-features.md` (`dynamics-plan.mjs` drafts it).

| id | class | feature | pages | reach | evidence | hint |
|---|---|---|---|---|---|---|
| a-cms-app-settings-object-wp | A API / personalisation / settings | CMS / app settings object wp | 8/8 |  |  | settings |
| a-cms-app-settings-object-datalayer | A API / personalisation / settings | CMS / app settings object dataLayer | 8/8 |  |  | settings |
| a-first-party-api-get-wp-json-contact-form-7-v1-contact-form | A API / personalisation / settings | first-party API GET /wp-json/contact-form-7/v1/contact-forms/{n}/feedback/schema | 4/8 | 32/70 | GET /wp-json/contact-form-7/v1/contact-forms/{n}/feedback/schema → 200 | api |
| a-unknown-third-party-host-places-googleapis-com | A API / personalisation / settings | unknown third-party host places.googleapis.com | 2/8 |  | places.googleapis.com | inspect |
| f-form-protection-captcha-antibot | F form | form protection: captcha / antibot | 8/8 |  | www.google.com<br>www.gstatic.com | forms |
| f-form-wpcf7-form-origin-es-el-atico-6-fields-tokens-wpcf7-r | F form | form "wpcf7-form" → origin /es/el-atico/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 |  | text:your-name,email:your-email,tel:tel-148,text:your-subject,textarea:your-message,checkbox:acceptance-575<br>_wpcf7,_wpcf7_version,_wpcf7_locale,_wpcf7_unit_tag,_wpcf7_container_post,_wpcf7_posted_data_hash,_wpcf7_recaptcha_response | forms |
| f-form-wpcf7-form-origin-es-eventos-6-fields-tokens-wpcf7-re | F form | form "wpcf7-form" → origin /es/eventos/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 |  | text:your-name,email:your-email,tel:tel-148,text:your-subject,textarea:your-message,checkbox:acceptance-575<br>_wpcf7,_wpcf7_version,_wpcf7_locale,_wpcf7_unit_tag,_wpcf7_container_post,_wpcf7_posted_data_hash,_wpcf7_recaptcha_response | forms |
| f-form-wpcf7-form-origin-es-contacto-6-fields-tokens-wpcf7-r | F form | form "wpcf7-form" → origin /es/contacto/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 |  | text:your-name,email:your-email,tel:tel-148,text:your-subject,textarea:your-message,checkbox:acceptance-575<br>_wpcf7,_wpcf7_version,_wpcf7_locale,_wpcf7_unit_tag,_wpcf7_container_post,_wpcf7_posted_data_hash,_wpcf7_recaptcha_response | forms |
| f-form-wpcf7-form-origin-es-reservas-6-fields-tokens-wpcf7-r | F form | form "wpcf7-form" → origin /es/reservas/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 |  | text:your-name,email:your-email,tel:tel-148,text:your-subject,textarea:your-message,checkbox:acceptance-575<br>_wpcf7,_wpcf7_version,_wpcf7_locale,_wpcf7_unit_tag,_wpcf7_container_post,_wpcf7_posted_data_hash,_wpcf7_recaptcha_response | forms |
| i18n-locale-variants-en-da-ca-es | I18N locale | locale variants en,da,ca,es | 7/8 |  | https://www.casaargentera.com/da/home/<br>https://www.casaargentera.com/ca/inici/<br>https://www.casaargentera.com/es/inicio/ | locale |
| i18n-locale-variants-da-es | I18N locale | locale variants da,es | 1/8 |  | https://www.casaargentera.com/da/home/<br>https://www.casaargentera.com/es/inicio/ | locale |
| m-modal-trigger-aria-haspopup-chrome-only-target-outside-dom | M modal / interactive | modal trigger aria-haspopup (chrome only) → target outside DOM at capture | 8/8 | 210/70 | settings<br>https://www.casaargentera.com/#<br>ajustes | chrome-interaction |
| m-modal-trigger-moove-gdpr-modal-allow-all-chrome-only-targe | M modal / interactive | modal trigger moove-gdpr-modal-allow-all (chrome only) → target outside DOM at capture | 8/8 | 70/70 | Enable All<br>Activar todo<br>Activa tot | chrome-interaction |
| m-modal-trigger-moove-gdpr-modal-save-settings-chrome-only-t | M modal / interactive | modal trigger moove-gdpr-modal-save-settings (chrome only) → target outside DOM at capture | 8/8 | 70/70 | Save Changes<br>Guardar ajustes<br>Desa la configuració | chrome-interaction |
| s-site-search-form-es | S search | site search form → /es/ | 6/8 | 70/70 | text:s | search |
| s-site-search-form | S search | site search form → / | 1/8 | 70/70 | text:s | search |
| s-site-search-form-ca | S search | site search form → /ca/ | 1/8 | 70/70 | text:s | search |
| t-tag-manager-google-tag-manager | T tag / consent | tag manager: Google Tag Manager | 8/8 |  | www.googletagmanager.com | tags |
| t-analytics-google-analytics-ads | T tag / consent | analytics: Google Analytics / Ads | 8/8 |  | www.google-analytics.com | tags |
| v-iframe-without-src-runtime-injected-embed | V media | iframe without src (runtime-injected embed) | 8/8 |  | 0×0 | embed-runtime |
| v-maps-embedded-map-service | V media | maps: embedded map service | 2/8 |  | maps.gstatic.com<br>maps.googleapis.com | media |
