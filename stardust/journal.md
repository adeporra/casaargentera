# Journal — casaargentera.com replica

## extract (replica Phase 1) — 2026-11-24

- Flow: replica — the design is kept (hands-off; flow stamped `replica`, source user-phrase).
- Opening order: sequential (extract → preserve-direction → recreate) instead of the two-track first-page-first opening; the site is small (61 unique URLs, 8 templates) so the site scope was known within the hour.
- Crawl: 70/71 planned pages captured live (Playwright, real Chrome, wait medium, concurrency 3). `/da/home/` failed: the source answers 301 → `/` (loops in a browser) — delivered as a redirect, never a page.
- 9 captured planned URLs redirect on the source to another page (ca/covid-19, ca/cultura, ca/la-casa, da/covid-19, da/privacy-policy-and-cookies, da/the-garden, da/the-house, da/the-noble-floor, da/who-we-are) — recorded as `sourceRedirectsTo` on their state rows.
- Page types: landing 3 · program 20 · article 24 · listing 4 · form 4 · booking 4 · events 4 · static 7.
- Style census: 61 URLs × 1440/360 → `_computed-styles.json`. Fonts harvested by response interception: Montserrat 200/300/400/500/700/800 (Google Fonts, OFL), Roboto 400, icomoon-the7-font, Font Awesome 5 solid.
- Cap model: contentMaxWidth 1250px (module), shell fluid, probe 2560, consistent across the 8 archetypes.
- Dynamics detect: 21 findings (Contact Form 7 + reCAPTCHA forms, GA4 G-CV2K683122 / UA via gtag, Moove GDPR consent, Google Maps embed, hidden search form, I18N en/es/ca/da).
- Martech evidence: stardust/martech (no Launch, no OneTrust; gtag inline + Moove GDPR consent).
- Source defects noted for the register: reservations calendar exposes guest reservation data; covid-19 shows a raw shortcode.

## preserve-direction (replica Phase 2) — 2026-11-24

- Promoted current/PRODUCT.md, DESIGN.md, DESIGN.json verbatim to the project root (full-prep branch); DESIGN.json carries the cap-probe model (contentMaxWidth 1250px, shell fluid).
- direction.md written (preserve mode). No --target-breakpoints: source breakpoints kept.
- Inconsistency register: R-01 applied (booking calendar guest data not carried — no visual change), R-02 deferred (raw shortcode on covid-19 replicated as captured). No proprietary fonts (Montserrat, Roboto: OFL/Apache) → no licensing entry.
- Dynamics triage: 21 detected rows curated into 12 features in stardust/dynamic-features.md, every row has a disposition; owner decision batch: form endpoint, availability feed, analytics/consent enablement. Forms ship the interim tier (UI verbatim, "no backend connected").
- Martech: dynamics-plan --martech → stardust/martech-contract.json + martech-handoff.md, 3 gtag routes, all disabled. scripts/martech.js is scaffolded before deploy (Phase 5).
- Publish decision recorded in stardust/eds-conversion-log.md.

## recreate — index

- Prototype `stardust/prototypes/index-proposed.html` = shared `canon.css` + `canon.js` (tokens, self-hosted Montserrat 200–800 + icomoon, masthead/top bar, `#phantom` floating header, mobile header + drawer, hero slider shell, content shell/vc grid, carousel arrows, footer, WPBakery fadeIn) + home-only `index.css` (intro, house grid, experiences, testimonials, map). Clean re-authoring from source-spec + measure.mjs; no portations.
- source-spec compare 0 deltas at 1440 and 360 before the first round. Lifted fixes the gate named: `#page { overflow: hidden }` (360 overflow +31px from the 50px h2), hidden mobile-mini-widgets duplicates (source header CTA counts), drawer per the recorded header contract (330px, `right` 500ms, close over the trigger).
- Capture state: the frozen origin shows hero slide 4 and the `#phantom` clone pinned visible by the capture's animation freeze — the prototype mirrors the same state machine, so both sides capture alike.
- Gate: 1440 r2-iter1 pixel 0.24 %, Δh 0, content-diff 0/0, header 0.26 % / footer 0.08 %; 360 iter5 aligned 0.59 %, Δh 0, footer 0.13 %, header band 39.9 % vs the origin's slider crossfade (0.08 % vs ref-2) — justified residual. Clipped 0, overflow ok, units PASS, header contract PASS, cap-probe PASS @2560.
- Rounds: 1440 extend (header contract not yet recorded) + re-prototype (interaction layer re-cut after the slider driver escaped the timer hold); 360 extend (same precondition). Static pass never regressed in content.
- Motion: observed and implemented phantom header, scroll-top, floating icon, sub-nav hover, footer link hover, fadeIn ×5, slider autoplay (2500 ms interval), carousel arrows, drawer. Dead: three hover families, header scroll-morph.
- State: index → approved (hands-off).

## recreate — the-garden

- Prototype `stardust/prototypes/the-garden-proposed.html` = shared `canon.css` + `canon.js` unchanged + `the-garden.css` (2-slide hero, text columns, 2-up/3-up images, The7 icon-with-text grid with self-hosted Font Awesome 5 solid, Contact Form 7 look). Clean re-authoring from source-spec + measure.mjs + css-rules; no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted fixes: textarea `vertical-align: top`, CF7 label `::before` space, per-page masthead veil `rgba(221,153,51,.5)` (scoped token override), `.act` current-page state.
- Capture state: frozen origin shows hero slide 2 with `#phantom` pinned; the prototype starts on that slide.
- Gate: 1440 iter3 pixel 0.03 %, Δh 0, content-diff 0/0, header 0.34 % / footer 0.08 %; 360 iter2 0.19 %, Δh 0, header 0.64 % / footer 0.10 %. Clipped 0, overflow ok, units PASS (10), cap-probe PASS @2560.
- Rounds: 1440 2 counted (iter1 slide state 15.89 %) + confirmation; 360 1 counted + confirmation.
- Motion: canon interactions + CF7 submit hover; dead: bullet click, three hover families, scroll-morph. Residual: slider 3000 ms vs canon 2500 ms (back-port `data-duration`).
- Canon back-port candidates (scoped locally for now): per-page veil token, `.act` state, WPBakery last-child margin + 46px spacer, per-slider `data-duration`.
- State: the-garden → approved (hands-off).

