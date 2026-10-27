import PhotoSwipeLightbox from '../vendor/photoswipe/photoswipe-lightbox.esm.min.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ---------- Tabs: each tablist switches only its own panels ---------- */
const groups = $$('[role="tablist"]').map((list) => {
  const tabs = $$('[role="tab"]', list);
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const section = list.closest('section');

  function select(id, { focus = false, scroll = false } = {}) {
    tabs.forEach((t, i) => {
      const on = panels[i].id === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      if (on && focus) t.focus();
    });
    if (scroll && section) section.scrollIntoView({ behavior: 'smooth' });
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(panels[i].id));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      select(panels[(i + d + tabs.length) % tabs.length].id, { focus: true });
    });
  });

  const has = (id) => panels.some((p) => p.id === id);
  select(has(location.hash.slice(1)) ? location.hash.slice(1) : panels[0].id);
  return { has, select };
});

// Deep links like #sfx or #clips open that tab
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  groups.forEach((g) => { if (g.has(id)) g.select(id, { scroll: true }); });
});

/* ---------- "Show all": works for photo and video grids ---------- */
$$('[data-more]').forEach((btn) => {
  const box = document.getElementById(btn.dataset.more);
  const items = [...box.children];
  const visible = Number(box.dataset.visible) || 12;
  items.forEach((it, i) => { if (i >= visible) it.classList.add('is-more'); });
  if (items.length <= visible) { btn.hidden = true; return; }
  btn.textContent = `${btn.dataset.label || 'Показать все работы'} (${items.length})`;
  btn.addEventListener('click', () => { box.classList.add('is-open'); btn.hidden = true; });
});

/* ---------- Photo lightbox: pinch-zoom, double-tap, swipe ---------- */
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

/* ---------- Video player over the page ----------
   Cards only hold a local cover. The YouTube/Vimeo player is created when a
   card is tapped and destroyed on close, so videos never slow the page down. */
const playerUrl = (provider, id) => (provider === 'vimeo'
  ? `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`
  : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`);

const vgrids = $$('.vgrid');
if (vgrids.length) {
  const box = document.createElement('div');
  box.className = 'vplayer';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Просмотр видео');
  box.innerHTML = `
    <div class="vplayer__bar">
      <p class="vplayer__title"></p>
      <span class="vplayer__count"></span>
      <button class="vplayer__close" type="button" aria-label="Закрыть">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="vplayer__stage"><div class="vplayer__frame"></div></div>
    <div class="vplayer__nav">
      <button class="vplayer__prev" type="button" aria-label="Предыдущее видео">←</button>
      <p class="vplayer__hint">Листайте свайпом</p>
      <button class="vplayer__next" type="button" aria-label="Следующее видео">→</button>
    </div>`;
  document.body.appendChild(box);

  const frame = $('.vplayer__frame', box);
  const title = $('.vplayer__title', box);
  const count = $('.vplayer__count', box);
  let list = [];
  let index = 0;
  let lastFocus = null;

  function show(i) {
    index = (i + list.length) % list.length;
    const card = list[index];
    const ifr = document.createElement('iframe');
    ifr.src = playerUrl(card.dataset.provider, card.dataset.id);
    ifr.title = card.dataset.title;
    ifr.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; web-share';
    ifr.allowFullscreen = true;
    ifr.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(ifr);
    title.textContent = card.dataset.title;
    count.textContent = `${index + 1} / ${list.length}`;
  }

  function open(card) {
    list = [...card.parentElement.children];
    lastFocus = card;
    box.hidden = false;
    document.documentElement.classList.add('is-locked');
    history.pushState({ vplayer: true }, '');
    show(list.indexOf(card));
    $('.vplayer__close', box).focus();
  }

  function close({ fromHistory = false } = {}) {
    if (box.hidden) return;
    frame.replaceChildren(); // stops playback
    box.hidden = true;
    document.documentElement.classList.remove('is-locked');
    if (!fromHistory && history.state && history.state.vplayer) history.back();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  vgrids.forEach((g) => g.addEventListener('click', (e) => {
    const card = e.target.closest('.vitem');
    if (card) open(card);
  }));
  $('.vplayer__close', box).addEventListener('click', () => close());
  $('.vplayer__prev', box).addEventListener('click', () => show(index - 1));
  $('.vplayer__next', box).addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('vplayer__stage')) close(); });
  window.addEventListener('popstate', () => close({ fromHistory: true })); // phone "back" closes the player
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  // Swipe left/right for next/previous, down to close (outside the video itself)
  let sx = 0; let sy = 0;
  box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    else if (dy > 90 && dy > Math.abs(dx)) close();
  });
}
