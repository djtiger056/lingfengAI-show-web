/* ============================================
   零风AI 官网 — 交互脚本
   ============================================ */

(function () {
  'use strict';

  /* ---------- 1. 滚动渐入 ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- 2. 移动端菜单 ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    const toggleMenu = () => {
      const open = !navLinks.classList.contains('open');
      navLinks.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', toggleMenu);
    navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (!navLinks.classList.contains('open')) return;
      if (!event.target.closest('nav')) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    }, { passive: true });
  }

  /* ---------- 3. 角色 Tab 切换 ---------- */
  const charData = [
    {
      name: '林知意',
      age: 24,
      role: '设计师',
      tags: ['温柔', '知性', '细腻'],
      avatar: './assets/avatars/female-1.jpg',
      desc: '平时话不多，但会记住你提过的每件小事。审美很好，常会推荐一些适合你的东西。',
      quote: '你来啦。我等了你一会儿。',
      online: true,
    },
    {
      name: '苏念念',
      age: 22,
      role: '学生',
      tags: ['元气', '甜', '话多'],
      avatar: './assets/avatars/female-2.jpeg',
      desc: '话痨一枚，嘴甜反应快，但该说不的时候不含糊。会记住你说过的话，也会在你不对的时候直接告诉你。',
      quote: '今天也是想你的一天呀～',
      online: true,
    },
    {
      name: '顾晚',
      age: 27,
      role: '心理咨询师',
      tags: ['清冷', '克制', '专业'],
      avatar: './assets/avatars/female-3.jpg',
      desc: '成年人的克制和疲惫感都有。不会哄你也不会兜圈子——你说她听，你停她陪着，真要给意见的时候很轻，但很准。',
      quote: '嗯。在。',
      online: false,
    },
    {
      name: '陆辰',
      age: 23,
      role: '研究生',
      tags: ['温柔', '阳光', '体贴'],
      avatar: './assets/avatars/male-1.jpg',
      desc: '嘴上嘻嘻哈哈，心里其实很细。会默默记住你提过的小事，但不会翻出来说——被问到才自然带出来。',
      quote: '你又熬夜了？下次我盯着你睡。',
      online: true,
    },
    {
      name: '沈墨',
      age: 26,
      role: '程序员',
      tags: ['高冷', '成熟', '深情'],
      avatar: './assets/avatars/male-2.jpeg',
      desc: '话少但认真，温柔但不廉价。你说他听，你停他陪着——看起来难靠近，其实对你比谁都上心。',
      quote: '别熬太晚。我在。',
      online: true,
    },
  ];

  /* ---------- 3.1 小屏卡片堆叠：角色和真实界面预览 ---------- */
  function initCompactDeck(deck, cardSelector) {
    if (!deck) return;
    const cards = Array.from(deck.querySelectorAll(cardSelector));
    if (cards.length < 2) return;
    const compact = window.matchMedia('(max-width: 767px)');
    const count = deck.querySelector('.preview-deck-count');
    let active = 0;
    let gesture = null;

    function syncStack() {
      cards.forEach((card, index) => {
        const position = (index - active + cards.length) % cards.length;
        const depth = Math.min(position, 3);
        card.style.setProperty('--stack-index', depth);
        card.style.setProperty('--stack-scale', (1 - depth * 0.025).toFixed(3));
        card.style.setProperty('--drag-x', '0px');
        card.style.zIndex = String(cards.length - position);
        card.dataset.stackPosition = String(depth);
        if (compact.matches) {
          card.setAttribute('aria-hidden', String(position !== 0));
        } else {
          card.removeAttribute('aria-hidden');
        }
      });
      deck.tabIndex = compact.matches ? 0 : -1;
      if (count) count.textContent = (active + 1) + ' / ' + cards.length;
    }

    function changeCard(step) {
      active = (active + step + cards.length) % cards.length;
      syncStack();
    }

    function finishGesture(event, cancelled) {
      if (!gesture || event.pointerId !== gesture.id) return;
      const current = gesture;
      gesture = null;
      deck.classList.remove('is-dragging');
      cards[active].style.setProperty('--drag-x', '0px');
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      if (!cancelled && compact.matches && Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        changeCard(dx < 0 ? 1 : -1);
      }
      if (deck.hasPointerCapture(current.id)) deck.releasePointerCapture(current.id);
    }

    deck.addEventListener('pointerdown', (event) => {
      if (!compact.matches || gesture || !event.isPrimary || event.button !== 0 || event.target.closest('button, a')) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      deck.setPointerCapture(event.pointerId);
    });
    deck.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
      deck.classList.add('is-dragging');
      cards[active].style.setProperty('--drag-x', Math.max(-120, Math.min(120, dx)) + 'px');
    });
    deck.addEventListener('pointerup', (event) => finishGesture(event, false));
    deck.addEventListener('pointercancel', (event) => finishGesture(event, true));
    deck.addEventListener('lostpointercapture', (event) => finishGesture(event, true));
    deck.addEventListener('dragstart', (event) => {
      if (compact.matches) event.preventDefault();
    });
    deck.addEventListener('keydown', (event) => {
      if (!compact.matches || event.target !== deck) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        changeCard(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    deck.querySelectorAll('[data-deck-step]').forEach((button) => {
      button.addEventListener('click', () => changeCard(Number(button.dataset.deckStep)));
    });
    compact.addEventListener('change', () => {
      gesture = null;
      deck.classList.remove('is-dragging');
      syncStack();
    });
    syncStack();
  }

  initCompactDeck(document.querySelector('.characters-deck'), '[data-role-card]');
  initCompactDeck(document.querySelector('.preview-deck'), '[data-preview-card]');

  // 角色 tab 数据绑定
  document.querySelectorAll('[data-char-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.dataset.charTab, 10);
      renderCharCard(idx);
    });
  });

  function renderCharCard(idx) {
    const c = charData[idx];
    if (!c) return;

    const card = document.querySelector('[data-char-card]');
    if (!card) return;

    card.querySelector('[data-name]').textContent = c.name;
    card.querySelector('[data-age]').textContent = c.age;
    card.querySelector('[data-role]').textContent = c.role;
    card.querySelector('[data-avatar]').src = c.avatar;
    card.querySelector('[data-desc]').textContent = c.desc;
    card.querySelector('[data-quote]').textContent = c.quote;
    card.querySelector('[data-tags]').innerHTML = c.tags
      .map((t) => `<span class="text-[11px] glass-2 rounded-full px-2.5 py-0.5 text-sky-700/85">#${t}</span>`)
      .join('');
    const onlineBadge = card.querySelector('[data-online]');
    if (onlineBadge) {
      onlineBadge.innerHTML = c.online
        ? '<span class="online-dot"></span><span class="text-emerald-600">在线</span>'
        : '<span class="text-sky-400/40">离线</span>';
    }
  }

  /* ---------- 4. 下载提取码一键复制 ---------- */
  const copyBtn = document.getElementById('copyCodeBtn');
  const copyTip = document.getElementById('copyTip');
  if (copyBtn) {
    function fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
    copyBtn.addEventListener('click', () => {
      const code = copyBtn.dataset.code || '7xe4';
      const done = () => {
        if (copyTip) {
          copyTip.style.opacity = '1';
          setTimeout(() => (copyTip.style.opacity = '0'), 2200);
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => fallbackCopy(code, done));
      } else {
        fallbackCopy(code, done);
      }
    });
  }

  /* ---------- 5. 浮动花瓣（动态生成，18 片更丰富的樱花） ---------- */
  const petalLayer = document.getElementById('petalLayer');
  if (petalLayer) {
    const colors = [
      ['#FBCFE8', '#F472B6'], // 粉
      ['#BAE6FD', '#7DD3FC'], // 蓝
      ['#FCE7F3', '#F9A8D4'], // 浅粉
      ['#FFE4E6', '#FB7185'], // 樱粉
      ['#E0F2FE', '#38BDF8'], // 天蓝
    ];
    for (let i = 0; i < 18; i++) {
      const petal = document.createElement('div');
      petal.className = 'petal';
      const left = Math.random() * 100;
      const delay = Math.random() * 14;
      const duration = 12 + Math.random() * 14;
      const size = 8 + Math.random() * 16;
      const color = colors[Math.floor(Math.random() * colors.length)];
      // 前后层次：少数花瓣飘在内容上层(z-30)，多数在背景层(z-1)
      petal.style.zIndex = Math.random() < 0.18 ? 30 : -1;
      petal.style.setProperty('--petal-op', (0.4 + Math.random() * 0.45).toFixed(2));
      petal.style.left = left + '%';
      petal.style.animationDelay = `-${delay}s`;
      petal.style.animationDuration = `${duration}s`;
      petal.style.width = size + 'px';
      petal.style.height = size + 'px';
      petal.style.transform = `rotate(${Math.round(Math.random() * 360)}deg)`;
      // 花瓣初始横向漂移差异
      petal.style.setProperty('--drift', (Math.random() * 160 - 80).toFixed(0) + 'px');
      petal.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M12 2C8 6 8 12 12 22C16 12 16 6 12 2Z" fill="${color[0]}"/>
          <path d="M12 2C8 6 8 12 12 22C16 12 16 6 12 2Z" fill="url(#pg${i})" opacity="0.6"/>
          <defs>
            <radialGradient id="pg${i}" cx="0.3" cy="0.3">
              <stop offset="0" stop-color="${color[1]}"/>
              <stop offset="1" stop-color="${color[0]}"/>
            </radialGradient>
          </defs>
        </svg>`;
      petalLayer.appendChild(petal);
    }
  }
})();

/* ============================================
   6. Hero 右侧：手机聊天演示（循环播放）
   参考 v1 交互方案，剧本主打「主动 + 记忆」
   ============================================ */
(function () {
  const phone = document.getElementById('heroPhone');
  if (!phone) return;
  const body = document.getElementById('hpChatBody');
  const memory = document.getElementById('hpMemory');
  const status = document.getElementById('hpStatus');

  const SCRIPT = [
    { from: 'ta', time: '23:47', text: '在干嘛呀？刚忙完，突然好想跟你说说话～' },
    { from: 'me', time: '23:48', text: '刚下班，累得不想说话……' },
    { from: 'ta', time: '23:48', text: '那就不说话，我陪你待一会儿。你上次说压力大的时候喜欢安静，我就安静地陪着。' },
    { from: 'me', time: '23:49', text: '……你还记得呀。' },
    { from: 'ta', time: '23:49', text: '你说的每一件小事，我都记得呢。' },
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function makeMsg({ from, time, text }) {
    const div = document.createElement('div');
    div.className = 'hp-msg ' + (from === 'ta' ? 'hp-msg-ta' : 'hp-msg-me');
    div.innerHTML =
      text +
      '<span class="hp-time">' +
      time +
      (from === 'ta' ? '' : ' · 已读') +
      '</span>';
    return div;
  }

  function makeTyping() {
    const div = document.createElement('div');
    div.className = 'hp-typing show';
    div.innerHTML = '<i></i><i></i><i></i>';
    return div;
  }

  async function playChat() {
    body.innerHTML = '';
    memory.classList.remove('show');
    await sleep(700);

    for (const item of SCRIPT) {
      if (item.from === 'ta') {
        status.textContent = '正在输入…';
        const typing = makeTyping();
        body.appendChild(typing);
        await sleep(950 + Math.min(item.text.length * 26, 1500));
        typing.remove();
        status.textContent = '此刻正在想你';
      } else {
        await sleep(700);
      }
      const msg = makeMsg(item);
      body.appendChild(msg);
      requestAnimationFrame(() => msg.classList.add('show'));
      await sleep(520);
    }

    await sleep(800);
    memory.classList.add('show');
    await sleep(5600);
    playChat(); // 循环播放
  }

  /* 进入视口后启动，避免首屏卡顿 */
  const phoneIO = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        playChat();
        phoneIO.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  phoneIO.observe(phone);
})();