/* ===========================================================
   零风AI 官网 · 「三秒抓住」视觉增强脚本 (accent.js)
   职责：① 挂载 html.accent-on 视觉样式，减少动态时仍保留布局
        ② Hero 柔光跟随指针；数字递增统一由 counter.js 处理
   与 motion.js / wind.js 并存，互不改写对方属性
   =========================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('accent-on');
  if (reduce) return; // 保留视觉样式，跳过指针和计数动画

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    /* ---------- ② Hero 柔光跟随指针 ---------- */
    var layout = document.querySelector('.hero-layout');
    if (layout && window.matchMedia('(pointer: fine)').matches) {
      layout.addEventListener('pointermove', function (e) {
        var r = layout.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width) * 100;
        var y = ((e.clientY - r.top) / r.height) * 100;
        layout.style.setProperty('--gx', x.toFixed(1) + '%');
        layout.style.setProperty('--gy', y.toFixed(1) + '%');
      });
      layout.addEventListener('pointerleave', function () {
        layout.style.setProperty('--gx', '70%');
        layout.style.setProperty('--gy', '40%');
      });
    }

  });
})();
