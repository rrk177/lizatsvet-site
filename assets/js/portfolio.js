import PhotoSwipeLightbox from '../vendor/photoswipe/photoswipe-lightbox.esm.min.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const VISIBLE = 12; // photos shown per direction before "show all"

/* ---------- Tabs: one direction at a time ---------- */
const tabs = $$('.tab');
const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

function select(id, { focus = false, scroll = false } = {}) {
  tabs.forEach((t, i) => {
    const on = panels[i].id === id;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    panels[i].hidden = !on;
    if (on && focus) t.focus();
  });
  if (scroll) $('#portfolio').scrollIntoView({ behavior: 'smooth' });
}

tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(panels[i].id));
  t.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const next = (i + d + tabs.length) % tabs.length;
    select(panels[next].id, { focus: true });
  });
});

// Deep links like #sfx open that direction
function fromHash() {
  const id = location.hash.slice(1);
  if (panels.some((p) => p.id === id)) select(id, { scroll: true });
}
window.addEventListener('hashchange', fromHash);
select(panels.some((p) => p.id === location.hash.slice(1)) ? location.hash.slice(1) : panels[0].id);

/* ---------- "Show all" ---------- */
$$('.gal').forEach((gal) => {
  const items = $$('.gal__item', gal);
  const btn = $(`[data-more="${gal.id}"]`);
  items.forEach((it, i) => { if (i >= VISIBLE) it.classList.add('is-more'); });
  if (items.length <= VISIBLE) { btn.hidden = true; return; }
  btn.textContent = `Показать все работы (${items.length})`;
  btn.addEventListener('click', () => { gal.classList.add('is-open'); btn.hidden = true; });
});

/* ---------- Lightbox: pinch-zoom, double-tap, swipe ---------- */
const lightbox = new PhotoSwipeLightbox({
  gallery: '.gal',
  children: 'a',
  pswpModule: () => import('../vendor/photoswipe/photoswipe.esm.min.js'),
  bgOpacity: 1,
  showHideAnimationType: 'fade',
  initialZoomLevel: 'fit',
  secondaryZoomLevel: 2,
  maxZoomLevel: 4,
  wheelToZoom: true,
  padding: { top: 48, bottom: 56, left: 0, right: 0 },
  closeTitle: 'Закрыть', zoomTitle: 'Увеличить', arrowPrevTitle: 'Назад', arrowNextTitle: 'Вперёд',
  errorMsg: 'Не удалось загрузить фото',
});
lightbox.on('uiRegister', () => {
  lightbox.pswp.ui.registerElement({
    name: 'caption',
    order: 9,
    isButton: false,
    appendTo: 'root',
    onInit: (el, pswp) => {
      pswp.on('change', () => {
        const a = pswp.currSlide.data.element;
        el.textContent = a ? a.dataset.caption || '' : '';
      });
    },
  });
});
lightbox.init();

/* ---------- Videos: nothing from YouTube/Vimeo loads until Play ---------- */
$$('.vcard').forEach((card) => {
  const frame = $('.vcard__frame', card);
  frame.addEventListener('click', () => {
    const box = document.createElement('div');
    box.className = frame.className; // keep each page's frame styling
    const ifr = document.createElement('iframe');
    ifr.src = card.dataset.src;
    ifr.title = card.dataset.title;
    ifr.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; web-share';
    ifr.allowFullscreen = true;
    ifr.referrerPolicy = 'strict-origin-when-cross-origin';
    box.appendChild(ifr);
    frame.replaceWith(box);
    card.classList.add('is-playing');
  }, { once: true });
});
