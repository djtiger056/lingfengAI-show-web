/* 交互与动效增强：在用户未偏好减少动态效果时启用。
   与 wind.js 的 data-reveal / data-tilt 并存，不接管其内容显隐逻辑。 */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

  function teardown() {
    document.documentElement.classList.remove('motion-enhanced');
    document.querySelectorAll('[data-magnetic], [data-spot], [data-ripple-bound]').forEach(el => {
      el.style.removeProperty('--m-mx');
      el.style.removeProperty('--m-my');
      el.style.removeProperty('--m-px');
      el.style.removeProperty('--m-py');
    });
    document.querySelectorAll('.m-ripple').forEach(el => el.remove());
  }

  function init() {
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    root.classList.add('motion-enhanced');

    // 1. 标题分行：把 <br /> 拆成可独立揭示的行，保留行内高亮 span
    const h1 = document.querySelector('.hero h1');
    if (h1 && !h1.dataset.mSplit) {
      const parts = h1.innerHTML.split(/<br\s*\/?>/i);
      if (parts.length > 1) {
        h1.innerHTML = parts
          .map(part => '<span class="m-line"><span class="m-line-in">' + part.trim() + '</span></span>')
          .join('');
        h1.dataset.mSplit = '1';
      }
    }

    // 2. 磁吸按钮：仅在精确指针设备启用
    if (finePointer.matches) {
      document.querySelectorAll('.hero-actions .button, .nav-actions .button').forEach(btn => {
        btn.setAttribute('data-magnetic', '');
        btn.addEventListener('pointermove', event => {
          const rect = btn.getBoundingClientRect();
          const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.16;
          const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.28;
          btn.style.setProperty('--m-mx', dx.toFixed(1) + 'px');
          btn.style.setProperty('--m-my', dy.toFixed(1) + 'px');
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.setProperty('--m-mx', '0px');
          btn.style.setProperty('--m-my', '0px');
        });
      });

      // 3. 手机框 3D 视差
      const phone = document.querySelector('.hero-phone-viewport');
      const hero = document.querySelector('.hero');
      if (phone && hero) {
        hero.addEventListener('pointermove', event => {
          const rect = hero.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - 0.5;
          const ny = (event.clientY - rect.top) / rect.height - 0.5;
          phone.style.setProperty('--m-px', (nx * 7).toFixed(2) + 'deg');
          phone.style.setProperty('--m-py', (-ny * 5).toFixed(2) + 'deg');
        });
        hero.addEventListener('pointerleave', () => {
          phone.style.setProperty('--m-px', '0deg');
          phone.style.setProperty('--m-py', '0deg');
        });
      }

      // 4. 卡片光晕跟随指针
      document.querySelectorAll('.feature-visual, .schedule-scene, .moments-scene, .voice-visual, .download-panel, .role-poster').forEach(card => {
        card.setAttribute('data-spot', '');
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--m-mx', (((event.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%');
          card.style.setProperty('--m-my', (((event.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%');
        });
      });
    }

    // 5. 锚点平滑滚动（尊重 reduced-motion，已由 CSS scroll-behavior 提供，这里兜底 JS 场景）
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const id = link.getAttribute('href').slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
        if (event.detail === 0 || link.classList.contains('skip-link')) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
        history.replaceState(null, '', '#' + id);
      });
    });
  }

  init();
  reduced.addEventListener('change', () => {
    if (reduced.matches) teardown(); else init();
  });
})();
