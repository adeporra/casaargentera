---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-11-24T10:03:04Z
  againstInput: https://www.casaargentera.com/
  readArtifacts:
    - stardust/current/PRODUCT.md
    - stardust/current/DESIGN.md
    - stardust/current/DESIGN.json
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of https://www.casaargentera.com/,
promoted verbatim (no direct invocation, no creative decisions).

Promoted: current/PRODUCT.md → PRODUCT.md · current/DESIGN.md → DESIGN.md ·
current/DESIGN.json → DESIGN.json (at 2026-11-24T10:03:04Z).

Permitted deltas: ONLY the entries of stardust/replica/inconsistency-register.md
(2 entries: R-01 applied — guest data not carried; R-02 deferred).

Fidelity: ia verbatim · design verbatim · content verbatim.

Scope: the 71 planned URLs of stardust/.labs/site-plan.json — 70 captured pages (8 templates); /da/home/ is a source redirect to / and ships as a redirect.
Breakpoints: source breakpoints kept (no --target-breakpoints); gate widths 1440 and 360.
Publish decision: publish (owner decision recorded in stardust/eds-conversion-log.md).
Martech: carried over, every part disabled (owner request; stardust/martech-contract.json).

## E2 link-audit decisions (2026-11-25)

- Internal page links: 67 distinct targets on 70 pages + 8 chrome documents, all 200 on aem.live.
- `/es/politica-de-privacidad-y-cookies` (es footer) is outside the plan; the source 301s it to `/ca/politica-de-privacidad-y-cookies`, which is delivered → a redirects row and the footer link follows it.
- Kept absolute (the integration boundary): 13 `wp-content/uploads` image links (lightbox targets served by the source host) and the 8 `/wp/` links of R-13 that 404 on the source. No other-locale or uncaptured in-scope page targets.
