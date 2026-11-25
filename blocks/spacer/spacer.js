/**
 * spacer — authored vertical space, the source's WPBakery "empty space" module and the empty
 * lines authors typed to push text below the transparent masthead (static pages: privacy
 * policy, COVID-19; no hero, so the absolute masthead overlays the top of the content).
 *
 * Authoring: one cell holding the height in pixels (`255`). The number is the layout, never
 * shown: the cell stays in the DOM (EW: the author edits it in place), visually hidden.
 *
 * @ew-exempt <p> height in px (cell 1) — config: read for the block height, never displayed
 */

export default function decorate(block) {
  const text = block.textContent.replace(/\s+/g, ' ').trim();
  const px = parseInt(text, 10);
  if (Number.isFinite(px) && px >= 0) block.style.setProperty('--spacer-height', `${px}px`);
  block.setAttribute('aria-hidden', 'true');
}
