# Inconsistency register — casaargentera.com replica

Everything not listed here is frozen; any design delta found by the gate is a defect, not an improvement.

## R-01 — Booking calendar leaks guest reservation data

- **Evidence:** stardust/current/pages/reservations-2.html — booked days of the availability calendar carry Airbnb host reservation-detail URLs (`airbnb.com/hosting/reservations/details/<code>`) and guest phone-number fragments in their markup (4 occurrences on the English page; same on es/ca/da).
- **Finding:** the source publishes guest personal data inside the calendar markup (not visible on screen; present in the DOM). A defect, not a design choice.
- **Minimal change:** the migrated calendar carries day states (free / booked) and the visible text only; the reservation URLs and phone fragments are not carried. No visual change.
- **Status:** applied
- **Where:** booking (reservations-2, es-reservas, ca-reserves, da-reservations) — calendar section.

## R-02 — Raw shortcode text on the COVID-19 page

- **Evidence:** stardust/current/pages/covid-19.json body — visible text `[ultimate_heading …]` (a WordPress shortcode that failed to render).
- **Finding:** a broken shortcode shows as text on the live page.
- **Minimal change:** none in this run — replicated as captured (content is verbatim); handed to the owner.
- **Status:** deferred
- **Where:** static (covid-19, ca-covid-19, da-covid-19).
- **Extension (static cluster render, 2026-11-24 — same treatment as R-10):** stardust/current/pages/covid-19.html, ca-covid-19.html, da-covid-19.html (one WP page, id 15419, served at three paths) — the single column wrapper holds vc_empty_space 32 ×4, the bare text `[ultimate_heading main_heading=”During COVID-19″ alignment=”left”][/ultimate_heading]`, vc_empty_space 32, then one text column of six `<p>` and no heading element at all (content-diff #main: 0 headings; stardust/.work/rollout/static/content-diff-covid-19.txt). The text is carried verbatim (clone: bare text in the column; delivery: a paragraph). Because the source text has no heading, R-10's precedent (promote the first heading) has nothing to apply to and no h1 is invented (the heading text exists only inside the shortcode attribute — inventing it would be unregistered content). These three pages are a documented exception to the delivery contract's "exactly one `<h1>`" (delivery-lint / qa-gate): they deliver with no h1, as the source.

## R-03 — Map iframe has no accessible name

- **Evidence:** stardust/current/pages/contact.html — the Google Maps `<iframe>` carries no `title` attribute (same on es/ca/da contact pages).
- **Finding:** an unnamed iframe is an accessibility defect (WCAG 4.1.2), not a design choice.
- **Minimal change:** add a `title` to the map iframe. No visual change.
- **Status:** applied
- **Where:** form (contact, es-contacto, ca-contacte, da-kontakt) — map section.

## R-04 — Two teaser images render blank on the experiences page

- **Evidence:** stardust/replica/gates/experiences-1440 (live baseline) — the "Nature / sport" and "Beach and more" teaser images render as blank boxes: the lazy loader points them at a `/wp/…` URL that returns 404 and drops the valid srcset. The same files serve from `/wp-content/uploads/2020/03/Punxes_L-1024x576.jpg` and `/wp-content/uploads/2020/03/Sunset-CostaDaurada.jpg` (200, image/jpeg; fetched by da-media-upload 2026-11-24). Same defect on es-experiencias, ca-experiencies, da-oplevelser (same image URLs; da-oplevelser's Escornalbou teaser image too).
- **Finding:** broken images on the live page; a source defect, not a design choice.
- **Minimal change (reconciled with R-11 at the listing archetype unit, EDS delivery):** the images are delivered — rehosted from the working `/wp-content/uploads/…` URL (encoder `stardust/encoders/encode-listing.mjs`, da-media-upload scope `listing`) and laid out exactly as the working teaser image of the same page (Cultural experiences: 1024 px wide inline image, 10 px under it). The recreate-phase prototype keeps the mirrored blank boxes (prototype regime, as gated then); delivery follows R-11 so the whole site treats the lazy-loader defect one way. Measured on /experiences: the pixel gate differs inside the two image boxes only; painted out on both captures (stardust/.work/rollout/listing/probes/paint-residual.mjs) the page measures 0.51 % aligned @1440 and 3.65 % @360 (360: origin slider frozen mid-crossfade, capture state); the two teasers are 8 px taller than the source's broken stubs (the real image's line box, as the working teaser) — Δh −16.
- **Status:** applied
- **Where:** listing (experiences, es-experiencias, ca-experiencies, da-oplevelser) — teaser rows (media-feature head-32).

## R-05 — Hero slide 3 text-layer offsets normalised (EDS delivery, landing)

- **Evidence:** stardust/prototypes/index-proposed.html #main-slideshow — five slides, each with its own Revolution Slider layer offsets (1240 grid): slide 3 title (-189, 24) / sub (-226, 110) vs slide 4 title (-59, 53) / sub (-141, 138).
- **Finding:** per-slide hand positioning is the page builder's storage model; the EDS block exposes a closed layout vocabulary (deploy #134, budget 3–4 words): `center | low | left | low-left`.
- **Minimal change:** slide 3 uses the `left` layout (slide 4's exact offsets) — its layers sit about 130 px further right. Slide 4 (the captured state) and slides 1, 2, 5 are exact.
- **Status:** applied
- **Where:** landing (index, es-inicio, ca-inici, da-home) — hero slider, slide 3 only while it is showing.

## R-06 — Home grid image links follow their heading (EDS delivery, landing)

- **Evidence:** stardust/prototypes/index-proposed.html .house-grid — THE PENTHOUSE image links /wp/the-penthouse/ (heading /the-penthouse/), THE GROUND FLOOR image links /wp/the-old-stable/ (heading /the-ground-floor/).
- **Finding:** inconsistent image vs heading destinations within one tile.
- **Minimal change:** the `linked` image-grid links each image to its heading's destination. No visual change.
- **Status:** applied
- **Where:** landing (index and its locale siblings) — house grid.

## R-07 — Home page has no h1

- **Evidence:** stardust/current/pages/index.json headings — no `<h1>`; the intro heading is an `<h2>`.
- **Finding:** a page without an h1 (SEO / a11y outline defect); the EDS delivery contract asks for one h1 per page.
- **Minimal change:** the intro heading is authored as the page's `<h1>`, painted exactly as the canon h2 (200 50px/55px). No visual change.
- **Status:** applied
- **Where:** landing (index and its locale siblings) — intro; program (the-garden and its accommodation siblings, EDS delivery 2026-11-24) — the intro heading (source `<h2>`, painted 200 50px/55px); article (culture and its editorial siblings, EDS delivery 2026-11-24) — the intro heading (source `<h2>`/`<h3>`, painted as the source heading). form (contact and its locale siblings, EDS delivery 2026-11-24) — the intro heading (source `<h2>`, painted 200 50px/55px); on da-kontakt (intro is a `<p>`) the first column head (source `<h3>`, painted 200 30px/35px).

## R-08 — Icon-with-text per-box colours and margins normalised (EDS delivery, program)

- **Evidence:** stardust/current/pages/the-garden.html — every The7 icon-with-text shortcode emits its own inline CSS: description colour #424242 ×2 / #383838 ×2 / #303030 ×1, description margin-bottom 3px ×2 / 4px ×1 / 0 ×2, title margin-bottom 3px ×2 / none ×3. Across the five English program pages + contact: description colour #303030 ×24 / #383838 ×13 / #424242 ×11, description margin 0 ×31 / 3px ×11 / 4px ×8, title margin 0 or none ×87 / 3px ×13.
- **Finding:** per-box hand-set values are the page builder's storage model, not a design decision (three near-identical greys, 0–4px margins on adjacent boxes of one list); the EDS `icon-features` block exposes no per-item style cell.
- **Minimal change:** every box uses the most frequent values — description #303030, title and description margin 0. Measured on the preview: /the-garden 1440 Δh −4px (features list 3px shorter), 360 Δh −17px (16px from these margins, wrapped boxes); gate PASS 0.32 % / 1.09 % aligned; the description text of 4 of 5 boxes is 1–2 shades lighter/darker.
- **Status:** applied
- **Where:** program (the-garden and its accommodation siblings, es/ca/da) and form (contact) — icon-with-text lists.

## R-09 — Raw shortcode text on two Danish accommodation pages

- **Evidence:** stardust/current/pages/da-stueetagen.html, da-penthousekvisten.html — the contact row's column carries three bare text nodes `[ult_content_box …]`, `[ultimate_modal modal_title=”Mere info?” … btn_text=”Ja, tak gerne” …]`, `[/ultimate_modal][/ult_content_box]` (Ultimate Addons shortcodes that failed to render) around the text column and the CF7 form.
- **Finding:** broken shortcodes show as text on the live page (same class of defect as R-02).
- **Minimal change:** none in this run — replicated as captured (bare text in the column, verbatim); handed to the owner.
- **Status:** deferred
- **Where:** program (da-stueetagen, da-penthousekvisten) — contact row.

## R-10 — Raw heading shortcode text on three "beach and more" article pages

- **Evidence:** stardust/current/pages/es-playas-y-mas.html, ca-platja-i-mes.html, da-strand-m-m.html — the intro row's column wrapper opens with the bare text `[ultimate_heading main_heading=»Actividades para todos» alignment=»left» margin_design_tab_text=»»]` (ca: `»Activitats per a tots els gustos»`, da: `”Oplevelser for alle”`) and closes with `[/ultimate_heading]` (es: inside its own `<p>`); the Ultimate Addons heading shortcode failed to render, so the page has no intro heading and shows the shortcode as text. The English sibling (beach-and-more) has no shortcode. Migrate evidence: stardust/.work/rollout/article/content-diff-es-playas-y-mas.txt, content-diff-ca-platja-i-mes.txt (text equal).
- **Finding:** broken shortcode shows as text on the live page; the intended heading text sits only inside the shortcode attribute (same class of defect as R-02 / R-09).
- **Minimal change:** none in this run — replicated as captured (bare text in the column, verbatim; the encoder carries it as a paragraph); handed to the owner.
- **Status:** deferred
- **Where:** article (es-playas-y-mas, ca-platja-i-mes, da-strand-m-m) — intro row.

## R-11 — Feature images broken on ten article pages (EDS delivery, article)

- **Evidence:** live source probe stardust/.work/rollout/article/probes/broken-src.mjs (1440, full scroll, 2026-11-24): `#content img` with `complete && naturalWidth 0` — es-naturaleza-deporte, ca-natura-esport, nature-sport, da-natur-sport (3 of 3: 20200215_171854P3D-1024x577.jpg, 20170514_123904MolaColldeJouGitte-1024x576.jpg, Horseridingbeach-Casa-Argentera.jpg), es-playas-y-mas, ca-platja-i-mes, beach-and-more, da-strand-m-m (3 of 3: Mediterrani-CasaArgentera-1024x575.jpg, Spa-TermesMontbrio-1024x576.jpg, port-aventura.jpg), es-la-casa, ca-la-casa (1 of 5: P1010765EnhancedP3D-e1587830457410-1024x576.jpg). The lazy loader points the image at `/wp/wp-content/uploads/…` (404) and drops the srcset, whose `/wp-content/uploads/…` URLs serve the same files (200, image/jpeg) — the same defect as R-04. The gate's frozen references (stardust/replica/gates/all-<w>/<slug>/baseline.png) show alt-text stubs where the images belong.
- **Finding:** broken images on the live pages; a source defect, not a design choice.
- **Minimal change:** the images are delivered: each is rehosted from its working `/wp-content/uploads/…` URL (encoder `encode-article.mjs`, da-media-upload scope `article`) and laid out exactly as the working images of the same template (media-feature image column, 50/50 above 768px). Measured: the pixel gate differs on those image boxes only (residual outside them recorded per page in the gate override).
- **Status:** applied
- **Where:** article (the ten pages above) — media-feature image column.

## R-12 — Empty "#" link around one direction icon on da-kontakt (EDS delivery, form)

- **Evidence:** stardust/current/pages/da-kontakt.html — the "Med tog" icon-with-text box wraps its icon in `<a href="#" class="anchor-link text-icon">` (no text, no aria-label; the other 15 form-template boxes use a `<span class="text-icon">`). Gate units (stardust/replica/gates/all-1440/da-kontakt/units.json, unit 2) read it MISSING (role link, 60×60) — the only missing unit on the page.
- **Finding:** a text-less link to the page top is an accessibility defect (WCAG 2.4.4 / 4.1.2: no accessible name) and The7's editor residue, not a design choice; the `icon-features` block carries no per-item icon link.
- **Minimal change:** the icon is delivered without the link (same glyph, size and position). No visual change: pixel 0.04 % @1440 / 0.14 % @360, Δh 0.
- **Status:** applied
- **Where:** form (da-kontakt) — icon-features, item 3 ("Med tog").

## R-12 — No heading on the COVID-19 pages (delivery contract "exactly one h1")

- **Evidence:** R-02 extension — the source column has no heading element; rollout verify (aem.live, 2026-11-25): covid-19, ca-covid-19, da-covid-19 "page should render exactly one <h1>, found 0".
- **Finding:** the page has no heading for assistive technology and search engines; the delivery contract requires one h1.
- **Minimal change:** a visually hidden h1 carrying the captured page title ("COVID-19", the Title metadata without the site suffix) in a trailing section styled `screen-reader-text` (the existing clip rule in styles.css) — nothing visible changes and the shortcode text stays verbatim.
- **Status:** applied (2026-11-25) — published-origin gate re-run: 1440 0.17 / 0.36 / 0.28 %, 360 0.20 / 0.36 / 0.20 %, Δh 0, content MISSING 0; verify 3/3 verified.
- **Where:** static (covid-19, ca-covid-19, da-covid-19).

## R-13 — Broken `/wp/…` page links in the captured content

- **Evidence:** localize-links.mjs keep-list (2026-11-25): 35 distinct `https://www.casaargentera.com/wp/<path>` hrefs in the captured content; on the source 18 answer 301 to a page, 17 answer 404.
- **Finding:** the source links pages through a stale `/wp/` prefix; ten of the 404 targets name a delivered page exactly (`/wp/es/el-jardin` → `/es/el-jardin`, …).
- **Minimal change:** redirects sheet rows for the 18 source 301s (their target) and for the ten 404s whose path names a delivered page; localize-links then writes the links root-relative. The remaining 404 targets (`/wp/l'atic/`, `/wp/experiències/`, `/wp/plajta-i-mes/`, `/wp/ca/contact/`, `/wp/playa-y-mas/`, `/wp/es/experiences/`, `/wp/contacta/`, `/wp/search-results/`) name no page exactly and stay as captured (absolute, 404 on the source as today).
- **Status:** applied (2026-11-25) — 51 documents republished; link audit 67 internal targets, 0 non-200.
- **Where:** article, program, landing and chrome documents across all four trees.
