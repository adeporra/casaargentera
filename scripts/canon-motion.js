/*
 * Shared WPBakery entrance (canon.js): observed `wpb_start_animation` + `animated` added once
 * an element is almost in view; lifted .animated 1s both + fade-in 0 → 1 (styles.css).
 * Blocks call fadeInOnView(elements) for the elements the prototype marks
 * `wpb_animate_when_almost_visible fadeIn`.
 */

/**
 * Fades the given elements in once they are almost in view.
 * @param {Iterable<Element>} elements
 */
// eslint-disable-next-line import/prefer-default-export
export function fadeInOnView(elements) {
  const els = [...elements];
  els.forEach((el) => el.classList.add('wpb-animate'));
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('wpb-start-animation'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('wpb-start-animation');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach((el) => io.observe(el));
}
