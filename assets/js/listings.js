/* =========================================================
   부동산 매물 게시판 (listings.html)

   화면은 주소창의 해시로 나뉩니다.
     #list        목록 (기본)
     #view/<id>   상세
     #new         등록  (#edit/<id> 로 열면 내가 올린 글 수정)
     #mine        내가 올린 매물

   센터는 게시판만 관리합니다. 여기서 중개나 상담은 하지 않습니다.
   ========================================================= */
(function () {
  'use strict';

  var board = document.getElementById('lsBoard');
  if (!board) return;

  var db = window.CAPSDB;

  var el = {
    board: board,
    detail: document.getElementById('lsDetail'),
    detailBody: document.getElementById('lsDetailBody'),
    mine: document.getElementById('lsMine'),
    mineBody: document.getElementById('lsMineBody'),
    newPane: document.getElementById('lsNew'),
    form: document.getElementById('lsForm'),
    gate: document.getElementById('lsGate'),
    gateLogin: document.getElementById('lsGateLogin'),
    list: document.getElementById('lsList'),
    empty: document.getElementById('lsEmpty'),
    count: document.getElementById('lsCount'),
    q: document.getElementById('lsQ'),
    kind: document.getElementById('lsKind'),
    region: document.getElementById('lsRegion'),
    err: document.getElementById('lsFormErr'),
    ok: document.getElementById('lsFormOk'),
    submit: document.getElementById('lsSubmit'),
    editId: document.getElementById('lsEditId'),
    proofKind: document.getElementById('lsFProofKind'),
    proofHint: document.getElementById('lsProofHint'),
    proofFile: document.getElementById('lsFProof'),
    fileInfo: document.getElementById('lsFileInfo'),
  };

  var rows = [];      // 공개 매물
  var mineRows = [];  // 내가 올린 매물
  var loaded = false;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, '<br>');
  }

  function digits(v) {
    return String(v == null ? '' : v).replace(/[^\d]/g, '');
  }

  /* =========================================================
     목록
     ========================================================= */

  function card(r) {
    var v = db.listingView(r);
    var bits = [r.addressRough || r.region, r.area, r.floor]
      .filter(Boolean).map(esc).join(' · ');

    return '<a class="ls-card" href="#view/' + esc(r.id) + '">' +
      '<span class="ls-card-top">' +
        '<span class="ls-tag ls-tag-' + esc(r.kind) + '">' + esc(v.kindLabel) + '</span>' +
        (v.useLabel ? '<span class="ls-tag is-soft">' + esc(v.useLabel) + '</span>' : '') +
        (v.days != null && v.days <= 7 ? '<span class="ls-tag is-warn">게시 ' + v.days + '일 남음</span>' : '') +
      '</span>' +
      '<h3>' + esc(r.title || '(제목 없음)') + '</h3>' +
      '<p class="ls-card-meta">' + bits + '</p>' +
      '<strong class="ls-card-price">' + esc(db.listingPrice(r)) + '</strong>' +
      (r.religiousUse ? '<p class="ls-card-use">종교시설 사용 · ' + esc(r.religiousUse) + '</p>' : '') +
      '<span class="ls-card-more">자세히 보기 →</span>' +
      '</a>';
  }

  function filtered() {
    var q = (el.q.value || '').trim().toLowerCase();
    var kind = el.kind.value;
    var region = el.region.value;

    return rows.filter(function (r) {
      if (kind && r.kind !== kind) return false;
      if (region && r.region !== region) return false;
      if (!q) return true;
      var hay = [r.title, r.region, r.addressRough, r.desc, r.area]
        .join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    });
  }

  function renderList() {
    if (!loaded) return;
    var list = filtered();
    el.count.textContent = !list.length ? ''
      : list.length === rows.length ? '전체 ' + rows.length + '건'
      : rows.length + '건 중 ' + list.length + '건';
    el.list.innerHTML = list.map(card).join('');
    el.list.hidden = !list.length;
    el.empty.hidden = !!list.length;
    el.empty.querySelector('h2').textContent = rows.length
      ? '조건에 맞는 매물이 없습니다'
      : '아직 게시된 매물이 없습니다';
  }

  function load() {
    return db.publishedListings().then(function (list) {
      rows = list;
      loaded = true;
      renderList();
      return list;
    });
  }

  /* =========================================================
     상세
     ========================================================= */

  function dl(label, value) {
    if (!value) return '';
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  function priceRows(r) {
    var m = db.money;
    var out = '';
    if (r.kind === 'sale') out += dl('매매가', m(r.salePrice) + '원');
    if (r.kind === 'rent_jeonse') out += dl('전세금', m(r.deposit) + '원');
    if (r.kind === 'rent_monthly') {
      out += dl('보증금', m(r.deposit) + '원');
      out += dl('월세', m(r.monthly) + '원');
    }
    if (r.kind === 'share') out += dl('대여료', r.monthly ? m(r.monthly) + '원' : '협의');
    if (r.maintenance) out += dl('관리비', m(r.maintenance) + '원 / 월');
    return out;
  }

  function renderDetail(id) {
    var hit = rows.concat(mineRows).filter(function (r) { return r.id === id; });
    if (!hit.length) {
      el.detailBody.innerHTML =
        '<div class="notice-card"><p>이 매물은 게시가 끝났거나 찾을 수 없습니다.</p></div>';
      return;
    }
    var r = hit[0];
    var v = db.listingView(r);
    var me = db.auth.current();
    var isMine = !!(me && r.userId === me.id);

    if (!v.live && !isMine && !db.isStaff()) {
      el.detailBody.innerHTML =
        '<div class="notice-card"><p>이 매물은 현재 게시 중이 아닙니다. (' + esc(v.label) + ')</p></div>';
      return;
    }

    el.detailBody.innerHTML =
      '<article class="ls-view">' +
        '<div class="ls-view-top">' +
          '<span class="ls-tag ls-tag-' + esc(r.kind) + '">' + esc(v.kindLabel) + '</span>' +
          (v.useLabel ? '<span class="ls-tag is-soft">' + esc(v.useLabel) + '</span>' : '') +
          '<span class="ls-tag is-check">' + esc(v.holderLabel) + ' 확인' + '</span>' +
        '</div>' +
        '<h1>' + esc(r.title || '(제목 없음)') + '</h1>' +
        '<p class="ls-view-price">' + esc(db.listingPrice(r)) + '</p>' +

        '<dl class="ls-dl">' +
          dl('위치', r.addressRough || r.region) +
          dl('면적', r.area) +
          dl('층', r.floor) +
          dl('주차', r.parking) +
          priceRows(r) +
          dl('입주 가능', r.moveIn) +
          dl('종교시설 사용', r.religiousUse) +
          dl('게시일', r.publishedAt ? db.formatDate(r.publishedAt, false) : '') +
          dl('게시 종료', r.expiresAt ? db.formatDate(r.expiresAt, false) : '') +
        '</dl>' +

        (r.desc ? '<div class="ls-desc"><h2>상세 설명</h2><p>' + nl2br(r.desc) + '</p></div>' : '') +

        '<div class="ls-contact">' +
          '<h2>연락처</h2>' +
          '<p class="ls-contact-who">' + esc(r.contactName || '등록자') + '</p>' +
          '<a class="btn btn-primary btn-lg" href="tel:' + esc(digits(r.contactPhone)) + '">' +
            esc(db.formatPhone(r.contactPhone)) + ' 전화하기</a>' +
          '<p class="ls-contact-note">' +
            '연락과 협상, 계약은 등록자와 직접 진행하십니다. ' +
            '센터는 이 매물을 중개하지 않고, 내용의 정확성과 계약 결과를 보증하지 않습니다.' +
          '</p>' +
        '</div>' +

        '<div class="ls-verified">' +
          '<h2>' + esc(v.holderLabel) + ' 확인을 마친 매물입니다</h2>' +
          '<p>' +
            '등록자가 <strong>' + esc(v.proofLabel || '권리 증빙 서류') + '</strong>를 제출하고, ' +
            '관리자가 확인한 뒤 게시했습니다. ' +
            '서류에는 이름 · 주소 · 금액 같은 민감한 정보가 있어 게시판에는 공개하지 않습니다.' +
          '</p>' +
          '<p class="ls-verified-warn">' +
            '그래도 계약 전에는 등기부등본을 직접 확인하시고, 용도 변경 가능 여부를 관할 지자체에서 확인해 주세요. ' +
            '<a href="services/realestate.html">부동산 지원</a> 으로 신청하시면 이 확인을 도와드립니다.' +
          '</p>' +
        '</div>' +

        (isMine
          ? '<div class="ls-owner-bar">' +
              '<span>내가 올린 매물입니다.</span>' +
              '<a class="btn btn-ghost btn-sm" href="#edit/' + esc(r.id) + '">내용 수정</a>' +
              '<a class="btn btn-ghost btn-sm" href="#mine">내 매물 목록</a>' +
            '</div>'
          : '') +
      '</article>';
  }

  /* =========================================================
     내가 올린 매물
     ========================================================= */

  function mineCard(r) {
    var v = db.listingView(r);
    var fee = r.fee || {};
    var lines = '';

    if (v.status === 'pending') {
      lines += '<p class="ls-mine-note is-wait">' +
        (fee.paid
          ? '서류 확인을 기다리고 있습니다. 확인되면 바로 게시됩니다.'
          : '등록비 ' + db.money(fee.amount || db.LISTING_FEE) + '원 입금이 확인되지 않았습니다. 입금 후 게시됩니다.') +
        '</p>';
    }
    if (v.status === 'rejected') {
      lines += '<p class="ls-mine-note is-no"><strong>반려 사유</strong> ' +
        esc(r.rejectNote || '(사유 없음)') +
        '<br>내용을 고쳐 다시 신청하시면 등록비를 다시 내지 않으셔도 됩니다.</p>';
    }
    if (v.status === 'hidden') {
      lines += '<p class="ls-mine-note is-no"><strong>게시가 중지되었습니다.</strong> ' +
        esc(r.rejectNote || '자세한 사유는 센터로 문의해 주세요.') + '</p>';
    }
    if (v.status === 'expired') {
      lines += '<p class="ls-mine-note is-wait">게시 기간이 끝났습니다. ' +
        '다시 올리시려면 내용을 확인하신 뒤 재신청해 주세요.</p>';
    }
    if (v.status === 'published') {
      lines += '<p class="ls-mine-note is-ok">게시 중입니다. ' +
        (v.days != null ? v.days + '일 남았습니다.' : '') + '</p>';
    }

    return '<div class="ls-mine-card">' +
      '<div class="ls-mine-head">' +
        '<span class="ls-state is-' + esc(v.cls) + '">' + esc(v.label) + '</span>' +
        '<strong>' + esc(r.title || '(제목 없음)') + '</strong>' +
        '<span class="ls-mine-price">' + esc(db.listingPrice(r)) + '</span>' +
      '</div>' +
      '<p class="ls-mine-meta">' +
        esc(v.kindLabel) + ' · ' + esc(r.addressRough || r.region || '') +
        ' · 등록 ' + esc(db.formatDate(r.createdAt, false)) +
        ' · 등록비 ' + (fee.paid ? '입금 확인' : '미확인') +
      '</p>' +
      lines +
      '<div class="ls-mine-act">' +
        (v.status === 'published'
          ? '<a class="btn btn-ghost btn-sm" href="#view/' + esc(r.id) + '">게시된 모습 보기</a>' : '') +
        '<a class="btn btn-ghost btn-sm" href="#edit/' + esc(r.id) + '">내용 수정</a>' +
        '<button type="button" class="btn btn-ghost btn-sm is-danger" data-del="' + esc(r.id) + '">삭제</button>' +
      '</div>' +
      '</div>';
  }

  function renderMine() {
    var me = db.auth.current();
    if (!me) {
      el.mineBody.innerHTML =
        '<div class="auth-gate"><p>내가 올린 매물을 보려면 로그인해 주세요.</p>' +
        '<button type="button" class="btn btn-primary" id="lsMineLogin">로그인 · 회원가입</button></div>';
      var b = document.getElementById('lsMineLogin');
      if (b) {
        b.addEventListener('click', function () {
          if (window.CAPSAuthUI) window.CAPSAuthUI.require().then(renderMine);
        });
      }
      return;
    }

    el.mineBody.innerHTML = '<p class="ls-loading">불러오는 중입니다…</p>';
    db.myListings().then(function (list) {
      mineRows = list;
      if (!list.length) {
        el.mineBody.innerHTML =
          '<div class="notice-card"><p>아직 올리신 매물이 없습니다.</p>' +
          '<p><a class="btn btn-primary" href="#new">매물 등록하기</a></p></div>';
        return;
      }
      el.mineBody.innerHTML = list.map(mineCard).join('');
    });
  }

  if (el.mineBody) {
    el.mineBody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del]');
      if (!btn) return;
      var id = btn.getAttribute('data-del');
      var hit = mineRows.filter(function (r) { return r.id === id; })[0];
      if (!hit) return;
      if (!window.confirm('이 매물을 삭제합니다. 올려 주신 서류도 함께 지워집니다.\n되돌릴 수 없습니다. 계속하시겠습니까?')) return;
      btn.disabled = true;
      db.deleteListing(hit).then(function () {
        renderMine();
        load();
      }).catch(function (err) {
        btn.disabled = false;
        window.alert(err.message || '삭제하지 못했습니다.');
      });
    });
  }

  /* =========================================================
     등록 · 수정 폼
     ========================================================= */

  var f = {
    kind: document.getElementById('lsFKind'),
    use: document.getElementById('lsFUse'),
    title: document.getElementById('lsFTitle'),
    region: document.getElementById('lsFRegion'),
    addr: document.getElementById('lsFAddr'),
    area: document.getElementById('lsFArea'),
    floor: document.getElementById('lsFFloor'),
    parking: document.getElementById('lsFParking'),
    moveIn: document.getElementById('lsFMoveIn'),
    religious: document.getElementById('lsFReligious'),
    deposit: document.getElementById('lsFDeposit'),
    monthly: document.getElementById('lsFMonthly'),
    sale: document.getElementById('lsFSale'),
    maint: document.getElementById('lsFMaint'),
    desc: document.getElementById('lsFDesc'),
    name: document.getElementById('lsFName'),
    phone: document.getElementById('lsFPhone'),
  };

  var vows = ['lsVow1', 'lsVow2', 'lsVow3', 'lsVow4'].map(function (id) {
    return document.getElementById(id);
  });

  if (f.phone) db.bindPhoneInput(f.phone);

  /* 금액칸 — 숫자만 받고 콤마를 넣어 줍니다. 힌트에 '○○만원'을 함께 보여 줍니다. */
  function bindMoney(input) {
    if (!input) return;
    var hint = document.getElementById(input.id + 'Hint');
    var base = hint ? hint.textContent : '';
    var show = function () {
      var n = Number(digits(input.value)) || 0;
      input.value = n ? n.toLocaleString('ko-KR') : '';
      if (!hint) return;
      if (!n) { hint.textContent = base; return; }
      var eok = Math.floor(n / 1e8);
      var man = Math.floor((n % 1e8) / 1e4);
      hint.textContent = (eok ? eok + '억 ' : '') + (man ? man + '만' : '') + '원' +
        (base ? ' · ' + base : '');
    };
    input.addEventListener('input', show);
    input.addEventListener('blur', show);
    input._show = show;
  }

  [f.deposit, f.monthly, f.sale, f.maint].forEach(bindMoney);

  /** 종류에 따라 금액칸을 보이고 숨깁니다. */
  function syncKind() {
    var kind = f.kind.value;
    Array.prototype.forEach.call(document.querySelectorAll('.ls-money'), function (box) {
      var list = (box.getAttribute('data-kinds') || '').split(/\s+/);
      var on = list.indexOf(kind) > -1;
      box.hidden = !on;
      var input = box.querySelector('input');
      if (input) input.disabled = !on;
    });
    var dep = document.querySelector('label[for="lsFDeposit"]');
    if (dep) dep.textContent = kind === 'rent_jeonse' ? '전세금' : '보증금';
    var mon = document.querySelector('label[for="lsFMonthly"]');
    if (mon) mon.textContent = kind === 'share' ? '대여료 (월)' : '월세';
  }

  if (f.kind) f.kind.addEventListener('change', syncKind);

  /** 입장(소유자·세입자·대리인)에 맞는 서류 목록만 보여 줍니다. */
  function holderValue() {
    var on = document.querySelector('input[name="lsHolder"]:checked');
    return on ? on.value : 'owner';
  }

  var HOLDER_HINT = {
    owner: '소유자는 등기부등본이 가장 확실합니다. 인터넷등기소에서 발급한 PDF 를 그대로 올리셔도 됩니다.',
    tenant: '지금 쓰고 있는 공간이라면 임대차계약서로 확인합니다. 계약 당사자 이름이 보이도록 올려 주세요.',
    agent: '위임장과 함께 위임인의 권리 서류(등기부등본 또는 임대차계약서)를 올려 주세요.',
  };

  function syncHolder() {
    var holder = holderValue();
    var keys = db.PROOF_FOR[holder] || Object.keys(db.LISTING_PROOFS);
    var current = el.proofKind.value;
    el.proofKind.innerHTML = keys.map(function (k) {
      return '<option value="' + k + '">' + esc(db.LISTING_PROOFS[k]) + '</option>';
    }).join('');
    if (keys.indexOf(current) > -1) el.proofKind.value = current;
    el.proofHint.textContent = HOLDER_HINT[holder] || '';
  }

  Array.prototype.forEach.call(document.querySelectorAll('input[name="lsHolder"]'), function (r) {
    r.addEventListener('change', syncHolder);
  });

  /* 파일 선택 — 형식과 용량을 바로 확인해 알려 줍니다. */
  if (el.proofFile) {
    el.proofFile.addEventListener('change', function () {
      var file = el.proofFile.files && el.proofFile.files[0];
      el.fileInfo.hidden = !file;
      if (!file) return;
      var bad = db.checkProof(file);
      el.fileInfo.className = 'ls-file' + (bad ? ' is-bad' : ' is-ok');
      el.fileInfo.textContent = bad
        ? bad
        : file.name + ' · ' + Math.max(1, Math.round(file.size / 1024)) + 'KB — 확인했습니다.';
    });
  }

  function say(box, msg) {
    if (!box) return;
    box.hidden = !msg;
    box.innerHTML = msg || '';
  }

  function fillForm(r) {
    el.editId.value = r ? r.id : '';
    var v = r || {};
    f.kind.value = v.kind || 'rent_monthly';
    f.use.value = v.use || 'other';
    f.title.value = v.title || '';
    f.region.value = v.region || '';
    f.addr.value = v.addressRough || '';
    f.area.value = v.area || '';
    f.floor.value = v.floor || '';
    f.parking.value = v.parking || '';
    f.moveIn.value = v.moveIn || '';
    f.religious.value = v.religiousUse || '';
    f.deposit.value = v.deposit ? Number(v.deposit).toLocaleString('ko-KR') : '';
    f.monthly.value = v.monthly ? Number(v.monthly).toLocaleString('ko-KR') : '';
    f.sale.value = v.salePrice ? Number(v.salePrice).toLocaleString('ko-KR') : '';
    f.maint.value = v.maintenance ? Number(v.maintenance).toLocaleString('ko-KR') : '';
    f.desc.value = v.desc || '';

    var me = db.auth.current() || {};
    f.name.value = v.contactName || me.name || '';
    f.phone.value = v.contactPhone || me.phone || '';

    var holder = v.holder || 'owner';
    Array.prototype.forEach.call(document.querySelectorAll('input[name="lsHolder"]'), function (radio) {
      radio.checked = radio.value === holder;
    });
    syncHolder();
    if (v.proof && v.proof.kind) el.proofKind.value = v.proof.kind;
    syncKind();
    [f.deposit, f.monthly, f.sale, f.maint].forEach(function (i) { if (i && i._show) i._show(); });

    // 수정할 때는 이미 확인된 서류가 있으므로 다시 올리지 않아도 됩니다.
    var keep = !!(r && r.proof && r.proof.path);
    el.proofFile.required = !keep;
    el.fileInfo.hidden = !keep;
    if (keep) {
      el.fileInfo.className = 'ls-file is-ok';
      el.fileInfo.textContent = '이미 올린 서류: ' + (r.proof.name || '파일') +
        ' — 바꾸실 때만 새로 선택하세요.';
    }
    el.proofFile.value = '';

    vows.forEach(function (c) { if (c) c.checked = !!r; });
    el.submit.textContent = r ? '수정 신청하기' : '등록 신청하기';
    say(el.err, '');
    say(el.ok, '');
  }

  function openForm(editId) {
    var me = db.auth.current();
    el.gate.hidden = !!me;
    el.form.hidden = !me;
    if (!me) return;

    if (!editId) { fillForm(null); return; }
    el.form.hidden = true;
    db.myListings().then(function (list) {
      mineRows = list;
      var hit = list.filter(function (r) { return r.id === editId; })[0];
      el.form.hidden = false;
      if (!hit) {
        fillForm(null);
        say(el.err, '수정할 매물을 찾지 못했습니다. 새로 등록하는 화면으로 열었습니다.');
        return;
      }
      fillForm(hit);
    });
  }

  if (el.gateLogin) {
    el.gateLogin.addEventListener('click', function () {
      if (!window.CAPSAuthUI) return;
      window.CAPSAuthUI.require().then(function (user) {
        if (user) openForm(el.editId.value || '');
      });
    });
  }

  function collect() {
    var kind = f.kind.value;
    var num = function (input) { return Number(digits(input.value)) || 0; };
    return {
      kind: kind,
      use: f.use.value,
      holder: holderValue(),
      title: f.title.value.trim(),
      region: f.region.value,
      addressRough: f.addr.value.trim(),
      area: f.area.value.trim(),
      floor: f.floor.value.trim(),
      parking: f.parking.value.trim(),
      moveIn: f.moveIn.value.trim(),
      religiousUse: f.religious.value.trim(),
      deposit: kind === 'rent_monthly' || kind === 'rent_jeonse' ? num(f.deposit) : 0,
      monthly: kind === 'rent_monthly' || kind === 'share' ? num(f.monthly) : 0,
      salePrice: kind === 'sale' ? num(f.sale) : 0,
      maintenance: kind === 'sale' ? 0 : num(f.maint),
      desc: f.desc.value.trim(),
      contactName: f.name.value.trim(),
      contactPhone: db.formatPhone(f.phone.value),
    };
  }

  /** 저장 전 확인 — 통과하면 빈 문자열 */
  function validate(data, hasProof) {
    if (!data.title) return '제목을 적어 주세요.';
    if (!data.region) return '지역을 선택해 주세요.';
    if (!data.addressRough) return '위치를 동 단위까지 적어 주세요.';
    if (!data.desc) return '상세 설명을 적어 주세요.';
    if (!data.contactName) return '연락받을 성함을 적어 주세요.';
    if (!db.isValidPhone(data.contactPhone)) return '연락처를 다시 확인해 주세요.';
    if (data.kind === 'sale' && !data.salePrice) return '매매가를 적어 주세요.';
    if (data.kind === 'rent_jeonse' && !data.deposit) return '전세금을 적어 주세요.';
    if (data.kind === 'rent_monthly' && !data.monthly) return '월세를 적어 주세요.';
    if (!hasProof) return '권리를 확인할 수 있는 서류를 첨부해 주세요.';
    if (vows.some(function (c) { return c && !c.checked; })) {
      return '아래 확인 항목 네 가지에 모두 동의해 주셔야 등록됩니다.';
    }
    return '';
  }

  if (el.form) {
    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      say(el.err, '');
      say(el.ok, '');

      var editId = el.editId.value;
      var existing = editId
        ? mineRows.filter(function (r) { return r.id === editId; })[0]
        : null;
      var file = el.proofFile.files && el.proofFile.files[0];
      var keptProof = existing && existing.proof && existing.proof.path ? existing.proof : null;

      var data = collect();
      var bad = validate(data, !!(file || keptProof));
      if (bad) { say(el.err, esc(bad)); return; }

      if (file) {
        var fileBad = db.checkProof(file);
        if (fileBad) { say(el.err, esc(fileBad)); return; }
      }

      el.submit.disabled = true;
      el.submit.textContent = file ? '서류를 올리는 중…' : '저장 중…';

      var step = file
        ? db.uploadProof(file, el.proofKind.value)
        : Promise.resolve(Object.assign({}, keptProof, { kind: el.proofKind.value }));

      step.then(function (proof) {
        if (editId && existing) {
          return db.saveListing(editId, Object.assign({}, data, { proof: proof }));
        }
        return db.submitListing(data, proof);
      }).then(function () {
        say(el.ok,
          '<strong>접수되었습니다.</strong> 아직 공개되지 않은 <em>승인 대기</em> 상태입니다.<br>' +
          '등록비 ' + db.money(db.LISTING_FEE) + '원 입금과 서류가 확인되면 관리자가 게시합니다. ' +
          '진행 상태는 <a href="#mine">내가 올린 매물</a> 에서 보실 수 있습니다.');
        el.submit.disabled = false;
        el.submit.textContent = '등록 신청하기';
        el.editId.value = '';
        window.setTimeout(function () { go('#mine'); }, 1400);
      }).catch(function (err) {
        say(el.err, esc(err.message || '등록하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
        el.submit.disabled = false;
        el.submit.textContent = editId ? '수정 신청하기' : '등록 신청하기';
      });
    });
  }

  /* =========================================================
     화면 전환 (해시 라우팅)
     ========================================================= */

  function show(pane) {
    el.board.hidden = pane !== 'list';
    el.detail.hidden = pane !== 'view';
    el.mine.hidden = pane !== 'mine';
    el.newPane.hidden = pane !== 'new';
    // 목록이 아닐 때는 큰 머리말을 접습니다 (같은 문구를 두 번 읽지 않도록).
    document.body.setAttribute('data-ls-pane', pane);
  }

  function go(hash) {
    if (window.location.hash === hash) route();
    else window.location.hash = hash;
  }

  function route() {
    var hash = (window.location.hash || '').replace(/^#/, '');
    var parts = hash.split('/');

    if (parts[0] === 'view' && parts[1]) {
      show('view');
      // 목록을 아직 못 읽었으면 먼저 읽고 그립니다.
      (loaded ? Promise.resolve() : load()).then(function () {
        var me = db.auth.current();
        var known = rows.concat(mineRows).some(function (r) { return r.id === parts[1]; });
        if (known || !me) { renderDetail(parts[1]); return; }
        db.myListings().then(function (list) {
          mineRows = list;
          renderDetail(parts[1]);
        });
      });
      window.scrollTo(0, 0);
      return;
    }
    if (parts[0] === 'new' || parts[0] === 'edit') {
      show('new');
      openForm(parts[0] === 'edit' ? parts[1] || '' : '');
      window.scrollTo(0, 0);
      return;
    }
    if (parts[0] === 'mine') {
      show('mine');
      renderMine();
      window.scrollTo(0, 0);
      return;
    }
    show('list');
    if (!loaded) load();
  }

  window.addEventListener('hashchange', route);

  [el.q, el.kind, el.region].forEach(function (input) {
    if (input) input.addEventListener('input', renderList);
    if (input) input.addEventListener('change', renderList);
  });

  /* 로그인 상태가 바뀌면 열려 있는 화면을 다시 그립니다. */
  db.auth.onChange(function () {
    var hash = (window.location.hash || '').replace(/^#/, '').split('/');
    if (hash[0] === 'mine') renderMine();
    if (hash[0] === 'new' || hash[0] === 'edit') openForm(hash[0] === 'edit' ? hash[1] || '' : '');
  });

  syncKind();
  syncHolder();
  load().catch(function () {
    el.list.innerHTML = '';
    el.empty.hidden = false;
  });
  route();
}());