## recreate — culture

- Prototype `stardust/prototypes/culture-proposed.html` = shared `canon.css` + `canon.js` + `culture.css` (single-slide hero, intro, four image/text feature rows, 56/40 px spacers). Clean re-authoring from source-spec; no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted: `.wpb_text_column *:last-child` margin 0; in-paragraph image `margin 0 auto 10px` (319 px row).
- Scoped locally (canon back-port candidates): per-page veil `rgba(221,153,51,.5)`; active menu trail (EXPERIENCES underline, CULTURE `#dd9d3b`).
- Gate: 1440 pixel 0.17 %, Δh 0, content-diff 0/0, header 0.35 % / footer 0.08 %; 360 0.14 %, Δh 0, header 1.01 % / footer 0.08 %. Clipped 0, overflow ok, units PASS (8/8), cap-probe PASS @2560.
- Rounds: one counted per width + free post-motion confirmation.
- Motion: canon behaviour only; dead: three hovers, scroll-morph.
- State: culture → approved (hands-off).

## recreate — contact

- Prototype `stardust/prototypes/contact-proposed.html` = shared `canon.css` + `canon.js` + `contact.css` (single-slide hero, Google Maps embed with the live src, two-column directions with icons and the Contact Form 7 form). Clean re-authoring from source-spec; no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted: map frame (`#f7f7f7`, 5px padding, iframe 100% × 450), `.vc-col` min-height 1px, CF7 submit `transition: all .3s ease-out`.
- Scoped locally (canon back-port candidates): `.act` menu state, WPBakery last-child margin + spacer, column min-height, CF7 and icon-with-text modules. Header veil = canon default.
- Gate: 1440 pixel 0.04 %, Δh 0, content-diff 0/0, header 0.32 % / footer 0.05 %; 360 0.10 %, Δh 0, header 0.23 % / footer 0.10 %. Clipped 0, overflow ok, units PASS (10), cap-probe PASS @2560.
- Rounds: one counted per width + free post-motion confirmation.
- Motion: canon + CF7 submit hover; dead: four hover families, scroll-morph. Residual: map embed rows (live third-party, masked). Register R-03: map iframe `title` added.
- State: contact → approved (hands-off).

## recreate — experiences

- Prototype `stardust/prototypes/experiences-proposed.html` = shared `canon.css` + `canon.js` unchanged + `experiences.css` (6-slide hero, intro text, three teaser rows: linked h2 + inline image). Clean re-authoring from source-spec + css-rules; no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted: `.alignnone` inline image, text-column last-child margin, `.act` on EXPERIENCES; veil = canon default.
- Capture state: frozen origin shows slide 3 at 1440; the 360 origin froze mid-crossfade 3→4 (header band 5.83 %, justified as index 360).
- Gate: 1440 iter3 0.05 %, Δh 0, content-diff 0/0, header 0.35 % / footer 0.05 %; 360 iter1 2.85 %, Δh 0, footer 0.10 %. Clipped 0, overflow ok, units PASS (3), cap-probe PASS @2560.
- Rounds: 1440 2 counted (iter1 14.19 % slider markup not swapped) + confirmation; 360 1 counted.
- Live renders two teaser images blank (lazy-loader `/wp/` 404) — mirrored as rendered, register R-04 deferred to owner. Slider 3500 ms vs canon 2500 ms (back-port `data-duration`).
- Motion: canon at parity; dead: bullet click, teaser link hovers, soc-ico hover, scroll-morph. State: experiences → approved (hands-off).

## recreate — events

- Prototype `stardust/prototypes/events-proposed.html` = shared `canon.css` + `canon.js` unchanged + `events.css` (6-slide hero with text layers, intro text with list, 3-column media grid of 6 lightbox images, enquiry CF7 form). Clean re-authoring from source-spec + css-rules; no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted: rev-slider layer positions on the 1240×868 grid, 60/50 titles, `.content ul` disc, vc grid gutter 20, masonry whole-pixel column lefts, background-cover gallery zone; veil rgba(221,153,51,.5).
- Gate: 1440 iter3 0.45 %, Δh 0, content-diff 0/0, header 0.31 % / footer 0.08 %; 360 iter2 0.27 %, Δh 0, header 0.05 % / footer 0.13 %. Clipped 0, overflow ok, units PASS (12), cap-probe PASS @2560.
- Rounds: 1440 3 counted (iter1 18.88 %: same-named Priorat asset was a different photo → `assets/events/`; iter3 units element-kind pairing fixed post-cap, `accept-residual`, standalone unit-geometry PASS); 360 1 counted + confirmation.
- Motion: canon + CF7 submit hover at parity; dead: bullet click, grid/privacy/soc-ico hovers, scroll-morph. Lightbox (prettyPhoto) not observed → not implemented; links open the full image.
- Back-port candidates: `.hero-layer--xy` / `--t60`, masonry `round(down)` column floor. State: events → approved (hands-off).

## recreate — reservations-2

