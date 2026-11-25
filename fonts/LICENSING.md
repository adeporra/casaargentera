# Font licensing

| File | Family | Foundry / source | Status |
|---|---|---|---|
| montserrat-{200,300,400,500,700,800}.woff2 | Montserrat | Julieta Ulanovsky (Google Fonts, SIL OFL 1.1) | OK to self-host |
| fa-solid-900.woff2 | Font Awesome 5 Free (solid) | Fonticons (SIL OFL 1.1 fonts) | OK to self-host |
| icomoon-the7.woff2 | icomoon-the7-font | Dream-Theme "The7" WordPress theme (commercial theme licence) | CONFIRM before go-live |

The icon font ships with the source site's commercial theme. Confirm the theme licence
covers embedding on the new domain. Remove path: delete `icomoon-the7.woff2` and its
`@font-face` in `styles/fonts.css`; the phone / mail / social / arrow glyphs then render
blank until replaced by SVG icons.
