<!-- stardust provenance: skill=stardust:dynamics · phase=plan draft · 2026-11-24T12:13:54.871Z · input stardust/current/_dynamics.json (8 pages, 21 findings) · target probe https://main--ea32f12a--aemcoder.aem.page · reconciled against stardust/migrated -->
# Dynamic features — draft inventory (curate into `stardust/dynamic-features.md`)

One row per detected finding. Merge duplicates, drop noise, keep every axis honest. Columns: disposition = what we do · target = the delivery form (widget where no authored rows remain) · reproducibility = what it needs · status = where it stands (reference/triage.md).

| # | id | class | feature | pages | disposition | target | reproducibility | status | pattern | decision needed | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a-cms-app-settings-object-wp | A | CMS / app settings object wp | 8/8 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 2 | a-cms-app-settings-object-datalayer | A | CMS / app settings object dataLayer | 8/8 | static-snapshot | content | self | pending | read-settings | — (keys name endpoints, ids, vendors) |  |
| 3 | a-first-party-api-get-wp-json-contact-form-7-v1-contact-form | A | first-party API GET /wp-json/contact-form-7/v1/contact-forms/{n}/feedback/schema | 4/8 (reach 32/70) | data-fed | block | needs-business-decision | pending | off-origin-data | which tier for the target host; consumer on the migrated pages? | **dead on target (404)** |
| 4 | a-unknown-third-party-host-places-googleapis-com | A | unknown third-party host places.googleapis.com | 2/8 | static-snapshot | — | needs-human-capture | pending | inspect | inspect the XHR, add a vendor row |  |
| 5 | f-form-protection-captcha-antibot | F | form protection: captcha / antibot | 8/8 | rebuild-native | block | needs-backend | delivered-by-capture | forms | production backend (vendor form id + field mapping) | output already carries "www.google.com" |
| 6 | f-form-wpcf7-form-origin-es-el-atico-6-fields-tokens-wpcf7-r | F | form "wpcf7-form" → origin /es/el-atico/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 7 | f-form-wpcf7-form-origin-es-eventos-6-fields-tokens-wpcf7-re | F | form "wpcf7-form" → origin /es/eventos/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 8 | f-form-wpcf7-form-origin-es-contacto-6-fields-tokens-wpcf7-r | F | form "wpcf7-form" → origin /es/contacto/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 9 | f-form-wpcf7-form-origin-es-reservas-6-fields-tokens-wpcf7-r | F | form "wpcf7-form" → origin /es/reservas/ (6 fields, tokens: _wpcf7_recaptcha_response) | 1/8 | rebuild-native | block | needs-backend | pending | forms | production endpoint; interim capture ships now |  |
| 10 | i18n-locale-variants-en-da-ca-es | I18N | locale variants en,da,ca,es | 7/8 | rebuild-native | runtime | needs-business-decision | delivered-by-capture | locale-tree | scope of the locale trees | output already carries "https://www.casaargentera.com/ca/inici/" |
| 11 | i18n-locale-variants-da-es | I18N | locale variants da,es | 1/8 | rebuild-native | runtime | needs-business-decision | delivered-by-capture | locale-tree | scope of the locale trees | output already carries "https://www.casaargentera.com/es/inicio/" |
| 12 | m-modal-trigger-aria-haspopup-chrome-only-target-outside-dom | M | modal trigger aria-haspopup (chrome only) → target outside DOM at capture | 8/8 (reach 210/70) | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 13 | m-modal-trigger-moove-gdpr-modal-allow-all-chrome-only-targe | M | modal trigger moove-gdpr-modal-allow-all (chrome only) → target outside DOM at capture | 8/8 (reach 70/70) | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 14 | m-modal-trigger-moove-gdpr-modal-save-settings-chrome-only-t | M | modal trigger moove-gdpr-modal-save-settings (chrome only) → target outside DOM at capture | 8/8 (reach 70/70) | rebuild-native | runtime | self | pending | chrome-interaction | none (the header contract is the spec) |  |
| 15 | s-site-search-form-es | S | site search form → /es/ | 6/8 (reach 70/70) | index-backed | widget | self | pending | search-index-backed | none (corpus = the migrated pages; second corpora stay out) |  |
| 16 | s-site-search-form | S | site search form → / | 1/8 (reach 70/70) | index-backed | widget | self | pending | search-index-backed | none (corpus = the migrated pages; second corpora stay out) |  |
| 17 | s-site-search-form-ca | S | site search form → /ca/ | 1/8 (reach 70/70) | index-backed | widget | self | pending | search-index-backed | none (corpus = the migrated pages; second corpora stay out) |  |
| 18 | t-tag-manager-google-tag-manager | T | tag manager: Google Tag Manager | 8/8 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 19 | t-analytics-google-analytics-ads | T | analytics: Google Analytics / Ads | 8/8 | embed-passthrough | embed | needs-business-decision | pending | consent-gated-tags | which tags run on the new host; property ids |  |
| 20 | v-iframe-without-src-runtime-injected-embed | V | iframe without src (runtime-injected embed) | 8/8 | embed-passthrough | embed | needs-human-capture | pending | embed-passthrough | resolve the runtime src from a rendered capture |  |
| 21 | v-maps-embedded-map-service | V | maps: embedded map service | 2/8 | embed-passthrough | content | self | pending | media-as-url | none (player ids are public) |  |

## Triage

- **Ships autonomously (reproducibility `self`):** 9 row(s) — read-settings, chrome-interaction, search-index-backed, media-as-url.
- **One owner decision batch:** 9 row(s) — which tier for the target host; consumer on the migrated pages? · inspect the XHR, add a vendor row · production endpoint; interim capture ships now · which tags run on the new host; property ids · resolve the runtime src from a rendered capture.
- **Already delivered by the capture pipeline:** 3 row(s) — no work.
- **Host-bound on the target:** 1 of 1 probed API paths — the off-origin data work.
- **Martech:** no CMP · 0/3 route(s) enabled by the owner — `stardust/martech-handoff.md`.

## Phases

- **forms** — 5
- **detect** — 3
- **interactive** — 3
- **search** — 3
- **locale wave** — 2
- **tags** — 2
- **off-origin data** — 1
- **embeds** — 1
- **media** — 1
