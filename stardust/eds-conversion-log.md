# EDS conversion log — casaargentera.com

## Publish decision (2026-11-24)
Owner decision, made before the run: **publish**. Every delivered page, the redirects sheet and the chrome documents (nav, footer and their locale variants) go live on the aem.live origin (deploy-batch.mjs without --no-publish, or POST admin.hlx.page/live/…).

## index (landing archetype)

Unit `archetype-landing`, 2026-11-24. Prototype `stardust/prototypes/index-proposed.html`, schema
`stardust/eds-schema/index.json`, content `content/index.html` → DA `/index` (served at `/`).
Media: 18 editorial images → `media/home/` (da-media-upload, ledger `stardust/deploy/media-ledger.json`).

| Section | Triage | Block | Decode tier | Notes |
|---|---|---|---|---|
| hero (#main-slideshow) | block (carousel pattern) | `hero-slider` (variant `start-4`) | template-slotted per slide | rows = slides: image / layers (title, sub) / layout word `center\|low\|left\|low-left` (#134, R-05); section metadata `duration` 2500; autoplay setInterval, 600 ms crossfade, loop, bullets select; `start-<n>` = the source's rotation phase at capture |
| intro (h1 + lede) | default content | — | — | intro h2 promoted to h1 (R-07), painted as h2 via scoped override (foundation request queued) |
| "Get to know the house" | default content (section head) | — | — | head styled in place; block wrapper gets the 20px spacer |
| house grid | block | `image-grid` (variant `linked`) | reconstructive | one cell per column, heading + image stacks, images link to the heading destination (R-06), fadeIn on view |
| Testimonials | default head + block | `testimonials` | reconstructive | row = quote / author; 3/2/1 per view, arrows, 600 ms slide |
| experiences | default head + block | `image-grid` (variant `stacked`) | reconstructive | heading → image 30px, images 10px apart, no fade |
| location | default head + block | `map` | template-slotted (embed) | authored embed link (EW5 (c) exempt); D1 🟡 "default-content candidate" justified: an iframe embed is a bespoke component, not prose |

Round-trip: `block-roundtrip --ew` per block exit 0 (house grid mapped to `.house-grid`; the
experience grid verified alone against `.experience-grid`); EW editable 30/36, 0 dead, 0 duplicated,
6 exempt (5 layout words, 1 map link). qa-gate harness: 25 ok; 2 fails outside this unit (header
block h=0 — overlay masthead by design; the chrome logo served from preview.da.live in the harness).

Published gate (preview origin, gate-all --only index): 1440 pixel 0.25 %, Δh 0, clipped 0,
MISSING/HIDDEN 0, units 0 off (round 2; round 1 0.48 % aligned Δh 10 — stacked grid end pad fixed);
360 pixel 0.54 % aligned (1.14 % unaligned), Δh 0, clipped 0, MISSING/HIDDEN 0 (round 1).
crop-compare: 1440 header 0.26 % / footer 0.08 %; 360 footer 0.13 %, header 39.45 % vs the frozen
baseline (slider mid-crossfade under the translucent header, as at the prototype gate) and 0.09 % vs
ref-2. chrome-parity: quiet at both widths (0 deltas; 2 / 1 advisory). Behaviour on preview: starts
on slide 4, advances every 2500 ms (4→5→1→2), 600 ms crossfade, bullets select; #phantom shows past
250 px and hides back at the top.

## landing siblings — es-inicio, ca-inici (cluster `landing`)

Unit `landing`, 2026-11-24. Encoder: `stardust/.work/rollout/landing/probes/encode-landing.mjs` — the
archetype's authored shape (`content/index.html`) as the template, each page's verbatim slots read from
the hydrated capture `stardust/current/pages/<slug>.html` (headings + hrefs, intro paragraphs, card
titles/alts, testimonials quote/author rows, location head, metadata Title/Description). Same blocks,
same decode tiers as the archetype; hero slider is the source's shared English slider (identical).
Delivered `/es/inicio` → `content/es/inicio.html`, `/ca/inici` → `content/ca/inici.html` (leaf paths;
locale nav/footer docs picked by `scripts/locale.js` from the path prefix).

| Change | Where | Why |
|---|---|---|
| `testimonials author-top` variant | `blocks/testimonials/testimonials.css` (CSS only, scoped) | ca-inici's source carousel is The7 `layout-4` (author row above the quote, avatar shrinking beside the name); geometry matches the source to the px at 1440 and 360; index unchanged (re-gated PASS 0.25 % / 0.55 %) |
| 2 new media | `media/home/CasaArgentera-sala-1-1536x864.jpg`, `CasaArgentera-comedorgeneral-0-1-1536x864.jpg` | sibling house-grid images (noble floor, ground floor) |
| inline `<span lang>` kept in authored headings | content | verbatim; DA drops the span on ingest (text unchanged) |

Deviations: es-inicio's whitespace-only intro `<p>&nbsp;</p>` dropped (accounts for the -25 px step
at y≈1200, 1440); ca-inici's empty location `<h3>` dropped; house-grid images link to the heading
destination (R-06) where the source links them to the English `/wp/the-*/` pages.
Gate overrides (`stardust/replica/gates/all-{1440,360}/overrides.json`, waives `content` only): the
source wraps one accented letter of some headings in `<span lang>`; content-presence tokenises it with a
space ("el jard í") so the identical served heading/link reads MISSING — every other content finding 0.
D1 🟡 (map) justified as on the archetype. Round-trip `--ew` exit 0 per block and whole page.
Instrument note: the shared live cookie jar (`/tmp/stardust-live/…/www.casaargentera.com`) keeps
Polylang's `pll_language` from the last /es or /ca visit, and the source home `/` then 302s to that
locale — gate the home page with `STARDUST_LIVE_STATE=0` after any locale page.

