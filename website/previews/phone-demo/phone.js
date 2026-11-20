/* Standalone local preview. Images and message examples are bundled, not live services. */
(() => {
  'use strict';
  document.documentElement.classList.toggle('is-embedded', new URLSearchParams(location.search).has('embed'));
  const $ = selector => document.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const roles = [
    { name: '沈屿', image: 'shen-yu.webp', photoImage: 'desk-scene.png', audio: '../../assets/coffee-voice.wav', duration: 8, memory: '喜欢不加糖的拿铁',
      opening: '终于忙完了，你在干嘛？', photo: '我也刚忙完，给你看看我的桌面。', followup: '有点困，想喝杯拿铁。',
      voice: '这么晚还喝咖啡呀？那就不加糖，记得你上次说太甜会腻。先坐一会儿吧，我陪你聊聊。',
      recall: '那就不加糖，记得你上次说太甜会腻。', source: '上次聊天 · 说起喜欢的咖啡' },
    { name: '林莹莹', image: 'lin-yingying.webp', duration: 10, memory: '喜欢少冰、三分糖的奶茶',
      opening: '今天有点累，刚到家。', photo: '我刚拍的，陪你缓一缓。', followup: '这时候有杯奶茶就好了。',
      voice: '少冰、三分糖，对吧？你上次说这个甜度刚刚好。先歇会儿，今天的事慢慢说，我听着。',
      recall: '少冰、三分糖，对吧？你上次说刚刚好。', source: '上次聊天 · 说起喜欢的奶茶' }
  ];
  const states = roles.map((_, index) => createState(index));
  const replyTimers = new Map();
  let roleIndex = 0, replayTimer = null, replayCursor = null, replayPaused = false;
  let toastTimer = null, returnFocus = null;
  let activeAudio = null;
  const messages = $('#messages'), scroll = $('#chatScroll'), input = $('#messageInput');
  const overlay = $('#sheetOverlay'), sheet = $('.feature-sheet');

  function createState(index) {
    const selected = roles[index];
    return {
      messages: [
        { type: 'text', from: 'me', text: selected.opening, time: '23:47' },
        { type: 'image', from: 'ta', text: selected.photo, time: '23:48' },
        { type: 'text', from: 'me', text: selected.followup, time: '23:49' },
        { type: 'voice', from: 'ta', text: selected.voice, recall: selected.recall, time: '23:49', memory: true }
      ],
      memories: [{ text: selected.memory, source: selected.source }], pending: false, draft: ''
    };
  }
  function current() { return states[roleIndex]; }
  function now() { return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }); }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', '#icon-' + name);
    svg.append(use);
    return svg;
  }
  function announce(text) { $('#liveStatus').textContent = text; }
  function toast(text) {
    clearTimeout(toastTimer);
    $('#toast').textContent = text;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3000);
    announce(text);
  }
  function toBottom() { scroll.scrollTo({ top: scroll.scrollHeight, behavior: reduced.matches ? 'instant' : 'smooth' }); }
  function stopVoice() {
    if (!activeAudio) return;
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  function bindVoice(button, audio, hint) {
    button.type = 'button';
    const update = () => {
      const playing = !audio.paused && !audio.ended;
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? '暂停语音消息' : '播放语音消息');
      button.querySelector('.voice-play-icon').replaceChildren(icon(playing ? 'pause' : 'play'));
      hint.textContent = playing ? '正在播放 · 点击暂停' : '点击听听 Ta 的声音';
    };
    audio.addEventListener('play', update);
    audio.addEventListener('pause', update);
    audio.addEventListener('ended', update);
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) button.querySelector('.voice-duration').textContent = Math.ceil(audio.duration) + '″';
    });
    button.addEventListener('click', () => {
      if (!audio.paused) { audio.pause(); return; }
      if (activeAudio !== audio) stopVoice();
      activeAudio = audio;
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(error => {
        if (error.name === 'AbortError') return;
        update();
        hint.textContent = '播放失败，点击重试';
        toast('语音暂时无法播放，请再试一次。');
      });
    });
    update();
  }
  function updateStatus() {
    const typing = current().pending || (replayCursor !== null && !replayPaused && current().messages[replayCursor]?.from === 'ta');
    $('#chatStatus').textContent = typing ? '正在输入…' : '在线 · 陪你聊会儿';
    $('#sendButton').disabled = !input.value.trim() || current().pending;
    input.disabled = current().pending;
    document.querySelectorAll('[data-feature="image"], [data-feature="voice"]').forEach(button => { button.disabled = current().pending; });
    $('#replayButton').textContent = replayCursor === null ? '重播对话 ↻' : replayPaused ? '继续播放 ▷' : '暂停播放 Ⅱ';
    if (replayCursor === null) $('#replayButton').removeAttribute('aria-pressed');
    else $('#replayButton').setAttribute('aria-pressed', String(replayPaused));
  }
  function renderMessage(message, animate = false) {
    const node = element('article', 'bubble bubble-' + message.from);
    if (message.type === 'voice') {
      const source = roles[roleIndex].audio;
      const preview = element(source ? 'button' : 'div', 'voice-player');
      if (!source) preview.setAttribute('aria-label', '语音消息示意，没有可播放音频');
      const iconHolder = element('span', 'voice-play-icon');
      iconHolder.append(icon('voice'));
      preview.append(iconHolder);
      const wave = element('span', 'voice-wave');
      wave.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 21; i++) wave.append(element('i'));
      preview.append(wave, element('span', 'voice-duration', roles[roleIndex].duration + '″'));
      const hint = element('span', source ? 'voice-hint' : 'voice-unavailable', '语音示意 · 暂无可播放音频');
      node.append(preview, hint);
      if (source) {
        const audio = element('audio');
        audio.src = source;
        audio.preload = 'none';
        audio.hidden = true;
        node.append(audio);
        bindVoice(preview, audio, hint);
      }
      if (message.recall) node.append(element('p', 'voice-recall', message.recall));
      const transcript = element('details', 'voice-transcript');
      transcript.append(element('summary', '', '查看文字'), element('p', '', message.text));
      node.append(transcript);
    } else {
      if (message.text) node.append(element('p', '', message.text));
      if (message.type === 'image') {
        const imageButton = element('button', 'image-preview-button');
        imageButton.type = 'button';
        imageButton.dataset.openImage = '';
        imageButton.setAttribute('aria-label', '放大查看预设成图');
        const photo = roles[roleIndex].photoImage;
        const image = element('img', photo ? 'sample-image sample-image--scene' : 'sample-image');
        image.src = '../../assets/avatars/' + (photo || roles[roleIndex].image);
        image.alt = roles[roleIndex].name + '发的桌面照片，演示素材';
        image.width = 160; image.height = 112;
        imageButton.append(image, element('span', 'image-caption', 'AI 图片 · 点击查看'));
        node.append(imageButton);
      }
    }
    if (message.memory) {
      const memory = element('button', 'inline-memory', message.memoryLabel || '✳ 记得你的小习惯');
      memory.type = 'button'; memory.dataset.openMemory = '';
      node.append(memory);
    }
    node.append(element('small', '', message.time + (message.from === 'me' ? ' · 已读' : '')));
    messages.append(node);
    if (animate && !reduced.matches) node.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220 });
  }
  function renderChat(bottom = false) {
    stopVoice();
    messages.replaceChildren();
    current().messages.forEach(message => renderMessage(message));
    if (current().pending) {
      const typing = element('div', 'bubble bubble-ta typing');
      typing.setAttribute('aria-label', '预设回应演示中');
      typing.append(element('i'), element('i'), element('i'));
      messages.append(typing);
    }
    updateStatus();
    if (bottom) toBottom();
  }
  function stopReplay(restore = true) {
    stopVoice();
    clearTimeout(replayTimer); replayTimer = null; replayCursor = null; replayPaused = false;
    messages.querySelector('.typing')?.remove();
    if (restore) renderChat();
  }
  function startReplay() {
    stopReplay(false);
    replayCursor = 0; messages.replaceChildren(); scroll.scrollTop = 0;
    updateStatus(); stepReplay();
  }
  function stepReplay() {
    clearTimeout(replayTimer);
    messages.querySelector('.typing')?.remove();
    if (replayCursor === null || replayPaused || document.hidden) return;
    const next = current().messages[replayCursor];
    if (next.from === 'ta' && !reduced.matches) {
      const typing = element('div', 'bubble bubble-ta typing');
      typing.setAttribute('aria-label', roles[roleIndex].name + '正在输入');
      typing.append(element('i'), element('i'), element('i')); messages.append(typing);
      toBottom();
    }
    updateStatus();
    replayTimer = setTimeout(() => {
      messages.querySelector('.typing')?.remove();
      renderMessage(current().messages[replayCursor], true);
      replayCursor++;
      toBottom();
      if (replayCursor >= current().messages.length) { replayCursor = null; updateStatus(); return; }
      stepReplay();
    }, replayCursor === 0 || reduced.matches ? 100 : next.from === 'ta' ? 1400 : 1800);
  }
  function queueReply(message) {
    const target = roleIndex, state = current();
    state.pending = true;
    renderChat(true);
    const timer = setTimeout(() => {
      replyTimers.delete(target);
      message.time = now(); state.messages.push(message); state.pending = false;
      if (target === roleIndex) {
        renderChat(true);
        announce(message.type === 'image' ? '已展示预设成图，可以点击放大。' : message.type === 'voice' ? roles[target].audio ? '收到语音消息，点击即可播放。' : '已展示语音消息示意，可展开查看文字。' : roles[target].name + '：' + message.text);
      }
    }, reduced.matches ? 100 : 850);
    replyTimers.set(target, timer);
  }
  function send(text, type) {
    text = text.trim().slice(0, 240);
    if (!text || current().pending) { if (current().pending) toast('请等这条演示消息完成。'); return; }
    stopReplay(false);
    input.value = ''; current().draft = '';
    current().messages.push({ type: 'text', from: 'me', text, time: now() });
    let reply;
    if (type === 'image' || /画|生图|生成.*图|看看你|照片|在干嘛/.test(text)) {
      reply = { type: 'image', from: 'ta', text: roles[roleIndex].photo };
    } else if (type === 'voice' || /语音|声音|说给我听|说说话/.test(text)) {
      reply = { type: 'voice', from: 'ta', text: roles[roleIndex].voice };
    } else if (/^记住[，,:：\s]?/.test(text)) {
      const memory = text.replace(/^记住[，,:：\s]?/, '').replace(/[。！!]+$/, '').trim();
      if (memory) {
        current().memories.push({ text: memory.slice(0, 120), source: '本次预览中手动记录' });
        reply = { type: 'text', from: 'ta', text: '好，我记着了。' + memory.slice(0, 120) + '，下次聊到就不会忘啦。', memory: true, memoryLabel: '✳ 记下了这件小事' };
      } else reply = { type: 'text', from: 'ta', text: '说说看，你希望我记住什么？' };
    } else if (/记得|记着|记忆|喜欢什么/.test(text)) {
      const memories = current().memories;
      reply = { type: 'text', from: 'ta', text: memories.length ? '当然记得，你' + memories[memories.length - 1].text.replace(/^我/, '') + '。你说过的小事，我有放在心上。' : '这件事你再跟我说说？我想好好记下来。', memory: memories.length > 0 };
    } else if (/拿铁|咖啡|奶茶|喝点|喝杯/.test(text)) {
      const preference = current().memories.find(memory => memory.text === roles[roleIndex].memory);
      reply = preference
        ? { type: 'voice', from: 'ta', text: roles[roleIndex].voice, recall: roles[roleIndex].recall, memory: true }
        : { type: 'text', from: 'ta', text: '今天想喝什么口味的？说说看。' };
    } else reply = { type: 'text', from: 'ta', text: '我在呢，慢慢说。今天有什么想跟我分享的吗？' };
    queueReply(reply);
  }
  function closeSheet() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    $('.phone-base').inert = false;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    else $('#memoryButton').focus({ preventScroll: true });
  }
  function openSheet(kind) {
    if (overlay.hidden) returnFocus = document.activeElement;
    const body = $('#sheetContent'); body.replaceChildren();
    $('#sheetTools').hidden = kind !== 'tools';
    $('#sheetEyebrow').textContent = roles[roleIndex].name + ' · 功能演示';
    const note = text => body.append(element('p', 'sheet-note', text));
    const action = (text, handler) => { const b = element('button', 'sheet-action', text); b.type = 'button'; b.addEventListener('click', handler); body.append(b); };
    if (kind === 'memory') {
      $('#sheetTitle').textContent = '关于你的记忆';
      body.append(element('p', '', '聊过的小事，让下一次对话接得上。'));
      current().memories.forEach((memory, index) => {
        const item = element('article', 'memory-item');
        item.append(element('span', '', '记忆 ' + String(index + 1).padStart(2, '0')), element('p', '', memory.text), element('small', '', memory.source));
        const remove = element('button', 'remove-memory', '删除'); remove.type = 'button'; remove.setAttribute('aria-label', '删除记忆：' + memory.text);
        remove.addEventListener('click', () => { current().memories.splice(index, 1); openSheet('memory'); announce('已从本次预览中删除该记忆。'); });
        item.append(remove); body.append(item);
      });
      if (!current().memories.length) body.append(element('article', 'memory-item', '还没有记忆。发送「记住，我喜欢雨天」试试。'));
      action('接着聊聊', () => { closeSheet(); send('你还记得呀。'); });
      note('本页仅演示手动记录与引用。项目中的记忆整理、检索、管理和备份需在 App 内体验。刷新预览会重置。');
    } else if (kind === 'image-view') {
      $('#sheetTitle').textContent = '聊天中的生图示例';
      const image = element('img', 'enlarged-image');
      const photo = roles[roleIndex].photoImage || roles[roleIndex].image;
      image.src = '../../assets/avatars/' + photo;
      image.alt = roles[roleIndex].name + '发的桌面照片';
      body.append(image);
      note('这是一张预设图片，用于展示聊天中收到图片并放大查看的效果。');
    } else {
      $('#sheetTitle').textContent = '想和 Ta 做什么？';
      const tools = element('div', 'tools-grid');
      [['image', 'moments', '生成图片'], ['voice', 'voice', '语音回应'], ['memory', 'memory', '记忆回应']].forEach(([feature, symbol, text]) => {
        const b = element('button'); b.type = 'button'; b.dataset.feature = feature; b.append(icon(symbol), element('span', '', text)); tools.append(b);
      });
      body.append(tools); note('图片、语音与回复均为演示素材；实际服务在 App 内提供。');
    }
    overlay.hidden = false;
    $('.phone-base').inert = true;
    sheet.scrollTop = 0;
    updateStatus();
    $('#closeSheet').focus({ preventScroll: true });
  }
  function selectRole(index) {
    stopReplay(false);
    current().draft = input.value;
    roleIndex = index;
    input.value = current().draft;
    $('#roleName').textContent = roles[index].name;
    $('#roleAvatar').src = '../../assets/avatars/' + roles[index].image;
    $('#roleAvatar').alt = roles[index].name + '的角色头像';
    document.querySelectorAll('[data-role]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.role) === index)));
    renderChat(); scroll.scrollTop = 0;
    if (!reduced.matches && current().messages.length === 4 && !current().pending) startReplay();
    announce('当前角色：' + roles[index].name);
  }
  document.addEventListener('click', event => {
    const role = event.target.closest('[data-role]');
    if (role) { closeSheet(); selectRole(Number(role.dataset.role)); return; }
    const feature = event.target.closest('[data-feature]');
    if (feature) {
      if (feature.dataset.feature === 'image') {
        closeSheet(); send('也想看看你。', 'image');
      } else if (feature.dataset.feature === 'voice') {
        closeSheet(); send('想听你说说话。', 'voice');
      } else if (feature.dataset.feature === 'memory') {
        closeSheet(); send('你还记得呀。');
      } else openSheet(feature.dataset.feature);
      return;
    }
    const prompt = event.target.closest('[data-prompt]');
    if (prompt) { send(prompt.dataset.prompt); return; }
    const image = event.target.closest('[data-open-image]');
    if (image) { openSheet('image-view'); return; }
    if (event.target.closest('[data-open-memory]')) { openSheet('memory'); return; }
  });
  $('#messageForm').addEventListener('submit', event => { event.preventDefault(); send(input.value); });
  input.addEventListener('input', updateStatus);
  $('#emojiButton').addEventListener('click', () => {
    if (current().pending) return;
    if (input.value.length < input.maxLength - 1) input.value += '☺';
    input.focus(); updateStatus();
  });
  $('#toolsButton').addEventListener('click', () => openSheet('tools'));
  $('#moreButton').addEventListener('click', () => openSheet('tools'));
  $('#memoryButton').addEventListener('click', () => openSheet('memory'));
  $('#closeSheet').addEventListener('click', closeSheet);
  overlay.addEventListener('click', event => { if (event.target === overlay) closeSheet(); });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeSheet(); return; }
    if (event.key === 'Tab') {
      const focusable = [...sheet.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],summary')].filter(node => node.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $('#replayButton').addEventListener('click', () => {
    if (current().pending) { toast('请等当前演示完成，再重播对话。'); return; }
    closeSheet();
    if (replayCursor === null) { stopVoice(); replayCursor = 0; replayPaused = false; messages.replaceChildren(); scroll.scrollTop = 0; }
    else replayPaused = !replayPaused;
    updateStatus(); stepReplay();
  });
  $('#resetButton').addEventListener('click', () => {
    clearTimeout(replyTimers.get(roleIndex)); replyTimers.delete(roleIndex);
    stopReplay(false); states[roleIndex] = createState(roleIndex); input.value = '';
    closeSheet();
    renderChat(); scroll.scrollTop = 0; toast('已重置当前角色的演示。');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopVoice();
      if (replayCursor !== null) { replayPaused = true; clearTimeout(replayTimer); messages.querySelector('.typing')?.remove(); updateStatus(); }
    }
  });
  window.addEventListener('pagehide', stopVoice);
  reduced.addEventListener('change', () => { if (reduced.matches) stopReplay(); });
  renderChat();
  if (!reduced.matches) startReplay();
})();
