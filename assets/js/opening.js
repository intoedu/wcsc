/* 첫 화면 오프닝.

   스크롤로 장면을 넘깁니다 — 오프닝은 그냥 키가 큰 구역이고, 그 안의
   무대(.opening-stage)는 화면에 붙어 있습니다. 우리가 하는 일은
   "얼마나 내려왔는지" 를 보고 장면을 바꾸는 것뿐입니다.

   끝나면 그 자리에서 사라집니다
     마지막 장면(헤드셋이 씌워지는 것)이 끝날 때까지 잠깐 머문 뒤, 무대가
     그 자리에서 옅어지고 홈은 맨 위에서부터 놓여 있습니다.
     [건너뛰기] 도 똑같이 사라집니다 (머물지 않고 바로).

   옅어지는 동안 뒤에서 하는 일
     1. 키가 큰 구역을 접어 자리를 비우고, 화면을 맨 위로 올립니다
        (무대가 덮고 있어 보이지 않습니다)
     2. 화면을 잠그고(html.opening-lock), 그래도 움직이면 곧바로 맨 위로
        되돌립니다. 둘 다 필요합니다 —
          · 휴대폰에서 손가락을 튕긴 관성은 이벤트로 막을 수 없고
            화면을 잠가야 멈춥니다
          · 키보드(End · Space · PageDown)나 트랙패드로 이미 굴러가던
            스크롤은 잠가도 계속 가므로, 움직일 때마다 되돌려야 합니다
     3. 다 사라진 뒤에도, 손을 떼고 굴러오던 관성이 그칠 때까지 조금 더
        막습니다 — 시간으로 정해 두면 남은 관성이 홈을 밀어 내립니다
*/
(function () {
  var opening = document.getElementById('opening');
  if (!opening) return;

  var root = document.documentElement;

  /* 홈은 언제나 맨 위에서 시작합니다 — 새로고침이나 뒤로 가기로 예전
     위치가 되살아나지 않게. 오프닝을 안 보여 주는 날에도 미리 해 둡니다.
     그날 홈을 내려 둔 위치가 남아 있으면, 하루가 지나 새로고침했을 때
     오프닝이 그 아래 어딘가에서 시작해 마지막 장면만 보이고 끝나 버립니다. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* 오늘은 보여 주지 않는 날입니다 — 한 번 보셨거나, 움직임을 줄여 달라고
     하셨습니다. 여기서 바로 멈춥니다.

     앞서는 멈추지 않고 아래로 내려가, 가려진(높이 0) 오프닝을 '끝까지
     봤다' 고 판단해 기록을 지금 시각으로 다시 적었습니다. 그래서 하루에
     한 번이라도 홈에 오시는 분은 하루 기한이 매번 다시 늘어나, 오프닝이
     영영 나오지 않았습니다. */
  if (root.classList.contains('no-opening')) return;

  var scenes = [].slice.call(opening.querySelectorAll('.opening-scene'));
  var dots = [].slice.call(opening.querySelectorAll('.opening-dot'));
  var skip = document.getElementById('openingSkip');
  if (!scenes.length) return;

  var body = document.body;
  var LAST = scenes.length - 1;

  /* 마지막 장면의 헤드셋은 0.35초 기다렸다가 0.85초 동안 내려옵니다.
     다 씌워진 것을 보시고 사라지도록 그만큼 머뭅니다. */
  var HOLD = 1300;
  /* 옅어지는 시간 — style.css 의 .opening.is-leaving 과 맞춥니다. */
  var FADE = 600;
  /* 이만큼 스크롤 입력이 없으면 막기를 풉니다. */
  var QUIET = 220;
  /* 그래도 사라진 뒤 이 시간이 지나면 풉니다 — 일부러 내리시는 스크롤을
     오래 막지 않도록. */
  var CAP = 1200;

  var current = -1;
  var lastAt = 0;
  var lastP = 0;
  var lastH = opening.offsetHeight;
  var ticking = false;
  var finished = false;
  var lastInput = 0;

  function show(n) {
    if (n === current) return;
    current = n;
    if (n === LAST) lastAt = Date.now();
    scenes.forEach(function (el, i) { el.classList.toggle('is-on', i === n); });
    dots.forEach(function (el, i) { el.classList.toggle('is-on', i === n); });
    /* 마지막 장면에서는 "아래로 내려 보세요" 를 지웁니다 — 이미 내려오셨으니까요. */
    opening.classList.toggle('is-last', n === LAST);
  }

  function scrollY() { return window.scrollY || window.pageYOffset || 0; }

  function update() {
    ticking = false;
    if (finished) return;
    var h = opening.offsetHeight - window.innerHeight;
    var y = scrollY();

    /* 끝까지 내려오셨습니다. */
    if (h > 0 && y >= h) {
      show(LAST);
      finish(false);
      return;
    }

    var p = h > 0 ? Math.min(Math.max(y / h, 0), 1) : 0;
    lastP = p;
    show(Math.min(Math.floor(p * scenes.length), LAST));
  }

  function onScroll() {
    if (ticking || finished) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  /* 휴대폰을 돌리면 오프닝의 키가 바뀝니다 (500vh 라서). 그대로 두면 지금
     위치가 새 끝을 넘어 오프닝이 저절로 끝나 버립니다. 보시던 자리(비율)로
     옮겨 둡니다.
     주소창이 들어가고 나올 때는 키가 그대로이므로 건드리지 않습니다 —
     내리시는 중에 위치를 바꾸면 손가락과 다투게 됩니다. */
  function onResize() {
    if (finished) return;
    var H = opening.offsetHeight;
    if (H !== lastH) {
      lastH = H;
      var h = H - window.innerHeight;
      /* 끝 바로 앞에서 돌리면 반올림으로 끝에 닿아 버립니다 — 한 칸 앞에
         둡니다. 끝내는 것은 사용자의 다음 스크롤이 합니다. */
      if (h > 0) jump(Math.min(Math.round(lastP * h), h - 1));
    }
    onScroll();
  }

  function markSeen() {
    try { localStorage.setItem('wcsc.opening.seen', String(Date.now())); } catch (e) {}
  }

  /* html 에 scroll-behavior: smooth 가 걸려 있어, 그냥 옮기면 미끄러지듯
     움직입니다. 한 번에 옮겨야 합니다.

     잠깐 끄는 것만으로는 안 됩니다 — 크롬은 scrollTo(0, 0) 일 때만
     스타일 갱신을 건너뛰어(0,0 은 넘칠 일이 없다고 보고), 방금 끈 것이
     반영되기 전에 미끄러지기 시작합니다. 실제로 그렇게 미끄러졌습니다.
     그래서 스타일을 바로 반영시키고, 'instant' 를 따로 적습니다. */
  function jump(y) {
    var was = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    void window.getComputedStyle(root).scrollBehavior;
    try {
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, y);
    }
    root.style.scrollBehavior = was;
  }

  /* ── 사라지는 동안 막기 ── */
  var SCROLL_KEYS = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 38: 1, 40: 1 };

  /* 글을 치는 칸에서는 스페이스 · 화살표를 막지 않습니다. 옅어지는 사이
     머리글의 찾기 칸을 누르실 수도 있습니다. */
  function typing(t) {
    if (!t || !t.tagName) return false;
    var tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
  }

  function stop(e) {
    lastInput = Date.now();
    /* 이미 시작된 손짓에서 온 이벤트는 취소할 수 없습니다 — 그건 아래 pin 이
       맡습니다. */
    if (e.cancelable) e.preventDefault();
  }
  function stopKeys(e) {
    if (!SCROLL_KEYS[e.keyCode] || typing(e.target)) return;
    lastInput = Date.now();
    e.preventDefault();
  }
  function pin() {
    if (scrollY() !== 0) jump(0);
  }

  function lock(on) {
    var m = on ? 'addEventListener' : 'removeEventListener';
    root.classList.toggle('opening-lock', on);
    window[m]('wheel', stop, { passive: false });
    window[m]('touchmove', stop, { passive: false });
    window[m]('keydown', stopKeys);
    window[m]('scroll', pin);
  }

  /* 굴러오던 관성이 그쳤는지 봅니다. QUIET 만큼 입력이 없거나, 늦어도
     deadline 에는 풉니다. 막는 동안은 pin 이 맨 위를 지키고 있었으므로
     풀 때 위치를 다시 옮길 일은 없습니다. */
  function release(deadline) {
    var now = Date.now();
    var idle = now - lastInput;
    if (idle >= QUIET || now >= deadline) {
      lock(false);
      return;
    }
    window.setTimeout(function () { release(deadline); }, QUIET - idle + 10);
  }

  /* now 가 참이면 [건너뛰기] 입니다 — 머물지 않고 바로 사라집니다. */
  function finish(now) {
    if (finished) return;
    finished = true;
    markSeen();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);

    /* 1) 자리를 비우고 맨 위로 — 무대는 화면에 남아 덮고 있습니다 */
    lastInput = Date.now();
    lock(true);
    opening.classList.add('is-done');
    body.classList.remove('opening-on');
    jump(0);

    var wait = now ? 0 : Math.max(0, HOLD - (Date.now() - lastAt));
    window.setTimeout(function () {
      /* 2) 그 자리에서 옅어집니다 */
      opening.classList.add('is-leaving');
      window.setTimeout(function () {
        /* 3) 걷어내고, 관성이 그치면 풉니다 */
        root.classList.add('no-opening');
        jump(0);
        release(Date.now() + CAP);
      }, FADE + 40);
    }, wait);
  }

  if (skip) {
    skip.addEventListener('click', function () { finish(true); });
  }

  body.classList.add('opening-on');
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  update();
})();
