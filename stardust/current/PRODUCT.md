<!-- stardust:provenance
  writtenBy: stardust:extract --prep
  writtenAt: 2026-11-24T10:05:00Z
  mode: descriptive (current state of https://www.casaargentera.com/)
  readArtifacts:
    - stardust/current/_brand-extraction.json
    - stardust/current/_computed-styles.json
    - stardust/current/pages/*.json (70)
    - stardust/state.json
  synthesizedInputs: []
  stardustVersion: 0.10.0
-->
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

_provenance: inferred — basis: page copy, testimonials, capacity and price statements on the captured pages._

- Families, multi-generation groups and friend groups (the whole house sleeps up to 13–15) planning a self-catering stay in rural Catalonia; testimonials cite groups of 10–15 with children (`index`, `the-whole-house`).
- Smaller parties renting a single apartment (penthouse for 4, noble floor for 5–6, ground floor for 4) (`the-penthouse`, `the-noble-floor`, `the-ground-floor`).
- Groups organising events, workshops, retreats or training camps (tastings, yoga, bike camps) (`events`).
- Four language audiences: English (root), Spanish (`/es/`), Catalan (`/ca/`), Danish (`/da/`); guest reviews come from Denmark, France and Spain.

## Product Purpose

A brochure-and-enquiry site for Casa Argentera, a restored historic village house (rural-tourism rental) in L’Argentera, Baix Camp, between the Priorat wine region and the Mediterranean coast (Costa Daurada). It presents the house and its four rentable parts, the garden and pool, the surrounding area and activities, events, and prices, and converts visitors through a contact/enquiry form and an availability calendar. Success = a qualified booking enquiry (form submission, email or phone).

## Positioning

_provenance: inferred — basis: hero captions and intro copy._

An authentic, family-run Catalan village house — “A place where time stands still, and unique traditions stays alive” — with a majestic view of the castle of Escornalbou, hosted personally by a Danish-Catalan couple (Albert & Ina), rentable whole for big groups or by individual floor.

## Capabilities and Constraints

- Content types (from `stardust/state.json`): landing (3), program / rentable unit (20), article (24), listing (4), events (4), form/contact (4), booking (4), static/legal (7) — 70 captured pages across 4 locales.
- Enquiry via Contact Form 7 (name, email, phone, subject, message, privacy acceptance) protected by reCAPTCHA v3 — on 32 pages.
- Availability calendar (ICS Calendar plugin, Airbnb iCal feed) and static price list (e.g. “950-975 € for up to 13 persons” per weekend; “2975-3400 €” per week in high season; extra beds 15 €/night) on the 4 reservations pages.
- Google Maps embeds on landing and contact pages; site search in the footer.
- No online booking or payment; no accounts.
- Platform today: WordPress + The7 theme + WPBakery + Revolution Slider; Polylang-style locale folders. 10 source URLs redirect: 9 captured records (`state.json` `sourceRedirectsTo`, e.g. `/da/the-garden/` → `/the-garden/`, `/ca/cultura/` → `/es/cultura/`) plus `/da/home/` (301 → `/`, redirect loop; not captured).

## Brand Commitments

- **Register:** `brand` (marketing / hospitality brochure).
- **Name & marks:** “Casa Argentera”; square badge logo `stardust/current/assets/logo.png` (172×136, also the favicon); sister property “Casa Vella del Panta” promoted in the footer.
- **Personality (observed):** warm, sensory, unhurried, family-hosted; short evocative hero captions (“WELCOME HOME”, “THE TIME IS YOURS”, “HERE YOUR STORY BEGINS”).
- **Visual identity (observed):** one amber accent (#dd9d3b) on white, Montserrat with thin 200-weight display headings, photography-led, flat.
- **Anti-references (observed by absence):** no dark mode, no shadows/cards, no stock-UI chrome, no bold display type.

## Evidence on Hand

- Page records + rendered HTML: `stardust/current/pages/<slug>.json|.html` (70), each with typed `slots`.
- Screenshots: `stardust/current/assets/screenshots/<slug>.png` (70).
- Computed-style census (61 final URLs × 360/1440): `stardust/current/_computed-styles.json`.
- Brand surface: `stardust/current/_brand-extraction.json`; tokens: `stardust/current/DESIGN.md`, `DESIGN.json`.
- Logo/favicon: `stardust/current/assets/logo.png`, `assets/favicon.png`; fonts: `assets/fonts/` (Montserrat 200–800, Font Awesome 5 solid, icomoon-the7-font); CSS: `assets/css/`.
- Real content: 8 guest testimonials (home), house/apartment descriptions, amenity lists, directions by plane/car/train/bus, price list, COVID-19 and privacy statements.
- Absent — do not fabricate: no press, awards, ratings aggregate, booking engine, team bios beyond the “Who we are” couple, or h1 page titles.

## Product Principles

_provenance: inferred — basis: content structure and repeated CTAs._

1. Show the place first — photography of the house and landscape leads every page.
2. Every unit page ends in a direct, personal enquiry rather than a transactional checkout.
3. Equal standing for four languages; navigation and footer are fully localized.
4. Practical facts (capacity, amenities, prices, directions) stated plainly beside the evocative copy.

## Accessibility & Inclusion

_provenance: inferred — basis: census and page records._ Observed gaps to carry into migration: no `<h1>` on any page; body text is 14px; white nav text sits on a 50%-alpha amber band over photography; Google Maps iframe has no title; 2% of images have empty alt text.
