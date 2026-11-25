<!-- stardust:provenance
  writtenBy: stardust:extract --prep
  writtenAt: 2026-11-24T10:05:00Z
  mode: descriptive (current state of https://www.casaargentera.com/)
  readArtifacts:
    - stardust/current/_brand-extraction.json
    - stardust/current/_computed-styles.json (aggregate; 61 final URLs x 360/1440)
    - stardust/current/pages/*.json, *.html (70)
    - stardust/current/assets/css/combined.css
  synthesizedInputs: []
  stardustVersion: 0.10.0
-->
---
name: Casa Argentera
description: Rural-tourism village house between the Priorat and the Mediterranean — current-state design system
colors:
  amber: "#dd9d3b"
  amber-deep: "#dd9933"
  amber-veil: "rgba(221, 153, 51, 0.5)"
  amber-hover: "#ae9964"
  sand: "#ddbd89"
  paper: "#ffffff"
  ink: "#3a3a3a"
  ink-deep: "#2b2b2b"
  mist: "#f0f3f6"
  field: "#fcfcfc"
  hairline: "rgba(173, 176, 182, 0.3)"
typography:
  display:
    fontFamily: "Montserrat, Helvetica, Arial, Verdana, sans-serif"
    fontSize: "50px"
    fontWeight: 200
    lineHeight: "55px"
    letterSpacing: "normal"
  headline:
    fontFamily: "Montserrat, Helvetica, Arial, Verdana, sans-serif"
    fontSize: "30px"
    fontWeight: 200
    lineHeight: "35px"
    letterSpacing: "normal"
  title:
    fontFamily: "Montserrat, Helvetica, Arial, Verdana, sans-serif"
    fontSize: "22px"
    fontWeight: 200
    lineHeight: "30px"
    letterSpacing: "normal"
  label:
    fontFamily: "Montserrat, Helvetica, Arial, Verdana, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "27px"
    letterSpacing: "normal"
  body:
    fontFamily: "Montserrat, Helvetica, Arial, Verdana, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "25px"
    letterSpacing: "normal"
  button:
    fontFamily: "Montserrat, Helvetica, Arial, Verdana, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: "normal"
    letterSpacing: "normal"
rounded:
  none: "0"
  button: "25px"
  circle: "200px"
  round: "50%"
spacing:
  spacer: "20px"
  gutter-page: "60px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "12px 25px 11px"
  button-primary-hover:
    backgroundColor: "{colors.amber-hover}"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
  header-band:
    backgroundColor: "{colors.amber-veil}"
    textColor: "{colors.paper}"
    height: "172px"
  header-sticky:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.paper}"
  amenity-icon:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.paper}"
    rounded: "{rounded.circle}"
    size: "60px"
  footer:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
---

# Design System: Casa Argentera (current state)

## Overview

**Creative North Star: "The Village House in Afternoon Light"**

Casa Argentera reads as a warm, photo-led holiday brochure. Almost every page (63 of 70) opens on a full-width Revolution Slider slideshow of the house, garden and surrounding landscape, with the masthead floating over it on a translucent amber band. Below the hero the page turns white and quiet: one large, thin amber Montserrat headline, a few lines of small grey body copy, then square-cornered photographs in 2-up and 3-up rows, icon lists of amenities, and — on every unit, event, booking and contact page — an enquiry form. A full-bleed amber footer closes every page.

Density is low and the system is minimal by construction: a single chromatic colour, one typeface, no shadows, no card chrome. Everything decorative is carried by photography; everything brand is carried by amber. Rounding appears only on controls (25px pill buttons, circular 60px icon chips, round slider bullets) — imagery and sections are square.

This is a WordPress / The7 / WPBakery build, and it shows in the details: spacing comes from per-block spacer elements (20px), there is no `<h1>` anywhere (page titles are switched off), and the header tint drifts slightly between page groups.

**Key Characteristics:**
- Single amber accent `#dd9d3b` on white; grey `#3a3a3a` body text
- Montserrat throughout; display headings at weight 200
- Photo slideshow hero with the header overlaid on 50% amber
- Flat: no shadows, square photography, no card containers
- Round only for controls: 25px buttons, 200px (circle) icon chips
- Enquiry form as the universal page closer; amber footer band

## Colors

One warm amber does all the brand work against white and two greys.

### Primary
- **Argentera Amber** (#dd9d3b): h2/h3/h4 headings, in-content links, form submit and search buttons, the full-bleed footer background, amenity icon chips. Declared as `--the7-accent-color`, `--the7-btn-bg-color`, `--the7-footer-bg-color`. Census weight 3459, used as text, background and border.
- **Amber Deep** (#dd9933): the uppercase h5 amenity titles and h4 uppercase labels; also the base of the header veil.
- **Amber Veil** (rgba(221,153,51,0.5)): the 172px masthead band laid over the hero (41 pages); variants rgba(221,179,110,0.5) on 16 pages and rgba(221,185,51,0.5) on 4.
- **Amber Hover** (#ae9964): button hover background.

### Secondary
- **Sand** (#ddbd89): the sticky header clone (`#phantom`) shown on scroll.

### Neutral
- **Paper White** (#ffffff): page ground; white text/links on the footer and over the hero.
- **Ink Grey** (#3a3a3a): body copy (`--the7-base-color`).
- **Footer Ink** (#2b2b2b): footer contact widget text and links (hover #0a0a0a).
- **Field Mist** (#f0f3f6) / **Field** (#fcfcfc): form field and calendar fills.
- **Hairline** (rgba(173,176,182,0.3)): form field borders.

### Named Rules
**The One Amber Rule.** Amber is the only chromatic colour in the system; everything else is white or grey. (Slider caption accents #f2ab41 / #e09500 are the only near-amber exceptions.)

## Typography

**Display Font:** Montserrat (with Helvetica, Arial, Verdana, sans-serif)
**Body Font:** Montserrat (same stack)

**Character:** One geometric sans used at two extremes — hairline-thin 200 for large amber headlines, heavy 800 for button labels — with 14px regular body in between. Self-hosted Google Fonts (`font-display: swap`).

### Hierarchy
- **Display** (200, 50px, 55px): the page lead headline (h2) in amber; 133 instances at 1440.
- **Headline** (200, 30px, 35px): section heads and linked card titles (h3) in amber.
- **Title** (200, 22px, 30px): sub-sections (h4) in amber; a 400 uppercase variant in #dd9933 on booking/contact pages.
- **Label** (400, 17px, 27px, uppercase via CSS): amenity titles (h5) beside icon chips, #dd9933.
- **Body** (400, 14px, 25px): all prose in #3a3a3a; white on the footer.
- **Button** (800, 14px): Send / Enviar / Go! / Ir! on amber.
- **Nav** (400, uppercase-authored labels, white): primary menu; top-bar language links at 300.

No visible `<h1>` exists on any captured page; the theme’s `--the7-h1-font-size: 60px` is unused. The scale is ad-hoc: 50 → 30 → 22 → 17 → 14 (ratios 1.667, 1.364, 1.294, 1.214).

### Named Rules
**The Thin Headline Rule.** Display and section headings are Montserrat 200 in amber — never bold.

## Layout

Full-bleed hero slider, then a centred content column (theme-declared content width 1250px / box 1280px; measured caps are left to cap-probe) built from WPBakery rows: 12-column single blocks, 6/6 pairs (image/text or image/image) and 4/4/4 trios. Vertical rhythm comes from `vc_empty_space` spacer elements (typically 20px) rather than a spacing scale. The masthead is 172px at 1440 (36px top bar for language switcher + social icons, then logo badge and nav) and overlays the slider; on pages without a slider (legal, COVID) it sits on white. Footer: three widget columns over two rows with 60px side padding. Mobile (360) collapses rows to one column and swaps to the 75px logo and a hamburger.

## Elevation & Depth

Flat. No brand surface carries a shadow; the only measured shadows are third-party (reCAPTCHA badge `rgb(128,128,128) 0 0 5px`) and the slider loader. Depth comes from photography and from the translucent amber header over images.

### Named Rules
**The Flat Brochure Rule.** Surfaces stay flat; photographs supply all depth.

## Shapes

Square by default: photographs, rows, form fields and the footer have no radius. Round shapes are reserved for controls: 25px pill buttons and footer search field, 60px circular icon chips (200px radius — the cross-page mode, 688 occurrences), 50% round slider bullets and social icons, 100px top-bar social icons.

## Components

### Buttons
- **Shape:** pill (25px).
- **Primary:** amber `#dd9d3b` background, white 14px/800 label, padding 12px 25px 11px, no border (the footer search “Go!” adds a 2px outset black border).
- **Hover / Focus:** background shifts to `#ae9964`; no focus ring styled.
- **Secondary / Ghost:** none observed.

### Cards / Containers
- **Corner Style:** none (0).
- **Background:** transparent on white — an amber h3 link sits above a photo.
- **Shadow Strategy:** none.
- **Internal Padding:** none; 20px spacer between heading and image.

### Inputs / Fields
- **Style:** #fcfcfc fill, 1px rgba(173,176,182,0.3) border, square; labels above in 14px grey (“Your Name (required)”).
- **Focus:** browser default.
- **Error:** Contact Form 7 response output.

### Navigation
- White uppercase labels over the amber veil; hover draws a left-to-right underline; dropdowns under THE HOUSE and EXPERIENCES. A top bar carries Dansk · Català · Español · English plus Instagram/Facebook. A sand (#ddbd89) sticky clone appears on scroll.

### Hero Slider (signature)
Revolution Slider 6, full-width, 1–6 photo slides at 2.5s, round bullets bottom-centre. Landing and events slides carry a two-line caption (script-like eyebrow + uppercase title, e.g. “Casa Argentera / WELCOME HOME”).

### Amenity Icon List (signature)
60px amber circle with a white Font Awesome 5 solid glyph, uppercase 17px h5 title in #dd9933, grey description lines.

### Footer Band
Full-bleed amber, white 14px text: CONTACT US · SEARCH · FOLLOW US / OTHER RENTALS · LEGAL INFO, bottom bar “©2020 Casa Argentera” and the language list.

## Do's and Don'ts

### Do:
- **Do** open content pages with a full-width photo slideshow under an amber-veiled header.
- **Do** set lead headlines at 50px/55px Montserrat 200 in #dd9d3b.
- **Do** keep body copy at 14px/25px #3a3a3a.
- **Do** use 25px amber pills (#dd9d3b → #ae9964 on hover) for actions.
- **Do** close unit, event, booking and contact pages with the enquiry form.

### Don't:
- **Don't** add shadows or card chrome around image blocks.
- **Don't** introduce a second accent colour.
- **Don't** round photographs or section containers.
- **Don't** bold display headings.

## Third-party embeds (opaque to extraction)

No page is embed-dominated. Embeds present: Google Maps on `index`, `es-inicio`, `ca-inici`, `contact`, `es-contacto`, `ca-contacte`, `da-kontakt` (renders grey/blank in captures); reCAPTCHA v3 badge on all pages; ICS Calendar (Airbnb iCal) on the four reservations pages.
