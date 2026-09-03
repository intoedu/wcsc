/* =========================================================
   홈 화면 (index.html)

     1) 미는 배너의 점
     2) 지원 항목을 갈래로 걸러 보기

   찾기는 머리(header)에 있고 assets/js/search.js 가 맡습니다.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 처음 열 때의 움직임 ----------

     첫 화면이 위에서부터 차례로 떠오릅니다. 배너 · 바로가기 ·
     항목 순서로 아주 짧게(0.5초) 지나갑니다.

     지키는 것 셋
       1. 한 번만 봅니다. 같은 방문에서 다른 페이지를 들렀다
          돌아오실 때마다 다시 움직이면 성가십니다.
       2. 움직임을 줄여 달라고 설정하신 분(prefers-reduced-motion)
          에게는 아무것도 움직이지 않습니다. 어지러움을 느끼시는
          분이 실제로 계십니다.
       3. 자바스크립트가 늦거나 막혀도 화면은 그대로 다 보입니다 —
          움직임은 붙였다 떼는 덧옷일 뿐입니다.
  */

  (function intro() {
    var seen;
    try { seen = window.sessionStorage.getItem('wcsc.intro'); } catch (ignore) { seen = null; }

    var still = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (seen || still) return;

    try { window.sessionStorage.setItem('wcsc.intro', '1'); } catch (ignore) { /* 못 남겨도 그만 */ }

    var steps = ['.bn-wrap', '.sc-wrap', '#items'];
    var nodes = steps.map(function (sel) { return document.querySelector(sel); })
      .filter(Boolean);
    if (!nodes.length) return;

    nodes.forEach(function (el, i) {
      el.classList.add('rise');
      el.style.animationDelay = (i * 110) + 'ms';
    });

    // 끝나면 표시를 떼어 냅니다. 남겨 두면 나중에 그리는 것과 부딪힙니다.
    window.setTimeout(function () {
      nodes.forEach(function (el) {
        el.classList.remove('rise');
        el.style.animationDelay = '';
      });
    }, 1200);
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
