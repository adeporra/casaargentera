# Learnings — casaargentera replica run

- **CDN variant staleness after a code push (2026-11-25):** after pushing blocks/footer/footer.js, `curl` on aem.live got the new file at once, but Chromium's module request (it sends an `Origin` header) kept getting the pre-push copy from the CDN (`cf-cache-status: HIT`, age climbing) even after an admin code-sync POST. aem.page served the new code. Verify behaviour changes on aem.page or with a real browser, never with curl alone, and expect the live variant to clear only at max-age.
- **`?s=` search parity:** the source WordPress search runs on any URL with `?s=`; making the footer widget honour that parameter let dynamics-check's `search-query` replay compare counts and titles against the source directly.
- **No-h1 source pages vs verify's "exactly one h1":** verify flips such pages to failed and gate-all then refuses them (`NOT gated`) until a re-verify — fix, re-verify per slug, then gate.
- **Stale `/wp/` links:** 35 distinct `/wp/<path>` hrefs in captured content; resolving each on the source (301 target or exact page name) and seeding redirects before localize-links turned 93 off-site links root-relative in one pass.
