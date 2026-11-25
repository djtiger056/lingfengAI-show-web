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

  const community = document.getElementById('floatingCommunity');
  if (community) {
    const groupStatus = document.getElementById('communityGroupStatus');
    [
      ['communityGroupNumber', 'copyCommunityGroup', '群号', '群号已复制，打开 QQ 搜索即可申请加入。'],
      ['communityWechatNumber', 'copyCommunityWechat', '微信号', '微信号已复制，打开微信搜索即可添加好友。'],
    ].forEach(([inputId, buttonId, label, successMessage]) => {
      const number = document.getElementById(inputId);
      const copyButton = document.getElementById(buttonId);
      copyButton.hidden = false;
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(number.value);
          copyButton.textContent = '已复制';
          groupStatus.textContent = successMessage;
        } catch {
          number.focus();
          number.select();
          groupStatus.textContent = `已选中${label}，可手动复制。`;
        }
      });
    });
  }

  const voiceButton = document.getElementById('dailyVoiceButton');
  const voiceAudio = document.getElementById('dailyVoiceAudio');
  const voiceStatus = document.getElementById('dailyVoiceStatus');
  const voiceButtonText = voiceButton.querySelector('.voice-audio-label');
  const voiceDuration = voiceButton.querySelector('.voice-audio-duration');
  const voiceLabel = '语音：今天过得怎么样？有发生什么有趣的事吗？';
  let voiceLoading = false;
  let voiceFailed = false;
  function voiceTime(seconds) {
    const value = Math.max(0, Math.floor(seconds));
    return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
  }
  function updateVoiceProgress() {
    const duration = Number.isFinite(voiceAudio.duration) && voiceAudio.duration > 0 ? voiceAudio.duration : 0;
    const fraction = duration ? Math.min(1, voiceAudio.currentTime / duration) : 0;
    voiceButton.style.setProperty('--voice-progress', (fraction * 100).toFixed(2) + '%');
    const total = duration ? Math.ceil(duration) : 4;
    voiceDuration.textContent = voiceTime(voiceAudio.ended ? total : voiceAudio.currentTime) + ' / ' + voiceTime(total);
  }
  function updateVoice() {
    const playing = !voiceAudio.paused && !voiceAudio.ended;
    voiceButton.setAttribute('aria-pressed', String(playing));
    voiceButton.setAttribute('aria-label', (playing ? '暂停' : '播放') + voiceLabel);
    voiceButton.setAttribute('aria-busy', String(voiceLoading));
    voiceButtonText.textContent = voiceFailed ? '重新播放' : voiceLoading ? '正在加载…' : playing ? '暂停语音' : voiceAudio.ended ? '再听一次' : voiceAudio.currentTime > 0 ? '继续播放' : '播放语音';
    voiceStatus.textContent = voiceFailed ? '暂时无法播放，请点击重试。' : voiceLoading ? '正在加载这声问候…' : playing ? '正在播放 · 点击可暂停' : voiceAudio.ended ? '听完了，再听一次也很温暖。' : voiceAudio.currentTime > 0 ? '已暂停，点击继续听。' : '点击播放，听听 Ta 的声音。';
    updateVoiceProgress();
  }
  function voicePlaybackError() {
    voiceLoading = false;
    voiceFailed = true;
    updateVoice();
  }
  voiceButton.addEventListener('click', () => {
    if (!voiceAudio.paused) { voiceLoading = false; voiceAudio.pause(); return; }
    voiceFailed = false;
    if (voiceAudio.ended) voiceAudio.currentTime = 0;
    if (voiceAudio.error) voiceAudio.load();
    voiceLoading = true;
    updateVoice();
    voiceAudio.play().catch(error => {
      if (error.name === 'AbortError') return;
      voicePlaybackError();
    });
  });
  ['playing', 'pause', 'ended'].forEach(event => voiceAudio.addEventListener(event, () => {
    voiceLoading = false;
    updateVoice();
  }));
  voiceAudio.addEventListener('waiting', () => { voiceLoading = true; updateVoice(); });
  voiceAudio.addEventListener('error', voicePlaybackError);
  ['timeupdate', 'loadedmetadata'].forEach(event => voiceAudio.addEventListener(event, updateVoiceProgress));
  document.addEventListener('visibilitychange', () => { if (document.hidden) voiceAudio.pause(); });
  window.addEventListener('pagehide', () => voiceAudio.pause());

  const hero = document.querySelector('.hero');
  const heroLayout = document.querySelector('.hero-layout');
  const heroCopy = document.querySelector('.hero-copy');
  const heroPhone = document.querySelector('.hero-phone-demo');
  const phoneViewport = document.querySelector('.hero-phone-viewport');
  const phoneNote = document.querySelector('.hero-phone-note');
  const siteNav = document.querySelector('.site-nav');
  const heroRoleToggle = document.getElementById('heroRoleToggle');
  const heroRoleImage = heroRoleToggle?.querySelector('img');
  const heroRoleCaption = document.querySelector('.hero-stage-caption');
  const heroRoleButtons = [...document.querySelectorAll('[data-hero-role]')];
  const heroPhoneFrame = document.querySelector('.hero-phone-frame');
  const heroRoles = [
    { name: '沈屿', image: './assets/avatars/shen-yu.webp', quote: '「好久不见。」' },
    { name: '林莹莹', image: './assets/avatars/lin-yingying.webp', quote: '「今天有点累，刚到家。」' }
  ];
  let heroRoleIndex = 1;
  // file:// pages have an opaque "null" origin, so they need the wildcard target.
  const messageTargetOrigin = location.origin === 'null' ? '*' : location.origin;
  function syncHeroRoleToFrame() {
    const frame = heroPhoneFrame?.contentWindow;
    if (!frame) return;
    if (typeof frame.selectDemoRole === 'function') {
      frame.selectDemoRole(heroRoleIndex);
      return;
    }
    frame.postMessage({ type: 'select-role', index: heroRoleIndex }, messageTargetOrigin);
  }
  function setHeroRole(index, syncFrame = true) {
    const role = heroRoles[index];
    if (!role || !heroRoleToggle || !heroRoleImage || !heroRoleCaption) return;
    heroRoleIndex = index;
    heroRoleImage.src = role.image;
    heroRoleImage.alt = '零风AI 角色 ' + role.name;
    heroRoleToggle.setAttribute('aria-label', '切换角色，当前为' + role.name);
    heroRoleCaption.querySelector('span').textContent = '官方角色 · ' + role.name;
    heroRoleCaption.querySelector('strong').textContent = role.quote;
    heroRoleButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.heroRole) === index)));
    if (syncFrame) syncHeroRoleToFrame();
  }
  heroRoleToggle?.addEventListener('click', () => setHeroRole((heroRoleIndex + 1) % heroRoles.length));
  heroRoleButtons.forEach(button => button.addEventListener('click', () => setHeroRole(Number(button.dataset.heroRole))));
  heroPhoneFrame?.addEventListener('load', syncHeroRoleToFrame);
  window.addEventListener('message', event => {
    if ((location.origin !== 'null' && event.origin !== location.origin) || event.source !== heroPhoneFrame?.contentWindow) return;
    if (event.data?.type !== 'role-changed') return;
    setHeroRole(Number(event.data.index), false);
  });
  setHeroRole(heroRoleIndex, false);
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
