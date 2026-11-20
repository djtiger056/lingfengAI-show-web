/* Site navigation, hero sizing and reading progress. */
(() => {
  'use strict';
  document.documentElement.classList.add('js-ready');
  const mobile = matchMedia('(max-width: 650px)');
  const menu = document.getElementById('menuBtn');
  const nav = document.getElementById('siteNav');
  function setMenu(open, focusButton = false) {
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    if (focusButton) menu.focus();
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    const wasOpen = menu.getAttribute('aria-expanded') === 'true';
    setMenu(false);
    if (wasOpen) {
      const target = document.getElementById(link.hash.slice(1));
      target?.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-nav')) setMenu(false);
  });
  mobile.addEventListener('change', () => setMenu(false));

  const voiceButton = document.getElementById('dailyVoiceButton');
  const voiceAudio = document.getElementById('dailyVoiceAudio');
  const voiceStatus = document.getElementById('dailyVoiceStatus');
  const voiceProgress = voiceButton.querySelector('.voice-audio-progress');
  const voiceButtonText = voiceButton.querySelector('.voice-audio-label');
  const voiceLabel = '语音：今天过得怎么样？有发生什么有趣的事吗？';
  function updateVoice() {
    const playing = !voiceAudio.paused && !voiceAudio.ended;
    voiceButton.setAttribute('aria-pressed', String(playing));
    voiceButton.setAttribute('aria-label', (playing ? '暂停' : '播放') + voiceLabel);
    voiceButtonText.textContent = playing ? '暂停语音' : '播放语音';
    voiceStatus.textContent = playing ? '正在播放 · 再点一次暂停' : '点击播放，听听 Ta 的问候。';
  }
  voiceButton.addEventListener('click', () => {
    if (!voiceAudio.paused) { voiceAudio.pause(); return; }
    if (voiceAudio.ended) voiceAudio.currentTime = 0;
    voiceAudio.play().catch(error => {
      if (error.name === 'AbortError') return;
      updateVoice();
      voiceStatus.textContent = '暂时无法播放，点击重试。';
    });
  });
  ['play', 'pause', 'ended'].forEach(event => voiceAudio.addEventListener(event, updateVoice));
  voiceAudio.addEventListener('timeupdate', () => {
    const fraction = Number.isFinite(voiceAudio.duration) && voiceAudio.duration > 0 ? voiceAudio.currentTime / voiceAudio.duration : 0;
    voiceProgress.style.transform = `scaleX(${fraction})`;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) voiceAudio.pause(); });
  window.addEventListener('pagehide', () => voiceAudio.pause());

  const hero = document.querySelector('.hero');
  const heroLayout = document.querySelector('.hero-layout');
  const heroCopy = document.querySelector('.hero-copy');
  const heroPhone = document.querySelector('.hero-phone-demo');
  const phoneViewport = document.querySelector('.hero-phone-viewport');
  const phoneNote = document.querySelector('.hero-phone-note');
  const siteNav = document.querySelector('.site-nav');
  function fitHeroPhone() {
    if (mobile.matches) {
      phoneViewport.style.removeProperty('--phone-scale');
      hero.style.removeProperty('--hero-nav-space');
      return;
    }
    const navStyle = getComputedStyle(siteNav);
    const navSpace = siteNav.offsetHeight + parseFloat(navStyle.marginTop);
    hero.style.setProperty('--hero-nav-space', navSpace + 'px');
    const heroStyle = getComputedStyle(hero);
    const layoutStyle = getComputedStyle(heroLayout);
    const noteStyle = getComputedStyle(phoneNote);
    const availableHeight = innerHeight - navSpace - parseFloat(heroStyle.paddingTop)
      - parseFloat(layoutStyle.paddingBottom) - phoneNote.offsetHeight - parseFloat(noteStyle.marginTop);
    const scale = Math.max(.1, Math.min(.8, (availableHeight - 2) / 860, (heroPhone.clientWidth - 2) / 450));
    const value = scale.toFixed(4);
    if (phoneViewport.style.getPropertyValue('--phone-scale') !== value) {
      phoneViewport.style.setProperty('--phone-scale', value);
    }
  }
  addEventListener('resize', fitHeroPhone);
  const heroResize = new ResizeObserver(fitHeroPhone);
  [siteNav, heroCopy, heroPhone].forEach(element => heroResize.observe(element));
  fitHeroPhone();

  const progress = document.getElementById('readingProgress');
  const download = document.getElementById('download');
  const actionBar = document.querySelector('.mobile-action-bar');
  const footer = document.querySelector('.site-footer');
  const navLinks = [...nav.querySelectorAll('a')];
  const sections = navLinks.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  let scheduled = false;
  function updateReading() {
    scheduled = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
    let current = '';
    const readingLine = Math.max(160, siteNav.getBoundingClientRect().bottom + 20);
    sections.forEach(section => { if (section.getBoundingClientRect().top <= readingLine) current = section.id; });
    if (max > 0 && scrollY >= max - 2) current = sections[sections.length - 1].id;
    navLinks.forEach(link => {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const rect = download.getBoundingClientRect();
    const heroVisible = hero.getBoundingClientRect().bottom > readingLine;
    const footerVisible = footer.getBoundingClientRect().top < innerHeight;
    const hidden = heroVisible || footerVisible || (rect.top < innerHeight - 80 && rect.bottom > 80);
    actionBar.classList.toggle('is-hidden', hidden);
    actionBar.inert = hidden;
  }
  function requestReading() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); }
  }
  addEventListener('scroll', requestReading, { passive: true });
  addEventListener('hashchange', requestReading);
  addEventListener('resize', requestReading);
  new ResizeObserver(requestReading).observe(document.body);
  updateReading();
})();
