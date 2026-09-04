/* =========================================================
   홈 화면 (index.html)

     1) 미는 배너의 점
     2) 지원 항목을 갈래로 걸러 보기

   찾기는 머리(header)에 있고 assets/js/search.js 가 맡습니다.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 첫 화면 인트로 ----------

     홈에 들어오시면 로고가 잠깐 떴다가 걷히고, 그 뒤로 배너 ·
     바로가기 · 항목이 차례로 떠오릅니다. 전부 1.4초입니다.

     지키는 것 넷
       1. 기다리게 하지 않습니다. 어디를 누르거나 스크롤하거나
          자판을 치시면 그 자리에서 걷힙니다.
       2. 움직임을 줄여 달라고 설정하신 분께는 아무것도 하지
          않습니다. 어지러움을 느끼시는 분이 실제로 계십니다.
       3. 자바스크립트가 늦거나 막혀도 화면은 그대로 다 보입니다 —
          가림막은 자바스크립트가 직접 붙였다 뗍니다.
       4. 어떤 일이 있어도 2초 뒤에는 반드시 걷힙니다.
  */

  (function intro() {
    var still = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;

    var steps = ['.bn-wrap', '.sc-wrap', '#items'];
    var nodes = steps.map(function (sel) { return document.querySelector(sel); })
      .filter(Boolean);

    /* 가림막 — 로고가 잠깐 떴다가 걷힙니다. */
    var veil = document.createElement('div');
    veil.className = 'intro';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<img class="intro-logo" src="assets/img/logo-light.png" alt="">';
    document.body.appendChild(veil);
    document.body.classList.add('is-intro');

    nodes.forEach(function (el, i) {
      el.classList.add('rise');
      el.style.animationDelay = (600 + i * 120) + 'ms';
    });

    var done = false;
    function finish() {
      if (done) return;
      done = true;

      veil.classList.add('is-gone');
      document.body.classList.remove('is-intro');
      window.setTimeout(function () {
        if (veil.parentNode) veil.parentNode.removeChild(veil);
      }, 500);

      nodes.forEach(function (el) {
        el.classList.remove('rise');
        el.style.animationDelay = '';
      });

      ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
        window.removeEventListener(ev, finish);
      });
    }

    /* 누르거나 스크롤하시면 바로 걷습니다 */
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, finish, { passive: true });
    });

    window.setTimeout(finish, 1400);
    // 무슨 일이 있어도 여기서는 걷힙니다.
    window.setTimeout(function () {
      done = false;
      finish();
    }, 2000);
  }());

  /* ---------- 미는 배너 ----------
     화살표 단추를 붙이지 않았습니다. 손가락으로 미는 것이 이미
     되고, 마우스로는 다음 장이 걸쳐 보여 밀 수 있다는 것이 보입니다.
     점은 어디까지 왔는지 알려 주는 몫만 합니다. */

  var rail = document.getElementById('bnRail');
  var dots = document.getElementById('bnDots');

  if (rail && dots) {
    var buttons = dots.querySelectorAll('.bn-dot');

    var paint = function () {
      var cards = rail.querySelectorAll('.bn');
      if (!cards.length) return;
      var step = cards[0].offsetWidth + 16;
      var at = Math.round(rail.scrollLeft / step);
      Array.prototype.forEach.call(buttons, function (b, i) {
        b.classList.toggle('is-on', i === at);
      });
    };

    var waiting = false;
    rail.addEventListener('scroll', function () {
      if (waiting) return;
      waiting = true;
      window.requestAnimationFrame(function () { paint(); waiting = false; });
    }, { passive: true });

    dots.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (!b) return;
      var cards = rail.querySelectorAll('.bn');
      var i = Number(b.getAttribute('data-go'));
      if (cards[i]) rail.scrollTo({ left: cards[i].offsetLeft - rail.offsetLeft, behavior: 'smooth' });
    });

    paint();
  }

  /* ---------- 갈래로 걸러 보기 ---------- */

  var tabs = document.getElementById('catTabs');
  var grid = document.getElementById('itemGrid');

  if (tabs && grid) {
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) return;

      var want = btn.getAttribute('data-cat');
      Array.prototype.forEach.call(tabs.querySelectorAll('.cat-tab'), function (b) {
        b.classList.toggle('is-on', b === btn);
      });
      Array.prototype.forEach.call(grid.querySelectorAll('.item'), function (card) {
        card.hidden = !!want && card.getAttribute('data-cat') !== want;
      });
    });
  }

}());
