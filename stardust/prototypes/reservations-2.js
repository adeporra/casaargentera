/* Availability calendar month switch (captured snapshot; the select shows one month at a time,
   as the source's ICS Calendar plugin does). No live feed — dynamic-features row 10. */
(() => {
  const cal = document.querySelector('.avail-calendar');
  if (!cal) return;
  const select = cal.querySelector('.avail-calendar__select');
  const show = (ym) => cal.querySelectorAll('.avail-calendar__month').forEach((m) => { m.hidden = m.dataset.yearMonth !== ym; });
  select.addEventListener('change', () => show(select.value));
})();
