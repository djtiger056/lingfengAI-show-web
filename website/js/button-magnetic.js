/* 按钮多层波纹效果 */
(() => {
  'use strict';

  const buttons = document.querySelectorAll('.button');

  buttons.forEach(button => {
    button.setAttribute('data-spot', '');

    // 多层波纹
    button.addEventListener('click', (e) => {
      if (!document.documentElement.classList.contains('motion-enhanced')) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (let i = 1; i <= 3; i++) {
        const ripple = document.createElement('span');
        ripple.classList.add('m-ripple', `ripple-${i}`);
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600 + i * 100);
      }
    });

    // 光晕跟随
    button.addEventListener('mousemove', (e) => {
      if (!document.documentElement.classList.contains('motion-enhanced')) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      button.style.setProperty('--m-mx', `${x}px`);
      button.style.setProperty('--m-my', `${y}px`);
    });

    button.addEventListener('mouseleave', () => {
      button.style.removeProperty('--m-mx');
      button.style.removeProperty('--m-my');
    });
  });
})();
