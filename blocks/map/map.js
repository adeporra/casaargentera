/**
 * map — Google Maps embed in the WPBakery gmaps frame (grey 5px border, 450px tall, not
 * interactive), as on the home page and the contact page (prototype index-proposed.html
 * .gmaps, contact-proposed.html .map-embed).
 *
 * Authoring: one link to the map's embed URL (https://www.google.com/maps/embed?pb=…); its
 * link text is the iframe's accessible title ("Casa Argentera on Google Maps"). Any other
 * authored content in the block is kept above the map.
 *
 * @ew-exempt <a> embed source link (cell 1) — config: read for the iframe src + title,
 *   never displayed (maps are an EW5 category (c) embed)
 */

const ALLOWED = /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/;

export default function decorate(block) {
  if (block.querySelector(':scope > .map-frame')) return; // EW9 re-entrant
  const link = [...block.querySelectorAll('a[href]')].find((a) => ALLOWED.test(a.href));
  const rest = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.children].forEach((n) => {
        if (!link || !n.contains(link)) rest.push(n);
      });
    });
  });

  const frame = document.createElement('div');
  frame.className = 'map-frame';
  if (link) {
    const iframe = document.createElement('iframe');
    iframe.src = link.href;
    iframe.title = link.textContent.trim() || 'Map';
    iframe.width = '600';
    iframe.height = '450';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('allowfullscreen', '');
    frame.append(iframe);
  }
  block.replaceChildren(...rest, frame);
}