## the-garden (program archetype)

Unit `archetype-program`, 2026-11-24. Prototype `stardust/prototypes/the-garden-proposed.html`, schema
`stardust/eds-schema/the-garden.json`, content `content/the-garden.html` → DA `/the-garden` (live).
Encoder (reused by the 19 accommodation siblings): `stardust/encoders/encode-program.mjs <slug> <out>
[--scope s] [--translations …]` — walks the hydrated capture's WPBakery rows in document order (text
columns → default content, single-image rows → `image-grid plain`, icon-with-text → `icon-features`,
CF7 → `contact-form`, spacers → block CSS), hero from the Revolution Slider (`start-<n>` = the
capture's `data-slideactive`, `duration` = its `data-duration`), writes the media manifest
(1536 renditions; captured files, else source URL). Media: 8 → `media/garden/`.

| Section | Triage | Block | Decode tier | Notes |
|---|---|---|---|---|
| hero (#main-slideshow) | block (carousel) | `hero-slider` (variant `start-2`) | template-slotted per slide | image-only slides; section metadata `duration` 3000; frozen state slide 2 (rs-128). D1 🟡 (2 single-cell rows) justified: a carousel, not prose |
| intro (h1 + lede) | default content | — | — | source h2 promoted to h1 (R-07 extended to program), painted 200 50/55 by the scoped override |
| garden images (2 rows: halves, thirds) | block | `image-grid` (NEW variant `plain`) | reconstructive | one block row per source row, one cell per column; no fade, 46px under every image, 32px under the intro. D3 🟡 (rows 2 / 3 cells) justified: the cell count IS the column count |
| "In the garden you will find" | default content | — | — | h3 |
| features | block | `icon-features` (NEW) | reconstructive | row = icon word (FA5 solid, 23 glyphs) / heading + description; 20px apart, 32px around; per-box colours/margins normalised (R-08) |
| contact head | default content | — | — | h2 + p |
| enquiry form | block | `contact-form` (NEW, shared with contact / events / reservations) | template-slotted per row | row = label / field word [`required`]; note rows single-cell; message, acceptance and submit share one line as in CF7. Interim per dynamic-features row 3: submit blocked, notice in the response line, no POST (probed). D3 🟡 (note rows) justified |

Round-trip `--ew` exit 0 per block and whole page (17/30 editable, 0 dead, 0 duplicated, 13 exempt:
5 icon words, 7 field words, 1 submit caption). qa-gate harness: 20 ok, fails = header/footer h=0
(harness) and the contact-form-row unit count (form lines are divs) — structural asserts otherwise clean.
.plain.html: 200, one h1, 0 about:error, 7 img, no /img/; ai-readability code 100 %.

Published gate (preview origin): 1440 round 1 FAIL — units selector error (no `eds` selector on the
garden families; added to `stardust/replica/units.json`, plus `contact-form-row` / `booking-form-row`)
and the EDS capture served stale CDN CSS (grid −12 px); round 2 PASS 0.32 % aligned (0.80 % unaligned),
Δh 4, 2 steps 4 px, clipped 0, MISSING/HIDDEN 0, units 0 off. 360 round 1 PASS 1.09 % aligned (3.91 %),
Δh 17 (R-08: 16 px of per-box margins), clipped 0, MISSING/HIDDEN 0, units 0 off. crop-compare vs the
frozen baseline: 1440 header 0.34 % / footer 0.22 %; 360 header 0.86 % / footer 0.10 %. chrome-parity
quiet both widths (0 deltas; 3 / 2 advisory). Behaviour on preview: starts slide 2, 2→1→2 every 3000 ms,
600 ms crossfade, bullets select; #phantom shows past the fold, hides at top; submit hover
rgb(221,157,59)→rgb(174,153,100), 0.3 s. index re-gated after the image-grid change: PASS 0.25 % / 0.54 %.

## program cluster

Unit `cluster-program`, 2026-11-24. 19 accommodation siblings of the-garden (es ×5, ca ×5, en ×4, da ×5),
delivered at leaf paths (`/es/el-atico` → `content/es/el-atico.html`, …; list in
`stardust/rollout/units/program.paths`), published live; locale nav/footer from the published locale docs.
Encoder `stardust/encoders/encode-program.mjs <slug> <out> --scope program --start <n>` (driver
`stardust/.work/rollout/program/probes/encode-all.sh`), extended for the three gaps the render units found:

| Gap | Encoder | Block | Decode tier |
|---|---|---|---|
| vc_masonry_media_grid (es-la-planta-baja, ca-la-planta-baixa, the-ground-floor, da-stueetagen) | grid → `image-grid gallery`, one row per grid row (2 cells), cell = image + `<p><a href=file>title</a></p>` (href and title verbatim) | `image-grid` NEW variant `gallery` + `lightbox.js` (lazy) | reconstructive |
| The7 icomoon icons (`icomoon-the7-font-the7-home-021`, 18 boxes on 16 pages) + one FA brands icon (`fab fa-hotjar`, the-ground-floor) | icon word = class minus `icomoon-the7-font-` / `fa-` | `icon-features`: `the7-home-021` (U+E3021, self-hosted icomoon font), `hotjar` (glyph outline mask `fa-hotjar.svg`, FA Free CC BY 4.0) | unchanged |
| bare wrapper text (R-09, da-stueetagen, da-penthousekvisten) | each text node → `<p>` verbatim in source order | default content | — |

Also derived from the capture: `header-veil` (masthead inline background — `amber`, or the literal
`rgba(221,185,51,0.5)` on the four ground-floor pages), `translations` (hreflang alternates), and spacing
variants read from WPBakery spacers — `image-grid plain intro-50` (50px intro spacer) and `stack-70`
(two images stacked 70px apart in a third, no closing spacer) on the four penthouse pages; plain images
narrower than their column keep their own width (a 320px portrait). Gallery: 2 columns above 768px,
20px gutters, 46px under; geometry equals the source (555×312 at x 155/730, 1440). Lightbox = what the
source's prettyPhoto does on click (probed 1440/360): 70 % black overlay, image ≤1024px in a white frame,
thumbnails when wide, play (5 s) / prev / next / n/N / caption (the link title) / close, Esc and arrow keys;
the zoom link is an empty anchor over the image named by its title, as on the source.
Hero `start-<n>`: the source starts at slide 1 and rotates; the published-origin reference freezes after
three transitions (2 slides → 2, 3 → 1, 4 → 4; matched per page against the frozen reference). Media:
47 files → `media/program/` (35 fetched from the source, magic bytes checked; names ASCII-folded).

Chain per page: delivery-lint 0, media-reconcile 0, davids-model-lint 0 except **D15 🔴 on da-stueetagen
and da-penthousekvisten** — the R-09 raw shortcode text contains `css_modal_box=”.vc_custom…{padding-left:
30px !important;}”`; kept verbatim per R-09 (deferred, owner decision) and deployed with this documented
exception. block-roundtrip `--ew` exit 0 on all 19 (0 dead / 0 duplicated); qa-gate: only the archetype's
known harness fails (header/footer h=0, contact-form-row units). .plain.html 200, one h1, all images, 0
about:error; ai-readability code 100 %. Unit families: `garden-image` limited to the 16 pages with single
images, NEW `gallery-image` (`.vc_grid-item .vc_gitem-zone` = `.image-grid.gallery .image-grid-image`, n 6).

Published gate (aem.page), final: 1440 worst 1.04 % aligned (es-el-piso-senorial), 360 worst 1.31 %
(ca-el-jardi); |Δh| ≤ 43px (≤ 0.97 %), clipped 0, MISSING+HIDDEN 0 on 18 pages; ca-el-jardi carries the
documented `<span lang>` heading override (both widths). Round 1 failed 16 pages on the hero slide (13–15 %,
start slide from the capture's mid-rotation state) and the gallery links' names (image alt vs the source's
title); round 2 fixed both. Re-gated after the shared-block changes: the-garden 0.32 % / 1.09 %, index
0.25 % / 0.57 % — PASS. Content-count (content-diff of each published page vs its capture, chrome
included, `stardust/.work/rollout/program/cd-pub-<slug>-1440.txt`): #main 🔴 only `<span lang>` heading
artefacts (MISSING HEADING / ROLE SWAP on spanned h2/h3); header 🔴 = the queued language/social-link
finding; footer 0. da-the-garden and da-the-noble-floor: the source serves the ENGLISH masthead menu
on those two Danish pages (16 extra header 🔴); the build uses the published Danish nav (noted, not fixed).

## culture (article archetype)

Unit `archetype-article`, 2026-11-24. Prototype `stardust/prototypes/culture-proposed.html`, schema
`stardust/eds-schema/culture.json`, content `content/culture.html` → DA `/culture` (live).
Encoder (reused by the 22 editorial siblings): `stardust/encoders/encode-article.mjs <slug> <out>
[--scope s] [--start n] [--translations …]` — walks the hydrated capture's WPBakery rows in document
order: full-width text → default content (verbatim; first heading promoted to h1, R-07), rows of 2+
text columns with an image → `media-feature` (row = image column | text column, column order kept),
single-image rows → `image-grid plain`, bare wrapper text / inline runs → `<p>` verbatim (R-09 class,
es-playas-y-mas, ca-platja-i-mes), spacers → `media-feature` variants (`gap-<n>` between rows, default
40; `top-<n>` above, default 56; `intro-<n>` under the intro h1), unknown modules reported on stderr.
Media: 6 → `media/culture/` (1536 renditions where captured).

| Section | Triage | Block | Decode tier | Notes |
|---|---|---|---|---|
| hero (#main-slideshow) | block (carousel) | `hero-slider` (unchanged) | template-slotted per slide | ONE slide (EscalaDei-CasaArgentera.jpg), no layers, no bullets, no timer — static as restoreAtDelivery records; no `duration` metadata (a single slide never rotates). D1 🟡 (1-row block) justified: the shared carousel, siblings carry 3 slides |
| intro (h1 + blank line + lede) | default content | — | — | source h2 promoted to h1 (R-07, now also article), painted 200 50/55 by the scoped override in media-feature.css. The source's `<p>&nbsp;</p>` is dropped by the delivery pipeline (.plain.html) → carried as the block variant `intro-45` (h1 margin 10 + 25 line + 10) |
| 4 image + text rows | block | `media-feature` (NEW) | reconstructive | one row per feature, one cell per column; image cell = the cell holding a picture; 50/50 above 768px, stacked below; 56px above, 40px between (vc_empty_space). The pipeline unwraps the image paragraph: the picture is an inline-block (overflow hidden → baseline at its bottom margin edge) so the 8px descender gap of the source line box is kept and the picture measures as the source image |

Chain: delivery-lint 0, media-reconcile 0 (6 hosted), davids-model-lint 0 🔴 (1 🟡 D1 above),
sanitise ok; block-roundtrip `--ew` media-feature exit 0 (editable 10/10, 0 dead / 0 duplicated),
whole page exit 0; qa-gate harness: 14 ok, fails = known harness (header/footer h=0; schema unit
mapped by order onto the hero). localize-links `--check`: content/culture.html clean; content/index.html
now has 2 localizable links to /culture (index owned by the landing unit — re-run at C-final).
.plain.html: 200, one h1, 5 img, 0 about:error, no /img/; ai-readability code 100 %.

Published gate (preview origin): 1440 round 1 FAIL units (3 off: alt-less images matched the inline
`<picture>` box, 18px tall, not the image — fixed in CSS, geometry unchanged); round 2 PASS 0.24 %
(text 0.02 %), Δh 0, clipped 0, MISSING/HIDDEN 0, units 0 off (culture-feature-column, eds selector
`.media-feature .media-feature-col` added to units.json). 360 round 1 PASS 0.36 % (text 0.17 %), Δh 0,
clipped 0, MISSING/HIDDEN 0, units 0 off. Geometry probe equals the prototype at both widths (h1 y928,
rows 319px at y1269/1628/1987/2346, footer y2725 @1440; rows 187+530… footer y3990 @360).
crop-compare vs the frozen baseline: 1440 header 0.35 % / footer 0.08 %; 360 header 1.21 % / footer
0.40 %. chrome-parity quiet both widths (0 deltas; 2 / 1 advisory). Active trail on preview = source:
EXPERIENCES underline 111px + CULTURE rgb(221,157,59) (main, #phantom, mobile) — foundation header.
No shared block changed → index / the-garden not re-gated.

## article cluster

Unit `cluster-article`, 2026-11-24. 23 editorial siblings of culture (es ×6, ca ×6, en ×5, da ×6), delivered at
leaf paths (`/es/cultura` → `content/es/cultura.html`, …; list in `stardust/rollout/units/article.paths`),
published live; locale nav/footer from the published locale docs. Encoder `stardust/encoders/encode-article.mjs`
(driver `stardust/.work/rollout/article/probes/encode-all.sh`: encode → localize-links over a copy of the whole
tree, only this cluster's files taken back → chain), extended for what the siblings carry:

| Gap | Encoder | Block | Decode tier |
|---|---|---|---|
| comment-only `<p><!-- /wp:… --></p>` (es-el-entorno, the-place, ca-lentorn, da-stedet) | dropped like the pipeline drops them; one closing the text column before a single-image row keeps the text's 10px margin → `intro-42` | `image-grid` NEW plain modifier `intro-42` (42px under the text) | reconstructive |
| single-image row with no closing spacer (who-we-are ×4) | `end-0` when no image of the rows has a spacer | `image-grid` NEW plain modifier `end-0` | reconstructive |
| intro heading is a source h3 (es/ca-la-casa, the-house, da-the-house) | promoted to h1 (R-07) + `intro-h3` on the page's media-feature | `media-feature` NEW variant `intro-h3` (h1 painted 200 30px/35px, 10px below) | — |
| no intro heading (R-10 pages es-playas-y-mas, ca-platja-i-mes, da-strand-m-m) | first feature h2 promoted to h1 (R-07); raw `[ultimate_heading …]` text kept verbatim (R-10 deferred) | `media-feature` h1 in a text column painted as the canon h2 | — |
| source h3 followed by text (es-playas-y-mas Port Aventura) | — | `.media-feature-text h3` 10px below (scoped override; styles.css sets 0 — request queued) | — |
| `/wp/wp-content/…` image src 404 on the source (R-11, ten pages) | upload manifest fetches the srcset's `/wp-content/…` URL | — | — |

Hero `start-<n>`: 3-slide heroes keep autoplay; start = the slide the frozen reference shows, matched per page
(`probes/slide-match-eds.mjs`): the program rule (3 transitions → slide 1) holds for the culture/house/beach
heroes, the entorno heroes (es-el-entorno, ca-lentorn, the-place, da-stedet) freeze on slide 3 (`starts.txt`).
Unit families (`stardust/replica/units.json`): `culture-feature-column` limited to the four culture pages (n 8),
NEW `article-feature-column-6` (8 pages), `article-feature-column-10` (4 la-casa/the-house pages),
`article-image-5` / `article-image-3` (`#content .wpb_single_image` = `.image-grid.plain .image-grid-image`).
Media: 35 files → `media/article/` (20 fetched from the source, magic bytes JPEG/PNG checked; 4 via the `/wp/` repair).

Chain per page: delivery-lint 0, media-reconcile 0, davids-model-lint 0, sanitise ok; block-roundtrip `--ew`
exit 0 on all 23 (0 structural 🔴, 0 dead / 0 duplicated); qa-gate: only the archetype's known harness fails
(header/footer h=0; schema unit mapped onto the hero). .plain.html 200, one h1, all images (+1 og:image in head),
0 about:error, no /img/; ai-readability code 100 % (23/23). localize-links: 6 links localized
(la-casa/the-house → accommodation pages); `/wp/<locale>/…` accommodation links stay absolute (not in the
map; redirects at C-final / E2).

Published gate (aem.page), final: 23/23 delivered at both widths — 11 PASS on their own, 12 PASS with a
documented override (`stardust/replica/gates/all-<w>/overrides.json`). Clean pages worst: 1440 0.59 %
(da-the-house), 360 1.7 % unaligned / 0.65 % aligned (the-house); Δh ≤ 1px, clipped 0, MISSING+HIDDEN 0 on
all 23. Overrides, each with its measured cause: R-11 (NEW register entry — the source lazy loader breaks 1–3
feature images on ten pages; the build delivers them): pixel waived on 8 pages, measured 13–14.3 % @1440 /
12.4–20.1 % @360 raw; with the broken-image columns painted out of both captures (`probes/paint-residual.mjs`)
the residual is ≤ 1.11 % @1440 (da-natur-sport 3.73 %) and ≤ 7.3 % @360 (the 8px-per-row line-box shift
under each delivered image) — es/ca-la-casa pass pixel on their own (≤ 6.76 % / 9.83 %) with Δh −143 / −126
from the delivered ground-floor image; units waived where the units probe reads the `<span lang>` inline box
(dy −3 / dh +7, span-wrapped heading fragments MISSING; DA drops the span) or the pipeline's merge of two
adjacent `<strong>` runs + `&nbsp;` → space (ca-natura-esport). Round 1 failed 16 pages (hero slide on the
four entorno pages 24 %, image-row spacing −10px ×2 and the 46px closing spacer, h3 margin, R-11 and unit
artefacts); rounds 2–3 fixed the build-side causes.
Sibling chrome (es-cultura): crop-compare 1440 header 0.44 % / footer 0.09 %, 360 header 1.49 % / footer
0.42 %; chrome-parity 1 delta per width (footer search button aria-label "Search", foundation — request queued).
Content-count (content-diff published vs capture, `stardust/.work/rollout/article/cd-pub-<slug>-1440.txt`):
#main 🔴 only `<span lang>` heading artefacts (ROLE SWAP / MISSING HEADING on 7 pages); header 🔴 = the queued
language/social-link finding; ca-cultura and ca-la-casa: the source serves the SPANISH masthead/footer,
da-the-house and da-who-we-are the ENGLISH masthead — the build uses the locale's published nav (noted, not fixed).
Re-gated after the shared-block changes (media-feature, image-grid; additive variants): culture 0.24 % / 0.36 %, index 0.25 % / 0.55 %, the-garden 0.32 % / 1.09 % — PASS.

## contact (form archetype)

Unit `archetype-form`, 2026-11-24. Prototype `stardust/prototypes/contact-proposed.html`, schema
`stardust/eds-schema/contact.json`, content `content/contact.html` → DA `/contact` (live).
Encoder (for es-contacto, ca-contacte, da-kontakt): `stardust/encoders/encode-form.mjs <slug> <out>
[--scope s] [--start n] [--translations …]` — walks the capture's WPBakery rows: full-width text →
default content (first heading → h1, R-07), gmaps widget → `map` (`top-10` when inside the text
column), two-column rows → one section with style `split` (text-only row = column heads, then the
left column's modules, the right column's form LAST), icon-with-text → `icon-features` (`title-22`
for h4 titles, `gap-32` for 32px spacers), CF7 → `contact-form`. Media: 2 → `media/contact/`.
All four locale captures encode (da-kontakt: intro is a `<p>` → first column head is the h1; an extra
left-column paragraph under the directions).

| Section | Triage | Block | Decode tier | Notes |
|---|---|---|---|---|
| hero | block (carousel) | `hero-slider` (unchanged) | template-slotted per slide | one slide, static (no duration) |
| intro + map | default content + block | `map` (+ variant `top-10`) | config link | h2 → h1 (R-07), override in map.css; iframe title (R-03) |
| heads + directions + form | section style `split` | `icon-features` (+ `title-22 gap-32`), `contact-form` (unchanged JS) | reconstructive | grid layout in contact-form.css (`main > .section.split`), stacked ≤768 in source order |

Chain: delivery-lint 0, media-reconcile 0, davids-model-lint 0, sanitise ok; block-roundtrip `--ew`
whole page exit 0 (editable 17/30, 0 dead / 0 duplicated, 13 exempt); qa-gate harness: known fails
only (header/footer h=0; schema unit #2 mapped onto the map). .plain.html 200, one h1, 1 img,
0 about:error; ai-readability code 100 %. Code NOT pushed by the unit (coordinator commits): the gate
ran against the preview content through a local code overlay (`stardust/.work/rollout/form/probes/
code-overlay.mjs`, code paths from the working tree, everything else proxied from main--…aem.page).
Gate: 1440 pixel 0.04 % Δh 0, 360 0.23 % Δh 0, clipped 0, MISSING/HIDDEN 0; contact-direction units
4/4 within (eds selector added to units.json); contact-form-row 5 off = label inline box vs the authored
label `<p>` (dy −3, dh −26) → documented override (units only) in gates/all-<w>/overrides.json.
crop-compare 1440 header 0.32 % / footer 0.05 %, 360 header 0.18 % / footer 0.10 %; chrome-parity
within tolerance (advisory only). restoreAtDelivery: phantom show/hide on scroll, CF7 submit hover
300 ms, interim no-backend notice — verified on the overlay. Shared blocks changed (variants only):
index 0.25 %, the-garden 0.32 % Δh 4 @1440 re-gated unchanged.

## experiences (listing archetype) — 2026-11-24

Encoder `stardust/encoders/encode-listing.mjs` (runs on experiences, es-experiencias, ca-experiencies,
da-oplevelser; media scope `listing`). Schema stardust/eds-schema/experiences.json.

| Section | Triage | Block | Decode tier | Notes |
|---|---|---|---|---|
| hero | block (carousel) | `hero-slider` (unchanged) + section metadata `duration 3500` | template-slotted per slide | 6 slides, `start-3` = frozen origin slide |
| intro | default content | — | — | h2 → h1 (R-07), painted as canon h2 by media-feature.css |
| teasers | block (repeat) | `media-feature` (+ `top-32 gap-32 head-32 end-32`) | reconstructive | one row per teaser: linked h2 + image paragraph(s), one column |

Chain: delivery-lint 0, media-reconcile 0, davids-model-lint 0, sanitise ok; block-roundtrip `--ew`
whole page exit 0 (editable 5/5, 0 dead / 0 duplicated); qa-gate harness: known fails only (header/footer
h=0; schema unit family = the prototype's two text-columns per teaser). .plain.html (preview + live) 200,
one h1, 9 img, 0 about:error. Code NOT pushed by the unit (coordinator commits): fix rounds ran against the
preview content through `aem up` on a code-only copy of the working tree (port 3018, proxy to
main--…aem.page); the code then landed with the coordinator's checkpoint (7213db3) and the final gate
re-ran on main--ea32f12a--aemcoder.aem.page with identical numbers. Gate: 1440 22.91 % → R-04 override (painted residual 0.51 % aligned), 360 13.67 % →
override (residual 3.65 %, origin slider mid-crossfade), Δh −16 both (the two teasers whose source image is
broken are 8 px taller, as the working teaser); clipped 0, MISSING/HIDDEN 0; experience-teaser units 3/3,
2 rows off = the broken stubs' anchors (eds selector added to units.json). crop-compare 1440 header 0.35 % /
footer 0.05 %, 360 header 9.37 % (veil over the origin's 3→4 crossfade — capture state, as recreate 360) /
footer 0.10 %; chrome-parity 0 deltas both widths. restoreAtDelivery verified on the preview
(stardust/.work/rollout/listing/motion-experiences.txt): autoplay 3469–3525 ms, 0.6 s fade, loops 6→1,
bullet click selects, #phantom show/hide at 600/0 px. Shared block changed (variants only, `head-<n>`
scoped): culture re-gated 0.24 % Δh 0 unchanged.

## reservations-2 (booking archetype) — 2026-11-24

Unit `archetype-booking`. Prototype `stardust/prototypes/reservations-2-proposed.html`, schema
`stardust/eds-schema/reservations-2.json`, content `content/reservations-2.html` → DA `/reservations-2`
(live). Encoder `stardust/encoders/encode-booking.mjs <slug> <out> [--scope s] [--translations …]`
(media scope `booking`; runs clean on es-reservas, ca-reserves, da-reservations): walks the hydrated
capture's WPBakery rows — text → default content (h2 → h1, R-07), CF7 → `contact-form`, ICS Calendar →
`availability-calendar` with the calendar row's text columns as its side cells, an empty row after the
calendar → variant `tail-1`.

| Section | Triage | Block | Decode tier | Notes |
|---|---|---|---|---|
| hero | block (carousel) | `hero-slider` (unchanged) | template-slotted per slide | ONE slide (Collage-CasaArgentera.jpg), no layers/bullets/timer — D1 🟡 justified as article (shared carousel) |
| enquiry | default content + block | h1 + `contact-form` (unchanged) | template-slotted per row | spacers 64 / 32 (+ the last line's 10) and the note's 25 carried by section-scoped rules in availability-calendar.css |
| availability + prices | block | `availability-calendar` (NEW) | reconstructive (generated grid) | setting rows (label, today, weekdays, all day, no events, day label {l} {d}/{m} or {l} {F} {j}, day/month names), one `YYYY-MM` row per captured month (15), one row per booking (`date [– date]`, title — 5), one-cell side rows (prices) MOVED; R-01: no reservation URLs / descriptions / phone fragments; dynamic-features row 10 interim (static snapshot, today = 2026-11-24) |

Chain: delivery-lint 0, npm run lint clean, media-reconcile 2 hosted, davids-model-lint 0 🔴 (D1 hero, D3
mixed cell counts by design), sanitise ok; block-roundtrip `--ew` availability-calendar + contact-form and
whole page exit 0 (0 structural 🔴, 0 dead / 0 duplicated; 54 + 8 declared exempt); qa-gate harness: known
fails only (header/footer h=0, schema unit #1 mapped onto the hero). Calendar DOM vs prototype: 129/129
lines identical (states, day labels, multi-day bars, hover blocks, no-events lines). .plain.html 200, one
h1, 0 about:error, no /img/. Code reached the preview with the coordinator's checkpoint (7213db3); a first
round ran on `aem up` (code-only copy, port 3010) with the same numbers.
Gate (preview origin): 1440 0.15 % Δh 0, 360 0.28 % Δh 0; clipped 0, MISSING/HIDDEN 0; booking-price-column
and booking-calendar-day units within tolerance (eds selectors added to units.json); booking-form-row
off 5 = the CF7 label-box instrument artefact → units-only override (as contact). crop-compare 1440
header 0.35 % / footer 0.05 %, 360 header 1.00 % / footer 0.13 %; chrome-parity quiet both widths.
restoreAtDelivery on the preview: #phantom show/hide on scroll, month dropdown switches, multi-day hover
block names the range, submit shows the no-backend notice; 0 page errors.
