/* =========================================================
   CAPS 데이터 계층 (window.CAPSDB)
   =========================================================
   두 가지 백엔드를 같은 API로 감쌉니다.

   · firebase — assets/js/firebase-config.js 에 설정을 채운 경우
   · local    — 설정이 비어 있으면 브라우저 저장소 사용 (데모)

   화면 코드는 둘의 차이를 몰라도 됩니다. 모두 Promise 를 반환합니다.
   ========================================================= */

window.CAPSDB = (function () {
  'use strict';

  /* ---------------- 상수 ---------------- */

  var ROLES = {
    owner: { label: '최고관리자', rank: 4 },
    admin: { label: '관리자', rank: 3 },
    staff: { label: '직원', rank: 2 },
    client: { label: '고객', rank: 1 },
  };

  var PERMS = {
    requests: '신청·의뢰 관리',
    services: '지원 항목 수정',
    customers: '고객·구독 관리',
    settlement: '정산 관리',
    members: '직원 승인·권한 관리',
    settings: '센터 설정',
  };

  var COLLECTIONS = ['users', 'requests', 'customers', 'subscriptions', 'invoices', 'serviceContent', 'settings'];

  var REQUEST_STATUS = {
    received: '접수',
    consulting: '상담중',
    proposed: '견적 발송',
    progress: '진행중',
    hold: '보류',
    done: '완료',
    canceled: '취소',
  };

  var SUB_STATUS = { active: '이용중', paused: '일시정지', ended: '종료' };

  /* ---------------- 공통 유틸 ---------------- */

  function nowIso() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function makeCode() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return 'CAPS-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) +
      '-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  function isConfigured() {
    var c = window.FIREBASE_CONFIG || {};
    return !!(c.apiKey && c.projectId && c.authDomain);
  }

  /** 문서 목록에 정렬·필터 적용 (두 어댑터 공통) */
  function applyQuery(rows, opts) {
    var o = opts || {};
    var out = rows.slice();
    if (o.where) {
      Object.keys(o.where).forEach(function (key) {
        var want = o.where[key];
        out = out.filter(function (r) {
          if (Array.isArray(r[key])) return r[key].indexOf(want) > -1;
          return r[key] === want;
        });
      });
    }
    var field = o.orderBy || 'createdAt';
    var dir = o.desc === false ? 1 : -1;
    out.sort(function (a, b) {
      var x = a[field], y = b[field];
      if (x === y) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return x > y ? dir * 1 : dir * -1;
    });
    if (o.limit) out = out.slice(0, o.limit);
    return out;
  }

  /* =========================================================
     로컬 어댑터 (데모)
     ========================================================= */

  function LocalAdapter() {
    var PREFIX = 'caps.db.';
    var SESSION = 'caps.session';
    var listeners = {};

    function read(name) {
      try {
        var raw = window.localStorage.getItem(PREFIX + name);
        var v = raw ? JSON.parse(raw) : [];
        return Array.isArray(v) ? v : [];
      } catch (e) {
        return [];
      }
    }

    function write(name, rows) {
      try {
        window.localStorage.setItem(PREFIX + name, JSON.stringify(rows));
      } catch (e) {
        /* 용량 초과 등은 무시 */
      }
      (listeners[name] || []).forEach(function (cb) {
        try { cb(rows.slice()); } catch (err) { /* 개별 리스너 오류 무시 */ }
      });
    }

    /* 데모 초기 데이터 */
    function seed() {
      if (window.localStorage.getItem(PREFIX + '__seeded')) return;
      window.localStorage.setItem(PREFIX + '__seeded', '1');

      write('users', [
        {
          id: 'demo-owner', email: 'admin@caps.or.kr', password: 'caps1234',
          name: '관리자', phone: '02-0000-0000', role: 'owner', approved: true,
          perms: {}, createdAt: nowIso(),
        },
      ]);

      var d = function (days) {
        return new Date(Date.now() - days * 864e5).toISOString();
      };

      write('customers', [
        { id: 'cust-1', name: '은혜로교회', denomination: '예장합동', contactName: '김은혜', contactRole: '담임목사',
          phone: '010-2222-3333', email: 'grace@example.com', location: '경기 성남시 분당구', size: '150~500명',
          memo: '홈페이지 오픈 후 주보 정기 제작까지 이어짐.', createdAt: d(120) },
        { id: 'cust-2', name: '한빛교회', denomination: '기장', contactName: '박한빛', contactRole: '행정 간사',
          phone: '010-4444-5555', email: 'hanbit@example.com', location: '서울 은평구', size: '50~150명',
          memo: '', createdAt: d(64) },
        { id: 'cust-3', name: '샘물교회', denomination: '예장통합', contactName: '이샘물', contactRole: '장로',
          phone: '010-6666-7777', email: 'well@example.com', location: '부산 해운대구', size: '500~1,000명',
          memo: '음향 진단 후 장비 일부 교체 예정.', createdAt: d(28) },
      ]);

      write('subscriptions', [
        { id: 'sub-1', customerId: 'cust-1', serviceId: 'design', plan: '주보 정기 제작 (주 300부)',
          monthlyFee: 350000, status: 'active', startDate: d(100).slice(0, 10), billingDay: 5, memo: '', createdAt: d(100) },
        { id: 'sub-2', customerId: 'cust-1', serviceId: 'homepage', plan: '홈페이지 유지관리',
          monthlyFee: 80000, status: 'active', startDate: d(90).slice(0, 10), billingDay: 5, memo: '', createdAt: d(90) },
        { id: 'sub-3', customerId: 'cust-2', serviceId: 'intooffice', plan: '행정 대행 (회계 + 급여)',
          monthlyFee: 450000, status: 'active', startDate: d(60).slice(0, 10), billingDay: 10, memo: '', createdAt: d(60) },
        { id: 'sub-4', customerId: 'cust-3', serviceId: 'smartchurch', plan: '스마트처치 앱 (500~1,000명)',
          monthlyFee: 200000, status: 'paused', startDate: d(25).slice(0, 10), billingDay: 1,
          memo: '앱 오픈 준비 중 — 다음 달부터 청구', createdAt: d(25) },
      ]);

      write('requests', [
        { id: 'req-1', code: 'CAPS-260806-1204', createdAt: d(7), status: 'received',
          services: ['homepage', 'design'], church_name: '새순교회', denomination: '예장합동',
          contact_name: '조수아', contact_role: '전도사', phone: '010-5555-1234', email: 'saesoon@example.com',
          location: '대전 유성구', size: '50~150명', budget: '300~1,000만원', timeline: '3개월 이내',
          message: '홈페이지가 5년째 방치되어 있고, 주보도 담당 집사님이 혼자 만들고 계십니다.',
          prefer: '전화', marketing: false, extra: {}, assignee: '', memo: '', tasks: [] },
        { id: 'req-2', code: 'CAPS-260804-3391', createdAt: d(9), status: 'consulting',
          services: ['sound'], church_name: '주찬양교회', denomination: '',
          contact_name: '이예은', contact_role: '집사', phone: '010-4040-2270', email: '',
          location: '광주 서구', size: '150~500명', budget: '아직 정하지 못했습니다', timeline: '가능한 빨리',
          message: '뒷자리에서 설교가 잘 들리지 않고 찬양 때 하울링이 심합니다.',
          prefer: '문자/카카오톡', marketing: true,
          extra: { sound__sanctuary_size: '150~300석', sound__sound_issue: '뒷자리 전달력 부족, 하울링' },
          assignee: 'demo-owner', memo: '현장 방문 일정 조율 중 (다음 주 화요일 예정).',
          tasks: [{ text: '현장 방문 진단', done: true }, { text: '진단 보고서 작성', done: false }] },
        { id: 'req-3', code: 'CAPS-260728-8820', createdAt: d(16), status: 'progress',
          services: ['staffing'], church_name: '한빛교회', denomination: '기장',
          contact_name: '박한빛', contact_role: '행정 간사', phone: '010-4444-5555', email: 'hanbit@example.com',
          location: '서울 은평구', size: '50~150명', budget: '', timeline: '1개월 이내',
          message: '교육 전도사 청빙 공고를 부탁드립니다.', prefer: '이메일', marketing: false,
          extra: { staffing__position: '교육 전도사', staffing__employment_type: '파트타임' },
          assignee: 'demo-owner', memo: '공고 배포 완료. 지원자 3명 정리 중.',
          tasks: [{ text: '공고문 작성', done: true }, { text: '공고 배포', done: true }, { text: '지원자 비교표 전달', done: false }],
          customerId: 'cust-2' },
      ]);

      write('invoices', []);
      write('serviceContent', []);
      write('settings', []);
    }

    /* ---- 인증 (데모) ---- */
    var authListeners = [];
    var session = null;

    function loadSession() {
      try {
        var raw = window.localStorage.getItem(SESSION);
        if (!raw) return null;
        var id = JSON.parse(raw).id;
        var found = read('users').filter(function (u) { return u.id === id; });
        return found.length ? found[0] : null;
      } catch (e) {
        return null;
      }
    }

    function publicUser(u) {
      if (!u) return null;
      var copy = Object.assign({}, u);
      delete copy.password;
      return copy;
    }

    function emitAuth() {
      authListeners.forEach(function (cb) {
        try { cb(publicUser(session)); } catch (e) { /* 무시 */ }
      });
    }

    function setSession(u) {
      session = u;
      if (u) window.localStorage.setItem(SESSION, JSON.stringify({ id: u.id }));
      else window.localStorage.removeItem(SESSION);
      emitAuth();
    }

    seed();
    session = loadSession();

    return {
      mode: 'local',

      auth: {
        current: function () { return publicUser(session); },
        onChange: function (cb) {
          authListeners.push(cb);
          cb(publicUser(session));
          return function () {
            authListeners = authListeners.filter(function (f) { return f !== cb; });
          };
        },
        signUp: function (data) {
          var users = read('users');
          var email = String(data.email || '').trim().toLowerCase();
          if (users.some(function (u) { return u.email.toLowerCase() === email; })) {
            return Promise.reject(new Error('이미 가입된 이메일입니다.'));
          }
          if (String(data.password || '').length < 6) {
            return Promise.reject(new Error('비밀번호는 6자 이상으로 입력해 주세요.'));
          }
          var isStaff = !!data.staffRequest;
          var user = {
            id: uid('user'), email: email, password: data.password,
            name: (data.name || '').trim(), phone: (data.phone || '').trim(),
            church: (data.church || '').trim(),
            role: isStaff ? 'staff' : 'client',
            approved: !isStaff, // 고객은 즉시 이용, 직원은 승인 대기
            perms: {}, createdAt: nowIso(),
          };
          users.push(user);
          write('users', users);
          setSession(user);
          return Promise.resolve(publicUser(user));
        },
        signIn: function (data) {
          var email = String(data.email || '').trim().toLowerCase();
          var found = read('users').filter(function (u) {
            return u.email.toLowerCase() === email && u.password === data.password;
          });
          if (!found.length) return Promise.reject(new Error('이메일 또는 비밀번호가 맞지 않습니다.'));
          setSession(found[0]);
          return Promise.resolve(publicUser(found[0]));
        },
        signInGoogle: function () {
          return Promise.reject(new Error('구글 로그인·가입은 Firebase 연결 후 사용할 수 있습니다. 데모 모드에서는 이메일로 가입해 주세요.'));
        },
        signOut: function () { setSession(null); return Promise.resolve(); },
        resetPassword: function () {
          return Promise.reject(new Error('비밀번호 재설정은 Firebase 연결 후 사용할 수 있습니다.'));
        },
        updateProfile: function (patch) {
          if (!session) return Promise.reject(new Error('로그인이 필요합니다.'));
          var users = read('users').map(function (u) {
            return u.id === session.id ? Object.assign(u, patch) : u;
          });
          write('users', users);
          setSession(users.filter(function (u) { return u.id === session.id; })[0]);
          return Promise.resolve(publicUser(session));
        },
      },

      list: function (name, opts) {
        return Promise.resolve(applyQuery(read(name), opts));
      },
      get: function (name, id) {
        var found = read(name).filter(function (r) { return r.id === id; });
        return Promise.resolve(found.length ? found[0] : null);
      },
      add: function (name, data) {
        var rows = read(name);
        var row = Object.assign({ id: uid(name.slice(0, 3)), createdAt: nowIso() }, data);
        rows.push(row);
        write(name, rows);
        return Promise.resolve(row);
      },
      set: function (name, id, data) {
        var rows = read(name);
        var row = Object.assign({ id: id }, data);
        var i = rows.findIndex(function (r) { return r.id === id; });
        if (i > -1) rows[i] = row; else rows.push(row);
        write(name, rows);
        return Promise.resolve(row);
      },
      update: function (name, id, patch) {
        var rows = read(name).map(function (r) {
          return r.id === id ? Object.assign({}, r, patch) : r;
        });
        write(name, rows);
        return Promise.resolve();
      },
      remove: function (name, id) {
        write(name, read(name).filter(function (r) { return r.id !== id; }));
        return Promise.resolve();
      },
      watch: function (name, cb) {
        listeners[name] = listeners[name] || [];
        listeners[name].push(cb);
        cb(read(name));
        return function () {
          listeners[name] = listeners[name].filter(function (f) { return f !== cb; });
        };
      },
    };
  }

  /* =========================================================
     Firebase 어댑터
     ========================================================= */

  function FirebaseAdapter() {
    var V = '10.14.1';
    var base = 'https://www.gstatic.com/firebasejs/' + V + '/';
    var fb = {};
    var authListeners = [];
    var profile = null;
    var loadError = null;

    var LOAD_MSG =
      'Firebase 연결에 실패했습니다. 인터넷 연결을 확인해 주세요. ' +
      '(광고 차단 프로그램이나 사내 방화벽이 googleapis.com · gstatic.com 을 막고 있을 수도 있습니다.)';

    /** SDK 로드 실패 시 모든 데이터 호출을 같은 메시지로 막습니다. */
    function guard() {
      return ready.then(function () {
        if (loadError) throw new Error(LOAD_MSG);
      });
    }

    var ready = Promise.all([
      import(base + 'firebase-app.js'),
      import(base + 'firebase-auth.js'),
      import(base + 'firebase-firestore.js'),
    ]).then(function (mods) {
      var appMod = mods[0], authMod = mods[1], fsMod = mods[2];
      fb.app = appMod.initializeApp(window.FIREBASE_CONFIG);
      fb.auth = authMod.getAuth(fb.app);
      fb.fs = fsMod.getFirestore(fb.app);
      fb.authMod = authMod;
      fb.fsMod = fsMod;

      return new Promise(function (resolve) {
        var first = true;
        authMod.onAuthStateChanged(fb.auth, function (user) {
          var step = user ? ensureProfile(user) : Promise.resolve(null);
          step.then(function (p) {
            profile = p;
            authListeners.forEach(function (cb) {
              try { cb(p); } catch (e) { /* 무시 */ }
            });
            if (first) { first = false; resolve(); }
          });
        });
      });
    }).catch(function (err) {
      // SDK 로드 또는 초기화 실패 — 화면이 멈추지 않도록 여기서 흡수합니다.
      loadError = err;
      authListeners.forEach(function (cb) {
        try { cb(null); } catch (e) { /* 무시 */ }
      });
    });

    /** 로그인한 계정의 users 문서를 확인하고, 없으면 만듭니다. */
    function ensureProfile(user) {
      var fs = fb.fsMod;
      var ref = fs.doc(fb.fs, 'users', user.uid);
      return fs.getDoc(ref).then(function (snap) {
        if (snap.exists()) {
          return Object.assign({ id: user.uid, email: user.email }, snap.data());
        }
        var pending = window.sessionStorage.getItem('caps.signup.intent');
        var intent = {};
        try { intent = pending ? JSON.parse(pending) : {}; } catch (e) { intent = {}; }
        window.sessionStorage.removeItem('caps.signup.intent');

        var isStaff = !!intent.staffRequest;
        var doc = {
          email: user.email || '',
          name: intent.name || user.displayName || '',
          phone: intent.phone || '',
          church: intent.church || '',
          role: isStaff ? 'staff' : 'client',
          approved: !isStaff,
          perms: {},
          createdAt: nowIso(),
        };
        return fs.setDoc(ref, doc).then(function () {
          return Object.assign({ id: user.uid }, doc);
        });
      });
    }

    function col(name) { return fb.fsMod.collection(fb.fs, name); }

    function snapRows(snap) {
      var rows = [];
      snap.forEach(function (d) { rows.push(Object.assign({ id: d.id }, d.data())); });
      return rows;
    }

    return {
      mode: 'firebase',
      ready: ready,
      loadError: function () { return loadError && LOAD_MSG; },

      auth: {
        current: function () { return profile; },
        onChange: function (cb) {
          authListeners.push(cb);
          ready.then(function () { cb(profile); });
          return function () {
            authListeners = authListeners.filter(function (f) { return f !== cb; });
          };
        },
        signUp: function (data) {
          return guard().then(function () {
            window.sessionStorage.setItem('caps.signup.intent', JSON.stringify({
              name: data.name, phone: data.phone, church: data.church, staffRequest: !!data.staffRequest,
            }));
            return fb.authMod
              .createUserWithEmailAndPassword(fb.auth, String(data.email).trim(), data.password)
              .then(function (cred) {
                if (data.name) {
                  return fb.authMod.updateProfile(cred.user, { displayName: data.name }).then(function () { return cred; });
                }
                return cred;
              })
              .then(function () { return ensureProfile(fb.auth.currentUser); })
              .catch(function (err) { throw new Error(authMessage(err)); });
          });
        },
        signIn: function (data) {
          return guard().then(function () {
            return fb.authMod
              .signInWithEmailAndPassword(fb.auth, String(data.email).trim(), data.password)
              .catch(function (err) { throw new Error(authMessage(err)); });
          });
        },
        /**
         * 구글 계정으로 로그인 또는 가입.
         * 처음 사용하는 계정이면 자동으로 가입 처리되며, intent 로 넘긴 값이
         * users 문서 생성에 사용됩니다 (직원 포털은 staffRequest: true).
         */
        signInGoogle: function (intent) {
          return guard().then(function () {
            if (intent) {
              window.sessionStorage.setItem('caps.signup.intent', JSON.stringify({
                name: intent.name || '', phone: intent.phone || '',
                church: intent.church || '', staffRequest: !!intent.staffRequest,
              }));
            }
            var provider = new fb.authMod.GoogleAuthProvider();
            return fb.authMod.signInWithPopup(fb.auth, provider)
              .catch(function (err) {
                window.sessionStorage.removeItem('caps.signup.intent');
                throw new Error(authMessage(err, 'google'));
              });
          });
        },
        signOut: function () {
          return guard().then(function () { return fb.authMod.signOut(fb.auth); });
        },
        resetPassword: function (email) {
          return guard().then(function () {
            return fb.authMod.sendPasswordResetEmail(fb.auth, String(email).trim())
              .catch(function (err) { throw new Error(authMessage(err)); });
          });
        },
        updateProfile: function (patch) {
          return guard().then(function () {
            if (!profile) throw new Error('로그인이 필요합니다.');
            return fb.fsMod.updateDoc(fb.fsMod.doc(fb.fs, 'users', profile.id), patch).then(function () {
              profile = Object.assign({}, profile, patch);
              return profile;
            });
          });
        },
      },

      list: function (name, opts) {
        return guard().then(function () {
          var o = opts || {};
          var fs = fb.fsMod;
          var ref = col(name);

          // where 조건은 서버로 넘깁니다. 보안 규칙이 조회 범위를 확인할 수 있어야
          // 하기 때문입니다 (전체 목록 조회는 권한이 없으면 거부됩니다).
          if (o.where) {
            var clauses = Object.keys(o.where).map(function (key) {
              return fs.where(key, '==', o.where[key]);
            });
            if (clauses.length) ref = fs.query.apply(null, [ref].concat(clauses));
          }

          return fs.getDocs(ref).then(function (snap) {
            // 정렬·개수 제한은 색인을 추가하지 않아도 되도록 여기서 처리합니다.
            var rest = Object.assign({}, o);
            delete rest.where;
            return applyQuery(snapRows(snap), rest);
          });
        });
      },
      get: function (name, id) {
        return guard().then(function () {
          return fb.fsMod.getDoc(fb.fsMod.doc(fb.fs, name, id)).then(function (d) {
            return d.exists() ? Object.assign({ id: d.id }, d.data()) : null;
          });
        });
      },
      add: function (name, data) {
        return guard().then(function () {
          var row = Object.assign({ createdAt: nowIso() }, data);
          return fb.fsMod.addDoc(col(name), row).then(function (ref) {
            return Object.assign({ id: ref.id }, row);
          });
        });
      },
      set: function (name, id, data) {
        return guard().then(function () {
          return fb.fsMod.setDoc(fb.fsMod.doc(fb.fs, name, id), data).then(function () {
            return Object.assign({ id: id }, data);
          });
        });
      },
      update: function (name, id, patch) {
        return guard().then(function () {
          return fb.fsMod.updateDoc(fb.fsMod.doc(fb.fs, name, id), patch);
        });
      },
      remove: function (name, id) {
        return guard().then(function () {
          return fb.fsMod.deleteDoc(fb.fsMod.doc(fb.fs, name, id));
        });
      },
      watch: function (name, cb) {
        var stop = null;
        var dead = false;
        ready.then(function () {
          if (dead) return;
          if (loadError) { cb([]); return; }
          stop = fb.fsMod.onSnapshot(col(name), function (snap) { cb(snapRows(snap)); }, function () { cb([]); });
        });
        return function () {
          dead = true;
          if (stop) stop();
        };
      },
    };

    function authMessage(err, kind) {
      if (kind === 'google' && err && err.code === 'auth/operation-not-allowed') {
        return 'Firebase [Authentication → 로그인 방법] 에서 Google 로그인이 사용 설정되지 않았습니다.';
      }
      var map = {
        'auth/invalid-email': '이메일 형식을 확인해 주세요.',
        'auth/email-already-in-use': '이미 가입된 이메일입니다.',
        'auth/weak-password': '비밀번호는 6자 이상으로 입력해 주세요.',
        'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않습니다.',
        'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않습니다.',
        'auth/user-not-found': '가입되지 않은 이메일입니다.',
        'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
        'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
        'auth/unauthorized-domain':
          '이 주소가 Firebase [Authentication → 설정 → 승인된 도메인] 에 등록되지 않았습니다.',
        'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
        'auth/api-key-not-valid': 'Firebase 설정값(apiKey)이 올바르지 않습니다. firebase-config.js 를 확인해 주세요.',
        'auth/invalid-api-key': 'Firebase 설정값(apiKey)이 올바르지 않습니다. firebase-config.js 를 확인해 주세요.',
        'auth/operation-not-allowed':
          'Firebase [Authentication] 에서 [이메일/비밀번호] 로그인이 사용 설정되지 않았습니다.',
        'auth/configuration-not-found':
          'Firebase [Authentication] 이 아직 설정되지 않았습니다. 콘솔에서 [시작하기] 를 눌러주세요.',
      };
      var code = (err && err.code) || '';
      if (map[code]) return map[code];
      // Firebase 가 코드에 설명을 덧붙이는 경우가 있어 부분 일치도 확인합니다.
      var keys = Object.keys(map);
      for (var i = 0; i < keys.length; i++) {
        if (code.indexOf(keys[i]) === 0) return map[keys[i]];
      }
      if (code.indexOf('api-key') > -1) return map['auth/api-key-not-valid'];
      return (err && err.message) || '처리 중 문제가 발생했습니다.';
    }
  }

  /* =========================================================
     공개 API
     ========================================================= */

  var adapter = isConfigured() ? FirebaseAdapter() : LocalAdapter();

  var api = {
    mode: adapter.mode,
    ready: adapter.ready || Promise.resolve(),
    /** Firebase SDK 로드에 실패한 경우 안내 문구, 정상이면 null */
    loadError: adapter.loadError || function () { return null; },
    ROLES: ROLES,
    PERMS: PERMS,
    REQUEST_STATUS: REQUEST_STATUS,
    SUB_STATUS: SUB_STATUS,
    COLLECTIONS: COLLECTIONS,

    auth: adapter.auth,
    list: adapter.list,
    get: adapter.get,
    add: adapter.add,
    set: adapter.set,
    update: adapter.update,
    remove: adapter.remove,
    watch: adapter.watch,

    makeCode: makeCode,

    /** 현재 계정이 특정 권한을 가졌는지 */
    can: function (perm) {
      var u = adapter.auth.current();
      if (!u || !u.approved) return false;
      if (u.role === 'owner') return true;
      if (u.role === 'client') return false;
      return !!(u.perms && u.perms[perm]);
    },

    /** 관리자 화면에 들어올 수 있는 계정인지 */
    isStaff: function () {
      var u = adapter.auth.current();
      if (!u || !u.approved) return false;
      return u.role === 'owner' || u.role === 'admin' || u.role === 'staff';
    },

    roleLabel: function (role) {
      return (ROLES[role] || {}).label || role || '-';
    },

    /**
     * 신청서 제출.
     * requests 문서 하나만 만듭니다. 고객(customers) 연결은 관리자 화면에서 처리합니다.
     * — 고객 목록을 읽으려면 다른 교회 정보까지 볼 수 있어야 하므로,
     *   신청자 권한으로는 조회하지 않습니다.
     */
    submitRequest: function (data) {
      var me = adapter.auth.current();
      var record = Object.assign({}, data, {
        code: makeCode(),
        createdAt: nowIso(),
        status: 'received',
        assignee: '',
        dueDate: '',
        memo: '',
        tasks: [],
        userId: me ? me.id : '',
      });
      return adapter.add('requests', record);
    },

    /** 접수번호로 조회. 고객은 본인 신청만, 직원은 전체를 조회합니다. */
    findByCode: function (code) {
      var needle = String(code || '').trim().toUpperCase();
      if (!needle) return Promise.resolve(null);

      var me = adapter.auth.current();
      var isStaffUser = !!(me && me.approved &&
        ['owner', 'admin', 'staff'].indexOf(me.role) > -1);
      var opts = isStaffUser ? {} : { where: { userId: me ? me.id : '__none__' } };

      return adapter.list('requests', opts).then(function (rows) {
        var hit = rows.filter(function (r) {
          return String(r.code || '').toUpperCase() === needle;
        });
        return hit.length ? hit[0] : null;
      });
    },

    /** 지원 항목 공개 콘텐츠 (관리자가 수정한 내용) */
    serviceContent: function () {
      return adapter.list('serviceContent').then(function (rows) {
        var map = {};
        rows.forEach(function (r) { map[r.id] = r; });
        return map;
      });
    },

    formatDate: function (iso, withTime) {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      var p = function (n) { return String(n).padStart(2, '0'); };
      var s = d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
      return withTime === false ? s : s + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    },

    money: function (n) {
      return (Number(n) || 0).toLocaleString('ko-KR');
    },

    /**
     * 마감일까지 남은 일수(디데이)를 계산합니다.
     * @param {string} dateStr 'YYYY-MM-DD'
     * @returns {{days:number, label:string, cls:string, late:boolean}|null}
     */
    dday: function (dateStr) {
      if (!dateStr) return null;
      var parts = String(dateStr).split('-');
      if (parts.length !== 3) return null;

      var due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (isNaN(due.getTime())) return null;

      var now = new Date();
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var days = Math.round((due - today) / 864e5);

      if (days < 0) return { days: days, label: 'D+' + -days, cls: 'dd-late', late: true };
      if (days === 0) return { days: 0, label: 'D-DAY', cls: 'dd-today', late: false };
      if (days <= 3) return { days: days, label: 'D-' + days, cls: 'dd-soon', late: false };
      return { days: days, label: 'D-' + days, cls: 'dd-ok', late: false };
    },

    /** 작업이 끝난 상태인지 (지연 계산에서 제외) */
    isClosed: function (status) {
      return status === 'done' || status === 'canceled';
    },

    /** 전화번호에 하이픈을 넣습니다. 형식을 알 수 없으면 원본을 그대로 돌려줍니다. */
    formatPhone: function (value) {
      var d = String(value || '').replace(/\D/g, '');
      if (d.length < 9 || d.length > 11) return String(value || '');
      if (d.startsWith('02')) {
        return d.length === 9
          ? d.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3')
          : d.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
      }
      return d.length === 10
        ? d.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
        : d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    },

    serviceName: function (id) {
      var list = window.CAPS_SERVICES || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name;
      return id;
    },
  };

  return api;
})();
