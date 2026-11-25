/* Casa Argentera replica — shared chrome behaviour (canon).
   Observed on live (stardust/replica/motion/index-live.json), reproduced as the same
   class state machine — never a different mechanism:
   - #phantom: separate fixed header clone; .show-phantom on scroll down past the
     threshold, .hide-phantom when back above it (slide-in .52s / slide-out .35s).
     Threshold: observed between 200 and 300 px of scroll (motion-observe samples) → 250.
   - .show-floating-icon on the masthead (mobile floating menu button) — same trigger.
   - a.scroll-top: .on / .off toggle.
   - mobile drawer: hamburger opens the off-canvas menu. */
(function () {
  var T = 250;
  var html = document.documentElement;
  var phantom = document.getElementById('phantom');
  var masthead = document.querySelector('.masthead');
  var toTop = document.querySelector('.scroll-top');
  var shown = false;
  function onScroll() {
    var y = window.pageYOffset || html.scrollTop;
    var past = y > T;
    if (past !== shown) {
      shown = past;
      if (phantom) {
        phantom.classList.toggle('show-phantom', past);
        phantom.classList.toggle('hide-phantom', !past);
      }
      if (masthead) masthead.classList.toggle('show-floating-icon', past);
      html.classList.toggle('show-floating-icon', past);
    }
    if (toTop) {
      toTop.classList.toggle('on', y > T);
      toTop.classList.toggle('off', !(y > T));
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var drawer = document.getElementById('mobile-drawer');
  var opener = null;
  function setDrawer(open, trigger) {
    if (open === html.classList.contains('mobile-drawer-open')) return;
    html.classList.toggle('mobile-drawer-open', open);
    if (drawer) {
      if (open) { drawer.removeAttribute('inert'); drawer.setAttribute('tabindex', '-1'); drawer.focus({ preventScroll: true }); }
      else { drawer.setAttribute('inert', ''); }
    }
    document.querySelectorAll('.dt-mobile-menu-icon').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    if (open) opener = trigger || null;
    else if (opener) { opener.focus({ preventScroll: true }); opener = null; }
  }
  document.querySelectorAll('.dt-mobile-menu-icon').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); setDrawer(!html.classList.contains('mobile-drawer-open'), b); });
  });
  var close = document.querySelector('.mobile-drawer__close');
  if (close) close.addEventListener('click', function () { setDrawer(false); });
  var overlay = document.querySelector('.drawer-overlay');
  if (overlay) overlay.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  /* main-nav hover state — observed: .dt-hovered (+ .show-mega-menu-content) on the li */
  document.querySelectorAll('.main-nav > li').forEach(function (li) {
    li.addEventListener('mouseenter', function () { li.classList.add('dt-hovered', 'show-mega-menu-content'); });
    li.addEventListener('mouseleave', function () { li.classList.remove('dt-hovered', 'show-mega-menu-content'); });
  });

  /* WPBakery entrance — observed: wpb_start_animation + animated added once in view */
  var anims = document.querySelectorAll('.wpb_animate_when_almost_visible');
  if (anims.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('wpb_start_animation', 'animated'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    anims.forEach(function (el) { io.observe(el); });
  } else { anims.forEach(function (el) { el.classList.add('wpb_start_animation', 'animated'); }); }

  /* Hero slider — observed: slides advance on their own (bullet .selected moves, idle);
     lifted: data-duration 2500 ms per slide, 600 ms fade, loop; bullets select a slide. */
  document.querySelectorAll('.hero-slider').forEach(function (slider) {
    var slides = slider.querySelectorAll('.hero-slide');
    var bullets = slider.querySelectorAll('.hero-bullet');
    if (slides.length < 2) return;
    var cur = 0;
    slides.forEach(function (s, i) { if (s.classList.contains('is-active')) cur = i; });
    var timer = null;
    function go(n, auto) {
      slides[cur].classList.remove('is-active');
      if (bullets[cur]) bullets[cur].classList.remove('selected');
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('is-active');
      if (bullets[cur]) bullets[cur].classList.add('selected');
      if (!auto) schedule();
    }
    /* a 2500 ms interval: a rAF ticker advanced mid-capture (iter4 1440: 13.64 %) and a
       timeout chain ticks once before the capture's long-timer hold catches it (iter5) */
    function schedule() { clearInterval(timer); timer = setInterval(function () { go(cur + 1, true); }, 2500); }
    schedule();
    bullets.forEach(function (b, i) { b.addEventListener('click', function () { if (i !== cur) go(i); }); });
  });

  /* Testimonial carousel — observed: arrow click moves the stage (transform, 600 ms) */
  document.querySelectorAll('[data-carousel]').forEach(function (car) {
    var track = car.querySelector('.testimonials__track');
    var items = track ? track.children : [];
    if (!track || !items.length) return;
    var idx = 0;
    function perView() { var w = car.querySelector('.testimonials__viewport').clientWidth; return Math.max(1, Math.round((w + 30) / (items[0].getBoundingClientRect().width + 30))); }
    function move(d) {
      var max = items.length - perView();
      idx = idx + d; if (idx > max) idx = 0; if (idx < 0) idx = max;
      var pitch = items[0].getBoundingClientRect().width + 30;
      track.style.transform = 'translate3d(' + (-idx * pitch) + 'px,0,0)';
      var pv = perView();
      Array.prototype.forEach.call(items, function (it, k) { it.classList.toggle('active', k >= idx && k < idx + pv); });
    }
    move(0);
    var prev = car.querySelector('.carousel-arrow--prev'), next = car.querySelector('.carousel-arrow--next');
    if (prev) prev.addEventListener('click', function () { move(-1); });
    if (next) next.addEventListener('click', function () { move(1); });
    window.addEventListener('resize', function () { move(0); });
  });
})();
