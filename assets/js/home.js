/* =========================================================
   홈 화면 (index.html)

     1) 미는 배너의 점
     2) 지원 항목을 갈래로 걸러 보기

   찾기는 머리(header)에 있고 assets/js/search.js 가 맡습니다.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 첫 화면 인트로 ----------

     홈에 들어오시면 로고가 잠깐 떴다가 그 자리에서 사라집니다.
     가림막이 옅어지면 그 뒤에 홈페이지가 이미 놓여 있습니다.

     움직이지 않습니다
       앞서는 가림막이 위로 걷히고 배너 · 아이콘이 아래에서 하나씩
       올라왔습니다. 들어올 때마다 화면이 들썩여 보였습니다.
       지금은 옅어지는 것 하나뿐입니다.

     지키는 것 셋
       1. 기다리게 하지 않습니다. 어디를 누르거나 스크롤하거나
          자판을 치시면 그 자리에서 사라집니다.
       2. 움직임을 줄여 달라고 설정하신 분께는 아무것도 하지
          않습니다. 어지러움을 느끼시는 분이 실제로 계십니다.
       3. 자바스크립트가 늦거나 막혀도 화면은 그대로 다 보입니다 —
          가림막은 자바스크립트가 직접 붙였다 뗍니다.
  */

  (function intro() {
    var still = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) return;

    /* 메뉴의 [홈] 을 눌러 오신 경우에는 가림막을 띄우지 않습니다.
       페이지 사이를 오가는 일이라 그때마다 화면이 덮이면 성가십니다.
       처음 들어오실 때와 로고를 누르실 때는 그대로 뜹니다. */
    var skipVeil = false;
    try {
      skipVeil = window.sessionStorage.getItem('wcsc.veil') === 'skip';
      window.sessionStorage.removeItem('wcsc.veil');
    } catch (ignore) { skipVeil = false; }
    if (skipVeil) return;

    /* 로고가 머무는 시간. 뒤이어 0.3초 동안 옅어져 사라지므로
       들어오셔서 홈페이지를 보시기까지 1.1초입니다. */
    var HOLD = 800;
    var FADE = 340;

    var veil = document.createElement('div');
    veil.className = 'intro';
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<img class="intro-logo" src="assets/img/logo-light.png" alt="">';
    document.body.appendChild(veil);
    /* 가림막이 떠 있는 동안에는 뒤가 밀리지 않게 스크롤을 멈춥니다 */
    document.body.classList.add('is-intro');

    var gone = false;
    var WAKE = ['click', 'keydown', 'wheel', 'touchstart'];

    function hide() {
      if (gone) return;
      gone = true;
      veil.classList.add('is-gone');
      document.body.classList.remove('is-intro');
      window.setTimeout(function () {
        if (veil.parentNode) veil.parentNode.removeChild(veil);
      }, FADE);
      WAKE.forEach(function (ev) { window.removeEventListener(ev, hide); });
    }

    /* 누르거나 스크롤하시면 기다리지 않고 바로 사라집니다 */
    WAKE.forEach(function (ev) {
      window.addEventListener(ev, hide, { passive: true });
    });

    window.setTimeout(hide, HOLD);
    // 무슨 일이 있어도 여기서는 사라집니다.
    window.setTimeout(hide, 1600);
  }());

  /* ---------- 미는 배너 ----------
     화살표 단추를 붙이지 않았습니다. 손가락으로 미는 것이 이미
     되고, 마우스로는 다음 장이 걸쳐 보여 밀 수 있다는 것이 보입니다.
     점은 어디까지 왔는지 알려 주는 몫만 합니다. */

  var rail = document.getElementById('bnRail');
  var dots = document.getElementById('bnDots');

  if (rail && dots) {
    var buttons = dots.querySelectorAll('.bn-dot');

    /* 점은 배너 한 장에 하나씩 둡니다. 다만 화면이 넓으면 배너가 두 장씩
       보여, 끝까지 밀어도 마지막 장이 첫 자리에 오지 않습니다. 그래서
       끝에 닿으면 마지막 점을 켜 줍니다 — 그러지 않으면 눌러도 켜지지
       않는 점이 생깁니다. */
    var paint = function () {
      var cards = rail.querySelectorAll('.bn');
      if (!cards.length) return;
      var step = cards[0].offsetWidth + 16;
      var end = rail.scrollWidth - rail.clientWidth;

      var at = Math.min(buttons.length - 1, Math.max(0, Math.round(rail.scrollLeft / step)));

      if (end > 0 && end - rail.scrollLeft < 4) {
        // 끝에서는 마지막 두 장이 함께 보입니다. 방금 고른 점이 화면에 있으면
        // 그 점을 그대로 두고, 아니면 마지막 점을 켭니다.
        var on = -1;
        Array.prototype.forEach.call(buttons, function (b, i) {
          if (b.classList.contains('is-on')) on = i;
        });
        var seen = on > -1 && cards[on]
          && cards[on].offsetLeft - rail.offsetLeft >= rail.scrollLeft - 4;
        at = seen ? on : buttons.length - 1;
      }

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
      if (!cards[i]) return;
      // 오른쪽 끝을 넘겨 밀 수는 없습니다. 마지막 점은 끝까지 데려다 줍니다.
      var to = Math.min(cards[i].offsetLeft - rail.offsetLeft, rail.scrollWidth - rail.clientWidth);
      rail.scrollTo({ left: to, behavior: 'smooth' });
      Array.prototype.forEach.call(buttons, function (x, n) { x.classList.toggle('is-on', n === i); });
    });

    window.addEventListener('resize', paint);
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
