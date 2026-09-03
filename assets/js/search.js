/* =========================================================
   찾아보기

   사이트에 페이지가 늘면서 "그 기능이 어디 있더라" 가 됩니다.
   메뉴를 다 뒤지지 않고 한 칸에 적어 찾도록 만든 것입니다.

   두 가지를 함께 찾습니다.
     1) 사이트의 기능 — 페이지 · 지원 항목 · 게시판 · 자주 묻는 질문
        (build.js 가 미리 만들어 둔 목록을 씁니다)
     2) 게시판에 지금 올라와 있는 글 — 매물 · 물건 · 방 · 집회 · 공고
        (수시로 바뀌므로 찾을 때 그 자리에서 읽어 옵니다)

   초성으로도 찾습니다.
     한글은 타자를 다 치기 전에 'ㅎㅍㅇㅈ' 까지만 쳐도 무엇을 찾는지
     대개 정해집니다. 그래서 제목의 초성을 함께 견줍니다.
   ========================================================= */
(function () {
  'use strict';

  var box = document.getElementById('siteSearch');
  if (!box) return;

  var input = document.getElementById('ssInput');
  var out = document.getElementById('ssResults');
  var openers = document.querySelectorAll('[data-search-open]');
  var BASE = box.getAttribute('data-base') || '';
  var INDEX = window.CAPS_SEARCH || [];

  /* ---------- 초성 ---------- */

  var CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
    'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  function chosung(text) {
    var outStr = '';
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c >= 0xac00 && c <= 0xd7a3) outStr += CHO[Math.floor((c - 0xac00) / 588)];
      else outStr += text[i];
    }
    return outStr;
  }

  /** 친 글자가 초성만으로 이루어져 있을 때만 초성으로 견줍니다. */
  function isChosungOnly(q) {
    for (var i = 0; i < q.length; i++) {
      if (q[i] === ' ') continue;
      if (CHO.indexOf(q[i]) === -1) return false;
    }
    return q.replace(/\s/g, '').length > 0;
  }

  /* ---------- 점수 ---------- */

  function scoreOne(q, title, body, cat) {
    var t = title.toLowerCase();
    var b = (body || '').toLowerCase();

    if (t === q) return 1000;
    if (t.indexOf(q) === 0) return 800;
    if (t.indexOf(q) > -1) return 600;

    // 초성으로 친 경우 — 제목에만 견줍니다 (본문까지 보면 아무거나 걸립니다)
    if (isChosungOnly(q)) {
      var ct = chosung(title);
      if (ct.indexOf(q) === 0) return 500;
      if (ct.indexOf(q) > -1) return 380;
      return 0;
    }

    if (b.indexOf(q) > -1) return cat === '질문' ? 300 : 240;

    // 띄어 친 낱말이 모두 어딘가에 있으면 (예: "음향 견적")
    var words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      var all = t + ' ' + b;
      for (var i = 0; i < words.length; i++) {
        if (all.indexOf(words[i]) === -1) return 0;
      }
      return 200;
    }
    return 0;
  }

  function searchIndex(q) {
    var hits = [];
    for (var i = 0; i < INDEX.length; i++) {
      var r = INDEX[i];
      var s = scoreOne(q, r.title, (r.desc || '') + ' ' + (r.kw || ''), r.cat);
      if (!s) continue;
      // 지원 항목과 페이지를 질문보다 위에 둡니다 — 대개 기능을 찾아 오십니다.
      if (r.cat === '자주 찾는 것') s += 90;
      else if (r.cat === '지원 항목' || r.cat === '게시판') s += 60;
      else if (r.cat === '페이지' || r.cat === '갈래') s += 40;
      hits.push({ row: r, score: s });
    }
    return hits.sort(function (a, b) {
      return b.score - a.score || a.row.title.length - b.row.title.length;
    }).slice(0, 12).map(function (x) { return x.row; });
  }

  /* ---------- 게시판에 올라온 글 ---------- */

  var db = window.CAPSDB;
  var postCache = null;
  var postLoading = null;

  function loadPosts() {
    if (postCache) return Promise.resolve(postCache);
    if (postLoading) return postLoading;
    if (!db) return Promise.resolve([]);

    var jobs = [
      ['listings.html', '부동산 매물', db.publishedListings],
      ['market.html', '중고 장터', db.publishedMarketItems],
      ['guesthouse.html', '게스트하우스', db.publishedGuestHouses],
      ['tickets.html', '집회', db.publishedEvents],
      ['jobs.html', '교역자 구인', db.publishedJobPosts],
    ].map(function (j) {
      if (typeof j[2] !== 'function') return Promise.resolve([]);
      return j[2].call(db).then(function (list) {
        return (list || []).map(function (r) {
          return {
            url: j[0] + '#view/' + r.id,
            title: r.title || r.name || '(제목 없음)',
            desc: [r.churchName, r.region, r.addressRough].filter(Boolean).join(' · '),
            cat: j[1],
            kw: [r.desc, r.department, r.denomination, r.place, r.host].filter(Boolean).join(' '),
            post: true,
          };
        });
      }).catch(function () { return []; });
    });

    postLoading = Promise.all(jobs).then(function (all) {
      postCache = all.reduce(function (a, b) { return a.concat(b); }, []);
      postLoading = null;
      return postCache;
    });
    return postLoading;
  }

  function searchPosts(q, list) {
    var hits = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var s = scoreOne(q, r.title, (r.desc || '') + ' ' + (r.kw || ''), r.cat);
      if (s) hits.push({ row: r, score: s });
    }
    return hits.sort(function (a, b) { return b.score - a.score; })
      .slice(0, 8).map(function (x) { return x.row; });
  }

  /* ---------- 그리기 ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** 찾으신 글자에 밑줄을 칩니다 — 왜 걸렸는지 보이도록. */
  function mark(text, q) {
    var t = String(text || '');
    var i = t.toLowerCase().indexOf(q);
    if (i === -1 || !q) return esc(t);
    return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>'
      + esc(t.slice(i + q.length));
  }

  function trim(s, n) {
    var t = String(s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
  }

  function item(r, q, i) {
    return '<a class="ss-hit" href="' + esc(BASE + r.url) + '" data-i="' + i + '">' +
      '<span class="ss-hit-cat">' + esc(r.cat) + '</span>' +
      '<span class="ss-hit-body">' +
        '<strong>' + mark(r.title, q) + '</strong>' +
        (r.desc ? '<small>' + mark(trim(r.desc, 90), q) + '</small>' : '') +
      '</span>' +
      '</a>';
  }

  var lastQ = '';

  function render(q, rows, posts, loading) {
    if (!q) {
      out.innerHTML =
        '<p class="ss-hint">무엇을 찾으시나요? <b>음향</b>, <b>홈페이지 얼마</b>, ' +
        '<b>사택</b> 처럼 적어 보세요. 초성(<b>ㅎㅍㅇㅈ</b>)으로도 찾습니다.</p>' +
        '<div class="ss-quick">' +
        ['음향', '홈페이지', '비용이 얼마', '사택', '교역자 구인', '중고']
          .map(function (t) {
            return '<button type="button" class="ss-chip" data-q="' + esc(t) + '">' + esc(t) + '</button>';
          }).join('') +
        '</div>';
      return;
    }

    var html = '';
    if (rows.length) {
      html += '<p class="ss-group">사이트 안에서</p>' +
        rows.map(function (r, i) { return item(r, q, i); }).join('');
    }
    if (posts && posts.length) {
      html += '<p class="ss-group">게시판에 올라온 글</p>' +
        posts.map(function (r, i) { return item(r, q, rows.length + i); }).join('');
    }
    if (loading) html += '<p class="ss-loading">게시판을 찾아보는 중입니다…</p>';

    if (!html) {
      html = '<div class="ss-none"><p><strong>&ldquo;' + esc(q) + '&rdquo;</strong> 으로는 찾지 못했습니다.</p>' +
        '<p class="ss-none-lead">다른 낱말로 적어 보시거나, 바로 여쭤봐 주세요. ' +
        '없는 기능이면 그렇다고 말씀드리겠습니다.</p>' +
        '<a class="btn btn-primary btn-sm" href="' + esc(BASE) + 'contact.html">문의하기</a></div>';
    }
    out.innerHTML = html;
  }

  function run() {
    var q = input.value.trim().toLowerCase();
    lastQ = q;
    if (!q) { render('', [], []); return; }

    var rows = searchIndex(q);
    // 두 글자부터 게시판까지 찾습니다 (한 글자면 거의 다 걸립니다).
    if (q.length < 2) { render(q, rows, []); return; }

    if (postCache) { render(q, rows, searchPosts(q, postCache)); return; }
    render(q, rows, [], true);
    loadPosts().then(function (list) {
      if (lastQ !== q) return;   // 그 사이 더 치셨으면 버립니다
      render(q, rows, searchPosts(q, list));
    });
  }

  /* ---------- 열고 닫기 ---------- */

  var lastFocus = null;

  function open(seed) {
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.classList.add('is-search-open');
    input.value = seed || '';
    run();
    window.setTimeout(function () { input.focus(); }, 20);
  }

  function close() {
    box.hidden = true;
    document.body.classList.remove('is-search-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(openers, function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); open(''); });
  });

  box.addEventListener('click', function (e) {
    if (e.target === box || e.target.closest('[data-search-close]')) { close(); return; }
    var chip = e.target.closest('[data-q]');
    if (chip) { input.value = chip.getAttribute('data-q'); run(); input.focus(); }
  });

  input.addEventListener('input', run);

  /* 위아래 화살표로 고르고 엔터로 엽니다 — 손이 자판을 떠나지 않도록. */
  var cursor = -1;

  function hits() { return out.querySelectorAll('.ss-hit'); }

  function move(step) {
    var list = hits();
    if (!list.length) return;
    if (cursor > -1 && list[cursor]) list[cursor].classList.remove('is-on');
    cursor = (cursor + step + list.length) % list.length;
    list[cursor].classList.add('is-on');
    list[cursor].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', function () { cursor = -1; });

  box.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); return; }
    if (e.key === 'Enter') {
      var list = hits();
      var go = cursor > -1 ? list[cursor] : list[0];
      if (go) { e.preventDefault(); window.location.href = go.getAttribute('href'); close(); }
    }
  });

  /* 어디서든 '/' 나 Ctrl+K 로 엽니다. 글을 쓰는 중일 때는 빼고요. */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); box.hidden ? open('') : close(); return;
    }
    if (e.key === '/' && !typing && box.hidden) { e.preventDefault(); open(''); }
  });

  /* 자주 묻는 질문으로 건너뛰면 그 답이 접혀 있습니다 — 펴 줍니다. */
  function openTargetDetails() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    var node = document.getElementById(id);
    var d = node && node.closest('details');
    if (d) { d.open = true; node.scrollIntoView({ block: 'center' }); }
  }
  window.addEventListener('hashchange', openTargetDetails);
  openTargetDetails();
}());
