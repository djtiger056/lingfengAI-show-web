/* 卡片进入视口检测 + 光晕跟随 */
(() => {
  'use strict';

  // 特征卡片进入视口检测
  const features = document.querySelectorAll('.feature-row');

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      }
    });
  }, observerOptions);

  features.forEach(feature => {
    observer.observe(feature);
    feature.setAttribute('data-spot', '');
  });

  // 卡片光晕跟随光标
  document.querySelectorAll('[data-spot]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (!document.documentElement.classList.contains('motion-enhanced')) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--m-mx', `${x}px`);
      card.style.setProperty('--m-my', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.removeProperty('--m-mx');
      card.style.removeProperty('--m-my');
    });
  });

  // FAQ 区域检测
  const faqIntro = document.querySelector('.faq-intro');
  if (faqIntro) {
    const faqObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, observerOptions);

    faqObserver.observe(faqIntro);
  }

  // 日常、语音等其他板块
  const voiceCopy = document.querySelector('.voice-copy');
  if (voiceCopy) {
    const voiceObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, observerOptions);

    voiceObserver.observe(voiceCopy);
  }

  const dailyHeading = document.querySelector('.daily-heading');
  if (dailyHeading) {
    const dailyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, observerOptions);

    dailyObserver.observe(dailyHeading);
  }
})();
