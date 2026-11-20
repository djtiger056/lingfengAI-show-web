/* Optional motion and poster viewing; navigation works independently. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const atmosphere = document.querySelector('.site-atmosphere');
  const revealItems = [...document.querySelectorAll('.feature-row,.daily-feature,.voice-feature,.role-showcase-copy,.role-carousel,.faq-intro,.faq-list,.download-panel,.resources,.value-strip')];
  const tiltItems = [...document.querySelectorAll('.feature-visual,.schedule-scene,.moments-scene,.voice-visual')];
  let observer;
  revealItems.forEach(element => element.setAttribute('data-reveal', ''));
  tiltItems.forEach(element => element.setAttribute('data-tilt', ''));

  function configureMotion() {
    observer?.disconnect();
    document.documentElement.classList.remove('motion-ready');
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin:'0px 0px -28px 0px', threshold:0 });
    revealItems.forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
  configureMotion();
  reduced.addEventListener('change', () => {
    configureMotion();
    atmosphere.style.removeProperty('--wind-x');
    atmosphere.style.removeProperty('--wind-y');
    atmosphere.style.removeProperty('--wind-scroll-y');
    tiltItems.forEach(element => {
      element.style.removeProperty('--tilt-x');
      element.style.removeProperty('--tilt-y');
    });
  });
  document.addEventListener('focusin', event => {
    event.target.closest('[data-reveal]')?.classList.add('is-revealed');
  });

  let pointerFrame = 0;
  document.addEventListener('pointermove', event => {
    if (reduced.matches || !pointer.matches || pointerFrame) return;
    const x = (event.clientX / innerWidth - .5) * 26;
    const y = (event.clientY / innerHeight - .5) * 18;
    pointerFrame = requestAnimationFrame(() => {
      atmosphere.style.setProperty('--wind-x', x.toFixed(2) + 'px');
      atmosphere.style.setProperty('--wind-y', y.toFixed(2) + 'px');
      pointerFrame = 0;
    });
  }, { passive:true });
  document.documentElement.addEventListener('pointerleave', () => {
    atmosphere.style.setProperty('--wind-x', '0px');
    atmosphere.style.setProperty('--wind-y', '0px');
  });
  let scrollFrame = 0;
  function followScroll() {
    if (reduced.matches || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      atmosphere.style.setProperty('--wind-scroll-y', (Math.sin(scrollY / 1200) * 22).toFixed(2) + 'px');
      scrollFrame = 0;
    });
  }
  addEventListener('scroll', followScroll, { passive:true });
  followScroll();
  tiltItems.forEach(element => {
    element.addEventListener('pointermove', event => {
      if (reduced.matches || !pointer.matches) return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--tilt-x', ((.5 - (event.clientY - rect.top) / rect.height) * 3).toFixed(2) + 'deg');
      element.style.setProperty('--tilt-y', (((event.clientX - rect.left) / rect.width - .5) * 3).toFixed(2) + 'deg');
    }, { passive:true });
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--tilt-x', '0deg');
      element.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.addEventListener('visibilitychange', () => {
    atmosphere.getAnimations({ subtree:true }).forEach(animation => {
      if (document.hidden) animation.pause(); else animation.play();
    });
  });

  const poster = document.querySelector('.role-poster');
  const posterTriggers = [...document.querySelectorAll('.role-poster, .role-poster-hint')];
  const viewer = document.getElementById('posterViewer');
  const zoom = document.getElementById('posterZoom');
  const canvas = document.getElementById('posterCanvas');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  let posterOpener = poster;
  posterTriggers.forEach(trigger => {
    trigger.removeAttribute('target');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'posterViewer');
  });
  function resetZoom() {
    viewer.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.innerHTML = '放大细节 <span aria-hidden="true">＋</span>';
    canvas.scrollTo(0, 0);
  }
  posterTriggers.forEach(trigger => trigger.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    posterOpener = trigger;
    resetZoom();
    const currentPoster = trigger.classList.contains('role-poster') ? trigger : document.querySelector('.role-slide:not([inert])');
    const currentImage = currentPoster?.querySelector('img');
    const image = canvas.querySelector('img');
    image.src = trigger.href;
    image.alt = currentImage?.alt || '零风陪伴日常展示图';
    const title = currentPoster?.dataset.title || '陪伴日常';
    viewer.setAttribute('aria-label', `${title}大图`);
    viewer.querySelector('.poster-viewer-toolbar > span').textContent = `零风 · ${title}`;
    viewer.showModal();
    document.body.classList.add('has-poster-viewer');
  }));
  document.getElementById('posterClose').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('has-poster-viewer');
    resetZoom();
    // Native dialogs restore focus immediately; avoid stealing a later user action.
    if (document.activeElement === document.body || viewer.contains(document.activeElement)) {
      posterOpener.focus({ preventScroll:true });
    }
  });
  zoom.addEventListener('click', () => {
    const enlarged = viewer.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.innerHTML = enlarged ? '还原全图 <span aria-hidden="true">−</span>' : '放大细节 <span aria-hidden="true">＋</span>';
    canvas.scrollTo(0, 0);
  });
})();
