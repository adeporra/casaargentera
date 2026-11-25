<!-- stardust provenance: skill=stardust:replica · phase=preserve-direction · 2026-11-24 · curated from stardust/dynamics/dynamic-features.generated-plan.md (21 rows, 8 probed pages, reach 70/70) -->
# Dynamic features — casaargentera.com

## Listings contract
none — the site has no listing blocks fed by an index (the experiences hub and "the house" pages link hand-authored cards). The query index exists only for the footer search (below): every page emits `title`, `description`, `og:image` (defaults of the EDS index).

## Features
| # | id | feature | class | reach | disposition | target | reproducibility | status | pattern | decision / owner | evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | a-cms-app-settings-object-wp | WordPress settings object (`wp`, `dtGlobals`) | A | 70/70 | static-snapshot | content | self | planned | read-settings | none — theme runtime only, nothing reads it on the new site | _dynamics.json |
| 2 | a-cms-app-settings-object-datalayer | `dataLayer` (gtag) | A | 70/70 | embed-passthrough | embed | self | planned | consent-gated-tags | folded into martech contract (row 15) | inline gtag |
| 3 | f-enquiry-form | Contact Form 7 enquiry form (name, email, phone, subject, message, privacy checkbox; reCAPTCHA v3) on unit pages, contact, reservations, events — merged rows 3, 5–9 | F | 32/70 | rebuild-native | block | needs-backend | interim | forms | owner: production endpoint for submissions (CF7 lives on the WordPress host). Interim tier ships now: form UI rebuilt verbatim, submit shows an explicit "no backend connected" notice, no data captured | GET /wp-json/contact-form-7/v1/contact-forms/{n}/feedback/schema; www.google.com/recaptcha |
| 4 | i18n-locale-variants | Language switcher en / es / ca / da (Polylang, top bar + mobile menu) — merged rows 10–11 | I18N | 70/70 | rebuild-native | runtime | self | planned | locale-tree | none — all four trees are in scope; switcher targets map to the delivered locale home pages (`/da/home/` → redirect to `/`, as on the source) | top-bar #top-menu |
| 5 | m-menu-submenus | Header sub-menus (THE HOUSE, EXPERIENCES) + mobile drawer | M | 70/70 | rebuild-native | runtime | self | planned | chrome-interaction | none — header block | aria-haspopup |
| 6 | m-consent-modal | Moove GDPR cookie bar + settings modal (Enable All / Save Changes) | M/T | 70/70 | embed-passthrough | runtime | needs-business-decision | interim | consent-gated-tags | owner: consent UI on the new host — carried in the martech contract, disabled (row 15) | #moove_gdpr_cookie_info_bar |
| 7 | s-footer-search | Footer SEARCH widget (WordPress `?s=`) — merged rows 15–17 | S | 70/70 | index-backed | widget | self | planned | search-index-backed | none — corpus = the migrated pages; results render inside the widget (no new page) | form.searchform action=/ |
| 8 | v-maps-embed | Google Maps iframe on contact pages (places.googleapis.com is the map's own XHR) — merged rows 4, 21 | V | 4/70 | embed-passthrough | content | self | planned | media-as-url | none — same embed src | iframe google.com/maps/embed |
| 9 | v-runtime-iframes | src-less runtime iframes (reCAPTCHA / gtag helpers) | V | 70/70 | static-snapshot | — | self | planned | embed-passthrough | none — belong to rows 3 and 15, nothing to author | 0×0 iframes |
| 10 | booking-calendar | Availability calendar + price table on reservations (iCal-fed booking plugin) | D | 4/70 | static-snapshot | content | needs-business-decision | interim | off-origin-data | owner: live availability feed on the new host. Interim: captured month and prices as content; guest reservation details the source leaks are not carried (register R-01) | reservations-2.json |
| 11 | testimonial-carousel / hero slider | Revolution Slider heroes + testimonial carousel | M | 63/70 | rebuild-native | block | self | planned | carousel | none | rs-module |
| 12 | t-analytics | Google Analytics 4 G-CV2K683122 + UA-4591587-1 via gtag — merged rows 18–19 | T | 70/70 | embed-passthrough | embed | needs-business-decision | interim | consent-gated-tags | owner: enable in martech contract (all parts shipped disabled) | stardust/martech/vendors.json |

## Decision batch
One message to the owner:
1. **Enquiry forms** (row 3): where should submissions go on the new site? Until decided the forms show, but say no backend is connected.
2. **Availability calendar** (row 10): should the calendar read a live availability feed? Until decided it shows the captured month.
3. **Analytics and consent** (rows 6, 12): turn on the carried-over GA4 / consent parts in `stardust/martech-handoff.md`.

## Register (decided-out)
| feature | reason | production statement |
|---|---|---|
| — | none decided out | — |
