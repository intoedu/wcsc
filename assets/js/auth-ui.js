/* 공개 페이지 로그인 / 회원가입 모달 + 헤더 로그인 상태 표시
 *
 * 페이지 내용은 로그인 없이 볼 수 있습니다.
 * 신청서 제출처럼 계정이 필요한 동작에서만 이 모달이 열립니다.
 *   window.CAPSAuthUI.require().then(function (user) { ... })
 */
window.CAPSAuthUI = (function () {
  'use strict';

  var db = window.CAPSDB;
  var modal = null;
  var pendingResolve = null;
  var lastFocus = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function base() {
    // services/ 하위 페이지에서도 링크가 맞도록 경로 접두사를 계산합니다.
    return /\/services\//.test(window.location.pathname) ? '../' : '';
  }

  /* ---------------- 모달 만들기 ---------------- */

  function build() {
    if (modal) return modal;

    var demoHint = db.mode === 'local'
      ? '<p class="auth-demo">지금은 <strong>데모 모드</strong>입니다 (Firebase 미연결). ' +
        '관리자 화면을 둘러보시려면 <code>admin@caps.or.kr</code> / <code>caps1234</code> 로 로그인하세요.</p>'
      : '';

    var el = document.createElement('div');
    el.className = 'auth-modal';
    el.id = 'authModal';
    el.hidden = true;
    el.innerHTML =
      '<div class="auth-backdrop" data-close></div>' +
      '<div class="auth-panel" role="dialog" aria-modal="true" aria-labelledby="authTabLogin">' +
        '<div class="auth-tabs">' +
          '<button type="button" class="auth-tab is-on" id="authTabLogin" data-tab="login">로그인</button>' +
          '<button type="button" class="auth-tab" id="authTabSignup" data-tab="signup">회원가입</button>' +
          '<button type="button" class="auth-close" data-close aria-label="닫기">×</button>' +
        '</div>' +
        '<div class="auth-body">' +
          demoHint +
          '<p class="auth-note" id="authReason" hidden></p>' +

          /* 로그인 */
          '<form class="auth-form" id="loginForm" data-pane="login">' +
            '<div class="field"><label for="loginEmail">이메일</label>' +
              '<input type="email" id="loginEmail" autocomplete="email" required placeholder="church@example.com"></div>' +
            '<div class="field"><label for="loginPw">비밀번호</label>' +
              '<div class="pw-row"><input type="password" id="loginPw" autocomplete="current-password" required>' +
              '<button type="button" class="pw-toggle" data-pw="loginPw">표시</button></div></div>' +
            '<p class="auth-err" id="loginErr" hidden></p>' +
            '<button type="submit" class="btn btn-primary btn-block btn-lg">로그인</button>' +
            '<button type="button" class="btn btn-outline btn-block auth-google" id="googleBtn">Google 계정으로 계속하기</button>' +
            '<button type="button" class="link-btn auth-reset" id="resetBtn">비밀번호를 잊으셨나요?</button>' +
          '</form>' +

          /* 회원가입 */
          '<form class="auth-form" id="signupForm" data-pane="signup" hidden>' +
            '<div class="field"><label for="suName">성함 <em class="req">필수</em></label>' +
              '<input type="text" id="suName" autocomplete="name" required placeholder="예: 김은혜"></div>' +
            '<div class="field"><label for="suChurch">교회명 <span class="opt">선택</span></label>' +
              '<input type="text" id="suChurch" autocomplete="organization" placeholder="예: 은혜로교회"></div>' +
            '<div class="field"><label for="suPhone">연락처 <span class="opt">선택</span></label>' +
              '<input type="tel" id="suPhone" autocomplete="tel" placeholder="010-0000-0000"></div>' +
            '<div class="field"><label for="suEmail">이메일 <em class="req">필수</em></label>' +
              '<input type="email" id="suEmail" autocomplete="email" required placeholder="church@example.com"></div>' +
            '<div class="field"><label for="suPw">비밀번호 <em class="req">필수</em></label>' +
              '<div class="pw-row"><input type="password" id="suPw" autocomplete="new-password" required minlength="6" placeholder="6자 이상">' +
              '<button type="button" class="pw-toggle" data-pw="suPw">표시</button></div></div>' +
            '<label class="check-line"><input type="checkbox" id="suStaff">' +
              '<span>CAPS 센터 직원입니다 <small>(최고관리자 승인 후 관리자 화면을 이용할 수 있습니다)</small></span></label>' +
            '<label class="check-line"><input type="checkbox" id="suAgree" required>' +
              '<span>개인정보 수집 · 이용에 동의합니다. <em class="req">필수</em></span></label>' +
            '<p class="auth-err" id="signupErr" hidden></p>' +
            '<button type="submit" class="btn btn-primary btn-block btn-lg">가입하고 계속하기</button>' +
          '</form>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);
    modal = el;
    wire();
    return el;
  }

  function wire() {
    var tabs = modal.querySelectorAll('.auth-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
    });

    modal.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) close();
      var pw = e.target.closest('[data-pw]');
      if (pw) {
        var input = modal.querySelector('#' + pw.dataset.pw);
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        pw.textContent = showing ? '표시' : '숨기기';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) close();
    });

    /* 로그인 */
    modal.querySelector('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = modal.querySelector('#loginErr');
      err.hidden = true;
      var btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = '로그인 중…';
      db.auth
        .signIn({
          email: modal.querySelector('#loginEmail').value,
          password: modal.querySelector('#loginPw').value,
        })
        .then(function () { succeed(); })
        .catch(function (ex) {
          err.textContent = ex.message;
          err.hidden = false;
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = '로그인';
        });
    });

    /* 구글 로그인 */
    modal.querySelector('#googleBtn').addEventListener('click', function () {
      var err = modal.querySelector('#loginErr');
      err.hidden = true;
      db.auth.signInGoogle()
        .then(function () { succeed(); })
        .catch(function (ex) {
          err.textContent = ex.message;
          err.hidden = false;
        });
    });

    /* 비밀번호 재설정 */
    modal.querySelector('#resetBtn').addEventListener('click', function () {
      var err = modal.querySelector('#loginErr');
      var email = modal.querySelector('#loginEmail').value.trim();
      if (!email) {
        err.textContent = '이메일을 먼저 입력해 주세요.';
        err.hidden = false;
        return;
      }
      db.auth.resetPassword(email)
        .then(function () {
          err.textContent = '';
          err.hidden = true;
          window.alert(email + ' 로 비밀번호 재설정 메일을 보냈습니다.');
        })
        .catch(function (ex) {
          err.textContent = ex.message;
          err.hidden = false;
        });
    });

    /* 회원가입 */
    modal.querySelector('#signupForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = modal.querySelector('#signupErr');
      err.hidden = true;
      if (!modal.querySelector('#suAgree').checked) {
        err.textContent = '개인정보 수집 · 이용에 동의해 주세요.';
        err.hidden = false;
        return;
      }
      var btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = '가입 중…';
      db.auth
        .signUp({
          email: modal.querySelector('#suEmail').value,
          password: modal.querySelector('#suPw').value,
          name: modal.querySelector('#suName').value,
          phone: db.formatPhone(modal.querySelector('#suPhone').value),
          church: modal.querySelector('#suChurch').value,
          staffRequest: modal.querySelector('#suStaff').checked,
        })
        .then(function (user) {
          if (user && user.role === 'staff' && !user.approved) {
            window.alert('가입이 완료되었습니다.\n\n직원 계정은 최고관리자 승인 후 관리자 화면을 이용할 수 있습니다.');
          }
          succeed();
        })
        .catch(function (ex) {
          err.textContent = ex.message;
          err.hidden = false;
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = '가입하고 계속하기';
        });
    });
  }

  function switchTab(name) {
    modal.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('is-on', t.dataset.tab === name);
    });
    modal.querySelectorAll('[data-pane]').forEach(function (p) {
      p.hidden = p.dataset.pane !== name;
    });
    var focusTarget = modal.querySelector('[data-pane="' + name + '"] input');
    if (focusTarget) focusTarget.focus();
  }

  function open(opts) {
    var o = opts || {};
    build();
    var reason = modal.querySelector('#authReason');
    if (o.reason) {
      reason.textContent = o.reason;
      reason.hidden = false;
    } else {
      reason.hidden = true;
    }
    switchTab(o.tab || 'login');
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (pendingResolve) {
      var reject = pendingResolve.reject;
      pendingResolve = null;
      reject(new Error('cancelled'));
    }
  }

  function succeed() {
    var user = db.auth.current();
    modal.hidden = true;
    document.body.style.overflow = '';
    if (pendingResolve) {
      var resolve = pendingResolve.resolve;
      pendingResolve = null;
      resolve(user);
    }
  }

  /** 로그인이 필요한 동작에서 사용. 이미 로그인 상태면 바로 통과합니다. */
  function require(reason) {
    var user = db.auth.current();
    if (user) return Promise.resolve(user);
    return new Promise(function (resolve, reject) {
      pendingResolve = { resolve: resolve, reject: reject };
      open({ reason: reason || '이어서 진행하려면 로그인이 필요합니다.' });
    });
  }

  /* ---------------- 헤더 상태 표시 ---------------- */

  function renderHeader(user) {
    var slot = document.getElementById('authSlot');
    if (!slot) return;

    if (!user) {
      slot.innerHTML = '<button type="button" class="nav-link auth-open">로그인</button>';
      slot.querySelector('.auth-open').addEventListener('click', function () { open({ tab: 'login' }); });
      return;
    }

    var adminLink = db.isStaff()
      ? '<a class="user-menu-item" href="' + base() + 'admin.html">관리자 화면</a>'
      : '';
    var pending = user.role === 'staff' && !user.approved
      ? '<span class="user-menu-note">직원 승인 대기 중</span>'
      : '';

    slot.innerHTML =
      '<div class="user-box">' +
        '<button type="button" class="user-btn" id="userBtn" aria-expanded="false">' +
          '<span class="user-avatar">' + esc((user.name || user.email || '?').slice(0, 1)) + '</span>' +
          '<span class="user-name">' + esc(user.name || user.email) + '</span>' +
        '</button>' +
        '<div class="user-menu" id="userMenu" hidden>' +
          '<p class="user-menu-head"><strong>' + esc(user.name || '이름 미등록') + '</strong>' +
            '<small>' + esc(user.email) + '</small>' +
            '<em>' + esc(db.roleLabel(user.role)) + '</em>' + pending +
          '</p>' +
          '<a class="user-menu-item" href="' + base() + 'status.html">내 신청 내역</a>' +
          adminLink +
          '<button type="button" class="user-menu-item is-danger" id="signOutBtn">로그아웃</button>' +
        '</div>' +
      '</div>';

    var btn = slot.querySelector('#userBtn');
    var menu = slot.querySelector('#userMenu');
    btn.addEventListener('click', function () {
      var open_ = menu.hidden;
      menu.hidden = !open_;
      btn.setAttribute('aria-expanded', String(open_));
    });
    document.addEventListener('click', function (e) {
      if (!slot.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    slot.querySelector('#signOutBtn').addEventListener('click', function () {
      db.auth.signOut().then(function () { window.location.reload(); });
    });
  }

  db.auth.onChange(renderHeader);

  return { open: open, close: close, require: require };
})();
