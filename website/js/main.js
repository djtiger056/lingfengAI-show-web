(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const mobileDownload = document.querySelector('[data-mobile-download]');

  function updateHeaderState() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
    if (mobileDownload) mobileDownload.classList.toggle('is-visible', window.scrollY > 420);
  }

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    mobileMenu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  document.querySelectorAll('.ripple').forEach((element) => {
    element.addEventListener('pointerdown', (event) => {
      if (reduceMotion) return;
      const rect = element.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'ripple-dot';
      dot.style.left = `${event.clientX - rect.left}px`;
      dot.style.top = `${event.clientY - rect.top}px`;
      element.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
    });
  });

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px' }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const characters = [
    {
      name: '林知意',
      role: '独立设计师 · 24岁',
      code: 'LF 0217',
      photo: './assets/avatars/female-1.jpg',
      alt: '林知意角色照片',
      tags: ['温柔', '知性', '有分寸'],
      quote: '“你来啦。水刚好烧开，我也刚好在等你。”',
      description: '她不会抢着替你下结论，却会记住你说到一半停住的地方。需要安慰时认真靠近，想独处时也把安静还给你。',
    },
    {
      name: '苏念念',
      role: '在读学生 · 22岁',
      code: 'LF 0831',
      photo: './assets/avatars/female-2.jpeg',
      alt: '苏念念角色照片',
      tags: ['元气', '坦率', '会主动'],
      quote: '“刚刚看到一朵很怪的云，第一反应居然是发给你。”',
      description: '她的分享欲像刚打开的汽水，热烈却不敷衍。喜欢会直接说，不开心也不会让你猜很久。',
    },
    {
      name: '陆辰',
      role: '在读研究生 · 23岁',
      code: 'LF 1206',
      photo: './assets/avatars/male-1.jpg',
      alt: '陆辰角色照片',
      tags: ['阳光', '细心', '可靠'],
      quote: '“先去忙。结束以后告诉我，今天最累的是哪一刻。”',
      description: '他不擅长漂亮的套话，却总能注意到你语气里那一点变化。答应的事会做到，也愿意陪你把情绪慢慢说清楚。',
    },
    {
      name: '由你创造',
      role: '专属角色 · 自由定义',
      code: 'YOUR AI',
      photo: './assets/avatars/custom.png',
      alt: '自定义角色示意图',
      tags: ['身份自定', '性格自定', '关系自定'],
      quote: '“先告诉我，你希望我们的故事从哪里开始？”',
      description: '名字、过去、性格和表达习惯都由你写下。不是换一张头像，而是创造一个拥有完整内心世界的人。',
    },
  ];

  const profileCard = document.querySelector('[data-profile-card]');
  const characterTabs = document.querySelectorAll('[data-character]');

  function replaceTags(container, tags) {
    container.replaceChildren();
    tags.forEach((tag) => {
      const tagElement = document.createElement('span');
      tagElement.textContent = tag;
      container.appendChild(tagElement);
    });
  }

  function renderCharacter(index) {
    if (!profileCard || !characters[index]) return;
    const character = characters[index];
    profileCard.classList.add('is-changing');
    window.setTimeout(() => {
      const photo = profileCard.querySelector('[data-profile-photo]');
      photo.src = character.photo;
      photo.alt = character.alt;
      profileCard.querySelector('[data-profile-name]').textContent = character.name;
      profileCard.querySelector('[data-profile-role]').textContent = character.role;
      profileCard.querySelector('[data-profile-code]').textContent = character.code;
      profileCard.querySelector('[data-profile-quote]').textContent = character.quote;
      profileCard.querySelector('[data-profile-description]').textContent = character.description;
      replaceTags(profileCard.querySelector('[data-profile-tags]'), character.tags);
      profileCard.classList.remove('is-changing');
    }, reduceMotion ? 0 : 180);

    characterTabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  characterTabs.forEach((tab) => {
    tab.addEventListener('click', () => renderCharacter(Number(tab.dataset.character)));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const current = Number(tab.dataset.character);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = (current + direction + characterTabs.length) % characterTabs.length;
      renderCharacter(next);
      characterTabs[next].focus();
    });
  });

  const previews = [
    { image: './assets/screenshots/Screenshot_20260602_175226.jpg', alt: '零风AI 对话界面', kicker: 'CONVERSATION · 被接住', title: '你随口说过的事，\nTa 没有随手忘掉。', description: '文字、语音与过去的细节自然回到对话里。你感受到的是被接住，而不是一份冷冰冰的记忆清单。' },
    { image: './assets/screenshots/Screenshot_20260602_175141.jpg', alt: '零风AI 消息列表界面', kicker: 'PRESENCE · 被想起', title: '有些消息，\n不是因为你先发了消息。', description: 'Ta 有自己的近况和表达节奏，也会在某个具体的瞬间主动想起你——不是群发问候，更不是机械签到。' },
    { image: './assets/screenshots/Screenshot_20260602_175148.jpg', alt: '零风AI 发现界面', kicker: 'DISCOVER · 去相遇', title: '不是挑一张头像，\n是遇见一种相处方式。', description: '从角色广场认识不同的人，也可以亲手写下名字、经历与性格，让关系从第一句话就不一样。' },
    { image: './assets/screenshots/Screenshot_20260602_175151.jpg', alt: '零风AI 个人中心界面', kicker: 'CONTROL · 有边界', title: '被记住很浪漫，\n随时能删除才安心。', description: '查询、删除、导出与备份都放在看得见的位置。亲密由你决定，边界也始终握在你手里。' },
  ];

  const previewImage = document.querySelector('[data-preview-image]');
  const previewFrame = document.querySelector('.device-frame');
  const previewIndex = document.querySelector('[data-preview-index]');
  const previewKicker = document.querySelector('[data-preview-kicker]');
  const previewTitle = document.querySelector('[data-preview-title]');
  const previewDescription = document.querySelector('[data-preview-description]');
  const previewDots = document.querySelectorAll('[data-preview-dot]');
  let activePreview = 0;
  let pointerStart = null;

  function setPreview(index) {
    if (!previewImage || !previews[index]) return;
    activePreview = index;
    const preview = previews[index];
    if (previewFrame) previewFrame.classList.add('is-changing');
    window.setTimeout(() => {
      previewImage.src = preview.image;
      previewImage.alt = preview.alt;
      previewIndex.textContent = String(index + 1).padStart(2, '0');
      previewKicker.textContent = preview.kicker;
      previewTitle.textContent = preview.title;
      previewDescription.textContent = preview.description;
      if (previewFrame) previewFrame.classList.remove('is-changing');
    }, reduceMotion ? 0 : 160);
    previewDots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  }

  document.querySelector('[data-preview-prev]')?.addEventListener('click', () => setPreview((activePreview - 1 + previews.length) % previews.length));
  document.querySelector('[data-preview-next]')?.addEventListener('click', () => setPreview((activePreview + 1) % previews.length));
  previewDots.forEach((dot) => dot.addEventListener('click', () => setPreview(Number(dot.dataset.previewDot))));

  const previewLayout = document.querySelector('.preview-layout');
  if (previewLayout) {
    previewLayout.addEventListener('pointerdown', (event) => { pointerStart = event.clientX; });
    previewLayout.addEventListener('pointerup', (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) < 56) return;
      setPreview(distance < 0 ? (activePreview + 1) % previews.length : (activePreview - 1 + previews.length) % previews.length);
    });
    previewLayout.addEventListener('pointercancel', () => { pointerStart = null; });
  }

  document.querySelectorAll('.faq-item button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const nextState = !item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach((otherItem) => {
        otherItem.classList.remove('is-open');
        otherItem.querySelector('button').setAttribute('aria-expanded', 'false');
      });
      if (nextState) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const chatStream = document.querySelector('[data-chat-stream]');
  const typingRow = document.querySelector('[data-typing-row]');
  if (chatStream && typingRow && !reduceMotion) {
    const extraMessages = ['我没有催你睡，只是想把窗边这场雨陪完。', '你不用立刻变开心。今晚先把难过放在我这里。'];
    let messageIndex = 0;
    window.setInterval(() => {
      typingRow.hidden = true;
      const message = document.createElement('div');
      message.className = 'message message-ai';
      message.textContent = extraMessages[messageIndex];
      chatStream.appendChild(message);
      if (chatStream.children.length > 4) chatStream.firstElementChild.remove();
      messageIndex = (messageIndex + 1) % extraMessages.length;
      window.setTimeout(() => { typingRow.hidden = false; }, 1800);
    }, 5200);
  }
})();
