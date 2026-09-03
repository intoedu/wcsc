/* =========================================================
   홈 화면 (index.html)

     1) 지원 항목을 갈래로 걸러 보기
     2) 첫 화면의 [빠른 상담] → 신청서로 넘기며 적으신 것을 옮겨 담기

   왜 여기서 바로 보내지 않는가
     신청은 로그인이 필요합니다. 첫 화면에서 로그인부터 물으면
     대개 그냥 나가십니다. 그래서 연락처만 받아 두고, 신청서에서
     한 번 더 확인하고 보내시게 합니다.

   왜 주소창이 아니라 sessionStorage 인가
     연락처를 주소창에 실으면 브라우저 기록과 남의 사이트로 넘어가는
     referrer 에 전화번호가 남습니다. 같은 탭 안에서만 살아 있고
     쓰는 즉시 지워지는 자리에 잠깐 둡니다.
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

  /* ---------- 빠른 상담 ---------- */

  var form = document.getElementById('quoteForm');
  if (!form) return;

  var church = document.getElementById('qChurch');
  var phone = document.getElementById('qPhone');
  var item = document.getElementById('qItem');
  var err = document.getElementById('qErr');

  /* 010-0000-0000 모양으로 맞춰 줍니다 (db.js 에 이미 있는 것을 씁니다) */
  if (window.CAPSDB && window.CAPSDB.bindPhoneInput) window.CAPSDB.bindPhoneInput(phone);

  function say(msg) {
    err.textContent = msg || '';
    err.hidden = !msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    say('');

    var digits = String(phone.value || '').replace(/\D/g, '');
    if (digits.length < 9) {
      say('연락처를 확인해 주세요. 이것만 있으면 저희가 전화드립니다.');
      phone.focus();
      return;
    }

    try {
      window.sessionStorage.setItem('wcsc.quote', JSON.stringify({
        church: church.value.trim(),
        phone: phone.value.trim(),
      }));
    } catch (ignore) {
      // 저장이 막힌 브라우저 — 넘어가서 다시 적으시면 됩니다.
    }

    var id = item.value;
    window.location.href = 'apply.html' + (id ? '?service=' + encodeURIComponent(id) : '');
  });
}());
