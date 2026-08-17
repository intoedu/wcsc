/* 공통 UI 동작: 모바일 메뉴, 지원 항목 드롭다운, 스크롤 효과 */
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var mega = document.getElementById('mega');

  /* 모바일 메뉴 */
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? '메뉴 열기' : '메뉴 닫기');
      nav.classList.toggle('is-open', !open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* 데스크톱 '지원 항목' 드롭다운 */
  if (mega) {
    var trigger = document.querySelector('.nav-link[href$="services/index.html"]');
    var closeTimer = null;
    var isDesktop = function () { return window.matchMedia('(min-width: 821px)').matches; };

    var open = function () {
      if (!isDesktop()) return;
      window.clearTimeout(closeTimer);
      mega.hidden = false;
    };
    var close = function (delay) {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () { mega.hidden = true; }, delay || 0);
    };

    if (trigger) {
      trigger.addEventListener('mouseenter', open);
      trigger.addEventListener('focus', open);
      trigger.addEventListener('mouseleave', function () { close(180); });
    }
    mega.addEventListener('mouseenter', open);
    mega.addEventListener('mouseleave', function () { close(120); });
    if (header) {
      header.addEventListener('focusout', function (e) {
        if (!header.contains(e.relatedTarget)) close(0);
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(0);
    });
    window.addEventListener('resize', function () { if (!isDesktop()) mega.hidden = true; });
  }

  /* 스크롤 시 헤더 그림자 */
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* 등장 애니메이션 */
  var targets = document.querySelectorAll(
    '.svc-card, .why-card, .step, .prep-card, .prob-card, .feat-card, .contact-card, .tl-item'
  );
  if (targets.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.style.transitionDelay = Math.min(i * 60, 240) + 'ms';
          el.classList.add('is-in');
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.08 }
    );
    targets.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* 푸터 연도 */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
