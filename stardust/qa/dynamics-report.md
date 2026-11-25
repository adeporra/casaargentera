# Dynamics parity check — https://main--ea32f12a--aemcoder.aem.live — 2026-11-25T00:15:48.562Z

Replayed 14 checks over 9 features · pass 12 · fail 2. Flows, not presence.

| feature | class | status | check | result | detail | third-party requests |
|---|---|---|---|---|---|---|
| Footer SEARCH widget (WordPress ?s=) | S | done | fetch-json | PASS | 200 · 70 rows · keys columns,data,offset,limit,total,:type |  |
| Footer SEARCH widget (WordPress ?s=) | S | done | search-query | FAIL | 0 results (source 3) · no results · expected "/the-penthouse" MISSING · count 0 vs source 3 · top-3 titles differ — source: the penthouse / the house / home · here: (none) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Footer SEARCH widget (WordPress ?s=) | S | done | search-query | FAIL | 0 results (source 1) · no results · expected "/who-we-are" MISSING · count 0 vs source 1 · top-1 titles differ — source: who we are · here: (none) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Contact Form 7 enquiry form | F | interim | dom-count | PASS | 5 × main form .contact-form-field (min 5) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Contact Form 7 enquiry form | F | interim | dom-count | PASS | 5 × main form .contact-form-field (min 5) |  |
| Language switcher en / es / ca / da | I18N | done | dom-count | PASS | 4 × footer .languages a, footer [class*=lang] a (min 4) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Language switcher en / es / ca / da | I18N | done | dom-count | PASS | 4 × footer .languages a, footer [class*=lang] a (min 4) |  |
| Header sub-menus + mobile drawer | M | done | dom-count | PASS | 24 × header nav ul ul a (min 4) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Google Maps iframe on contact pages | V | done | dom-count | PASS | 1 × iframe[src*='google.com/maps'] (min 1) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Revolution Slider heroes + testimonial carousel | M | done | dom-count | PASS | 5 × .hero-slider .hero-slide (min 2) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Revolution Slider heroes + testimonial carousel | M | done | dom-count | PASS | 1 × .testimonials (min 1) | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| Availability calendar + price table on reservations | D | interim | dom-count | PASS | 15 × .availability-calendar table (min 12) |  |
| Cookie consent bar + settings modal | M/T | scaffolded-awaiting-owner | consent-gate | PASS | no request to 3 gated host pattern(s) before consent | www.google.com:200×1 maps.googleapis.com:200×13 maps.gstatic.com:200×1 fonts.googleapis.com:200×2 |
| martech: consent + tag routing | T | scaffolded-off | martech | PASS | no tag host requested (1 gated · 1 cross-site host(s) blocked) |  |

## Features without checks
