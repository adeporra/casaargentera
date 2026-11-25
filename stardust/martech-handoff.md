# Martech hand-off

Everything below is scaffolded **off**. To ship it, set `enabled: true` on `consent.cmp` and on each route in `stardust/martech-contract.json`, then re-run `deploy/scripts/martech-scaffold.mjs` and `dynamics/scripts/dynamics-check.mjs` to confirm the enabled tags load. Enabled tags load on `www.casaargentera.com` only; preview with `?martech=on` (add `&consent=accept` to grant every category).

## Consent

- **CMP:** none detected
- **Model `owner-decision`:** no evidence of consent gating inside the tag manager. Keep the source behaviour (route `category` null), or set a route `category` to a consent group id to load that tag manager only once the group is granted.
- **Categories:** no CMP configuration read — run `spec-martech.mjs` first, or decide categories with the owner.

## Routes

| id | vendor | src | CMP groups listing its host | enabled |
|---|---|---|---|---|
| google-tag-manager-1 | Google Tag Manager | `https://www.googletagmanager.com/gtag/js?id=UA-4591587-1` | — | false |
| google-tag-manager-2 | Google Tag Manager | `https://www.googletagmanager.com/gtag/js?id=G-CV2K683122&cx=c&gtm=4e6bh1` | — | false |
| google-tag-manager-3 | Google Tag Manager | `https://www.googletagmanager.com/gtag/js?id=G-CV2K683122&cx=c&gtm=4e6bh1h1` | — | false |

## Rewrite before go-live

Nothing found (or no tag-manager library read).

## Data layer

The source pages expose `dataLayer`; keep the same global names.
Rules in Google Tag Manager were not parsed. Read each library listed in `martech/tags.json` and record its rules and data elements in the contract's `tagNotes`, keyed by tag manager, each citing where it was read (`from`); until then their triggers and events come from the tagging plan.
Ask the owner for the tagging plan (solution design reference): each event, its payload and the interaction that pushes it. With it, add each push in the block that owns the interaction.

## Note (replica run, 2026-11-24)

The source's consent banner is the WordPress plugin **Moove GDPR Cookie Compliance** (`#moove_gdpr_cookie_info_bar`, settings modal with "Enable All" / "Save Changes"); it is not a hosted CMP, so there is no CMP id to carry. GA4 `G-CV2K683122` and UA `UA-4591587-1` load through inline `gtag`. On the new site every route stays disabled until the owner enables it and chooses a consent solution.