- Prototype `stardust/prototypes/reservations-2-proposed.html` = shared `canon.css` + `canon.js` unchanged + `reservations-2.css` + `reservations-2.js` (single-slide hero, CF7 form, note, ICS availability calendar re-authored from the plugin's CSS, two price columns). Clean re-authoring; no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted: calendar tokens, 70 % cells at 9em, collapse to event days below 782px, The7 select arrow, price h3 margin 10px, veil rgba(221,153,51,.5).
- Calendar: all 15 captured months carried (Nov 2026 shown, dropdown switches), day states and titles only; guest links, descriptions and phone fragments not carried (R-01), the 4 links accepted in `stardust/replica/accepted.json`. Dynamic-features calendar row now covers all captured months, not one.
- Gate: 1440 iter3 0.13 %, Δh 0, content-diff 0/0 (4 accepted), header 0.35 % / footer 0.05 %; 360 iter2 0.17 %, Δh 0, header 0.87 % / footer 0.13 %. Clipped 0, overflow ok, units PASS (43/9), cap-probe PASS @2560.
- Rounds: 1440 2 counted (iter1: 124 red from hidden months not carried) + confirmation; 360 1 counted + confirmation.
- Motion: canon + CF7 submit hover; month switch and date-range hover box are plugin functions not observable at rest (`motion.unobservedFunctional`). Residual: calendar snapshot matches live only on 2026-11-24.
- State: reservations-2 → approved (hands-off).

## recreate — privacy-policy-and-cookies

- Prototype `stardust/prototypes/privacy-policy-and-cookies-proposed.html` = shared `canon.css` + `canon.js` unchanged + `privacy-policy-and-cookies.css`. No hero; the author's empty p/h2 lines under the veiled masthead, then the h2 title and 9 h4 sections in one text column. Clean re-authoring, no portations.
- source-spec compare 0 deltas at 1440/360 before the first round. Lifted: h4 200 22/30 accent, text-column last-child margin 0, `.vc_col` min-height 1px, veil rgba(221,153,51,.5).
- Chrome: no current menu item; language menu lists only Dansk and Català (live drops Español here).
- Gate: 1440 0.07 %, Δh 0, content-diff 0/0, header 0.26 % / footer 0.05 %; 360 0.09 %, Δh 0, header 0.05 % / footer 0.10 %. Clipped 0, overflow ok, units PASS (9), cap-probe PASS @2560. One counted round per width + confirmation.
- Motion: canon only (14 parity); dead: three hovers, scroll-morph. State: privacy-policy-and-cookies → approved (hands-off).

## recreate — phase end (2026-11-24)

- All 8 archetypes approved (hands-off): index, the-garden, culture, experiences, contact, reservations-2, events, privacy-policy-and-cookies.
- Prototype table (gate-all --stage prototype): 1440 8 PASS / 0 FAIL; 360 8 PASS / 0 FAIL (worst: experiences 360 2.85 %, origin mid-crossfade, justified).
- Register now R-01..R-04 (R-03 applied: map iframe title; R-04 deferred: two blank teaser images on the live experiences page).
- Canon back-port candidates for C0 (all scoped in page css for now): per-page veil token, `.act` current-menu state, WPBakery last-child margin + spacers, `.vc-col` min-height 1px, CF7 form + submit transition, icon-with-text, h4 rule, per-slider `data-duration` (2500/3000/3500 ms), hero text layers, masonry column floor.

## plan (migrate Phase 1) — 12 render clusters planned (2026-11-24)

- Gated-archetype precondition met: all 8 templates have pass verdicts at 1440 and 360 in `stardust/replica/progress.json`; dynamic-features.md present with every row dispositioned.
- Path A: 8 archetypes rendered to `stardust/migrated/` (rendered 8, refused 0); their `modules[]` are filled at each template's C-archetype unit, when the encoder names the blocks.
- Path A′: 62 siblings in 12 render clusters (article ×3, program ×3, landing, events, listing, form, booking, static) in `stardust/migrate/progress.json`; each renders only after its template's `archetype` unit is done in C-deliver. Path B: none.

## A-inventory (rollout) — 70 pages inventoried (2026-11-24)

- `inventory.mjs --state`: 70 pages (8 pending archetypes, 62 content-pending siblings); 70 of 71 planned — `/da/home/` is a source 301 to `/`, shipped as a redirect (direction.md).
- Provisional block vocabulary on the archetype sidecars (refined by the encoders at each C-archetype unit): hero-slider, image-grid, testimonials, map, icon-features, contact-form, media-feature, availability-calendar, columns, gallery, legal-text.
- rollout.json site: DA aemcoder/ea32f12a ref main, live host main--ea32f12a--aemcoder.aem.live.
- Content-pending siblings group under their type name until their render sets `template` to the archetype slug; the inventory is re-run after each render cluster.

## B-block (rollout) — 11 distinct blocks, 33 instances (2026-11-24)

- `blocks.mjs`: 11 module blocks (hero-slider ×10, contact-form ×7, gallery ×4, icon-features, image-grid, map ×2 …), 0 chrome/widget; `plan.mjs`: representative-first, each block converts on exactly one archetype, the rest reuse.

## B2-dynamic (rollout) — dynamic surface re-checked, martech scaffolded (2026-11-24)

- `dynamics-plan.mjs --martech --target-origin https://main--ea32f12a--aemcoder.aem.page --migrated stardust/migrated`: 21 findings (self 9 · owner batch 9 · already delivered 3 · host-bound 1/1) — consistent with the curated `stardust/dynamic-features.md`, every row keeps its disposition. Curated martech contract and handoff note kept (re-run only restamped them).
- `martech-scaffold.mjs`: `scripts/martech.js` written and hooked (scripts.js, consented.js, consent-check.js); no CMP, 0 routes enabled — every contract part stays disabled for the owner to turn on. Ships with the foundation.

## C-deliver — foundation unit (2026-11-24)

- C0 subagent: styles/fonts (Montserrat ×6, icomoon-the7, fa-solid), favicon, head.html, header/footer blocks recreating the gated chrome, locale helpers, runtime-contract.json; canon back-ports folded in (veil via `header-veil` metadata, `.act`, last-child margin, `.vc-col` min-height, h4, slider `duration` section metadata). nav/footer docs for EN/ES/CA/DA (noindex) previewed + published. Lint clean.
- Gate on /foundation-shell vs live privacy page: chrome-parity quiet at 1440 and 360 after one fix (hidden "Choose a language" footer text removed); crop bands 360 header 0.05 % / footer 0.10 %, 1440 footer 0.33 %; 1440 header band 7.74 % is capture state (frozen origin pins `#phantom`, the shell is too short to scroll) — confirmed at the archetype units' full gates.
- Open: icomoon-the7 licence (fonts/LICENSING.md, owner); footer search needs /query-index.json (D2); ES footer links an uncaptured privacy page (E2); unpublish /foundation-shell at C-final.
- foundation-freeze.mjs freeze.

## C-deliver — archetype-landing unit (2026-11-24)

- index converted (blocks hero-slider, image-grid, testimonials, map) and published at `/`; preview gate 1440 0.25 % Δh0 (round 2), 360 0.54 % Δh0 (round 1); clipped 0, missing/hidden 0; chrome parity 0 deltas; slider autoplay 2500 ms / 600 ms crossfade restored.
- Register R-05 (slide-3 text position via layout keyword), R-06 (house-grid image links follow heading href), R-07 (intro heading authored as h1); foundation request: h1 rule.
- Open: internal links still absolute to the source until their pages ship (E2 localize-links); bullet-select not proven.

## migrate render — landing cluster (2026-11-24)

- es-inicio, ca-inici rendered A′ from index (rendered 2, refused 0); variance probe: content-only deltas (testimonial count/heights), no variant class; locale chrome replaced at delivery.

## C-deliver — cluster-landing unit (2026-11-24)

- es-inicio, ca-inici live (preview + live); gate 1440 4.25 % / 1.18 %, 360 3.27 % / 1.59 %; clipped 0. MISSING rows are a `<span lang>` split-heading artefact — overridden per page with reason in gates/all-<w>/overrides.json. testimonials `author-top` variant added (index re-gated 0.25 % / 0.55 %).
- Open: header content-count (source repeats language + social links 4×) queued as a foundation request; `pll_language` cookie in the gate's shared store redirects `/` to the last locale — gate index with `STARDUST_LIVE_STATE=0`; full gate-all at C-final records the sidecar rows. Encoder kept at stardust/encoders/encode-landing.mjs.

## C-deliver — archetype-program unit (2026-11-24)

- the-garden live; gate 1440 0.32 % Δh4 (round 2), 360 1.09 % Δh17 (round 1); clipped 0, missing/hidden 0; chrome parity 0 deltas. New blocks icon-features, contact-form (generic, form not connected per dynamic-features row 3); image-grid `plain` variant (index re-gated unchanged). Encoder stardust/encoders/encode-program.mjs.
- Register R-08 (icon-feature per-item colours/margins normalised); R-07 extended to program pages. Open: links still absolute until E2 localize-links.

## migrate render — program-1 cluster (2026-11-24)

- 7 es/ca siblings rendered A′ from the-garden (rendered 7, refused 0); main content-diff 0/0; variance: content-only deltas plus a `gallery` variant (2-col lightbox photo grid on the ground-floor pages). Encoder gaps to close before the cluster unit: photo-grid branch, The7 icomoon icons.

## migrate render — program-2 cluster (2026-11-24)

- 7 ca/en siblings rendered A′ from the-garden (rendered 7, refused 0); main content-diff 0/0; `gallery` variant on ca-la-planta-baixa, the-ground-floor.

## migrate render — program-3 cluster (2026-11-24)

- 5 da siblings rendered A′ from the-garden (rendered 5, refused 0); main content-diff 0/0; raw shortcode text on da-stueetagen / da-penthousekvisten replicated as captured (R-09 deferred, like R-02).

## C-deliver — cluster-program unit (2026-11-24)

- 19 accommodation siblings live; worst gate 1440 1.04 %, 360 1.31 %; clipped 0; ca-el-jardi span-lang override. image-grid `gallery` (+ prettyPhoto-parity lightbox), `intro-50`, `stack-70`; icon-features The7 + hotjar glyphs; archetypes re-gated unchanged.
- Hero start slide per page set to the gate reference's frozen slide (autoplay intact). Open: D15 lint on da-stueetagen / da-penthousekvisten from the verbatim shortcode text (R-09); da-the-garden / da-the-noble-floor show the English menu on the source vs the Danish nav here; FA brands font request queued.

## C-deliver — archetype-article unit (2026-11-24)

- culture live; gate 1440 0.24 % Δh0 (round 2, round 1 units-only), 360 0.36 % Δh0 (round 1); clipped 0, missing/hidden 0; chrome parity 0 deltas. New block media-feature (variants gap-/top-/intro-<n>); hero-slider reused static. Encoder stardust/encoders/encode-article.mjs (runs on all 22 siblings).
- R-07 extended to article; foundation request: h1 rule. Open for the cluster: playas/platja/strand pages lack an intro heading and start with raw shortcode text (R-09 kind); la-casa/the-house intro is h3 (needs h1 size variant); culture-feature-column unit count varies per page; /culture links on index to localize at C-final.

## migrate render — article-1 cluster (2026-11-24)

- 8 es/ca siblings rendered A′ from culture (rendered 8, refused 0) via stardust/encoders/build-clone-article.mjs; main content-diff 0 red; variance content-only → variants start-2, gap-32, top-32, intro-32, plain (single-image rows use image-grid plain). R-10 deferred: raw `[ultimate_heading]` text on playas/platja/strand replicated as captured. Deviations drop-noscript, drop-empty logged.

## migrate render — article-2 cluster (2026-11-24)

- 8 ca/en siblings rendered A′ from culture (rendered 8, refused 0), same clone builder unchanged; main content-diff 0 red; variants plain / start-2 gap-32 / intro-32 / gap-32 top-0; 3-slide heroes with bullets on ca-la-casa, ca-lentorn, the-place, beach-and-more. drop-noscript / drop-empty logged.

## migrate render — article-3 cluster (2026-11-24)

- 7 en/da siblings rendered A′ from culture (rendered 7, refused 0); main content-diff 0 red; variants start-3 gap-32 (the-house, da-the-house), intro-32, plain, gap-32 top-32; R-10 cited on da-strand-m-m. All 23 article siblings rendered.

## C-deliver — cluster-article unit (2026-11-24)

- 23 editorial siblings live (preview + live); 11 pass outright (worst 0.59 % / 1.7 %, |Δh| ≤ 1), 12 pass with per-page overrides: R-11 (10 pages — source lazy-loader serves 404 feature images; we deliver the real image; masked, rest ≤ 1.11 % @1440) and span-lang unit artefacts. Clipped 0, missing/hidden 0. Coordinator accepted R-11 hands-off (register entry with evidence); note R-04 (experiences) went the other way — reconcile at the listing unit.
- Variants added: media-feature intro-h3, image-grid intro-42 / end-0; encoder drops comment-only p, promotes first h2 when no intro heading (R-10 pages), rewrites /wp/wp-content src. Archetypes re-gated unchanged. Foundation requests +2 (h3 margin, footer search aria-label). Open: wrong-language source menus on ca-cultura, ca-la-casa, da-the-house, da-who-we-are (locale nav used); /wp/<locale>/ links to source until C-final.

## C-deliver — archetype-form unit (2026-11-24)

- contact live (preview + live); gate 1440 0.04 % Δh 0, 360 0.23 % Δh 0 (round 1 each; units passed with a documented override for the CF7 label-box artefact); clipped 0, missing/hidden 0; chrome parity within tolerance, bands ≤ 0.32 %. Gated through a local code overlay on the preview content because the unit may not push code — re-gate on main--…aem.page after the coordinator's push.
- No new block: section style `split` (contact-form.css), icon-features `title-22` / `gap-32`, map `top-10` + h1 paint (R-07 extended to form; foundation request appended). index / the-garden re-gated unchanged. Encoder stardust/encoders/encode-form.mjs encodes all four locales.
- Open for the cluster: da-kontakt has no intro heading (first column head becomes the h1, h3 paint) and an extra left-column paragraph; privacy link in the form stays absolute until C-final localize-links.

## C-deliver — archetype-listing unit (2026-11-24)

- experiences live (preview + live); hero-slider reused (6 slides, start-3, duration 3500), teasers on media-feature with new variants `head-<n>` / `end-<n>` (rows carry their trailing spacer; picture keeps its 1024 width); encoder stardust/encoders/encode-listing.mjs runs on all four listing pages (da-oplevelser's two-image teaser included).
- R-04 reconciled with R-11 → applied: the two teaser images the source lazy-loader breaks are delivered; gate 1440 / 360 pass by documented override (painted residual 0.51 % / 3.65 %, Δh −16, units off only on the broken stubs). Chrome parity 0 deltas, footer bands ≤ 0.10 %, 360 header 9.37 % = origin crossfade capture state; captureState restored (autoplay 3.5 s, fade 0.6 s, loop, bullets, #phantom). culture re-gated unchanged.
- Fix rounds on an `aem up` code overlay over the preview content (unit does not push); final gate on main--…aem.page after the coordinator's checkpoint, identical. /wp/ teaser links stay absolute until C-final localize-links.

## C-deliver — archetype-booking unit (2026-11-24)

- reservations-2 live; gate 1440 0.15 % Δh0, 360 0.28 % Δh0 (round 1 each); clipped 0, missing/hidden 0; chrome parity quiet; bands 1440 0.35/0.05 %, 360 1.00/0.13 %. New block availability-calendar (static ICS snapshot from data rows — 15 months, 5 bookings, side column moved; dynamic-features row 10 interim, R-01 guest data not carried); hero-slider and contact-form reused unchanged. Encoder stardust/encoders/encode-booking.mjs (clean on es/ca/da).
- booking-form-row units: CF7 label-box instrument artefact → units-only override (as contact); calendar/price unit eds selectors added. Foundation request: h1 rule. Open for siblings: localized day label {l} {F} {j} + month names, es/ca/da carry one price column, ca-reserves has an extra note paragraph and no trailing empty row (no tail-1).

## migrate render — listing cluster (2026-11-24)

- 3 es/ca/da siblings rendered A′ from experiences (rendered 3, refused 0) via stardust/encoders/build-clone-listing.mjs; main content-diff 🔴 0, counts equal (da Kultur teaser's 2 images kept); variance content-only (stardust/.work/rollout/listing/variance.json) → no variants beyond hero-slider start-<n>; capture start slides es 2 / ca 3 / da 3, to be checked against the gate's frozen references in C-deliver.
- Deviations chrome-canon, drop-noscript, drop-empty (empty text column on es/ca, as the archetype); decision register-R-04 on all three (Punxes, Sunset; da also Escornalbou) — teaser images delivered from the working /wp-content/ file.

## migrate render — form cluster (2026-11-24)

- es-contacto, ca-contacte, da-kontakt rendered A′ from contact (rendered 3, refused 0) via new stardust/encoders/build-clone-form.mjs (reproduces contact-proposed.html #content exactly; per-box #303030 desc class read from each box's inline CSS, The7 hover glyph kept hidden, da's linked train icon box kept a link); main content-diff 🔴 0 (🟡 only R-03 map title); variance content-only (text-driven heights), no variant class.
- da-kontakt: intro `<p>` and extra left-column paragraph replicated verbatim in the clone; delivery applies R-07's da clause (first column head → h1, h3 paint) with the extra paragraph as default content after icon-features — deviation logged. Encoder encode-form.mjs unchanged.

## C-deliver — archetype-events unit (2026-11-24)

- events live (preview + live); hero-slider reused with an additive cell-3 placement grammar (`x:95 y:232; x:162 y:304 #ea9800`, `x:c+87 y:c-130`, `lh:25` — the rs-layer data-xy / data-color) + block variant `title-60`; 6 slides, start-4, duration 2500 / 600 ms fade / loop / bullets verified (motion probe: 4→5→6→1…, ~2.5 s, bullet 2 selects); media grid on image-grid `gallery events` (3 per row, -20 grid close, masonry whole-pixel floor), enquiry on contact-form. Encoder stardust/encoders/encode-events.mjs runs on all four event pages.
- Gate (code overlay :3016 on the preview content — block CSS changed after the sweep): 1440 0.48 % Δh 0, 360 0.42 % Δh 0; clipped 0, content 0/0; units geometry 12/12 within tolerance, element-kind pairing (bg-image zone vs img, CF7 label box) waived by per-page override; 1440 all-pages rounds closed by accept-residual. Bands header 0.31 % / 0.04 %, footer 0.08 % / 0.13 %; chrome parity within tolerance. index re-gated unchanged (0.25 %).
- Foundation request: styles.css `ul` reset strips content-list disc/indent (scoped override in image-grid.css for the events section). Open for siblings: es/ca/da freeze on other slides (encoder `--start` from the gate reference); gallery opens the image-grid lightbox (links keep the full-size hrefs); privacy link absolute until C-final localize-links.

## C-deliver — cluster-form unit (2026-11-24)

- es-contacto, ca-contacte, da-kontakt live (preview + live) through deploy-batch (ledger-form.json, concurrency 1); encode-form.mjs unchanged, no code change, no new media (contact scope reused). Gate 1440 0.04–0.09 %, 360 0.14–0.16 % (ca 1.11 % aligned, Δh 25 — the pipeline adds a breakable space beside the source's `&nbsp;` around `<strong>`); clipped 0, content MISSING/HIDDEN 0; header/footer bands ≤ 0.33 %.
- Units waived per page with documented reasons (overrides all-1440/all-360): the archetype's CF7 label-box artefact; da-kontakt also new register R-12 (empty `<a href="#">` around the train icon, not delivered). Chrome parity on es-contacto: one footer delta, the search button's aria-label, already a queued foundation request. da-kontakt h1 = first column head (R-07 da clause).

## migrate render — booking cluster (2026-11-24)

- es-reservas, ca-reserves, da-reservations rendered A′ from reservations-2 (rendered 3, refused 0) via new stardust/encoders/build-clone-booking.mjs (rebuilds reservations-2-proposed.html byte-identically from its capture; calendar = static snapshot, localized label/weekdays/day labels/no-events verbatim, hover block date + title only); main content-diff 🔴 0, calendar strings equal (calcheck); variance content-only (one price column, ca h4 price heads, ca extra note paragraph) → no variant class; ca has no trailing empty row.
- Deviations chrome-canon, drop-guest-data + decision register-R-01 on all three (dynamic-features row 10); es drop-empty (`<p>&nbsp;</p>` in prices). Encoder encode-booking.mjs unchanged.

## C-deliver — cluster-listing unit (2026-11-24)

- es-experiencias, ca-experiencies, da-oplevelser live (PUT → preview → publish, ledger-listing); Escornalbou uploaded to media/listing; chain + npm lint + block-roundtrip --ew clean. Start slides from the frozen references: es 4 (capture said 2), ca 3, da 3.
- Fix round 1: ca's intro paragraph opens on `<strong><br> </strong>` (pipeline drops it) → encode-listing emits `intro-35` (only ca changes; experiences re-encodes identical); da's Kultur teaser had +10px between its two image columns → media-feature `head-` scoped rule `p:has(picture) { margin-bottom: 0 }` (listing pages only), gated on the :3015 code overlay — NOT live until pushed.
- Gates pass by R-04 override (pixel + units waived, documented per page): painted residual 1440 es 0.51 / ca 0.49 / da 0.62 %, 360 es 3.92 (frozen 360 origin mid-crossfade, as experiences) / ca 0.89 / da 1.01 %; Δh −16/−16/−24 = the +8px stub line per broken teaser; clipped 0, MISSING/HIDDEN 0. Chrome parity es: only the known footer "Search" aria-label; crop header 0.36 % / footer 0.05 % @1440, footer 0.10 % @360 (360 header 8.8 % = crossfade). experiences re-gated unchanged (0.51 / 3.65 %).

## C-deliver — archetype-static unit (2026-11-24)

- privacy-policy-and-cookies live (preview + live); text stays default content (title h1 via R-07, 9 h4 sections, links localized to `/`). New block `spacer` (one cell = height px, config text visually hidden, `@ew-exempt`) stands in for the source's vertical-space authoring the pipeline drops (`<p>&nbsp;</p>`, empty h2s, vc_empty_space, empty 1px rows): 255 above the title, 45 under it, 1 at the tail; spacer.css also paints the h1 as the canon h2 (foundation request appended). Encoder stardust/encoders/encode-static.mjs runs on all 7 static pages.
- Gate round 1 (code overlay :3022, then confirmed on main--…aem.page after the checkpoint push): 1440 0.07 % Δh 0, 360 0.09 % Δh 0; clipped 0, content MISSING/HIDDEN 0, units 9/9 (eds selector added to units.json legal-section-heading); bands header 0.26 / 0.05 %, footer 0.05 / 0.10 %; chrome parity within tolerance. #phantom show/hide verified. qa-gate harness fails are artefacts (header/footer h0 on the harness, 1px tail spacer, schema maps the default-content row onto the spacer).
- Siblings: da = same structure (255/45/1); ca-privacitat / ca-privacidad push the title with vc_empty_space 64+64 (spacer 128 — vc_empty_space margin assumed 0, verify) and have no tail row; covid-19 / ca- / da-covid-19 have NO heading (spacers 128 + raw `[ultimate_heading …]` paragraph R-02 + 32) → no h1 (qa-gate "one h1" needs a decision/register entry).

## migrate render — events cluster (2026-11-24)

- es-eventos, ca-esdeveniments, da-eventsda rendered A′ from events (rendered 3, refused 0) via new stardust/encoders/build-clone-events.mjs (rebuilds events-proposed.html from its own capture, identical up to serialisation; hero layer grammar xy/xo-yo, t60/lh25/h28, colours from rs-layer data); main content-diff 🔴 0 🟡 0, counts equal; variance content-only (intro height, ca h2 2 lines; hero/gallery/form identical, English hero kept as source) → no variant beyond start-<n>.
- Clone starts = capture data-slideactive (es 2, ca 6, da 6); the frozen gate references do not exist yet — C-deliver sets encoder --start from them (events itself froze on 4, capture said 6). Deviations chrome-canon on all three, da drop-empty (`<p>&nbsp;</p>`); encode-events.mjs unchanged, dry run fetches nothing (13 media, all local).

## C-deliver — cluster-booking unit (2026-11-24)

- es-reservas, ca-reserves, da-reservations live (preview + live) through deploy-batch (ledger-booking.json, concurrency 1); encode-booking.mjs unchanged, no code change, no new media (booking scope reused). Gate 1440 0.15–0.26 %, 360 0.30–1.56 % aligned (es Δh 35); clipped 0, content MISSING/HIDDEN 0; chrome parity on es-reservas = the queued footer search aria-label only; bands 1440 0.33 / 0.05 %, 360 1.00 / 0.16 %.
- Units waived per page (overrides all-1440/all-360): the archetype's CF7 label-box artefact; es-reservas also its price column's `<p>&nbsp;</p>` the pipeline drops (italic notes 35px higher; page 35px shorter @360) and a narrower `<em>` (no Montserrat italic face — foundation request appended). Open: deliver that gap (a side-column spacer grammar in availability-calendar) if the coordinator wants the 35px back.

## migrate render — static cluster (2026-11-24)

- ca-politica-de-privacidad-y-cookies, ca-politica-de-privacitat-i-cookies, da-privacy-policy-and-cookies, covid-19, ca-covid-19, da-covid-19 rendered A′ from privacy-policy-and-cookies (rendered 6, refused 0) via new stardust/encoders/build-clone-static.mjs (rebuilds privacy-policy-and-cookies-proposed.html #content exactly from its capture; empty lines, vc_empty_space and bare text kept in source order); main content-diff 🔴 0 🟡 0 on all six, counts equal; variance content-only (stardust/.work/rollout/static/variance.json) → no variant class. vc_empty_space margin measured 0 on the source (ca-privacidad 64+64 → title y 188 = 60 + 128 at 1440 and 360) — the encoder's 128 spacer holds.
- Deviation chrome-canon on all six; decision register-R-07 on the three privacy pages (title → h1); covid-19 / ca- / da-covid-19 have no heading in the source text (R-10 has nothing to promote) → raw `[ultimate_heading …]` kept verbatim, no h1 invented: R-02 extended with evidence as the documented one-h1 exception. da-privacy and the ca/da covid pages are the English WP pages served at locale paths (same page id). Encoder encode-static.mjs unchanged.

## C-deliver — cluster-events unit (2026-11-24)

- es-eventos, ca-esdeveniments, da-eventsda live (PUT → preview → publish, ledger-events, concurrency 1); chain + npm lint clean, block-roundtrip --ew 0 structural, qa-gate = the archetype's harness findings. encode-events.mjs now strips editor attributes inside text nodes (Google Translate residue on es/ca/da list items: class/dir/data-placeholder/id); events re-encodes byte-identical. No block code change, no new media.
- Start slides from the frozen references: 4 on all three at 1440 and 360 (captures said 2/6/6) → re-encoded and re-deployed. Gate 1440 es 0.48 / ca 0.48 / da 1.65 % aligned, 360 es 0.42 / ca 0.22 / da 1.59 %; Δh 0 (da +35 = the source's trailing empty `<p>&nbsp;</p>`, drop-empty), clipped 0, content 0/0. Units waived per page with the archetype's element-kind reason (overrides all-1440/all-360). Bands es header 0.32/0.04 %, footer 0.09/0.16 %; chrome parity: only the queued footer "Search" aria-label.

## C-deliver — cluster-static unit (2026-11-24)

- ca-politica-de-privacidad-y-cookies, ca-politica-de-privacitat-i-cookies, da-privacy-policy-and-cookies, covid-19, ca-covid-19, da-covid-19 live (PUT → preview → publish, ledger-static.json, concurrency 1); encode-static.mjs unchanged (spacers: ca 128/45, da 255/45/1, covid 128/32), no code change, no new media (og image already in media/static). Chain clean except delivery-lint P0 "one h1" on the three covid pages = the documented R-02 exception (no heading on the source; .plain.html h1 0, raw shortcode paragraph present); qa-gate harness fails = the archetype's known artefacts (+ the same h1 exception).
- Gate (published origin, main--…aem.page) all 6 PASS without overrides: 1440 0.07–0.36 %, 360 0.08–0.36 %, Δh 0 on every page at both widths; clipped 0, content MISSING/HIDDEN 0. Round 1 failed 4 pages on units only — the legal-section-heading family (h4) was template-wide but ca-privacitat (`<p><em>` heads) and covid pages have no h4 → family scoped to the three pages with h4s in stardust/replica/units.json. covid-19: chrome parity within tolerance (1 advisory), crop header 0.26 / 0.05 %, footer 0.33 / 0.10 % (1440 / 360). Coverage rows deployed with gate verdicts.

## C-deliver — session 5 coordinator note (2026-11-24)

- All 8 archetype units and 8 cluster units done; 70/70 pages live. Remaining units: gate-all, final.
- Open for C-final: apply foundation-requests.md once (h1 type rule, h3 margin, footer search aria-label, ul reset, Montserrat italic, FA brands); es-reservas / da-eventsda / ca-contacte Δh from pipeline-dropped `&nbsp;` paragraphs (spacer block candidate); localize /wp/ and source links; covid pages carry the R-02 no-h1 exception.

## C-deliver — gate-all unit (2026-11-24)

- gate-all.mjs --skip-existing over the 70-page roster on main--ea32f12a--aemcoder.aem.page (max 3 browsers): 1440 39 PASS + 31 documented overrides (R-11 / R-04 source image defects, span-lang and form-label instrument artefacts) → 70/70 delivered, 0 error; 360 the same 39 + 31 → 70/70 (pixel-only 58 PASS; failing criteria pixel 12, content 3, units 24 — all named by overrides).
- Wide report 2560px: 4 pages over 10 % — the experiences template (da-oplevelser 17.04 %, es-experiencias 30.06 %, experiences 13.06 %, ca-experiencies 12.88 %, Δh −16/−24), the same R-04 source-defect columns. update-coverage --gate for 1440 and 360: 70/70 rows matched, 0 flips. Remaining unit: final (foundation-requests queue, C-deliver end).

## C-deliver — final unit (2026-11-24)

- foundation-freeze check clean; foundation-requests.md applied once: h1 type rule added to styles.css (`h1, h2` 200 50px/55px) — a pre-apply probe showed every archetype h1 already computed that paint, so the rule is neutral; the rest kept as scoped block overrides (FA brands mask, h3 10px, content ul, footer aria-label) or declined with residuals (hidden header link copies; Montserrat italic, no captured face).
- Re-gated the 8 archetypes on the preview (gate-all --only, eds recaptured): 1440 8/8 and 360 8/8 delivered, numbers identical to the gate-all unit. Foundation re-frozen; update-coverage --gate 70/70 matched, 0 flips. C-deliver ends.

## D-site (2026-11-25)

- Redirects sheet: stardust/redirects.tsv (71 rows: every source trailing-slash URL → its extensionless EDS path, `/da/home/` + `/da/home` → `/` for the source 301) PUT to DA `/redirects.json`, previewed and published; live checks `/ca/contacte/`, `/da/home/`, `/the-garden/` answer 301 to the right page, `/` 200.
- Chrome documents (nav, footer, es/ca/da variants, foundation-shell) live with `robots noindex`. assemble.mjs --verify-origin: served sitemap 70 urls = assembled 70, 0 extra, 0 missing.

## D2-dynamic (2026-11-25)

- `/query-index.json` answered 404: helix-query.yaml committed (title, description, image, lastModified, robots, page text; chrome excluded), 70 pages re-indexed → total 70.
- Footer search brought to source behaviour: searches the page text too, lists titles without the site suffix, and a `?s=<term>` URL opens with its results (the source's GET). Parity: `?s=penthouse` 3 = source set, `?s=kayak` 1 = source. Residual: the source searches WordPress post content only, so broad terms return more pages here (garden 9 vs 2, beach 5 vs 3).
- stardust/dynamics/parity.json: 8 features, 13 checks + martech. aem.page replay all PASS; aem.live replay all PASS except the 2 search checks — the CDN still serves the pre-change footer.js to module (Origin-header) requests (age < max-age 7200); re-run on the live origin at E.
- Interim / owner rows unchanged: enquiry form endpoint, live availability feed, consent UI + tags (martech contract, all parts disabled).

## E-full-site (2026-11-25)

- verify.mjs --all on aem.live: 67/70 first pass — the three COVID-19 pages had no h1 (R-02: the source has no heading). Register R-12 applied: a visually hidden h1 with the captured page title in a trailing `screen-reader-text` section; republished; published gate 1440 0.17/0.36/0.28 %, 360 0.20/0.36/0.20 %, Δh 0. Re-verify 70/70 verified; update-coverage --gate 1440 + 360: 70/70 matched, 0 flips.
- Headless render check on each template's archetype: carousels advance (home, the-garden, experiences, events), 0 broken images, 0 page errors.

## E2-link-audit (2026-11-25)

- localize-links over content/: 93 source-host links localized + 10 normalized in 52 documents (R-13 `/wp/` redirects, es footer privacy link) — republished; --check PASS. Redirects sheet 101 rows live.
- Live audit: 78 documents, 67 internal targets, 0 non-200; 60 source-host links kept (13 wp-content images, 8 R-13 residual 404 links) — direction.md § E2.

## F-optimize (2026-11-25)

- optimize.mjs --all on aem.live: 70 pages, open P1 0 · P2 70 (no JSON-LD on every page — the source carries a Yoast graph) · P3 1 (da/who-we-are shares who-we-are's description, the source's own text); 16 source-parity findings informational. GATE: no open P1.

## G-aem (2026-11-25)

- autofix-aem --dry-run: 70 candidates, all `eds-jsonld` — none auto-fixable (manual: JSON-LD goes through head.html / the metadata pipeline). Not applied in this run: the source's Yoast schema graph (captured in current/pages/<slug>.html) is handed over as an owner follow-up in the report; P2, not gated. Nothing re-deployed.

## H-report (2026-11-25)

- stardust/rollout/report.md written (pages 70/70 verified, 8 templates, quality, owner to-dos); stardust/learnings.md: 4 entries.

## I-dashboard (2026-11-25)

- dashboard.mjs → stardust/rollout/dashboard/index.html: 70 identified · 70 prototyped · 70 deployed · 0 optimised (every page keeps the open P2 JSON-LD finding).

## Handoff — complete (2026-11-25)

- done-check: complete, no gaps. Rollout A → I ended; 70/70 pages verified and published; redirects 101 rows; martech contract, handoff and scripts/martech.js committed with every part disabled.
- Open note: aem.live still served the pre-change footer.js to browser module requests at 00:50 UTC (CDN variant, max-age 7200), so the live `?s=` search replay passes only once it expires (~02:10 UTC); aem.page passes now. Re-run `dynamics-check.mjs --origin https://main--ea32f12a--aemcoder.aem.live --contract stardust/martech-contract.json` after that.
