/* 첫 화면 오프닝.
   스크롤을 가로채지 않습니다 — 오프닝은 그냥 키가 큰 구역이고,
   그 안의 무대(.opening-stage)가 화면에 붙어 있다가(sticky) 지나갑니다.
   우리가 하는 일은 "얼마나 내려왔는지" 를 보고 장면을 바꾸는 것뿐입니다. */
(function () {
  var opening = document.getElementById('opening');
  if (!opening) return;

  var scenes = [].slice.call(opening.querySelectorAll('.opening-scene'));
  var dots = [].slice.call(opening.querySelectorAll('.opening-dot'));
  var skip = document.getElementById('openingSkip');
  if (!scenes.length) return;

  var body = document.body;
  var current = -1;
  var ticking = false;

  function show(n) {
    if (n === current) return;
    current = n;
    scenes.forEach(function (el, i) { el.classList.toggle('is-on', i === n); });
    dots.forEach(function (el, i) { el.classList.toggle('is-on', i === n); });
    /* 마지막 장면에서는 "아래로 내려 보세요" 를 지웁니다 — 이미 내려오셨으니까요. */
    opening.classList.toggle('is-last', n === scenes.length - 1);
  }

  function update() {
    ticking = false;
    var h = opening.offsetHeight - window.innerHeight;
    var y = window.scrollY || window.pageYOffset || 0;
    var done = y >= h;

    /* 오프닝을 지나가면 머리글이 다시 나오고, 건너뛰기 단추는 사라집니다. */
    body.classList.toggle('opening-on', !done);

    if (done) { markSeen(); return; }

    var p = h > 0 ? Math.min(Math.max(y / h, 0), 1) : 0;
    var n = Math.min(Math.floor(p * scenes.length), scenes.length - 1);
    show(n);
  }

  var saved = false;
  function markSeen() {
    if (saved) return;
    saved = true;
    try { localStorage.setItem('wcsc.opening.seen', String(Date.now())); } catch (e) {}
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  if (skip) {
    skip.addEventListener('click', function () {
      markSeen();
      var to = opening.offsetHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(to, 0), behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* 새로고침으로 중간에서 시작하는 경우가 있어 맨 위에서 시작하게 맞춰 둡니다. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  update();
})();
