# Dynamic features plan — casaargentera.com

| phase | rows | deliverable | verification | owner decision | effort |
|---|---|---|---|---|---|
| chrome (C0 foundation) | 4, 5, 11 | header block (sub-menus, mobile drawer, language switcher), hero slider + testimonial carousel blocks | chrome-parity + published-origin gate 1440/360 | none | in foundation |
| forms (interim) | 3 | `enquiry-form` block: verbatim fields, submit → "no backend connected" notice | form renders, submit blocked, no network POST | endpoint | small |
| search | 7 | `helix-query.yaml` + footer search widget rendering results inline | search-query parity check (count + titles) | none | small |
| embeds | 8 | map iframe same src | iframe present 1440/360 | none | none |
| data (interim) | 10 | calendar + price table as content, guest data stripped | content-diff on reservations | live feed | small |
| tags | 2, 6, 12 | martech contract + scripts/martech.js, every part disabled | dynamics-check martech: `/` requests no tag host | enable parts | small |
