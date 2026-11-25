# Rollout report — casaargentera.com → AEM Edge Delivery (2026-11-25)

**Pages** 70 of 71 planned delivered and published on main--ea32f12a--aemcoder.aem.live (en 18 · es 16 · ca 19 · da 17); `/da/home/` is a source 301 to `/` and ships as a redirect. Coverage: 70 verified, 0 failed, 0 pending.

**Templates** 8 — landing (3), program (20), article (24), listing (4), form (4), booking (4), events (4), static (7). Each archetype gated on the source at 1440 and 360 before its siblings rendered.

**Blocks** 15 blocks plus fragment; of the 11 module candidates 8 shipped as blocks, `gallery` and `columns` are realized by image-grid / media-feature, `legal-text` by default content under spacer.

**Quality**
- Published-origin gate (all pages): 1440 70/70 delivered (39 PASS + 31 documented overrides), 360 70/70; wide 2560 report: 4 experiences pages over 10 % (source image defects, R-04).
- verify 70/70; link audit 67 internal targets, 0 non-200; redirects sheet 101 rows live; served sitemap 70 = expected.
- Dynamic parity: 8 features, 15 checks (aem.page all PASS); martech contract carried over, every part disabled.
- Optimize: open P1 0 · P2 70 · P3 1 (scorecard: stardust/rollout/optimize/scorecard.json).

**To deliver (owner)**
- Enquiry form submission endpoint (form UI live; submit shows a no-backend notice).
- Live availability feed for the reservations calendar (snapshot of 2026-11-24 shipped).
- Consent UI and analytics routes: enable in stardust/martech-contract.json (see stardust/martech-handoff.md).
- JSON-LD: the source's Yoast schema graph is not carried (P2 on every page) — add through head.html / a metadata field.
- Source content defects handed over unchanged: register R-02, R-04, R-09, R-10, R-11 (broken shortcodes, broken /wp/ image paths), R-13 residual links.
