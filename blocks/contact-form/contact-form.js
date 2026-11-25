/**
 * contact-form — the site's enquiry form (Contact Form 7 look; prototype
 * stardust/prototypes/the-garden-proposed.html .cf7, the same form on contact, events and
 * reservations). Template-slotted per row: each authored row becomes one form line, the
 * authored label paragraph MOVED into its <label>.
 *
 * Authoring — one row per line, in display order (authors add, remove, reorder and translate):
 *   cell 1  the label (paragraph; links allowed — e.g. the privacy-policy link of the checkbox)
 *   cell 2  field word, optionally followed by `required`:
 *             name | email | tel | subject | text   → single-line input (type from the word)
 *             message                              → textarea
 *             acceptance                           → checkbox with the label beside it
 *             submit                               → the submit button (cell 1 = its caption)
 *           A one-cell row is a note paragraph shown between the fields.
 * `acceptance` and `submit` continue the line above them (CF7 markup: message, checkbox and
 * button share one paragraph), so they sit 0px below it instead of a 10px line gap.
 *
 * Submission (stardust/dynamic-features.md row 3, f-enquiry-form, disposition rebuild-native,
 * status interim): no backend is connected yet — submit is blocked, nothing is sent or stored,
 * and the response line says so. The production endpoint is an owner decision.
 *
 * @ew-exempt metadata — the field word (cell 2) is never displayed
 * @ew-exempt submit caption — an <input type=submit> value cannot host the authored node (EW7
 *   forbids a <button> host); the caption is read from cell 1 and its paragraph removed
 */

const TEXT_TYPES = {
  name: { type: 'text', autocomplete: 'name' },
  email: { type: 'email', autocomplete: 'email' },
  tel: { type: 'tel', autocomplete: 'tel' },
  subject: { type: 'text' },
  text: { type: 'text' },
};

const NOTICE = {
  en: 'This form is not connected yet: your message was not sent.',
  es: 'Este formulario aún no está conectado: tu mensaje no se ha enviado.',
  ca: 'Aquest formulari encara no està connectat: el teu missatge no s\'ha enviat.',
  da: 'Formularen er endnu ikke forbundet: din besked blev ikke sendt.',
};

function el(tag, className, attrs = {}) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

function labelNodes(cell) {
  // leftovers: bare text directly in the cell becomes a paragraph so it is kept (EW1)
  [...cell.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .forEach((n) => {
      const p = document.createElement('p');
      n.replaceWith(p);
      p.append(n);
    });
  return [...cell.children];
}

function parseWord(cell) {
  const words = (cell ? cell.textContent : '').trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
  return { word: words[0] || 'text', required: words.includes('required') };
}

function wrapControl(control) {
  const w = el('span', 'contact-form-wrap');
  w.append(control);
  return w;
}

export default function decorate(block) {
  if (block.querySelector(':scope > form')) return; // EW9 re-entrant
  const form = el('form', 'contact-form-form', { novalidate: '', 'aria-label': 'Contact form' });
  let line = null;
  let n = 0;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length || !row.textContent.trim()) return;
    if (cells.length === 1) {
      // note paragraph(s) between the fields
      labelNodes(cells[0]).forEach((node) => {
        const note = el('div', 'contact-form-line contact-form-note');
        note.append(node);
        form.append(note);
      });
      line = null;
      return;
    }
    const nodes = labelNodes(cells[0]);
    const { word, required } = parseWord(cells[cells.length - 1]);
    n += 1;
    const id = `contact-form-${n}`;
    const joins = (word === 'acceptance' || word === 'submit') && line;
    if (joins) {
      line.append(el('br'));
    } else {
      line = el('div', 'contact-form-line');
      form.append(line);
    }

    if (word === 'submit') {
      const caption = nodes.map((x) => x.textContent.trim()).join(' ') || 'Send';
      nodes.forEach((x) => x.remove());
      const submit = el('input', 'contact-form-submit', { type: 'submit', value: caption });
      line.append(submit, el('span', 'contact-form-spinner', { 'aria-hidden': 'true' }));
      line = null;
      return;
    }

    if (word === 'acceptance') {
      const box = el('input', '', { type: 'checkbox', name: id, value: '1' });
      if (required) box.setAttribute('aria-required', 'true');
      const text = el('span', 'contact-form-check-label');
      text.append(...nodes);
      const label = el('label');
      label.append(box, text);
      const item = el('span', 'contact-form-check');
      item.append(label);
      line.append(wrapControl(item));
      return;
    }

    const label = el('label', 'contact-form-label');
    label.append(...nodes);
    let control;
    if (word === 'message') {
      control = el('textarea', 'contact-form-field contact-form-textarea', {
        name: 'message', rows: '10', cols: '40',
      });
    } else {
      const spec = TEXT_TYPES[word] || TEXT_TYPES.text;
      control = el('input', 'contact-form-field', {
        type: spec.type, name: TEXT_TYPES[word] ? word : id, size: '40', value: '',
      });
      if (spec.autocomplete) control.setAttribute('autocomplete', spec.autocomplete);
    }
    if (required) control.setAttribute('aria-required', 'true');
    label.append(wrapControl(control));
    line.append(label);
    if (word !== 'message') line = null;
  });

  const response = el('div', 'contact-form-response', { 'aria-live': 'polite' });
  form.append(response);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); // interim: no backend connected — nothing is sent or stored
    const lang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
    response.textContent = NOTICE[lang] || NOTICE.en;
  });
  block.replaceChildren(form);
}
