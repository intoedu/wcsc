/* =========================================================
   홈 화면 (index.html)

     1) 첫 화면의 넓은 찾기 칸 → 찾기 창으로 넘기기
     2) 지원 항목을 갈래로 걸러 보기
     3) 미는 배너의 점
   ========================================================= */
(function () {
  'use strict';

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

  /* ---------- 첫 화면의 찾기 칸 ----------
     머리의 작은 돋보기만으로는 찾을 수 있다는 것을 모르십니다.
     그래서 넓은 칸을 하나 더 두었습니다.

     칸에 손이 닿는 순간(focus) 찾기 창을 열고 그리로 넘깁니다.
     글자를 치기 전에 focus 가 먼저 오므로, 치신 글자가 사라지지
     않습니다. */

  var hs = document.getElementById('hsInput');

  function openSearch(seed) {
    var box = document.getElementById('siteSearch');
    var input = document.getElementById('ssInput');
    if (!box || !input) return false;

    box.hidden = false;
    document.body.classList.add('is-search-open');
    input.value = seed || '';
    input.dispatchEvent(new Event('input'));
    input.focus();
    return true;
  }

  if (hs) {
    var handOver = function () {
      var seed = hs.value;
      hs.value = '';
      hs.blur();
      if (!openSearch(seed)) window.location.href = 'contact.html';
    };
    hs.addEventListener('focus', handOver);
    hs.addEventListener('click', handOver);
  }

  var tags = document.querySelector('.hs-tags');
  if (tags) {
    tags.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hs]');
      if (b) openSearch(b.getAttribute('data-hs'));
    });
  }

}());
