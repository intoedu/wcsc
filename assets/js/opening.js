/* 첫 화면 오프닝.

   스크롤로 장면을 넘깁니다 — 오프닝은 그냥 키가 큰 구역이고, 그 안의
   무대(.opening-stage)는 화면에 붙어 있습니다. 우리가 하는 일은
   "얼마나 내려왔는지" 를 보고 장면을 바꾸는 것뿐입니다.

   끝나면 그 자리에서 사라집니다
     앞서는 끝까지 내려오면 무대가 위로 밀려 올라가고 그 아래에서
     홈이 따라 올라왔습니다. 지금은 마지막 장면(헤드셋이 씌워지는 것)이
     끝날 때까지 잠깐 머문 뒤, 무대가 그 자리에서 옅어지고 홈은 맨
     위에서부터 놓여 있습니다. [건너뛰기] 도 똑같이 사라집니다.

     옅어지는 동안 뒤에서는 이렇게 합니다 —
       1. 키가 큰 구역을 접어 자리를 비웁니다
       2. 화면을 맨 위로 올립니다 (무대가 덮고 있어 보이지 않습니다)
       3. 그동안 들어오는 스크롤은 먹지 않게 막습니다 — 손을 뗀 뒤에도
          관성으로 굴러가는 스크롤이 홈을 아래로 밀어내지 않도록
*/
(function () {
  var opening = document.getElementById('opening');
  if (!opening) return;

  /* 오늘은 보여 주지 않는 날입니다 — 한 번 보셨거나, 움직임을 줄여 달라고
     하셨습니다. 여기서 바로 멈춥니다.

     앞서는 멈추지 않고 아래로 내려가, 가려진(높이 0) 오프닝을 '끝까지
     봤다' 고 판단해 기록을 지금 시각으로 다시 적었습니다. 그래서 하루에
     한 번이라도 홈에 오시는 분은 하루 기한이 매번 다시 늘어나, 오프닝이
     영영 나오지 않았습니다. */
  var root = document.documentElement;
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

  var current = -1;
  var lastAt = 0;
  var ticking = false;
  var finished = false;

  function show(n) {
    if (n === current) return;
    current = n;
    if (n === LAST) lastAt = Date.now();
    scenes.forEach(function (el, i) { el.classList.toggle('is-on', i === n); });
    dots.forEach(function (el, i) { el.classList.toggle('is-on', i === n); });
    /* 마지막 장면에서는 "아래로 내려 보세요" 를 지웁니다 — 이미 내려오셨으니까요. */
    opening.classList.toggle('is-last', n === LAST);
  }

  function update() {
    ticking = false;
    if (finished) return;
    var h = opening.offsetHeight - window.innerHeight;
    var y = window.scrollY || window.pageYOffset || 0;

    /* 끝까지 내려오셨습니다. */
    if (h > 0 && y >= h) {
      show(LAST);
      finish(false);
      return;
    }

    var p = h > 0 ? Math.min(Math.max(y / h, 0), 1) : 0;
    show(Math.min(Math.floor(p * scenes.length), LAST));
  }

  function onScroll() {
    if (ticking || finished) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  function markSeen() {
    try { localStorage.setItem('wcsc.opening.seen', String(Date.now())); } catch (e) {}
  }

  /* html 에 scroll-behavior: smooth 가 걸려 있어, 그냥 올리면 미끄러지듯
     올라갑니다. 무대 뒤에서 한 번에 올려야 합니다.

     잠깐 끄는 것만으로는 안 됩니다 — 크롬은 scrollTo(0, 0) 일 때만
     스타일 갱신을 건너뛰어(0,0 은 넘칠 일이 없다고 보고), 방금 끈 것이
     반영되기 전에 미끄러지기 시작합니다. 실제로 그렇게 미끄러졌습니다.
     그래서 스타일을 바로 반영시키고, 'instant' 를 따로 적습니다. */
  function toTop() {
    var was = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    void window.getComputedStyle(root).scrollBehavior;
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    root.style.scrollBehavior = was;
  }

  /* 사라지는 동안 스크롤을 막습니다 — 휠 · 손가락 · 자판 */
  var SCROLL_KEYS = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 38: 1, 40: 1 };
  function stop(e) { e.preventDefault(); }
  function stopKeys(e) { if (SCROLL_KEYS[e.keyCode]) e.preventDefault(); }
  function hold(on) {
    var add = on ? 'addEventListener' : 'removeEventListener';
    window[add]('wheel', stop, { passive: false });
    window[add]('touchmove', stop, { passive: false });
    window[add]('keydown', stopKeys);
  }

  /* now 가 참이면 [건너뛰기] 입니다 — 머물지 않고 바로 사라집니다. */
  function finish(now) {
    if (finished) return;
    finished = true;
    markSeen();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    hold(true);

    /* 1) 자리를 비우고 맨 위로 — 무대는 화면에 남아 덮고 있습니다 */
    opening.classList.add('is-done');
    body.classList.remove('opening-on');
    toTop();

    var wait = now ? 0 : Math.max(0, HOLD - (Date.now() - lastAt));
    window.setTimeout(function () {
      /* 2) 그 자리에서 옅어집니다 */
      opening.classList.add('is-leaving');
      window.setTimeout(function () {
        /* 3) 걷어냅니다 */
        root.classList.add('no-opening');
        hold(false);
        toTop();
      }, FADE + 40);
    }, wait);
  }

  if (skip) {
    skip.addEventListener('click', function () { finish(true); });
  }

  body.classList.add('opening-on');
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* 새로고침으로 중간에서 시작하는 경우가 있어 맨 위에서 시작하게 맞춰 둡니다. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  update();
})();
