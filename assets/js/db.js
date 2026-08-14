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

  var COLLECTIONS = ['users', 'requests', 'customers', 'subscriptions', 'invoices',
    'serviceContent', 'settings', 'editConsents', 'listings'];

  /* 교회가 알려준 정보 — 고치려면 그 교회의 승인이 필요합니다.
     (firestore.rules 의 churchInfoFields() 와 같은 목록을 유지해야 합니다) */
  var CHURCH_FIELDS = {
    name: '교회명',
    denomination: '교단',
    location: '소재지',
    size: '출석 교인 수',
    contactName: '담당자 성함',
    contactRole: '담당자 직분',
    phone: '연락처',
    email: '이메일',
  };

  var CONSENT_STATUS = {
    pending: '승인 대기',
    approved: '수정 가능',
    rejected: '거절',
    used: '수정 완료',
    canceled: '요청 취소',
    expired: '기한 지남',
  };

  /** 승인 후 수정할 수 있는 기간 (일) */
  var CONSENT_DAYS = 7;

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

  /* 회원가입 · 내 정보 · 고객 관리에서 함께 쓰는 직분 목록.
     '기타'를 고르면 직접 입력칸이 열립니다. */
  var ROLE_OPTIONS = [
    '담임목사', '부목사', '전도사', '장로', '권사', '집사', '행정 간사', '성도', '기타',
  ];

  /* =========================================================
     부동산 매물 게시판 (listings)

     센터가 하는 일은 딱 하나입니다 — 게시판을 관리하는 것.
     중개·상담·계약은 하지 않으며, 글은 등록자가 직접 씁니다.
     대신 아무나 남의 건물을 올리지 못하도록,
     등록할 때 권리 증빙(임대차계약서 · 등기부등본 등)을 받습니다.
     ========================================================= */

  var LISTING_STATUS = {
    pending: '승인 대기',
    awaiting_payment: '입금 대기',
    published: '게시중',
    rejected: '반려',
    hidden: '게시 중지',
    expired: '기간 만료',
  };

  var LISTING_KIND = {
    rent_monthly: '월세',
    rent_jeonse: '전세',
    sale: '매매',
    share: '공간 공유 · 대여',
  };

  /** 등록자가 이 매물에 대해 어떤 사람인지 */
  var LISTING_HOLDER = {
    owner: '소유자 (임대인)',
    tenant: '임차인 (현재 세입자)',
    agent: '위임받은 대리인',
  };

  /** 권리 증빙으로 받을 수 있는 서류 */
  var LISTING_PROOFS = {
    deed: '등기부등본 (부동산 등기사항증명서)',
    lease: '임대차계약서',
    sale: '매매계약서',
    delegation: '위임장 (+ 위임인 신분 확인)',
    other: '그 외 권리를 확인할 수 있는 서류',
  };

  /** 증빙 서류별로 어떤 입장에서 쓰는 것인지 안내 */
  var PROOF_FOR = {
    owner: ['deed', 'sale', 'other'],
    tenant: ['lease', 'other'],
    agent: ['delegation', 'deed', 'lease', 'other'],
  };

  /** 주 용도 — '기타'를 고르면 직접 입력칸이 열립니다. */
  var LISTING_USES = {
    church: '교회',
    education: '교육관',
    prayer: '기도원',
    retreat: '수양관',
    land: '종교부지',
    other: '기타',
  };

  var LISTING_REGIONS = ['서울', '경기', '인천', '강원', '대전', '세종', '충남', '충북',
    '광주', '전남', '전북', '대구', '경북', '부산', '울산', '경남', '제주'];

  /** 제목 예시 — 보는 사람이 한 줄로 판단할 수 있게 쓰도록 돕습니다. */
  var LISTING_TITLE_EXAMPLES = [
    '뷰가 좋은 3층 예배실 — 한강 조망, 주차 12대',
    '지하철 5분 · 주차 8대, 2층 예배 공간 65평',
    '리모델링 완료된 교육관 — 소그룹실 3칸',
    '단독 건물 전체, 사택 포함 (즉시 입주)',
    '상가 1층 · 간판 설치 가능, 유동인구 많은 자리',
  ];

  /** 연락 가능 시간 예시 */
  var LISTING_HOURS_EXAMPLES = [
    '평일 09:00 – 18:00',
    '평일 · 토요일 10:00 – 20:00 (주일 제외)',
    '주일 오후 제외 언제든',
    '문자 남겨주시면 회신드립니다',
  ];

  /** 게시 등록비 (원) — 게시판에 올려 드리는 비용이며 중개 수수료가 아닙니다. */
  var LISTING_FEE = 60000;

  /** 기본 게시 기간 (일) */
  var LISTING_DAYS = 90;

  /** 증빙 파일 제한 — storage.rules 와 같은 값을 유지해야 합니다. */
  var PROOF_MAX_BYTES = 10 * 1024 * 1024;
  var PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  /* 매물 사진 — 게시판에 그대로 공개됩니다 (증빙 서류와 달리).
     올릴 때 브라우저에서 긴 변 1600px · JPEG 로 줄이므로 용량 걱정이 줄어듭니다. */
  var PHOTO_MAX_COUNT = 10;
  var PHOTO_MIN_HINT = 3;
  var PHOTO_MAX_BYTES = 15 * 1024 * 1024; // 줄이기 전 원본 기준
  var PHOTO_LONG_EDGE = 1600;
  var PHOTO_QUALITY = 0.82;

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
      // 판 번호를 올리면 데모 데이터가 새 구조로 다시 깔립니다.
      if (window.localStorage.getItem(PREFIX + '__seeded') === '2') return;
      window.localStorage.setItem(PREFIX + '__seeded', '2');

      write('users', [
        {
          id: 'demo-owner', email: 'admin@caps.or.kr', password: 'caps1234',
          name: '관리자', phone: '02-0000-0000', role: 'owner', approved: true,
          church: '우리교회지원센터', contactRole: '행정 간사', birthDate: '',
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

      /* 예시 글(lst-0)은 "이렇게 쓰시면 됩니다" 를 보여 주는 견본입니다.
         제목 · 연락 가능 시간 · 사진까지 모두 채워 두었습니다. */
      var sampleShot = function (n) {
        return { path: '', url: 'assets/img/sample/listing-' + n + '.svg',
          name: '예시 이미지 ' + n + '.svg', size: 0, sample: true };
      };

      write('listings', [
        { id: 'lst-0', userId: 'demo-owner', status: 'published', sample: true,
          kind: 'rent_monthly', holder: 'owner', use: 'church', useOther: '',
          title: '뷰가 좋은 3층 예배실 — 한강 조망, 주차 12대',
          region: '서울', addressRough: '서울 광진구 자양동',
          area: '82평 (271㎡)', floor: '3층 / 7층 (엘리베이터)', parking: '12대 (주일 인근 공영주차장 무료)',
          deposit: 50000000, monthly: 3800000, salePrice: 0, maintenance: 320000,
          moveIn: '즉시 입주 가능 (협의 시 6월 이후도 가능)',
          religiousUse: '건축물대장 종교집회장 — 용도 변경 없이 바로 사용 가능',
          desc: '한강이 보이는 3층 전체입니다. 남향이라 오전 예배 때 조명을 거의 켜지 않아도 됩니다.\n\n'
            + '· 본당 250석 규모, 강단과 음향 배선이 그대로 남아 있습니다 (스피커 4조 포함 양도 가능)\n'
            + '· 유아실 1칸, 소그룹실 2칸, 사무실 1칸이 따로 있습니다\n'
            + '· 엘리베이터가 있어 어르신들 접근이 편합니다\n'
            + '· 같은 층에 다른 세대가 없어 찬양 시간 민원 걱정이 적습니다\n'
            + '· 지하철 2호선 구의역에서 걸어서 7분입니다\n\n'
            + '이전 교회가 더 큰 곳으로 옮기면서 내놓았습니다. 보증금과 월세는 조건에 따라 협의 가능합니다.',
          contactName: '김요한 장로', contactPhone: '010-2345-6789',
          contactHours: '평일 · 토요일 10:00 – 20:00 (주일 제외)',
          photos: [sampleShot(1), sampleShot(2), sampleShot(3), sampleShot(4)],
          proof: { path: 'demo/deed-0.pdf', name: '등기부등본.pdf', size: 268000, kind: 'deed', uploadedAt: d(12) },
          fee: { amount: LISTING_FEE, paid: true, paidAt: d(11), noticeSentAt: d(12), invoiceId: '' },
          rejectNote: '', views: 213,
          reviewedBy: 'demo-owner', reviewedAt: d(11), publishedAt: d(11),
          expiresAt: new Date(Date.now() + 79 * 864e5).toISOString(),
          hiddenAt: '', createdAt: d(12), updatedAt: d(11) },

        { id: 'lst-1', userId: 'demo-owner', status: 'published',
          kind: 'rent_monthly', holder: 'owner', use: 'church', useOther: '',
          title: '2층 예배실 (지하철 5분, 주차 8대)', region: '경기', addressRough: '경기 부천시 원미구',
          area: '65평 (215㎡)', floor: '2층 / 5층', parking: '8대',
          deposit: 30000000, monthly: 2200000, salePrice: 0, maintenance: 250000,
          moveIn: '협의 가능', religiousUse: '건물주 동의 완료 (종교시설 사용 가능)',
          desc: '기존 교회가 사용하던 공간으로 강단·음향 배선이 남아 있습니다.\n엘리베이터 있고, 주말 주차가 넉넉합니다.',
          contactName: '관리자', contactPhone: '02-0000-0000',
          contactHours: '평일 09:00 – 18:00',
          photos: [],
          proof: { path: 'demo/deed-1.pdf', name: '등기부등본.pdf', size: 214000, kind: 'deed', uploadedAt: d(20) },
          fee: { amount: LISTING_FEE, paid: true, paidAt: d(19), noticeSentAt: d(20), invoiceId: '' },
          rejectNote: '', views: 41,
          reviewedBy: 'demo-owner', reviewedAt: d(19), publishedAt: d(19),
          expiresAt: new Date(Date.now() + 70 * 864e5).toISOString(),
          hiddenAt: '', createdAt: d(20), updatedAt: d(19) },

        { id: 'lst-2', userId: 'demo-owner', status: 'pending',
          kind: 'rent_jeonse', holder: 'tenant', use: 'education', useOther: '',
          title: '교육관으로 쓰던 지하 1층 (전세)', region: '서울', addressRough: '서울 강북구 수유동',
          area: '40평 (132㎡)', floor: '지하 1층 / 4층', parking: '2대',
          deposit: 180000000, monthly: 0, salePrice: 0, maintenance: 120000,
          moveIn: '2026년 10월 이후', religiousUse: '건물주 확인 필요',
          desc: '소그룹실 3칸으로 나뉘어 있습니다. 계약 기간이 남아 승계 조건 협의 가능합니다.',
          contactName: '관리자', contactPhone: '02-0000-0000',
          contactHours: '주일 오후 제외 언제든',
          photos: [],
          proof: { path: 'demo/lease-2.pdf', name: '임대차계약서.pdf', size: 331000, kind: 'lease', uploadedAt: d(1) },
          fee: { amount: LISTING_FEE, paid: false, paidAt: '', noticeSentAt: '', invoiceId: '' },
          rejectNote: '', views: 0,
          reviewedBy: '', reviewedAt: '', publishedAt: '', expiresAt: '',
          hiddenAt: '', createdAt: d(1), updatedAt: d(1) },
      ]);

      write('invoices', []);
      write('serviceContent', []);
      write('settings', []);
    }

    /* 증빙 파일 (데모) — 브라우저 저장소에 데이터 URL 로 담습니다.
       용량이 크면 저장하지 않고 파일 정보만 남깁니다. */
    var FILES = 'caps.files';

    function readFiles() {
      try {
        var raw = window.localStorage.getItem(FILES);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
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
            contactRole: (data.contactRole || '').trim(),
            birthDate: (data.birthDate || '').trim(),
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
        /** 로그인 방식 목록 — 데모는 이메일/비밀번호만 있습니다. */
        providers: function () { return session ? ['password'] : []; },
        changePassword: function (data) {
          if (!session) return Promise.reject(new Error('로그인이 필요합니다.'));
          var rows = read('users');
          var me = rows.filter(function (u) { return u.id === session.id; })[0];
          if (!me) return Promise.reject(new Error('계정을 찾을 수 없습니다.'));
          if (me.password !== data.current) {
            return Promise.reject(new Error('현재 비밀번호가 맞지 않습니다.'));
          }
          if (String(data.next || '').length < 6) {
            return Promise.reject(new Error('새 비밀번호는 6자 이상으로 입력해 주세요.'));
          }
          me.password = data.next;
          write('users', rows);
          return Promise.resolve();
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

      files: {
        upload: function (path, file) {
          return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function () { resolve(String(reader.result || '')); };
            reader.onerror = function () { resolve(''); };
            reader.readAsDataURL(file);
          }).then(function (url) {
            var map = readFiles();
            map[path] = { name: file.name, size: file.size, type: file.type, url: url };
            try {
              window.localStorage.setItem(FILES, JSON.stringify(map));
            } catch (e) {
              // 용량 초과 — 파일 내용은 버리고 정보만 남깁니다.
              map[path].url = '';
              map[path].tooBig = true;
              try { window.localStorage.setItem(FILES, JSON.stringify(map)); } catch (e2) { /* 무시 */ }
            }
            return path;
          });
        },
        url: function (path) {
          var map = readFiles();
          return Promise.resolve((map[path] && map[path].url) || '');
        },
        remove: function (path) {
          var map = readFiles();
          delete map[path];
          try { window.localStorage.setItem(FILES, JSON.stringify(map)); } catch (e) { /* 무시 */ }
          return Promise.resolve();
        },
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
          contactRole: intent.contactRole || '',
          birthDate: intent.birthDate || '',
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
              name: data.name, phone: data.phone, church: data.church,
              contactRole: data.contactRole, birthDate: data.birthDate,
              staffRequest: !!data.staffRequest,
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
                church: intent.church || '', contactRole: intent.contactRole || '',
                birthDate: intent.birthDate || '', staffRequest: !!intent.staffRequest,
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
        /**
         * 로그인 방식 목록 ('password' · 'google.com' 등).
         * 비밀번호 변경 화면을 보여줄지 판단하는 데 씁니다.
         */
        providers: function () {
          var u = fb.auth && fb.auth.currentUser;
          if (!u) return [];
          return (u.providerData || []).map(function (p) { return p.providerId; });
        },
        /** 비밀번호 변경 — 현재 비밀번호로 다시 인증한 뒤 바꿉니다. */
        changePassword: function (data) {
          return guard().then(function () {
            var user = fb.auth.currentUser;
            if (!user) throw new Error('로그인이 필요합니다.');
            var hasPw = (user.providerData || []).some(function (p) {
              return p.providerId === 'password';
            });
            if (!hasPw) {
              throw new Error(
                '이 계정은 구글 로그인으로 만들어져 센터에 비밀번호가 없습니다. ' +
                '비밀번호는 구글 계정 설정에서 관리해 주세요.'
              );
            }
            if (String(data.next || '').length < 6) {
              throw new Error('새 비밀번호는 6자 이상으로 입력해 주세요.');
            }
            var cred = fb.authMod.EmailAuthProvider.credential(user.email, data.current);
            return fb.authMod.reauthenticateWithCredential(user, cred)
              .catch(function (err) {
                var code = (err && err.code) || '';
                if (/wrong-password|invalid-credential|invalid-login/.test(code)) {
                  throw new Error('현재 비밀번호가 맞지 않습니다.');
                }
                throw new Error(authMessage(err));
              })
              .then(function () {
                return fb.authMod.updatePassword(user, data.next)
                  .catch(function (err) { throw new Error(authMessage(err)); });
              });
          });
        },
        updateProfile: function (patch) {
          return guard().then(function () {
            if (!profile) throw new Error('로그인이 필요합니다.');
            return fb.fsMod.updateDoc(fb.fsMod.doc(fb.fs, 'users', profile.id), patch).then(function () {
              profile = Object.assign({}, profile, patch);
              // 헤더·게이트 등 로그인 상태를 보는 화면도 함께 갱신합니다.
              authListeners.forEach(function (cb) {
                try { cb(profile); } catch (e) { /* 무시 */ }
              });
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

      /* 증빙 파일 — Firebase Storage.
         계약서에는 민감한 정보가 들어 있어 게시판에는 노출되지 않고,
         올린 본인과 승인된 직원만 열 수 있습니다 (storage.rules). */
      files: {
        upload: function (path, file) {
          return storageMod().then(function (mod) {
            return mod.uploadBytes(mod.ref(fb.st, path), file, { contentType: file.type })
              .then(function () { return path; })
              .catch(function (err) { throw new Error(storageMessage(err)); });
          });
        },
        url: function (path) {
          return storageMod().then(function (mod) {
            return mod.getDownloadURL(mod.ref(fb.st, path))
              .catch(function () { return ''; });
          });
        },
        remove: function (path) {
          return storageMod().then(function (mod) {
            return mod.deleteObject(mod.ref(fb.st, path)).catch(function () { /* 이미 없으면 무시 */ });
          });
        },
      },
    };

    /** Storage SDK 는 필요할 때만 불러옵니다 (게시판을 쓰지 않으면 로드하지 않음). */
    function storageMod() {
      return guard().then(function () {
        if (fb.stMod) return fb.stMod;
        return import(base + 'firebase-storage.js').then(function (mod) {
          fb.stMod = mod;
          fb.st = mod.getStorage(fb.app);
          return mod;
        }).catch(function () {
          throw new Error(
            '파일 저장소(Firebase Storage) 에 연결할 수 없습니다. ' +
            'Firebase 콘솔에서 Storage 를 시작했는지 확인해 주세요.');
        });
      });
    }

    function storageMessage(err) {
      var code = (err && err.code) || '';
      if (code === 'storage/unauthorized') {
        return '파일을 올릴 권한이 없습니다. 로그인 상태와 저장소 보안 규칙(storage.rules)을 확인해 주세요.';
      }
      if (code === 'storage/quota-exceeded') return '저장소 용량이 부족합니다.';
      if (code === 'storage/retry-limit-exceeded') return '업로드가 지연되고 있습니다. 잠시 후 다시 시도해 주세요.';
      if (code === 'storage/unknown' || code === 'storage/unauthenticated') {
        return '파일을 올리지 못했습니다. 다시 로그인한 뒤 시도해 주세요.';
      }
      return (err && err.message) || '파일을 올리지 못했습니다.';
    }

    /** 콘솔에서 바로 켤 수 있도록 링크를 붙입니다. */
    function providerHint(what) {
      var pid = (window.FIREBASE_CONFIG || {}).projectId;
      var url = pid
        ? 'https://console.firebase.google.com/project/' + pid + '/authentication/providers'
        : 'https://console.firebase.google.com';
      return 'Firebase 콘솔에서 ' + what + ' 로그인을 켜야 합니다. ' +
        '<a href="' + url + '" target="_blank" rel="noopener">Authentication → 로그인 방법 열기 ↗</a>';
    }

    function authMessage(err, kind) {
      var code = (err && err.code) || '';
      if (code === 'auth/operation-not-allowed') {
        return providerHint(kind === 'google' ? '[Google]' : '[이메일/비밀번호]');
      }
      if (code === 'auth/configuration-not-found') {
        return providerHint('[이메일/비밀번호]');
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

      };
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
    CHURCH_FIELDS: CHURCH_FIELDS,
    CONSENT_STATUS: CONSENT_STATUS,
    CONSENT_DAYS: CONSENT_DAYS,

    LISTING_STATUS: LISTING_STATUS,
    LISTING_KIND: LISTING_KIND,
    LISTING_HOLDER: LISTING_HOLDER,
    LISTING_PROOFS: LISTING_PROOFS,
    PROOF_FOR: PROOF_FOR,
    LISTING_USES: LISTING_USES,
    LISTING_REGIONS: LISTING_REGIONS,
    LISTING_TITLE_EXAMPLES: LISTING_TITLE_EXAMPLES,
    LISTING_HOURS_EXAMPLES: LISTING_HOURS_EXAMPLES,
    LISTING_FEE: LISTING_FEE,
    LISTING_DAYS: LISTING_DAYS,
    PROOF_MAX_BYTES: PROOF_MAX_BYTES,
    PROOF_TYPES: PROOF_TYPES,
    PHOTO_MAX_COUNT: PHOTO_MAX_COUNT,
    PHOTO_MIN_HINT: PHOTO_MIN_HINT,
    PHOTO_MAX_BYTES: PHOTO_MAX_BYTES,

    files: adapter.files,

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

    /**
     * 필수 프로필(교회명 · 직분 · 연락처)이 비어 있는지.
     * 구글로 가입한 계정과 예전에 만들어진 계정을 걸러내기 위한 것입니다.
     */
    needsProfile: function (user) {
      var u = user || adapter.auth.current();
      if (!u) return false;
      return !String(u.church || '').trim()
        || !String(u.contactRole || '').trim()
        || !String(u.phone || '').trim();
    },

    /* =====================================================
       고객 정보 수정 동의 (editConsents)

       흐름
         1. 직원이 고객에게 [정보 수정 요청] 을 보냅니다  → pending
         2. 교회 계정이 홈페이지에서 승인 또는 거절합니다  → approved / rejected
         3. 승인된 동안(기본 7일) 직원이 교회 정보를 수정합니다
         4. 저장을 마치면 다시 잠깁니다                    → used

       보안 규칙이 customers 의 교회 정보 항목을 이 승인과 묶어 두었으므로,
       화면에서 잠금을 우회해도 서버에서 거부됩니다.
       ===================================================== */

    /** 승인이 살아 있는지 (승인 상태이고 기한이 남았는지) */
    consentLive: function (doc) {
      if (!doc || doc.status !== 'approved') return false;
      if (!doc.expiresAt) return true;
      return new Date(doc.expiresAt).getTime() > Date.now();
    },

    /** 화면 표시용 상태 정보 */
    consentView: function (doc) {
      if (!doc) return { status: 'none', label: '요청 없음', cls: 'none', live: false };
      var live = api.consentLive(doc);
      var status = doc.status;
      if (status === 'approved' && !live) status = 'expired';
      return {
        status: status,
        label: CONSENT_STATUS[status] || status,
        cls: status,
        live: live,
        fields: doc.fields || [],
        reason: doc.reason || '',
        expiresAt: doc.expiresAt || '',
      };
    },

    /** 항목 키 목록을 사람이 읽는 문구로 */
    fieldLabels: function (keys) {
      var list = (keys || []).map(function (k) { return CHURCH_FIELDS[k] || k; });
      return list.length ? list.join(' · ') : '교회 정보 전체';
    },

    /**
     * 고객 교회 계정을 찾습니다.
     * customers.userId 를 먼저 보고, 없으면 연결된 신청서에서 찾습니다.
     */
    accountOf: function (customer, requests) {
      if (!customer) return '';
      if (customer.userId) return customer.userId;
      var linked = (requests || []).filter(function (r) {
        return r.customerId === customer.id && r.userId;
      });
      return linked.length ? linked[0].userId : '';
    },

    /** 직원 → 고객에게 정보 수정 요청 보내기 */
    requestChurchEdit: function (customer, opts) {
      var o = opts || {};
      var me = adapter.auth.current();
      var userId = String(o.userId || '').trim();
      if (!userId) {
        return Promise.reject(new Error(
          '이 교회에 연결된 계정이 없습니다. 먼저 신청 건을 고객으로 연결하거나, 교회 계정을 확인해 주세요.'));
      }
      return adapter.set('editConsents', customer.id, {
        customerId: customer.id,
        customerName: customer.name || '',
        userId: userId,
        fields: o.fields || [],
        reason: String(o.reason || '').trim(),
        status: 'pending',
        requestedBy: me ? me.id : '',
        requestedByName: me ? (me.name || me.email) : '',
        requestedAt: nowIso(),
        respondedAt: '',
        rejectNote: '',
        expiresAt: '',
        createdAt: nowIso(),
      });
    },

    /** 직원 → 요청 취소 */
    cancelChurchEdit: function (customerId) {
      return adapter.update('editConsents', customerId, {
        status: 'canceled', respondedAt: nowIso(),
      });
    },

    /** 직원 → 수정을 마쳐 다시 잠금 */
    finishChurchEdit: function (customerId) {
      return adapter.update('editConsents', customerId, {
        status: 'used', usedAt: nowIso(),
      });
    },

    /** 기한이 지난 승인을 정리 */
    expireChurchEdit: function (customerId) {
      return adapter.update('editConsents', customerId, { status: 'expired' });
    },

    /** 고객 → 승인 또는 거절 */
    respondChurchEdit: function (customerId, approve, note) {
      var patch = {
        status: approve ? 'approved' : 'rejected',
        respondedAt: nowIso(),
        rejectNote: approve ? '' : String(note || '').trim(),
        expiresAt: approve
          ? new Date(Date.now() + CONSENT_DAYS * 864e5).toISOString()
          : '',
      };
      return adapter.update('editConsents', customerId, patch);
    },

    /** 고객 → 나에게 온 요청 목록 (보안 규칙이 조회 범위를 확인합니다) */
    myEditConsents: function () {
      var me = adapter.auth.current();
      if (!me) return Promise.resolve([]);
      return adapter.list('editConsents', { where: { userId: me.id } });
    },

    /* =====================================================
       부동산 매물 게시판 (listings)

       흐름
         1. 등록자가 매물 정보 · 사진 · 권리 증빙 서류를 올립니다   → pending
         2. 관리자가 서류를 확인하고 승인하면서
            입금 계좌를 카카오톡으로 보냅니다                       → awaiting_payment
         3. 입금이 확인되면 게시됩니다                              → published
         4. 서류가 맞지 않으면 사유와 함께 반려                     → rejected
         5. 필요하면 관리자가 내립니다                              → hidden
         6. 게시 기간(기본 90일)이 지나면                           → expired

       계좌를 화면에 붙여 두지 않고 승인 시점에 카카오톡으로 보내는 이유는,
       확인되지 않은 글에 입금이 먼저 들어오는 일을 막기 위한 것입니다.

       센터는 게시판만 관리합니다. 중개·상담·계약은 하지 않으며,
       연락은 등록자와 보는 사람이 직접 합니다. 그래서 글에는
       연락처와 함께 **연락 가능 시간**을 받아 함께 보여 줍니다.

       사진은 게시판에 공개되지만, 증빙 서류는 절대 보이지 않습니다.
       (Storage 규칙으로 올린 본인과 승인된 직원만 열 수 있습니다.)
       ===================================================== */

    /** 게시 중이고 기간이 남아 있는지 */
    listingLive: function (row) {
      if (!row || row.status !== 'published') return false;
      if (!row.expiresAt) return true;
      return new Date(row.expiresAt).getTime() > Date.now();
    },

    /** 화면 표시용 상태 (기간이 지난 게시글은 '기간 만료'로 보여 줍니다) */
    listingView: function (row) {
      if (!row) return { status: 'none', label: '-', cls: 'none', live: false, days: null };
      var status = row.status;
      if (status === 'published' && !api.listingLive(row)) status = 'expired';
      var days = null;
      if (status === 'published' && row.expiresAt) {
        days = Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 864e5);
      }
      var use = row.use === 'other'
        ? (String(row.useOther || '').trim() || '기타')
        : (LISTING_USES[row.use] || row.use || '');
      return {
        status: status,
        label: LISTING_STATUS[status] || status,
        cls: status,
        live: status === 'published',
        days: days,
        kindLabel: LISTING_KIND[row.kind] || row.kind || '-',
        holderLabel: LISTING_HOLDER[row.holder] || row.holder || '-',
        useLabel: use,
        proofLabel: row.proof ? (LISTING_PROOFS[row.proof.kind] || '권리 증빙 서류') : '',
        photos: Array.isArray(row.photos) ? row.photos : [],
      };
    },

    /** 금액 요약 — 목록에 한 줄로 보여 줄 문구 */
    listingPrice: function (row) {
      if (!row) return '-';
      var m = api.money;
      if (row.kind === 'sale') return '매매 ' + m(row.salePrice) + '원';
      if (row.kind === 'rent_jeonse') return '전세 ' + m(row.deposit) + '원';
      if (row.kind === 'share') {
        return row.monthly ? '대여 ' + m(row.monthly) + '원' : '금액 협의';
      }
      return '보증금 ' + m(row.deposit) + ' / 월 ' + m(row.monthly) + '원';
    },

    /** 증빙 서류 파일 검사 (형식 · 용량) — 통과하면 빈 문자열 */
    checkProof: function (file) {
      if (!file) return '권리를 확인할 수 있는 서류를 첨부해 주세요.';
      if (file.size > PROOF_MAX_BYTES) {
        return '파일 용량은 10MB 이하로 올려 주세요. (현재 ' +
          Math.round(file.size / 1024 / 102.4) / 10 + 'MB)';
      }
      var t = String(file.type || '').toLowerCase();
      if (PROOF_TYPES.indexOf(t) === -1 && t.indexOf('image/') !== 0) {
        return 'PDF 또는 사진(JPG · PNG) 파일만 올릴 수 있습니다.';
      }
      return '';
    },

    /** 증빙 서류 업로드 → 문서에 담을 파일 정보 */
    uploadProof: function (file, kind) {
      var me = adapter.auth.current();
      if (!me) return Promise.reject(new Error('로그인이 필요합니다.'));
      var bad = api.checkProof(file);
      if (bad) return Promise.reject(new Error(bad));

      var safe = String(file.name || 'proof')
        .replace(/[^\w.\-가-힣]+/g, '_')
        .slice(-80);
      var path = 'listing-proofs/' + me.id + '/' +
        Date.now().toString(36) + '-' + safe;

      return adapter.files.upload(path, file).then(function () {
        return {
          path: path,
          name: file.name || safe,
          size: file.size || 0,
          type: file.type || '',
          kind: kind || 'other',
          uploadedAt: nowIso(),
        };
      });
    },

    /** 증빙 서류 열기용 주소 (본인 · 직원만 열립니다) */
    proofUrl: function (path) {
      if (!path) return Promise.resolve('');
      return adapter.files.url(path);
    },

    /* -------- 매물 사진 --------
       증빙 서류와 달리 사진은 게시판에 그대로 공개됩니다.
       올릴 때 브라우저에서 긴 변 1600px · JPEG 로 줄여 용량을 낮춥니다. */

    /** 사진 파일 검사 — 통과하면 빈 문자열 */
    checkPhoto: function (file) {
      if (!file) return '사진 파일을 선택해 주세요.';
      if (String(file.type || '').toLowerCase().indexOf('image/') !== 0) {
        return '사진(JPG · PNG · HEIC)만 올릴 수 있습니다.';
      }
      if (file.size > PHOTO_MAX_BYTES) {
        return '사진 한 장은 15MB 이하로 올려 주세요.';
      }
      return '';
    },

    /**
     * 사진을 긴 변 1600px JPEG 로 줄입니다.
     * 브라우저가 못 하는 경우(예: HEIC 디코딩 실패)에는 원본을 그대로 씁니다.
     */
    shrinkPhoto: function (file) {
      return new Promise(function (resolve) {
        if (!window.URL || !window.URL.createObjectURL) { resolve(file); return; }
        var url = window.URL.createObjectURL(file);
        var img = new window.Image();
        var done = function (out) {
          window.URL.revokeObjectURL(url);
          resolve(out || file);
        };
        img.onerror = function () { done(null); };
        img.onload = function () {
          try {
            var long = Math.max(img.naturalWidth, img.naturalHeight);
            var scale = long > PHOTO_LONG_EDGE ? PHOTO_LONG_EDGE / long : 1;
            var w = Math.round(img.naturalWidth * scale);
            var h = Math.round(img.naturalHeight * scale);
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            canvas.toBlob(function (blob) {
              if (!blob || blob.size >= file.size) { done(null); return; }
              // File 로 감싸 이름·형식을 유지합니다 (지원하지 않으면 Blob 그대로).
              var name = String(file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
              try {
                done(new File([blob], name, { type: 'image/jpeg' }));
              } catch (e) {
                blob.name = name;
                done(blob);
              }
            }, 'image/jpeg', PHOTO_QUALITY);
          } catch (e) {
            done(null);
          }
        };
        img.src = url;
      });
    },

    /** 사진 한 장 올리기 → 문서에 담을 정보 */
    uploadPhoto: function (file) {
      var me = adapter.auth.current();
      if (!me) return Promise.reject(new Error('로그인이 필요합니다.'));
      var bad = api.checkPhoto(file);
      if (bad) return Promise.reject(new Error(bad));

      return api.shrinkPhoto(file).then(function (small) {
        var safe = String(small.name || file.name || 'photo.jpg')
          .replace(/[^\w.\-가-힣]+/g, '_')
          .slice(-80);
        var path = 'listing-photos/' + me.id + '/' +
          Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7) + '-' + safe;
        return adapter.files.upload(path, small).then(function () {
          return adapter.files.url(path).then(function (url) {
            return {
              path: path,
              url: url || '',
              name: file.name || safe,
              size: small.size || 0,
              uploadedAt: nowIso(),
            };
          });
        });
      });
    },

    /** 사진 주소 — 저장된 url 이 있으면 그대로 씁니다. */
    photoUrl: function (photo) {
      if (!photo) return Promise.resolve('');
      if (photo.url) return Promise.resolve(photo.url);
      if (!photo.path) return Promise.resolve('');
      return adapter.files.url(photo.path);
    },

    /** 사진 파일 삭제 (문서에서 뺀 뒤 호출) */
    deletePhoto: function (photo) {
      if (!photo || !photo.path) return Promise.resolve();
      return adapter.files.remove(photo.path).catch(function () { return null; });
    },

    /** 매물 등록 — 언제나 '승인 대기'로 시작합니다. */
    submitListing: function (data, proof) {
      var me = adapter.auth.current();
      if (!me) return Promise.reject(new Error('매물을 등록하려면 로그인해 주세요.'));
      if (!proof || !proof.path) {
        return Promise.reject(new Error('권리를 확인할 수 있는 서류를 먼저 올려 주세요.'));
      }
      var record = Object.assign({
        kind: 'rent_monthly', holder: 'owner', use: 'church', useOther: '',
        title: '', region: '', addressRough: '', area: '', floor: '', parking: '',
        deposit: 0, monthly: 0, salePrice: 0, maintenance: 0,
        moveIn: '', religiousUse: '', desc: '',
        contactName: '', contactPhone: '', contactHours: '',
        photos: [],
      }, data, {
        userId: me.id,
        userEmail: me.email || '',
        proof: proof,
        status: 'pending',
        fee: { amount: LISTING_FEE, paid: false, paidAt: '', noticeSentAt: '', invoiceId: '' },
        rejectNote: '',
        views: 0,
        reviewedBy: '',
        reviewedAt: '',
        publishedAt: '',
        expiresAt: '',
        hiddenAt: '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      return adapter.add('listings', record);
    },

    /**
     * 등록자가 내용을 고칩니다.
     * 고친 글은 다시 확인해야 하므로 '승인 대기'로 돌아갑니다.
     * (보안 규칙도 같은 조건을 요구합니다.)
     */
    saveListing: function (id, data) {
      var patch = Object.assign({}, data, {
        status: 'pending',
        rejectNote: '',
        reviewedBy: '',
        reviewedAt: '',
        publishedAt: '',
        expiresAt: '',
        updatedAt: nowIso(),
      });
      return adapter.update('listings', id, patch);
    },

    /**
     * 관리자 → 1단계: 서류 확인 완료, 계좌를 카카오톡으로 보냄 → 입금 대기
     * 계좌를 화면에 붙여 두지 않고 승인할 때 카카오톡으로 보내는 이유는,
     * 확인되지 않은 글에 입금이 먼저 들어오는 일을 막기 위한 것입니다.
     */
    noticeListingFee: function (id) {
      var me = adapter.auth.current();
      return adapter.update('listings', id, {
        status: 'awaiting_payment',
        rejectNote: '',
        fee: {
          amount: LISTING_FEE,
          paid: false,
          paidAt: '',
          noticeSentAt: nowIso(),
          invoiceId: '',
        },
        reviewedBy: me ? me.id : '',
        reviewedAt: nowIso(),
        updatedAt: nowIso(),
      });
    },

    /** 관리자 → 2단계: 입금 확인 후 게시 */
    approveListing: function (id, opts) {
      var o = opts || {};
      var me = adapter.auth.current();
      var days = Number(o.days) > 0 ? Number(o.days) : LISTING_DAYS;
      var patch = {
        status: 'published',
        publishedAt: nowIso(),
        expiresAt: new Date(Date.now() + days * 864e5).toISOString(),
        rejectNote: '',
        hiddenAt: '',
        reviewedBy: me ? me.id : '',
        reviewedAt: nowIso(),
        updatedAt: nowIso(),
      };
      if (o.fee) patch.fee = o.fee;
      return adapter.update('listings', id, patch);
    },

    /** 관리자 → 반려 (사유 필수) */
    rejectListing: function (id, note) {
      var me = adapter.auth.current();
      var reason = String(note || '').trim();
      if (!reason) {
        return Promise.reject(new Error('반려 사유를 적어 주세요. 등록자에게 그대로 보입니다.'));
      }
      return adapter.update('listings', id, {
        status: 'rejected',
        rejectNote: reason,
        publishedAt: '',
        expiresAt: '',
        reviewedBy: me ? me.id : '',
        reviewedAt: nowIso(),
        updatedAt: nowIso(),
      });
    },

    /** 관리자 → 게시 중지 (내리기) */
    hideListing: function (id, note) {
      var me = adapter.auth.current();
      return adapter.update('listings', id, {
        status: 'hidden',
        hiddenAt: nowIso(),
        rejectNote: String(note || '').trim(),
        reviewedBy: me ? me.id : '',
        reviewedAt: nowIso(),
        updatedAt: nowIso(),
      });
    },

    /** 관리자 → 등록비 입금 확인 */
    markListingFee: function (id, paid, invoiceId) {
      return adapter.update('listings', id, {
        fee: {
          amount: LISTING_FEE,
          paid: !!paid,
          paidAt: paid ? nowIso() : '',
          invoiceId: invoiceId || '',
        },
        updatedAt: nowIso(),
      });
    },

    /** 기간이 지난 게시글 정리 (목록을 열 때 조용히 처리합니다) */
    expireListing: function (id) {
      return adapter.update('listings', id, { status: 'expired', updatedAt: nowIso() });
    },

    /** 매물 삭제 — 증빙 서류와 사진도 함께 지웁니다. */
    deleteListing: function (row) {
      var id = typeof row === 'string' ? row : (row && row.id);
      if (!id) return Promise.resolve();
      var doc = typeof row === 'object' ? row : null;
      var paths = [];
      if (doc && doc.proof && doc.proof.path) paths.push(doc.proof.path);
      (doc && Array.isArray(doc.photos) ? doc.photos : []).forEach(function (ph) {
        if (ph && ph.path) paths.push(ph.path);
      });
      return adapter.remove('listings', id).then(function () {
        return Promise.all(paths.map(function (p) {
          return adapter.files.remove(p).catch(function () { return null; });
        }));
      });
    },

    /**
     * 공개 목록 — 로그인 없이 누구나 봅니다.
     * 보안 규칙이 조회 범위를 확인하므로 반드시 status 조건을 붙입니다.
     */
    publishedListings: function () {
      return adapter.list('listings', { where: { status: 'published' } })
        .then(function (rows) {
          return rows.filter(function (r) { return api.listingLive(r); });
        })
        .catch(function () { return []; });
    },

    /** 내가 올린 매물 (보안 규칙이 조회 범위를 확인합니다) */
    myListings: function () {
      var me = adapter.auth.current();
      if (!me) return Promise.resolve([]);
      return adapter.list('listings', { where: { userId: me.id } })
        .catch(function () { return []; });
    },

    /** 관리자 화면 — 전체 목록 */
    allListings: function () {
      return adapter.list('listings');
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

    /**
     * 전화번호 입력칸을 숫자 11자리로 제한하고 하이픈을 자동으로 넣습니다.
     * (하이픈은 표시용이고, 실제로 입력받는 숫자는 최대 11자리입니다.)
     */
    /* =====================================================
       직분 선택 — 목록에 없으면 '기타'로 직접 입력합니다.

       화면에서는 select 하나와 text 하나를 짝지어 두고,
       저장되는 값은 언제나 실제 직분 이름입니다 ('기타'가 남지 않습니다).
       ===================================================== */

    ROLE_OPTIONS: ROLE_OPTIONS,

    /** select 옵션 태그 문자열 */
    roleOptionsHtml: function () {
      return '<option value="">선택해 주세요</option>' +
        ROLE_OPTIONS.map(function (r) { return '<option>' + r + '</option>'; }).join('');
    },

    /** '기타'를 고르면 직접 입력칸이 나타나도록 묶습니다. */
    bindRoleSelect: function (select, input) {
      if (!select || !input) return;
      var box = input.closest('.field') || input;
      var sync = function (keep) {
        var other = select.value === '기타';
        box.hidden = !other;
        input.disabled = !other || select.disabled;
        if (!other && !keep) input.value = '';
        if (other) input.setAttribute('placeholder', '직분을 직접 입력해 주세요');
      };
      select.addEventListener('change', function () { sync(false); });
      sync(true);
      return sync;
    },

    /** 최종 직분 값 — '기타'면 직접 입력한 내용 */
    roleValue: function (select, input) {
      var v = ((select && select.value) || '').trim();
      if (v !== '기타') return v;
      return ((input && input.value) || '').trim();
    },

    /** 저장된 직분을 select + input 에 채웁니다 (목록에 없으면 기타로) */
    setRoleValue: function (select, input, value) {
      if (!select) return;
      var v = String(value || '').trim();
      if (!v) select.value = '';
      else if (ROLE_OPTIONS.indexOf(v) > -1 && v !== '기타') select.value = v;
      else {
        select.value = '기타';
        if (input) input.value = v;
      }
      select.dispatchEvent(new Event('change'));
      // change 로 초기화되지 않도록 다시 채웁니다.
      if (input && select.value === '기타') input.value = v === '기타' ? '' : v;
    },

    bindPhoneInput: function (input) {
      if (!input) return;
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('maxlength', '13'); // 010-0000-0000
      input.addEventListener('input', function () {
        var d = input.value.replace(/\D/g, '').slice(0, 11);
        if (d.length < 4) { input.value = d; return; }
        if (d.startsWith('02')) {
          input.value = d.length <= 5 ? d.replace(/(\d{2})(\d+)/, '$1-$2')
            : d.length <= 9 ? d.replace(/(\d{2})(\d{3})(\d+)/, '$1-$2-$3')
            : d.replace(/(\d{2})(\d{4})(\d{1,4})/, '$1-$2-$3');
        } else {
          input.value = d.length <= 7 ? d.replace(/(\d{3})(\d+)/, '$1-$2')
            : d.length <= 10 ? d.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3')
            : d.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
        }
      });
    },

    /** 숫자만 세어 유효한 길이인지 확인 (휴대폰 11자리 · 서울 지역번호 9~10자리) */
    isValidPhone: function (value) {
      var d = String(value || '').replace(/\D/g, '');
      return d.length >= 9 && d.length <= 11;
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
