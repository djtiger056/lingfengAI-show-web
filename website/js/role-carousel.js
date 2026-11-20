/* Showcase photos, five-second rotation and native touch/keyboard controls. */
(() => {
  'use strict';
  const root = document.querySelector('.role-carousel');
  if (!root) return;
  const viewport = root.querySelector('.role-carousel-viewport');
  const track = root.querySelector('.role-carousel-track');
  const slides = [...root.querySelectorAll('.role-slide')];
  const pages = [...root.querySelectorAll('[data-carousel-page]')];
  const play = root.querySelector('[data-carousel-play]');
  const hint = document.querySelector('.role-poster-hint');
  const viewer = document.getElementById('posterViewer');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const status = root.querySelector('.carousel-status');
  const timing = root.querySelector('[data-carousel-timing]');
  const interval = 5000;
  let index = 0;
  let timer;
  let progress;
  let visible = false;
  let hovered = false;
  let keyboardFocus = false;
  let paused = reduced.matches;
  let gesture = null;
  let suppressClickUntil = 0;

  function schedule() {
    clearTimeout(timer);
    progress?.cancel();
    root.dataset.playing = 'false';
    if (paused || !visible || hovered || keyboardFocus || gesture || document.hidden || viewer?.open) return;
    root.dataset.playing = 'true';
    if (!reduced.matches) {
      progress = pages[index].querySelector('i').animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: interval, easing: 'linear', fill: 'forwards' }
      );
    }
    timer = setTimeout(() => show(index + 1), interval);
  }

  function show(next, manual = false) {
    index = (next + slides.length) % slides.length;
    root.dataset.index = String(index);
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      if (i === index) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
      if (i === index || i === (index + 1) % slides.length) slide.querySelector('img').loading = 'eager';
    });
    pages.forEach((page, i) => {
      if (i === index) page.setAttribute('aria-current', 'true');
      else page.removeAttribute('aria-current');
    });
    hint.href = slides[index].href;
    root.querySelector('[data-carousel-count]').textContent = String(index + 1).padStart(2, '0');
    root.querySelector('[data-carousel-count]').nextSibling.textContent = ` / ${String(slides.length).padStart(2, '0')} `;
    root.querySelector('[data-carousel-caption]').textContent = slides[index].dataset.title;
    if (manual) status.textContent = `第 ${index + 1} 张，共 ${slides.length} 张：${slides[index].dataset.title}`;
    schedule();
  }

  function updatePlay() {
    play.setAttribute('aria-pressed', String(paused));
    play.setAttribute('aria-label', paused ? '开始自动轮播' : '暂停自动轮播');
    timing.innerHTML = paused ? '已暂停' : '<span class="carousel-swipe-hint">左右滑动 · </span>5 秒轮播';
    schedule();
  }

  root.querySelector('[data-carousel-prev]').addEventListener('click', () => show(index - 1, true));
  root.querySelector('[data-carousel-next]').addEventListener('click', () => show(index + 1, true));
  pages.forEach((page, i) => page.addEventListener('click', () => show(i, true)));
  play.addEventListener('click', () => { paused = !paused; updatePlay(); });
  root.addEventListener('keydown', event => {
    keyboardFocus = true;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1);
      // Keep focus visible when the currently focused photo slides away.
      if (document.activeElement.classList.contains('role-slide')) pages[(next + slides.length) % slides.length].focus();
      show(next, true);
    } else schedule();
  });
  root.addEventListener('focusin', event => {
    keyboardFocus = event.target.matches(':focus-visible');
    schedule();
  });
  root.addEventListener('focusout', () => requestAnimationFrame(() => {
    keyboardFocus = root.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    schedule();
  }));
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; schedule(); } });

  // Preserve vertical page scrolling and pinch zoom; only deliberate horizontal swipes turn a page.
  viewport.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { gesture = null; schedule(); return; }
    gesture = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    schedule();
  }, { passive: true });
  viewport.addEventListener('touchend', event => {
    if (!gesture) return;
    const dx = event.changedTouches[0].clientX - gesture.x;
    const dy = event.changedTouches[0].clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > Math.max(40, viewport.clientWidth * .12) && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressClickUntil = performance.now() + 700;
      show(index + (dx < 0 ? 1 : -1), true);
    } else schedule();
  }, { passive: true });
  viewport.addEventListener('touchcancel', () => { gesture = null; schedule(); }, { passive: true });
  viewport.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  viewport.addEventListener('dragstart', event => event.preventDefault());

  document.addEventListener('visibilitychange', schedule);
  if (viewer) new MutationObserver(schedule).observe(viewer, { attributes: true, attributeFilter: ['open'] });
  reduced.addEventListener('change', () => { paused = reduced.matches; updatePlay(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, { threshold: .1 }).observe(viewport);
  } else visible = true;
  root.querySelector('.role-carousel-controls').hidden = false;
  show(0);
  updatePlay();
})();
