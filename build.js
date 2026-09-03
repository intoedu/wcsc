'use strict';

/**
 * 정적 페이지 생성기.
 *   node build.js
 * src/data/site.js 의 내용을 읽어 루트에 HTML 파일들을 생성합니다.
 * 생성된 HTML은 빌드 도구 없이 그대로 배포할 수 있습니다.
 */

const fs = require('fs');
const path = require('path');
const T = require('./src/templates');
const Boards = require('./src/boards');

const { esc, icon, layout, pageHero, sectionHead, faqList, serviceCard, ctaBand,
  applyLink, externalNote, site, categories, services, serviceGroups, categoryCards, categoryOf,
  plans, planRules, trial, invite, boardTabs,
  // 연락처는 반드시 이 함수들로 — 관리자가 [센터 설정] 에서 바꾼 값이 반영됩니다.
  phoneText, emailText, hoursText, addressText } = T;

const ROOT = __dirname;
const out = [];

function write(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, 'utf8');
  out.push(rel);
}

/* =========================================================
   홈
   ========================================================= */
function buildIndex() {
  /* 렌탈 회사 홈페이지의 배치를 따랐습니다 (렌트리 참고).
       위에서부터 — 미는 배너 · 아이콘 바로가기 · 품목표 · 상담 · 게시판.
     테두리를 두르는 대신 연회색 면과 넓은 여백으로 나눕니다.
     화려하게 만들기보다, 눈이 걸리는 선을 줄이는 쪽으로 갑니다. */

  /* 값을 앞에 내놓습니다 — 무엇을 얼마에 맡길 수 있는지가 먼저
     보여야 다음을 눌러 보십니다. 다만 요금제 페이지가 지금 닫혀
     있어 "요금제에 포함" 이라고만 적힌 항목은 그 말을 쓰지 않습니다. */
  const priceTag = (s) => {
    const p = String(s.price || '').trim();
    if (!p || p === '상담 후 결정' || p === '상담 후 안내') return { text: '상담 후 견적', kind: 'ask' };
    if (p === '무료') return { text: '무료', kind: 'free' };
    if (p === '요금제에 포함') return { text: '상담 후 견적', kind: 'ask' };
    if (p === '캠프마다 상이') return { text: '캠프별 안내', kind: 'ask' };
    return { text: p, kind: 'won' };
  };

  /* 첫 화면의 미는 배너. 사진 대신 은은한 바탕색과 큰 글씨로 갑니다 —
     교회 사진을 급조해 넣는 것보다 깔끔하고, 거짓이 없습니다. */
  const BANNERS = [
    {
      tone: 'green',
      eyebrow: '홈페이지 제작',
      title: '제작비 0원으로<br>교회 홈페이지를',
      lead: '만들어 드리고, 월 3만원으로 계속 돌봐 드립니다.',
      href: 'services/homepage.html',
      icon: 'monitor',
    },
    {
      tone: 'gold',
      eyebrow: '교역자 구인',
      title: '멀어서 사람 못 구하던<br>교회를 위해',
      lead: '사례비 · 사택 · 오가는 길을 미리 밝히고 공고를 올립니다.',
      href: 'jobs.html',
      icon: 'users',
    },
    {
      tone: 'deep',
      eyebrow: '중고 장터',
      title: '쓰던 음향과 악기를<br>교회끼리',
      lead: '사 오신 장비는 예배당에 달아 드리는 것까지 맡습니다.',
      href: 'market.html',
      icon: 'speaker',
    },
    {
      tone: 'mint',
      eyebrow: '게스트하우스',
      title: '비어 있는 사택을<br>필요한 분께',
      lead: '한국에 잠시 머무는 선교사와 사역자가 묵을 자리입니다.',
      href: 'guesthouse.html',
      icon: 'building',
    },
  ];

  const banner = (b) => `<a class="bn is-${b.tone}" href="${b.href}">
        <span class="bn-art" aria-hidden="true">${icon(b.icon)}</span>
        <span class="bn-in">
          <span class="bn-eyebrow">${esc(b.eyebrow)}</span>
          <strong class="bn-title">${b.title}</strong>
          <span class="bn-lead">${esc(b.lead)}</span>
        </span>
      </a>`;

  /* 아이콘 바로가기 — 열한 항목에 [전체보기] 하나를 더해 열둘입니다. */
  const shortcut = (s) => `<a class="sc" href="services/${s.slug}.html">
        <span class="sc-ico">${icon(s.icon)}</span>
        <span class="sc-name">${esc(s.short || s.name)}</span>
      </a>`;

  const itemTile = (s) => {
    const tag = priceTag(s);
    return `<a class="item" href="services/${s.slug}.html" data-cat="${s.category}">
        <span class="item-ico">${icon(s.icon)}</span>
        <span class="item-body">
          <strong class="item-name">${esc(s.name)}</strong>
          <span class="item-line">${esc(s.tagline)}</span>
        </span>
        <span class="item-foot">
          <span class="item-price is-${tag.kind}">${esc(tag.text)}</span>
          <span class="item-go">자세히 ${icon('arrow', 'ico ico-sm')}</span>
        </span>
      </a>`;
  };

  const boardTile = (b, i) => `<a class="bd-tile" href="${b.href}">
        <span class="bd-no">0${i + 1}</span>
        <strong>${esc(b.label)}</strong>
        <span>${esc(b.sub)}</span>
      </a>`;

  /* 섹션 제목 오른쪽에 [전체보기] 를 붙이는 자리 */
  const head = (title, lead, moreHref, moreLabel) => `<div class="hd-row">
      <div>
        <h2>${title}</h2>
        ${lead ? `<p>${esc(lead)}</p>` : ''}
      </div>
      ${moreHref ? `<a class="hd-more" href="${moreHref}">${esc(moreLabel || '전체보기')} ${icon('arrow', 'ico ico-sm')}</a>` : ''}
    </div>`;

  const body = `
<!-- ============ 1. 미는 배너 ============
     가로로 밀어 봅니다. 다음 장이 살짝 걸쳐 보이게 두어,
     더 있다는 것이 손짓 없이도 보이게 했습니다. -->
<section class="bn-wrap">
  <div class="wrap">
    <div class="bn-rail" id="bnRail" role="region" aria-label="주요 안내">
      ${BANNERS.map(banner).join('\n      ')}
    </div>
    <div class="bn-dots" id="bnDots" aria-hidden="true">
      ${BANNERS.map((b, i) => `<button type="button" class="bn-dot${i === 0 ? ' is-on' : ''}" data-go="${i}" tabindex="-1"></button>`).join('\n      ')}
    </div>
  </div>
</section>

<!-- ============ 2. 아이콘 바로가기 ============ -->
<section class="sc-wrap">
  <div class="wrap">
    <div class="sc-grid">
      ${services.map(shortcut).join('\n      ')}
      <a class="sc is-all" href="services/index.html">
        <span class="sc-ico">${icon('grid')}</span>
        <span class="sc-name">전체보기</span>
      </a>
    </div>
  </div>
</section>

<!-- ============ 3. 지원 항목 카탈로그 ============ -->
<section class="section" id="items">
  <div class="wrap">
    ${head('무엇이든 하나씩 맡기실 수 있습니다',
    '전부 맡기지 않으셔도 됩니다. 지금 급한 것 하나만 고르셔도 됩니다.',
    'services/index.html')}

    <div class="cat-tabs" id="catTabs" role="tablist" aria-label="갈래로 걸러 보기">
      <button type="button" class="cat-tab is-on" data-cat="">전체</button>
      ${categories.map((c) => `<button type="button" class="cat-tab" data-cat="${c.id}">${esc(c.name)}</button>`).join('\n      ')}
    </div>

    <div class="items" id="itemGrid">
      ${services.map(itemTile).join('\n      ')}
    </div>

    <p class="items-note">
      값이 <strong>상담 후 견적</strong> 인 항목은 교회 규모와 상황에 따라 달라, 보고 정해 드립니다.
      물어보시는 것은 무료이고, 견적을 받으셨다고 맡기셔야 하는 것도 아닙니다.
    </p>
  </div>
</section>

<!-- ============ 4. 빠른 상담 ============
     여기서 보내지는 않고 신청서로 넘기며 적으신 것을 옮겨 담습니다 —
     신청은 로그인이 필요한데, 첫 화면에서 로그인을 물으면 대개 나가십니다. -->
<section class="qz">
  <div class="wrap qz-in">
    <div class="qz-copy">
      <p class="qz-eyebrow">1분이면 됩니다</p>
      <h2>연락처만 남겨 주시면<br>저희가 전화드리겠습니다</h2>
      <p class="qz-lead">
        무엇이 필요하신지 아직 정하지 않으셔도 됩니다.
        형편을 여쭙고, 지금 급한 것부터 함께 정리해 드립니다.
        <strong>상담과 견적은 무료</strong>이고, 견적을 받으셨다고 맡기셔야 하는 것도 아닙니다.
      </p>
      <div class="qz-call">
        <span>바로 통화를 원하시면</span>
        <a href="${site.contact.phoneHref}">${icon('phoneCall', 'ico ico-sm')} ${phoneText()}</a>
        <small>${esc(site.contact.hours)}</small>
      </div>
    </div>

    <form class="qz-form" id="quoteForm" novalidate>
      <div class="quote-field">
        <label for="qChurch">교회명</label>
        <input type="text" id="qChurch" name="church" maxlength="40" placeholder="예: 새길교회" autocomplete="organization">
      </div>
      <div class="quote-field">
        <label for="qPhone">연락처 <em>*</em></label>
        <input type="tel" id="qPhone" name="phone" placeholder="010-0000-0000" autocomplete="tel">
      </div>
      <div class="quote-field">
        <label for="qItem">무엇이 필요하신가요?</label>
        <select id="qItem" name="item">
          <option value="">고르지 않으셔도 됩니다</option>
          ${services.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('\n          ')}
        </select>
      </div>
      <p class="quote-err" id="qErr" hidden></p>
      <button type="submit" class="btn btn-primary btn-lg quote-btn">상담 신청하기 ${icon('arrow', 'ico ico-sm')}</button>
      <p class="quote-fine">
        누르시면 신청서로 넘어가며, 적으신 내용이 그대로 옮겨집니다.
        거기서 한 번 더 확인하고 보내시면 됩니다.
      </p>
    </form>
  </div>
</section>

<!-- ============ 5. 게시판 ============ -->
<section class="section">
  <div class="wrap">
    ${head('교회끼리 사고, 나누고, 만납니다',
    '센터를 거치지 않고 교회와 교회가 직접 잇는 자리입니다. 보시는 것은 누구나 무료입니다.',
    'listings.html')}
    <div class="bd-tiles">
      ${T.BOARDS.map(boardTile).join('\n      ')}
    </div>
  </div>
</section>

<!-- ============ 6. 이용 절차 ============ -->
<section class="section is-soft">
  <div class="wrap">
    ${head('신청부터 사후 지원까지 5단계',
    '어디까지 왔는지 신청 현황에서 언제든 보실 수 있습니다.',
    'process.html', '자세히 보기')}
    <ol class="steps">
      ${site.steps
        .map(
          (s, i) => `<li class="step">
        <span class="step-no">${i + 1}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.desc)}</p>
      </li>`
        )
        .join('\n      ')}
    </ol>
  </div>
</section>

<!-- ============ 7. 자주 묻는 질문 ============ -->
<section class="section">
  <div class="wrap narrow">
    ${head('신청 전에 많이 묻는 것들', '', 'faq.html')}
    ${faqList(site.faqs.slice(0, 4), 'home-faq')}
  </div>
</section>

${ctaBand('')}
`;

  write(
    'index.html',
    layout({
      title: '우리교회지원센터 | 한국 교회를 위한 통합 지원',
      description: site.description,
      base: '',
      active: 'index.html',
      body,
      bodyClass: 'is-home',
      scripts: ['home.js'],
    })
  );
}

/* =========================================================
   센터 소개
   ========================================================= */
function buildAbout() {
  const body = `
${pageHero({
  eyebrow: '센터 소개',
  title: '한국 교회 곁에서<br>실무를 맡는 기관',
  lead: '우리교회지원센터는 교회가 사역 외의 일로 소모하는 시간과 비용을 줄이기 위해 만들어졌습니다.',
})}

<section class="section">
  <div class="wrap narrow prose">
    <h2>왜 만들어졌나</h2>
    <p>
      많은 교회가 비슷한 어려움을 겪습니다. 홈페이지를 만들려면 업체를 찾아야 하고, 주보는 매주 담당자가 밤늦게 편집합니다.
      부교역자를 청빙하려면 아는 분들께 부탁하는 것 외에 방법이 마땅치 않고, 음향이 안 좋아도 무엇이 문제인지 알기 어렵습니다.
      교회를 옮길 때는 계약 직전에야 용도 문제를 발견하기도 합니다.
    </p>
    <p>
      이 일들은 모두 사역이 아니지만, 하지 않으면 사역이 막힙니다. 그리고 대부분의 교회에는 이 일을 전담할 사람이 없습니다.
      우리교회지원센터는 그 자리를 대신 맡기 위해 만들어진 기관입니다.
    </p>

    <h2>어떻게 일하나</h2>
    <p>
      우리교회지원센터는 항목별로 업체를 따로 찾게 하지 않습니다. 여러 항목을 진행하더라도 한곳에서 이어서 맡습니다.
      교회의 규모와 예산, 의사결정 구조를 이미 알고 있는 곳과 일한다는 뜻입니다.
    </p>
    <p>
      또한 모든 제안은 문서로 드립니다. 당회와 제직회에 그대로 올릴 수 있도록 항목별 범위와 일정, 비용을 정리해 드리며,
      구두로만 진행되는 부분을 남기지 않습니다.
    </p>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('원칙', '이 세 가지는 지킵니다')}
    <div class="why-grid">
      ${site.principles
        .map(
          (p, i) => `<article class="why-card">
        <span class="why-no">0${i + 1}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${sectionHead('지원 범위', '세 갈래, 8개 항목')}
    ${serviceGroups('')}
  </div>
</section>

${ctaBand('', {
  title: '교회 상황부터 들려주세요',
  lead: '무엇이 필요한지 정리되지 않은 상태여도 좋습니다. 담당자가 함께 정리하는 것부터 시작합니다.',
})}
`;

  write(
    'about.html',
    layout({
      title: '센터 소개 | 우리교회지원센터',
      description: '우리교회지원센터가 만들어진 이유와 일하는 방식, 그리고 지키는 원칙을 소개합니다.',
      base: '',
      active: 'about.html',
      body,
    })
  );
}

/* =========================================================
   이용 절차
   ========================================================= */
function buildProcess() {
  const body = `
${pageHero({
  eyebrow: '이용 절차',
  title: '신청에서 사후 지원까지',
  lead: '접수 후 영업일 기준 1~2일 안에 담당자가 연락드립니다. 상담과 견적에는 비용이 들지 않습니다.',
})}

<section class="section">
  <div class="wrap narrow">
    <ol class="timeline">
      ${site.steps
        .map(
          (s, i) => `<li class="tl-item">
        <div class="tl-marker"><span>${i + 1}</span></div>
        <div class="tl-body">
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.desc)}</p>
        </div>
      </li>`
        )
        .join('\n      ')}
    </ol>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('준비하시면 좋은 것', '미리 있으면 상담이 빨라집니다')}
    <div class="prep-grid">
      <article class="prep-card">
        <span class="prep-ico">${icon('doc')}</span>
        <h3>교회 기본 정보</h3>
        <p>교회명, 소재지, 출석 교인 수, 담당자 연락처. 신청서에 적는 항목이지만 미리 정리해 두시면 좋습니다.</p>
      </article>
      <article class="prep-card">
        <span class="prep-ico">${icon('clock')}</span>
        <h3>희망 일정</h3>
        <p>언제까지 필요한지 알려주시면 가능 여부를 먼저 확인해 드립니다. 절기 행사처럼 날짜가 정해진 건은 특히 중요합니다.</p>
      </article>
      <article class="prep-card">
        <span class="prep-ico">${icon('briefcase')}</span>
        <h3>예산 범위</h3>
        <p>정확한 금액이 아니어도 됩니다. 대략의 범위를 알려주시면 그 안에서 가능한 방안으로 제안드립니다.</p>
      </article>
      <article class="prep-card">
        <span class="prep-ico">${icon('users')}</span>
        <h3>결정 구조</h3>
        <p>당회 결의가 필요한지, 담당 목사님 선에서 진행 가능한지에 따라 준비할 서류와 일정이 달라집니다.</p>
      </article>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    ${sectionHead('신청 후', '접수 상태 확인')}
    <div class="notice-card">
      <p>
        신청서를 제출하시면 <strong>접수번호</strong>가 발급됩니다. 이 번호로
        <a href="status.html">신청 조회</a> 페이지에서 접수 내용을 다시 확인하실 수 있습니다.
        접수번호는 신청 완료 화면에 표시되며, 담당자와 통화하실 때 말씀해 주시면 확인이 빠릅니다.
      </p>
    </div>
  </div>
</section>

${ctaBand('')}
`;

  write(
    'process.html',
    layout({
      title: '이용 절차 | 우리교회지원센터',
      description: '신청 접수, 담당자 배정, 제안·견적, 진행, 사후 지원까지 우리교회지원센터의 5단계 이용 절차를 안내합니다.',
      base: '',
      active: 'process.html',
      body,
    })
  );
}

/* =========================================================
   FAQ
   ========================================================= */
function buildFaq() {
  const perService = services
    .map(
      (s) => `<div class="faq-group">
      <h3 class="faq-group-title">${icon(s.icon, 'ico ico-sm')} ${esc(s.name)}</h3>
      ${faqList(s.faqs, `faq-${s.id}`)}
      <p class="faq-group-more"><a href="services/${s.slug}.html">${esc(s.name)} 자세히 보기 ${icon('arrow', 'ico ico-sm')}</a></p>
    </div>`
    )
    .join('\n    ');

  const body = `
${pageHero({
  eyebrow: '자주 묻는 질문',
  title: '궁금한 점을<br>모아 정리했습니다',
  lead: '여기에 없는 내용은 문의 주시면 확인해 답변드립니다.',
})}

<section class="section">
  <div class="wrap narrow">
    ${sectionHead('공통', '센터 이용 전반', null, 'left')}
    ${faqList(site.faqs, 'faq-common')}
  </div>
</section>

<section class="section section-alt">
  <div class="wrap narrow">
    ${sectionHead('항목별', '지원 항목에 대한 질문', null, 'left')}
    ${perService}
  </div>
</section>

${ctaBand('', {
  title: '찾는 답이 없으신가요',
  lead: '전화나 이메일로 문의 주시면 담당자가 직접 확인해 안내드립니다.',
})}
`;

  write(
    'faq.html',
    layout({
      title: '자주 묻는 질문 | 우리교회지원센터',
      description: '우리교회지원센터 이용과 8개 지원 항목에 대해 자주 묻는 질문을 모았습니다.',
      base: '',
      active: 'faq.html',
      body,
    })
  );
}

/* =========================================================
   지원 항목 목록
   ========================================================= */
function buildServicesIndex() {
  const body = `
${pageHero({
  eyebrow: '지원 항목',
  title: '네 갈래 11개 항목을<br>한곳에서 맡습니다',
  lead: '교회가 겪는 자리별로 묶었습니다 — 보이는 교회 · 사역하는 교회 · 세우는 교회, 그리고 가입이 무료인 커뮤니티 센터. '
    + '여러 항목을 한 번에 신청하실 수 있고, 전체 일정을 묶어 조율합니다.',
})}

<section class="section">
  <div class="wrap">
    ${serviceGroups('../')}
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    ${sectionHead(
      '비용은 세 가지 방식',
      '항목 성격에 따라 과금 방식이 다릅니다',
      '어떤 방식이든 상담과 견적에는 비용이 들지 않습니다.'
    )}
    <div class="bill-grid">
      <article class="bill-card">
        <span class="bill-tag">달마다</span>
        <h3>홈페이지 제작 · 인투오피스</h3>
        <p class="bill-price">홈페이지 <strong>월 관리비 3만원</strong> · 인투오피스 <strong>월 6,900원</strong></p>
        <p>초기 비용이 없어 예산 결의를 기다리지 않고 시작할 수 있습니다. 홈페이지는 제작비 0원이고 매달 3만원은
          서버 유지와 수정 · 장애 대응에 들어가는 관리비입니다. 인투오피스는 교회 규모와 관계없이 같은 금액입니다.
          둘 다 월 단위로 중단하실 수 있습니다.</p>
      </article>
      <article class="bill-card">
        <span class="bill-tag">1회 결제</span>
        <h3>마케팅 지원 · 부동산</h3>
        <p class="bill-price">디자인 시안 <strong>3만원</strong> · 매물 등록 <strong>6만원</strong></p>
        <p>필요할 때 한 번만 결제하는 항목입니다.
          주보처럼 매주 반복되는 경우에는 사역 요금제에 매주 제작이 들어 있습니다.</p>
      </article>
      <article class="bill-card">
        <span class="bill-tag">건별 견적</span>
        <h3>교역자 구인 · 음향 · AKC</h3>
        <p class="bill-price"><strong>상담 후 결정</strong></p>
        <p>교회 상황에 따라 범위가 크게 달라지는 항목입니다. 상담 후 항목별 내역이 적힌 견적서를 드립니다.</p>
      </article>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${sectionHead('한눈에 비교', '항목별 비용과 과금 방식, 접수 창구')}
    <div class="table-scroll">
      <table class="cmp-table">
        <thead>
          <tr><th scope="col">항목</th><th scope="col">비용</th><th scope="col">과금 방식</th><th scope="col">소요 기간</th><th scope="col">접수</th></tr>
        </thead>
        <tbody>
          ${services
            .map(
              (s) => `<tr>
            <th scope="row"><a href="../services/${s.slug}.html">${esc(s.name)}</a></th>
            <td class="cmp-price">${esc(s.price || '상담 후 결정')}</td>
            <td>${esc(s.billing || '건별 견적')}</td>
            <td>${esc(s.duration)}</td>
            <td>${s.externalApply ? `<span class="cmp-tag">${esc(s.externalApplyLabel || '외부')}</span>` : '센터'}</td>
          </tr>`
            )
            .join('\n          ')}
        </tbody>
      </table>
    </div>
  </div>
</section>

${ctaBand('../')}
`;

  write(
    'services/index.html',
    layout({
      title: '지원 항목 | 우리교회지원센터',
      description:
        '홈페이지 제작, 디자인, 교역자 구인, 음향 세팅, 부동산, AKC, 스마트처치 앱, 인투오피스 등 우리교회지원센터의 8개 지원 항목을 안내합니다.',
      base: '../',
      active: 'services/index.html',
      body,
    })
  );
}

/* =========================================================
   항목 상세
   ========================================================= */
function buildServicePage(s, i) {
  const prev = services[(i - 1 + services.length) % services.length];
  const next = services[(i + 1) % services.length];

  const body = `
<section class="svc-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="현재 위치">
      <a href="../index.html">홈</a> ${icon('arrow', 'ico ico-xs')}
      <a href="../services/index.html">지원 항목</a> ${icon('arrow', 'ico ico-xs')}
      <span>${esc(s.name)}</span>
    </nav>
    <div class="svc-hero-in">
      <div class="svc-hero-copy">
        <p class="eyebrow"><span class="svc-hero-no">${s.no}</span> 지원 항목</p>
        <h1 data-live="svc.${s.id}.name">${esc(s.name)}</h1>
        <p class="svc-hero-tag" data-live="svc.${s.id}.tagline">${esc(s.tagline)}</p>
        <p class="lead" data-live="svc.${s.id}.summary">${esc(s.summary)}</p>
        <div class="hero-actions">
          ${applyLink(s, '../')}
          <a class="btn btn-outline btn-lg" href="${site.contact.phoneHref}">전화 상담</a>
        </div>
        ${externalNote(s)}
      </div>
      <div class="svc-hero-side">
        <span class="svc-hero-ico">${icon(s.icon)}</span>
        ${s.siteLink ? `<a class="btn btn-gold svc-site-btn" href="${s.siteLink.url}" target="_blank" rel="noopener">
          ${esc(s.siteLink.label)} 바로가기 ↗
        </a>` : ''}
        <dl class="svc-meta">
          <div><dt>비용</dt><dd class="svc-meta-price">${esc(s.price || '상담 후 결정')}</dd></div>
          <div><dt>과금 방식</dt><dd>${esc(s.billing || '건별 견적')}</dd></div>
          <div><dt>소요 기간</dt><dd data-live="svc.${s.id}.duration">${esc(s.duration)}</dd></div>
          <div><dt>상담 · 견적</dt><dd>무료</dd></div>
          <div><dt>지원 지역</dt><dd>전국</dd></div>
        </dl>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${sectionHead('이런 경우에 필요합니다', '교회에서 자주 겪는 상황')}
    <div class="prob-grid">
      ${s.problems
        .map(
          (p) => `<article class="prob-card">
        <h3>“${esc(p.title)}”</h3>
        <p>${esc(p.desc)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

${s.campTypes ? `
<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('캠프 종류', '두 가지 방식 중에 고르실 수 있습니다',
      '같은 캠프를 우리 교회가 찾아가서 참석하실 수도, 우리 교회로 불러 여실 수도 있습니다.')}
    <div class="camp-grid">
      ${s.campTypes.map((c) => `<article class="camp-card">
        <span class="camp-tag">${esc(c.tag)}</span>
        <h3>${esc(c.title)}</h3>
        <p class="camp-lead">${esc(c.lead)}</p>
        <ul class="camp-points">
          ${c.points.map((t) => `<li>${esc(t)}</li>`).join('\n          ')}
        </ul>
        <p class="camp-note">${esc(c.note)}</p>
      </article>`).join('\n      ')}
    </div>
    ${s.siteLink ? `<p class="camp-site">
      <a class="btn btn-primary btn-lg" href="${s.siteLink.url}" target="_blank" rel="noopener">
        ${esc(s.siteLink.label)} 바로가기 ↗</a>
      <span>${esc(s.siteLink.desc)}</span>
    </p>` : ''}
  </div>
</section>` : ''}

${s.campTracks ? `
<section class="section">
  <div class="wrap">
    ${sectionHead('캠프 갈래', '영성캠프와 영역캠프',
      '영혼을 정렬하는 영성캠프에서, 일터와 학교로 나아가는 영역캠프까지 이어집니다.')}
    <div class="track-grid">
      ${s.campTracks.map((t) => `<article class="track-card">
        <h3>${esc(t.title)}</h3>
        <p class="track-lead">${esc(t.lead)}</p>
        <dl class="track-list">
          ${t.items.map((i) => `<div><dt>${esc(i.name)}</dt><dd>${esc(i.desc)}</dd></div>`).join('\n          ')}
        </dl>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>` : ''}

${s.useCases ? `
<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('어떤 문서에 쓰나요', '교회에서 서명이 필요한 거의 모든 곳',
      '아래는 자주 쓰이는 예입니다. 서명란이 있는 문서라면 무엇이든 올려 쓰실 수 있습니다.')}
    <div class="use-grid">
      ${s.useCases.map((u) => `<article class="use-card">
        <h3>${esc(u.group)}</h3>
        <ul>${u.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>` : ''}

<section class="section${s.useCases ? '' : ' section-alt'}">
  <div class="wrap">
    ${sectionHead('지원 내용', '이런 것들을 해 드립니다')}
    <div class="feat-grid" data-live-list="svc.${s.id}.features">
      ${s.features
        .map(
          (f) => `<article class="feat-card">
        <span class="feat-ico">${icon('check', 'ico ico-sm')}</span>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.desc)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    ${sectionHead('진행 순서', `${s.name}은 이렇게 진행됩니다`)}
    <ol class="timeline">
      ${s.steps
        .map(
          (st, n) => `<li class="tl-item">
        <div class="tl-marker"><span>${n + 1}</span></div>
        <div class="tl-body"><h3>${esc(st.title)}</h3><p>${esc(st.desc)}</p></div>
      </li>`
        )
        .join('\n      ')}
    </ol>
  </div>
</section>

${s.scope ? `
<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('이렇게 해 드립니다', s.scope.headline || '신청하시면 여기까지 진행됩니다')}
    <ul class="does-list">
      ${s.scope.does.map((t) => `<li>${icon('check', 'ico ico-sm')}<span>${esc(t)}</span></li>`).join('\n      ')}
    </ul>
    ${s.scope.note ? `<p class="scope-note">${esc(s.scope.note)}</p>` : ''}
    ${s.scope.fineprint ? `<p class="scope-fine">${esc(s.scope.fineprint)}</p>` : ''}
  </div>
</section>` : ''}

<section class="section${s.scope ? '' : ' section-alt'}">
  <div class="wrap">
    <div class="split">
      <div class="split-col">
        <h2 class="split-title">제공 내역</h2>
        <ul class="check-list" data-live-list="svc.${s.id}.deliverables">
          ${s.deliverables.map((d) => `<li>${icon('check', 'ico ico-sm')}<span>${esc(d)}</span></li>`).join('\n          ')}
        </ul>
      </div>
      <div class="split-col">
        <h2 class="split-title">비용 안내</h2>
        <div class="price-card">
          <p class="price-figure">${esc(s.price || '상담 후 결정')}<small>${esc(s.billing || '건별 견적')}</small></p>
          <p data-live="svc.${s.id}.priceNote">${esc(s.priceNote)}</p>
          <dl class="price-meta">
            <div><dt>소요 기간</dt><dd data-live="svc.${s.id}.duration">${esc(s.duration)}</dd></div>
            <div><dt>상담 · 견적</dt><dd>무료</dd></div>
          </dl>
          ${applyLink(s, '../', { cls: 'btn-primary btn-block', label: '견적 요청하기', arrow: false })}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    ${sectionHead('자주 묻는 질문', `${s.name} 관련 질문`)}
    ${faqList(s.faqs, `svc-${s.id}`, `data-live-list="svc.${s.id}.faqs"`)}
  </div>
</section>

${ctaBand('../', {
  title: `${s.name}, 지금 신청하실 수 있습니다`,
  lead: '신청서를 남기시면 영업일 기준 1~2일 안에 담당자가 연락드립니다. 상담과 견적은 무료입니다.',
})}

<nav class="svc-nav" aria-label="다른 항목">
  <div class="wrap svc-nav-in">
    <a class="svc-nav-link is-prev" href="../services/${prev.slug}.html">
      <span>이전 항목</span><strong>${esc(prev.name)}</strong>
    </a>
    <a class="svc-nav-all" href="../services/index.html">전체 항목</a>
    <a class="svc-nav-link is-next" href="../services/${next.slug}.html">
      <span>다음 항목</span><strong>${esc(next.name)}</strong>
    </a>
  </div>
</nav>
`;

  write(
    `services/${s.slug}.html`,
    layout({
      title: `${s.name} | 우리교회지원센터`,
      description: s.summary,
      base: '../',
      active: `services/${s.slug}.html`,
      serviceId: s.id,
      body,
    })
  );
}

/* =========================================================
   신청서
   ========================================================= */
function buildApply() {
  // 외부에서 접수하는 항목(@IM 등)은 체크박스가 아니라 링크로 내보냅니다.
  const serviceChecks = services
    .map((s) => {
      if (s.externalApply) {
        const who = s.externalApplyLabel || '외부 사이트';
        return `<a class="pick pick-external" data-service="${s.id}" data-apply="${s.id}"
          href="${s.externalApply}" target="_blank" rel="noopener">
          <span class="pick-in">
            <span class="pick-ico">${icon(s.icon, 'ico ico-sm')}</span>
            <span class="pick-text"><strong>${esc(s.name)}</strong><small>${esc(who)} 접수 페이지에서 신청합니다</small></span>
            <span class="pick-out">${esc(who)} ${icon('arrow', 'ico ico-xs')}</span>
          </span>
        </a>`;
      }
      return `<label class="pick" data-service="${s.id}">
          <input type="checkbox" name="services" value="${s.id}">
          <span class="pick-in">
            <span class="pick-ico">${icon(s.icon, 'ico ico-sm')}</span>
            <span class="pick-text"><strong>${esc(s.name)}</strong><small>${esc(s.tagline)}</small></span>
            <span class="pick-mark">${icon('check', 'ico ico-xs')}</span>
          </span>
        </label>`;
    })
    .join('\n        ');

  const externalIds = services.filter((s) => s.externalApply).map((s) => s.id);

  const body = `
${pageHero({
  eyebrow: '지원 신청',
  title: '필요한 항목을 선택해<br>신청서를 남겨주세요',
  lead: '접수 후 영업일 기준 1~2일 안에 담당자가 연락드립니다. 상담과 견적에는 비용이 들지 않습니다.',
})}

<section class="section">
  <div class="wrap narrow">
    <form class="apply-form" id="applyForm" novalidate>
      <ol class="form-progress" id="formProgress">
        <li class="is-on"><span>1</span> 항목 선택</li>
        <li><span>2</span> 교회 정보</li>
        <li><span>3</span> 상세 요청</li>
      </ol>

      <fieldset class="fs">
        <legend><span class="fs-no">1</span> 신청 항목 <em class="req">필수</em></legend>
        <p class="fs-help">필요한 항목을 모두 선택하세요. 여러 개를 선택하면 묶어서 진행합니다.</p>
        ${externalIds.length
          ? `<p class="fs-help fs-help-external">${externalIds
              .map((id) => esc(services.find((v) => v.id === id).name))
              .join(' · ')} 은 별도 접수 페이지에서 신청받습니다. 아래에서 해당 항목을 누르면 새 창으로 열립니다.</p>`
          : ''}
        <div class="pick-grid">
        ${serviceChecks}
        </div>
        <p class="err" id="err-services" hidden>항목을 하나 이상 선택해 주세요.</p>
      </fieldset>

      <fieldset class="fs">
        <legend><span class="fs-no">2</span> 교회 · 담당자 정보</legend>
        <div class="grid-2">
          <div class="field">
            <label for="church_name">교회명 <em class="req">필수</em></label>
            <input type="text" id="church_name" name="church_name" required autocomplete="organization" placeholder="예: 은혜로교회">
            <p class="err" data-for="church_name" hidden></p>
          </div>
          <div class="field">
            <label for="denomination">교단 <span class="opt">선택</span></label>
            <input type="text" id="denomination" name="denomination" placeholder="예: 예장합동">
          </div>
          <div class="field">
            <label for="contact_name">담당자 성함 <em class="req">필수</em></label>
            <input type="text" id="contact_name" name="contact_name" required autocomplete="name" placeholder="예: 김은혜">
            <p class="err" data-for="contact_name" hidden></p>
          </div>
          <div class="field">
            <label for="contact_role">직분 <span class="opt">선택</span></label>
            <select id="contact_role" name="contact_role">
              <option value="">선택해 주세요</option>
              <option>담임목사</option><option>부목사</option><option>전도사</option>
              <option>장로</option><option>집사</option><option>행정 간사</option><option>기타</option>
            </select>
          </div>
          <div class="field">
            <label for="phone">연락처 <em class="req">필수</em></label>
            <input type="tel" id="phone" name="phone" required autocomplete="tel" inputmode="tel" placeholder="010-0000-0000">
            <p class="err" data-for="phone" hidden></p>
          </div>
          <div class="field">
            <label for="email">이메일 <span class="opt">선택</span></label>
            <input type="email" id="email" name="email" autocomplete="email" placeholder="church@example.com">
            <p class="err" data-for="email" hidden></p>
          </div>
          <div class="field">
            <label for="location">교회 소재지 <em class="req">필수</em></label>
            <input type="text" id="location" name="location" required placeholder="예: 경기도 성남시 분당구">
            <p class="err" data-for="location" hidden></p>
          </div>
          <div class="field">
            <label for="size">출석 교인 수 <span class="opt">선택</span></label>
            <select id="size" name="size">
              <option value="">선택해 주세요</option>
              <option>50명 미만</option><option>50~150명</option><option>150~500명</option>
              <option>500~1,000명</option><option>1,000명 이상</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset class="fs" id="extraFieldset" hidden>
        <legend><span class="fs-no">+</span> 선택한 항목에 대한 추가 정보</legend>
        <p class="fs-help">선택하신 항목에 따라 필요한 내용만 표시됩니다. 모르는 항목은 비워두셔도 됩니다.</p>
        <div id="extraFields"></div>
      </fieldset>

      <fieldset class="fs">
        <legend><span class="fs-no">3</span> 상세 요청</legend>
        <div class="grid-2">
          <div class="field">
            <label for="budget">예산 범위 <span class="opt">선택</span></label>
            <select id="budget" name="budget">
              <option value="">선택해 주세요</option>
              <option>아직 정하지 못했습니다</option>
              <option>300만원 미만</option><option>300~1,000만원</option>
              <option>1,000~3,000만원</option><option>3,000만원 이상</option>
              <option>월 정기 계약 희망</option>
            </select>
          </div>
          <div class="field">
            <label for="timeline">희망 시작 시기 <span class="opt">선택</span></label>
            <select id="timeline" name="timeline">
              <option value="">선택해 주세요</option>
              <option>가능한 빨리</option><option>1개월 이내</option>
              <option>3개월 이내</option><option>6개월 이내</option><option>일정 미정</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label for="message">요청 내용 <em class="req">필수</em></label>
          <textarea id="message" name="message" rows="6" required placeholder="현재 상황과 필요하신 내용을 자유롭게 적어주세요. 예: 홈페이지가 5년째 방치되어 있고, 매주 주보도 담당 집사님이 혼자 만들고 계십니다."></textarea>
          <p class="err" data-for="message" hidden></p>
        </div>
        <div class="field">
          <label for="prefer">연락 선호 방법 <span class="opt">선택</span></label>
          <div class="radio-row">
            <label class="radio"><input type="radio" name="prefer" value="전화" checked><span>전화</span></label>
            <label class="radio"><input type="radio" name="prefer" value="문자/카카오톡"><span>문자 · 카카오톡</span></label>
            <label class="radio"><input type="radio" name="prefer" value="이메일"><span>이메일</span></label>
          </div>
        </div>
      </fieldset>

      <fieldset class="fs">
        <legend><span class="fs-no">4</span> 개인정보 수집 · 이용 동의</legend>
        <div class="consent-box" tabindex="0">
          <p><strong>수집 항목</strong> 교회명, 담당자 성함, 직분, 연락처, 이메일, 소재지, 신청 내용</p>
          <p><strong>수집 목적</strong> 지원 항목 상담, 견적 산출 및 진행 안내</p>
          <p><strong>보유 기간</strong> 상담 종료 후 1년 (관계 법령에 따른 보존 의무가 있는 경우 해당 기간)</p>
          <p><strong>거부 권리</strong> 동의를 거부하실 수 있으나, 이 경우 상담 진행이 어렵습니다.</p>
        </div>
        <label class="check-line">
          <input type="checkbox" id="consent" name="consent" required>
          <span>개인정보 수집 · 이용에 동의합니다. <em class="req">필수</em></span>
        </label>
        <p class="err" id="err-consent" hidden>개인정보 수집·이용에 동의해 주세요.</p>
        <label class="check-line">
          <input type="checkbox" name="marketing">
          <span>우리교회지원센터 소식과 교회 실무 자료를 받아보겠습니다. <span class="opt">선택</span></span>
        </label>
      </fieldset>

      <div class="form-submit">
        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn">신청서 제출하기</button>
        <p class="form-note">제출 후 접수번호가 발급됩니다. 문의: <a href="${site.contact.phoneHref}">${phoneText()}</a></p>
      </div>
      <p class="form-error" id="formError" hidden></p>
    </form>

    <div class="apply-done" id="applyDone" hidden>
      <div class="done-card">
        <span class="done-ico">${icon('check')}</span>
        <h2>신청이 접수되었습니다</h2>
        <p class="done-lead">영업일 기준 1~2일 안에 담당자가 연락드립니다.</p>
        <div class="done-code">
          <span>접수번호</span>
          <strong id="doneCode">—</strong>
          <button type="button" class="btn btn-outline btn-sm" id="copyCode">번호 복사</button>
        </div>
        <dl class="done-summary" id="doneSummary"></dl>
        <p class="done-hint">접수번호는 <a href="status.html">신청 조회</a> 페이지에서 다시 확인하실 수 있습니다.</p>
        <div class="done-actions">
          <a class="btn btn-primary" href="index.html">홈으로</a>
          <a class="btn btn-outline" href="status.html">신청 조회</a>
        </div>
      </div>
    </div>
  </div>
</section>
`;

  write(
    'apply.html',
    layout({
      title: '지원 신청 | 우리교회지원센터',
      description: '우리교회지원센터 지원 신청서. 필요한 항목을 선택해 신청하시면 담당자가 1~2일 내 연락드립니다.',
      base: '',
      active: 'apply.html',
      body,
      scripts: ['apply.js'],
    })
  );
}

/* =========================================================
   신청 조회
   ========================================================= */
function buildStatus() {
  const body = `
${pageHero({
  eyebrow: '신청 조회',
  title: '접수번호로 확인하기',
  lead: '신청 완료 화면에 표시된 접수번호를 입력하시면 접수 내용을 다시 확인하실 수 있습니다.',
})}

<section class="section">
  <div class="wrap narrow">
    <form class="lookup" id="lookupForm">
      <div class="field">
        <label for="code">접수번호</label>
        <div class="lookup-row">
          <input type="text" id="code" name="code" placeholder="CAPS-260812-4821" autocomplete="off" spellcheck="false">
          <button type="submit" class="btn btn-primary">조회</button>
        </div>
        <p class="err" id="lookupErr" hidden></p>
      </div>
    </form>

    <div id="lookupResult" hidden></div>

    <div class="notice-card" id="recentBox" hidden>
      <h3>이 기기에서 최근 신청한 내역</h3>
      <ul class="recent-list" id="recentList"></ul>
    </div>

    <div class="notice-card">
      <p>
        접수번호를 잊으셨다면 <a href="${site.contact.phoneHref}">${phoneText()}</a> 로 전화 주시거나
        <a href="mailto:${esc(site.contact.email)}">${emailText()}</a> 로 교회명과 담당자 성함을 보내주세요. 확인해 안내드립니다.
      </p>
    </div>
  </div>
</section>
`;

  write(
    'status.html',
    layout({
      title: '신청 조회 | 우리교회지원센터',
      description: '접수번호로 우리교회지원센터 지원 신청 내역을 조회합니다.',
      base: '',
      active: 'status.html',
      body,
      scripts: ['status.js'],
    })
  );
}

/* =========================================================
   문의
   ========================================================= */
/* =========================================================
   요금제
   ========================================================= */
const won = (n) => n.toLocaleString('ko-KR');

function planCard(p) {
  const monthly = p.free ? '0원' : `${won(p.price)}원`;
  const perMonth = p.free ? '' : `${won(Math.round(p.yearly / 12))}원`;

  return `<article class="plan${p.popular ? ' is-popular' : ''}${p.free ? ' is-free' : ''}" id="plan-${p.id}">
      ${p.popular ? '<span class="plan-flag">가장 많이 고르십니다</span>' : ''}
      <h3 class="plan-name">${esc(p.name)}</h3>
      <p class="plan-tag">${esc(p.tagline)}</p>

      <p class="plan-price" data-month="${monthly}" data-year="${perMonth || monthly}">
        <strong>${monthly}</strong><span>${p.free ? '' : ' / 월'}</span>
      </p>
      ${p.free
        ? '<p class="plan-sub">가입비도 월 요금도 없습니다</p>'
        : `<p class="plan-sub plan-year">연납 ${won(p.yearly)}원 — <b>2개월 무료</b></p>`}

      <p class="plan-lead">${esc(p.lead)}</p>

      <dl class="plan-quota">
        <div><dt>나눔집</dt><dd>${esc(p.quota.sharing)}</dd></div>
        <div><dt>AI 숏츠</dt><dd>${esc(p.quota.shorts)}</dd></div>
      </dl>

      ${p.inherits ? `<p class="plan-inherit">${esc(p.inherits)} 요금제에 더해서</p>` : ''}
      <ul class="plan-list">
        ${p.includes.map((t) => `<li>${icon('check', 'ico ico-xs')}<span>${esc(t)}</span></li>`).join('\n        ')}
      </ul>
      ${p.note ? `<p class="plan-note">${esc(p.note)}</p>` : ''}

      <a class="btn ${p.popular ? 'btn-primary' : 'btn-ghost'} plan-cta"
         href="apply.html?plan=${p.id}">${p.free ? '무료로 시작하기' : '30일 체험 신청'}</a>
    </article>`;
}

function buildPricing() {
  /* 요금제를 다시 짜는 동안 내용을 내려 둡니다.
     주소는 살려 두고(들어오시는 분이 404 를 만나지 않게) 안내만 보여 줍니다.
     요금제 내용(plans · trial · invite)은 src/data/site.js 에 그대로 있으니,
     다시 여실 때는 이 함수만 예전 모양으로 되돌리면 됩니다. */
  const body = `
${pageHero({
  eyebrow: '요금제',
  title: '요금제를 다시 짜고 있습니다',
  lead: '더 알맞은 기준으로 고쳐 쓰는 중입니다. 준비되는 대로 이 자리에 올려 드리겠습니다.',
})}

<section class="section">
  <div class="wrap narrow">
    <div class="renew-box">
      <h2>지금은 요금을 안내해 드리지 못합니다</h2>
      <p>
        비용이 궁금하시면 전화나 문의로 알려 주세요. 지금 필요하신 항목만 놓고
        견적을 따로 내어 드립니다. 상담과 견적에는 비용이 들지 않습니다.
      </p>
      <div class="renew-actions">
        <a class="btn btn-primary btn-lg" href="apply.html">지원 신청하기 ${icon('arrow', 'ico ico-sm')}</a>
        <a class="btn btn-outline btn-lg" href="contact.html">문의하기</a>
      </div>
      <p class="renew-fine">
        홈페이지 · 인투오피스처럼 이미 금액이 정해진 항목은
        <a href="services/index.html">지원 항목</a> 에서 그대로 보실 수 있습니다.
      </p>
    </div>
  </div>
</section>

${ctaBand('')}
`;

  write(
    'pricing.html',
    layout({
      title: '요금제 (준비 중) | 우리교회지원센터',
      description:
        '요금제를 다시 짜고 있습니다. 준비되는 대로 안내해 드리며, '
        + '그 사이에는 필요하신 항목만 놓고 견적을 따로 내어 드립니다.',
      base: '',
      active: 'pricing.html',
      body,
    })
  );
}

function buildContact() {
  const body = `
${pageHero({
  eyebrow: '문의',
  title: '편한 방법으로<br>연락 주세요',
  lead: '신청서를 남기시는 것이 가장 빠르지만, 먼저 물어보고 싶은 것이 있으시면 전화나 이메일로 연락 주셔도 됩니다.',
})}

<section class="section">
  <div class="wrap">
    <div class="contact-grid">
      <a class="contact-card" href="${site.contact.phoneHref}">
        <span class="contact-ico">${icon('phoneCall')}</span>
        <h2>전화 문의</h2>
        <strong>${phoneText()}</strong>
        <p>${hoursText()}</p>
      </a>
      <a class="contact-card" href="mailto:${esc(site.contact.email)}">
        <span class="contact-ico">${icon('mail')}</span>
        <h2>이메일</h2>
        <strong class="is-email">${emailText()}</strong>
        <p>영업일 기준 1일 이내 회신드립니다.</p>
      </a>
      <a class="contact-card is-accent" href="apply.html">
        <span class="contact-ico">${icon('doc')}</span>
        <h2>지원 신청</h2>
        <strong>신청서 작성하기</strong>
        <p>가장 빠른 방법입니다. 접수 후 1~2일 내 담당자가 연락드립니다.</p>
      </a>
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap narrow">
    ${sectionHead('찾아오시는 길', '방문 상담은 사전 예약제로 운영합니다')}
    <div class="notice-card">
      <ul class="footer-contact contact-list">
        <li>${icon('pin', 'ico ico-sm')} ${addressText()}</li>
        <li>${icon('clock', 'ico ico-sm')} ${hoursText()}</li>
        <li>${icon('phoneCall', 'ico ico-sm')} <span>방문 전 <a href="${site.contact.phoneHref}">${phoneText()}</a> 로 예약해 주세요.</span></li>
      </ul>
    </div>
  </div>
</section>

${ctaBand('')}
`;

  write(
    'contact.html',
    layout({
      title: '문의 | 우리교회지원센터',
      description: '우리교회지원센터 전화·이메일 문의 및 방문 안내.',
      base: '',
      active: 'contact.html',
      body,
    })
  );
}

/* =========================================================
   부동산 매물 게시판

   센터가 하는 일은 게시판 관리뿐입니다.
   대신 아무나 남의 건물을 올리지 못하도록 등록할 때
   권리 증빙 서류(등기부등본 · 임대차계약서 등)를 받고,
   관리자가 확인한 글만 게시합니다.
   ========================================================= */
function buildListings() {
  const board = site.listingBoard;
  const fee = board.fee.toLocaleString('ko-KR');

  const doList = board.does.map((t) => `<li>${esc(t)}</li>`).join('\n        ');


  const regionOpts = ['<option value="">전체 지역</option>']
    .concat(['서울', '경기', '인천', '강원', '대전', '세종', '충남', '충북',
      '광주', '전남', '전북', '대구', '경북', '부산', '울산', '경남', '제주']
      .map((r) => `<option>${r}</option>`))
    .join('');

  const kinds = [
    ['rent_monthly', '월세'],
    ['rent_jeonse', '전세'],
    ['sale', '매매'],
    ['share', '공간 공유 · 대여'],
  ];
  const kindFilter = ['<option value="">전체 종류</option>']
    .concat(kinds.map(([v, l]) => `<option value="${v}">${l}</option>`))
    .join('');
  const kindOpts = kinds.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

  /* 주 용도 — '기타'를 고르면 직접 입력칸이 열립니다.
     (assets/js/db.js 의 LISTING_USES 와 같은 목록을 유지해야 합니다) */
  const uses = [
    ['church', '교회'],
    ['education', '교육관'],
    ['prayer', '기도원'],
    ['retreat', '수양관'],
    ['land', '종교부지'],
    ['other', '기타'],
  ];
  const useOpts = uses.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  const useFilter = ['<option value="">전체 용도</option>']
    .concat(uses.filter(([v]) => v !== 'other').map(([v, l]) => `<option value="${v}">${l}</option>`))
    .join('');

  /** 예시를 눌러 그대로 넣을 수 있는 칩 */
  const egChips = (target, items) => `<div class="ls-eg" data-eg="${target}">
            <span class="ls-eg-label">예시</span>
            ${items.map((t) => `<button type="button" class="ls-eg-chip">${esc(t)}</button>`).join('\n            ')}
          </div>`;

  const titleExamples = [
    '뷰가 좋은 3층 예배실 — 한강 조망, 주차 12대',
    '지하철 5분 · 주차 8대, 2층 예배 공간 65평',
    '리모델링 완료된 교육관 — 소그룹실 3칸',
    '단독 건물 전체, 사택 포함 (즉시 입주)',
    '상가 1층 · 간판 설치 가능, 유동인구 많은 자리',
  ];

  /* 연락 가능 시간은 교회 일정에 매여 있어, 빈칸에서 문장을 짓기가 번거롭습니다.
     그래서 흔한 예배 · 사역 시간을 조각으로 두고 눌러서 더하게 했습니다.
     시간 숫자는 넣은 뒤 칸에서 직접 고치면 됩니다. */
  const hoursOk = [
    '평일 낮 10–18시',
    '평일 저녁 7–9시',
    '토요일 10–17시',
    '주일 오후 2–5시',
    '문자 남겨주시면 회신',
  ];
  const hoursAvoid = [
    '주일 오전 9–12시',
    '주일 오후 1–3시',
    '수요 예배 저녁 7–9시',
    '금요 기도회 밤 9–11시',
    '새벽 기도 5–7시',
  ];

  const hoursPicker = `<div class="ls-eg is-pick" data-eg="lsFHours">
            <div class="ls-eg-row">
              <span class="ls-eg-label">연락 되는 때</span>
              ${hoursOk.map((t) => `<button type="button" class="ls-eg-chip" data-add="ok">${esc(t)}</button>`).join('\n              ')}
            </div>
            <div class="ls-eg-row">
              <span class="ls-eg-label is-avoid">예배 · 기도회</span>
              ${hoursAvoid.map((t) => `<button type="button" class="ls-eg-chip is-avoid" data-add="avoid">${esc(t)}</button>`).join('\n              ')}
            </div>
            <p class="ls-eg-tip">
              누르면 <strong>칸에 더해집니다</strong> — 여러 개 고르셔도 됩니다.
              아래쪽(예배 · 기도회)은 <strong>&ldquo;… 제외&rdquo;</strong>로 들어갑니다.
              시간(<code>9–12시</code>)이 교회마다 다르니, 넣으신 뒤 칸에서 직접 고쳐 주세요.
            </p>
          </div>`;

  const regionFormOpts = '<option value="">선택해 주세요</option>' +
    ['서울', '경기', '인천', '강원', '대전', '세종', '충남', '충북',
      '광주', '전남', '전북', '대구', '경북', '부산', '울산', '경남', '제주']
      .map((r) => `<option>${r}</option>`).join('');

  /** 금액 입력칸 (종류에 따라 보였다 숨습니다) */
  const money = (id, label, kindsFor, hint) => `<div class="field ls-money" data-kinds="${kindsFor}">
            <label for="${id}">${esc(label)}</label>
            <div class="ls-won"><input type="text" id="${id}" inputmode="numeric" autocomplete="off" placeholder="0"><span>원</span></div>
            <small class="hint" id="${id}Hint">${esc(hint || '')}</small>
          </div>`;

  const body = `
${boardTabs('', 'listings.html')}

${pageHero({
  eyebrow: '부동산 · 매물 게시판',
  title: '교회 매물을<br>직접 올리고, 직접 찾습니다',
  lead: '예배 공간을 내놓는 교회와 구하는 교회가 서로 만나는 게시판입니다. '
    + '서류를 확인한 글만 올라갑니다 — 허위 매물 걱정 없이 조건만 보세요.',
  extra: `<div class="ls-hero-meta">
      <span class="ls-hero-pill">등록비 <strong>${fee}원</strong> / 건</span>
      <span class="ls-hero-pill">게시 <strong>팔릴 때까지</strong></span>
      <span class="ls-hero-pill">사진 <strong>최대 ${board.photoMax}장</strong></span>
      <span class="ls-hero-pill is-key">권리 증빙 서류 <strong>필수</strong></span>
    </div>
    <div class="ls-hero-actions">
      <a class="btn btn-gold btn-lg" href="#new" id="lsNewBtn">매물 등록하기 ${icon('arrow', 'ico ico-sm')}</a>
      <a class="btn btn-outline btn-lg" href="#mine">내가 올린 매물</a>
    </div>`,
})}

<!-- ============ 목록 ============ -->
<section class="section" id="lsBoard">
  <div class="wrap">
    <div class="ls-bar">
      <div class="ls-search">
        ${icon('doc', 'ico ico-sm')}
        <input type="search" id="lsQ" placeholder="지역 · 제목으로 검색 (예: 부천, 예배실)" aria-label="매물 검색">
      </div>
      <select id="lsKind" aria-label="매물 종류">${kindFilter}</select>
      <select id="lsUse" aria-label="주 용도">${useFilter}</select>
      <select id="lsRegion" aria-label="지역">${regionOpts}</select>
      <span class="ls-count" id="lsCount"></span>
    </div>

    <div class="ls-grid" id="lsList" aria-live="polite">
      <p class="ls-loading">매물을 불러오는 중입니다…</p>
    </div>

    <div class="ls-empty" id="lsEmpty" hidden>
      <h2>아직 게시된 매물이 없습니다</h2>
      <p>조건을 바꿔 다시 찾아보시거나, 가지고 계신 매물을 먼저 올려 주세요.</p>
      <a class="btn btn-primary" href="#new">매물 등록하기</a>
    </div>

    <div class="ls-scope">
      <div class="ls-scope-card is-do">
        <h2>${icon('check', 'ico ico-sm')} 센터가 해 드리는 일</h2>
        <ul>
        ${doList}
        </ul>
      </div>
      <div class="ls-scope-card is-tip">
        <h2>계약 전에 꼭 확인하세요</h2>
        <p class="ls-scope-note">
          마음에 드는 공간을 찾으셨다면, 계약 전에 <strong>용도 변경 가능 여부, 주차와 소음,
          교회 명의 등기</strong>를 확인해 두시는 것이 좋습니다. 나중에 바로잡기 어려운 것들입니다.
          관할 지자체 건축과와 공인중개사 · 법무사 · 세무사에게 확인해 주세요.
        </p>
        <p class="ls-scope-fine">${esc(board.fineprint)}</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ 상세 ============ -->
<section class="section" id="lsDetail" hidden>
  <div class="wrap narrow">
    <a class="ls-back" href="#list">← 목록으로</a>
    <div id="lsDetailBody"></div>
  </div>
</section>

<!-- ============ 내가 올린 매물 ============ -->
<section class="section" id="lsMine" hidden>
  <div class="wrap narrow">
    <a class="ls-back" href="#list">← 목록으로</a>
    ${sectionHead('내 매물', '내가 올린 매물', '상태와 관리자 확인 결과를 여기에서 보실 수 있습니다.', 'left')}
    <div id="lsMineBody"></div>
  </div>
</section>

<!-- ============ 등록 ============ -->
<section class="section" id="lsNew" hidden>
  <div class="wrap narrow">
    <a class="ls-back" href="#list">← 목록으로</a>
    ${sectionHead('매물 등록', '매물 등록하기',
      '작성해 주신 내용이 그대로 게시됩니다. 관리자가 권리 증빙 서류를 확인한 뒤 게시됩니다.', 'left')}

    <div class="notice-card ls-guard">
      <h3>${icon('check', 'ico ico-sm')} 왜 서류를 받나요?</h3>
      <p>
        아무나 남의 건물을 올릴 수 있으면 이 게시판을 아무도 믿을 수 없습니다.
        그래서 <strong>소유자는 등기부등본</strong>, <strong>현재 세입자는 임대차계약서</strong>,
        <strong>대리인은 위임장</strong>으로 권리를 확인합니다.
      </p>
      <p class="ls-guard-safe">
        올려 주신 서류는 <strong>게시판에 공개되지 않습니다.</strong>
        올린 본인과 확인 담당자만 열 수 있고, 게시가 끝나면 삭제를 요청하실 수 있습니다.
      </p>
    </div>

    <div class="auth-gate" id="lsGate" hidden>
      <p>매물 등록은 로그인 후 이용하실 수 있습니다. 등록 후 진행 상태를 알려드리기 위해 계정이 필요합니다.</p>
      <button type="button" class="btn btn-primary" id="lsGateLogin">로그인 · 회원가입</button>
    </div>

    <form class="ls-form" id="lsForm" novalidate hidden>
      <input type="hidden" id="lsEditId" value="">

      <fieldset class="ls-fs">
        <legend><span class="ls-step">1</span> 어떤 매물인가요?</legend>
        <div class="grid-2">
          <div class="field">
            <label for="lsFKind">매물 종류 <em>*</em></label>
            <select id="lsFKind" required>${kindOpts}</select>
          </div>
          <div class="field">
            <label for="lsFUse">주 용도 <em>*</em></label>
            <select id="lsFUse" required>${useOpts}</select>
          </div>
          <div class="field" id="lsUseOtherBox" hidden>
            <label for="lsFUseOther">용도 직접 입력 <em>*</em></label>
            <input type="text" id="lsFUseOther" maxlength="20" placeholder="예: 선교관, 카페 겸용">
          </div>
        </div>
        <div class="field">
          <label for="lsFTitle">제목 <em>*</em></label>
          <input type="text" id="lsFTitle" maxlength="60" required
            placeholder="예: 뷰가 좋은 3층 예배실 — 한강 조망, 주차 12대">
          <small class="hint">
            보시는 분이 <strong>한 줄만 읽고도 판단</strong>할 수 있게, 가장 큰 장점을 앞에 적어 주세요.
            (최대 60자 · <span id="lsTitleCount">0</span>자)
          </small>
          ${egChips('lsFTitle', titleExamples)}
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="lsFRegion">지역 <em>*</em></label>
            <select id="lsFRegion" required>${regionFormOpts}</select>
          </div>
          <div class="field">
            <label for="lsFAddr">위치 <em>*</em></label>
            <input type="text" id="lsFAddr" required placeholder="예: 경기 부천시 원미구">
            <small class="hint">동 단위까지만 적어 주세요. 상세 주소는 공개되지 않습니다.</small>
          </div>
        </div>
      </fieldset>

      <fieldset class="ls-fs">
        <legend><span class="ls-step">2</span> 공간 정보</legend>
        <div class="grid-3">
          <div class="field">
            <label for="lsFArea">면적</label>
            <input type="text" id="lsFArea" placeholder="예: 65평 (215㎡)">
          </div>
          <div class="field">
            <label for="lsFFloor">층</label>
            <input type="text" id="lsFFloor" placeholder="예: 2층 / 5층">
          </div>
          <div class="field">
            <label for="lsFParking">주차</label>
            <input type="text" id="lsFParking" placeholder="예: 8대 (주일 추가 협의)">
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="lsFMoveIn">입주 가능 시기</label>
            <input type="text" id="lsFMoveIn" placeholder="예: 협의 가능 / 2026년 10월 이후">
          </div>
          <div class="field">
            <label for="lsFReligious">종교시설 사용</label>
            <input type="text" id="lsFReligious" placeholder="예: 건물주 동의 완료 / 확인 필요">
            <small class="hint">교회가 들어갈 수 있는지가 가장 많이 묻는 항목입니다.</small>
          </div>
        </div>
      </fieldset>

      <fieldset class="ls-fs">
        <legend><span class="ls-step">3</span> 금액</legend>
        <div class="grid-2">
          ${money('lsFDeposit', '보증금 · 전세금', 'rent_monthly rent_jeonse')}
          ${money('lsFMonthly', '월세 · 대여료', 'rent_monthly share')}
          ${money('lsFSale', '매매가', 'sale')}
          ${money('lsFMaint', '관리비 (월)', 'rent_monthly rent_jeonse share', '없으면 비워 두세요.')}
        </div>
      </fieldset>

      <fieldset class="ls-fs">
        <legend><span class="ls-step">4</span> 사진 <em class="ls-legend-note">최대 ${board.photoMax}장</em></legend>
        <p class="ls-fs-help">
          사진이 있는 글이 훨씬 많이 열립니다.
          <strong>${board.photoMin}~${board.photoRecTop}장</strong>이면 충분합니다 —
          예배 공간 전경, 강단 쪽, 입구 · 외관, 주차장.
          <strong>${board.photoMax}장까지</strong> 올리실 수 있습니다.
          <br>올리면 브라우저에서 자동으로 크기를 줄이므로 원본을 그대로 선택하셔도 됩니다.
        </p>

        <div class="field">
          <label class="ls-photo-add" for="lsFPhotos">
            ${icon('doc', 'ico')}
            <span><strong>사진 선택하기</strong><small>여러 장을 한 번에 고르실 수 있습니다 (JPG · PNG · HEIC)</small></span>
          </label>
          <input type="file" id="lsFPhotos" accept="image/*" multiple class="ls-file-input">
          <small class="hint">
            첫 번째 사진이 목록의 대표 사진이 됩니다. 순서는 올린 뒤 바꾸실 수 있습니다.
            사람 얼굴이나 개인 정보가 찍힌 사진은 피해 주세요.
          </small>
        </div>

        <p class="ls-photo-status" id="lsPhotoStatus" hidden></p>
        <div class="ls-photo-grid" id="lsPhotoGrid"></div>
      </fieldset>

      <fieldset class="ls-fs">
        <legend><span class="ls-step">5</span> 설명과 연락처</legend>
        <div class="field">
          <label for="lsFDesc">상세 설명 <em>*</em></label>
          <textarea id="lsFDesc" rows="7" required
            placeholder="공간 상태, 강단·음향 설비, 엘리베이터, 주변 여건, 협의 가능한 조건 등을 적어 주세요."></textarea>
          <small class="hint">개인 주민번호나 계좌번호는 적지 마세요. 그대로 공개됩니다.</small>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="lsFName">연락받을 성함 <em>*</em></label>
            <input type="text" id="lsFName" required placeholder="예: 김○○ 집사">
          </div>
          <div class="field">
            <label for="lsFPhone">연락처 <em>*</em></label>
            <input type="tel" id="lsFPhone" required placeholder="010-0000-0000">
            <small class="hint">게시판에 공개됩니다. 문의 전화를 직접 받으실 번호를 적어 주세요.</small>
          </div>
        </div>
        <div class="field">
          <label for="lsFHours">연락 가능 시간 <em>*</em></label>
          <input type="text" id="lsFHours" maxlength="140" required
            placeholder="예: 평일 낮 10–18시 · 토요일 10–17시 / 주일 오전 9–12시 제외">
          <small class="hint">
            <strong>보시는 분이 이 시간을 먼저 확인하고 전화합니다.</strong>
            사역 중이나 새벽에 전화받지 않으시려면 꼭 적어 주세요.
          </small>
          ${hoursPicker}
        </div>
      </fieldset>

      <fieldset class="ls-fs is-proof">
        <legend><span class="ls-step">6</span> 권리 증명 <em>*</em></legend>

        <div class="field">
          <span class="label-txt">이 매물에 대해 어떤 분이신가요? <em>*</em></span>
          <div class="ls-holder" id="lsHolder">
            ${[
              ['owner', '소유자 (임대인)', '내 건물 · 내 상가를 내놓습니다', true],
              ['tenant', '임차인 (현재 세입자)', '지금 쓰고 있는 공간을 넘깁니다', false],
              ['agent', '위임받은 대리인', '소유자 · 세입자를 대신해 올립니다', false],
            ].map(([v, t, d, on]) => `<label class="pick">
              <input type="radio" name="lsHolder" value="${v}"${on ? ' checked' : ''}>
              <span class="pick-in">
                <span class="pick-text"><strong>${esc(t)}</strong><small>${esc(d)}</small></span>
                <span class="pick-mark">${icon('check', 'ico ico-xs')}</span>
              </span></label>`).join('\n            ')}
          </div>
        </div>

        <div class="field">
          <label for="lsFProofKind">첨부하는 서류 <em>*</em></label>
          <select id="lsFProofKind" required></select>
          <small class="hint" id="lsProofHint"></small>
        </div>

        <div class="field">
          <label for="lsFProof">서류 파일 <em>*</em></label>
          <input type="file" id="lsFProof" accept="application/pdf,image/*" required>
          <small class="hint">PDF 또는 사진(JPG · PNG), 10MB 이하. 이름 · 주소 · 금액이 보이도록 올려 주세요.</small>
          <p class="ls-file" id="lsFileInfo" hidden></p>
        </div>

        <div class="ls-vow">
          <label class="chk"><input type="checkbox" id="lsVow1">
            <span>제출한 서류상 <strong>제가 이 매물의 권리자(또는 위임받은 사람)</strong>임을 확인합니다.</span></label>
          <label class="chk"><input type="checkbox" id="lsVow2">
            <span>적은 <strong>내용과 금액이 사실</strong>이며, 조건이 바뀌면 직접 수정하겠습니다.</span></label>
          <label class="chk"><input type="checkbox" id="lsVow3">
            <span>허위 · 중복 · 광고성 글로 확인되면 <strong>사전 통보 없이 삭제되고 등록비는 환불되지 않는다</strong>는 점에 동의합니다.</span></label>
          <label class="chk"><input type="checkbox" id="lsVow4">
            <span>센터는 <strong>게시판 운영</strong>까지이며, <strong>연락 · 협상 · 계약은 제가 직접 진행</strong>한다는 점을 이해했습니다.</span></label>
        </div>
      </fieldset>

      <div class="ls-fee">
        <h3>등록비 ${fee}원 · 팔릴 때까지 게시</h3>
        <p class="ls-fee-lead">
          <strong>지금 입금하지 않으셔도 됩니다.</strong>
          서류를 먼저 확인한 뒤 계좌를 보내드립니다.
        </p>
        <ol class="ls-fee-steps">
          <li><span>1</span><div><strong>등록 신청</strong>
            지금 이 버튼을 누르시면 <em>승인 대기</em> 로 접수됩니다. 아직 공개되지 않습니다.</div></li>
          <li><span>2</span><div><strong>서류 확인 · 계좌 안내</strong>
            관리자가 권리 증빙 서류를 확인하고 승인하면,
            <em>입금 계좌를 카카오톡으로 보내드립니다.</em> 보통 영업일 1일 이내입니다.</div></li>
          <li><span>3</span><div><strong>입금</strong>
            받으신 계좌로 등록비 ${fee}원을 보내 주세요.</div></li>
          <li><span>4</span><div><strong>게시</strong>
            <em>입금이 확인되면 게시글이 올라갑니다.</em> 기한은 없습니다 — 거래가 끝날 때까지 올라가 있습니다.
            팔리시면 <a href="#mine">내가 올린 매물</a> 에서 <strong>[거래 완료]</strong> 를 눌러 내려 주세요.</div></li>
        </ol>
        <p class="ls-fee-note">
          서류가 맞지 않으면 사유와 함께 반려되며, 이 경우 <strong>입금 안내를 보내지 않습니다</strong> —
          돈이 먼저 나가는 일은 없습니다.
          진행 상태는 <a href="#mine">내가 올린 매물</a> 에서 언제든 확인하실 수 있습니다.
        </p>
      </div>

      <p class="auth-err" id="lsFormErr" hidden></p>
      <p class="auth-ok" id="lsFormOk" hidden></p>

      <div class="ls-submit">
        <button type="submit" class="btn btn-primary btn-lg" id="lsSubmit">등록 신청하기</button>
        <a class="btn btn-ghost" href="#list">취소</a>
      </div>
    </form>
  </div>
</section>

${ctaBand('', {
  title: '내놓으실 공간이 있으신가요?',
  lead: '권리 증빙 서류만 준비되면 6만원 한 번으로 팔릴 때까지 올려 드립니다. '
    + '게시판 이용이나 다른 지원 항목이 궁금하시면 편하게 문의해 주세요.',
})}
`;

  write(
    'listings.html',
    layout({
      title: '교회 매물 게시판 | 우리교회지원센터',
      description:
        '교회 예배 공간 매매 · 임대 매물 게시판. 등기부등본이나 임대차계약서로 권리를 확인한 매물만 게시합니다. '
        + `등록비 ${fee}원 한 번으로 거래가 끝날 때까지 게시됩니다.`,
      base: '',
      active: 'listings.html',
      body,
      scripts: ['listings.js'],
    })
  );
}

/* =========================================================
   보안 규칙을 관리자 화면에서 복사할 수 있도록 내보냅니다.
   firestore.rules 가 원본이고, 이 파일은 그 사본입니다.
   ========================================================= */
function buildSupabaseSql() {
  const dir = path.join(ROOT, 'supabase', 'migrations');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (!files.length) return;

  const version = files[files.length - 1].split('_')[0];
  const header = `-- =========================================================
-- 우리교회지원센터 (WCSC) — Supabase 전체 설정
--
-- WCSC_SUPABASE_VERSION: ${version}
--
-- 새 Supabase 프로젝트를 쓰실 때는 이 파일 하나를 SQL Editor 에 통째로
-- 붙여넣고 실행하시면 됩니다. 표 · 접근 규칙(RLS) · 저장소 버킷 ·
-- 가입 트리거가 한 번에 만들어집니다.
--
-- 이 파일은 supabase/migrations/*.sql 을 순서대로 이어 붙인 것입니다.
-- 직접 고치지 마시고, 마이그레이션 파일을 고친 뒤 npm run build 를 실행하세요.
-- =========================================================

`;

  const body = files
    .map((f) => `-- ---------------------------------------------------------\n-- ${f}\n-- ---------------------------------------------------------\n\n` +
      fs.readFileSync(path.join(dir, f), 'utf8').trimEnd())
    .join('\n\n\n');

  write('supabase.sql', header + body + '\n');

  // 관리자 [보안 규칙] 화면에서 그대로 복사할 수 있도록 내보냅니다.
  return { version, text: header + body + '\n' };
}

function buildRulesScript(sql) {
  const text = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const version = (text.match(/CAPS_RULES_VERSION:\s*([\w.-]+)/) || [])[1] || '(미표기)';

  // 매물 증빙 서류를 지키는 저장소 규칙도 함께 내보냅니다.
  const stFile = path.join(ROOT, 'storage.rules');
  const stText = fs.existsSync(stFile) ? fs.readFileSync(stFile, 'utf8') : '';
  const stVersion = (stText.match(/CAPS_STORAGE_VERSION:\s*([\w.-]+)/) || [])[1] || '(미표기)';

  const js = `/* build.js 가 supabase/migrations · firestore.rules · storage.rules 에서
   생성한 파일입니다. 직접 수정하지 마세요.
   내용을 바꿀 때는 원본 파일을 고치고 \`npm run build\` 를 실행하세요. */
window.CAPS_SUPABASE_SQL = ${JSON.stringify((sql && sql.text) || '')};
window.CAPS_SUPABASE_SQL_VERSION = ${JSON.stringify((sql && sql.version) || '(미표기)')};
window.CAPS_FIRESTORE_RULES = ${JSON.stringify(text)};
window.CAPS_FIRESTORE_RULES_VERSION = ${JSON.stringify(version)};
window.CAPS_STORAGE_RULES = ${JSON.stringify(stText)};
window.CAPS_STORAGE_RULES_VERSION = ${JSON.stringify(stVersion)};
`;
  write('assets/js/rules-text.js', js);
}

/* =========================================================
   브라우저용 데이터 파일
   ========================================================= */
/* =========================================================
   찾아보기 목록 (assets/js/search-index.js)

   사이트가 커지면서 "그 기능이 어디 있더라" 가 됩니다.
   메뉴를 다 뒤지지 않고 한 칸에 적어 찾도록, 페이지 · 지원 항목 ·
   게시판 · 자주 묻는 질문을 미리 한 벌로 만들어 둡니다.

   게시판에 올라온 실제 글(매물 · 공고 등)은 여기 넣지 않습니다 —
   수시로 바뀌므로 찾을 때 그 자리에서 읽어 옵니다.
   ========================================================= */
function buildSearchIndex() {
  const rows = [];
  const add = (o) => rows.push(o);

  /* 주요 페이지 */
  [
    ['index.html', '홈', '우리교회지원센터가 하는 일을 한눈에', '페이지', '처음 메인 홈'],
    ['about.html', '센터 소개', '어떤 사람들이 무엇을 위해 모였는지', '페이지', '소개 우리 누구'],
    ['services/index.html', '지원 항목 전체', '센터가 해 드리는 일 전부', '페이지', '서비스 목록'],
    ['process.html', '이용 절차', '신청부터 시작까지 어떻게 진행되는지', '페이지', '순서 진행 방법'],
    ['faq.html', '자주 묻는 질문', '많이 물어보시는 것들을 모았습니다', '페이지', 'FAQ 질문'],
    ['contact.html', '문의', '전화 · 카카오톡 · 이메일로 여쭤보기', '페이지', '연락처 상담 전화'],
    ['apply.html', '지원 신청', '필요한 것을 적어 보내 주시면 연락드립니다', '페이지', '신청서 접수'],
    ['status.html', '신청 현황', '내가 넣은 신청이 어디까지 갔는지', '페이지', '진행 상황 조회'],
  ].forEach(([url, title, desc, cat, kw]) => add({ url, title, desc, cat, kw }));

  /* 큰 갈래 */
  categories.forEach((c) => add({
    url: `services/index.html#${c.id}`,
    title: c.name, desc: c.tagline, cat: '갈래', kw: c.desc,
  }));

  /* 지원 항목 하나하나 — 여기가 사람들이 가장 많이 찾는 곳입니다 */
  services.forEach((s) => add({
    url: `services/${s.slug}.html`,
    title: s.name,
    desc: s.tagline,
    cat: '지원 항목',
    kw: [s.short, s.summary,
      (s.features || []).map((f) => f.title || f).join(' '),
      (s.deliverables || []).join(' '),
      (s.problems || []).map((x) => x.title).join(' ')].join(' '),
  }));

  /* 사람들이 실제로 치는 말 — 우리가 쓰는 이름과 다릅니다.
     "사택" 을 치면 게스트하우스가, "얼마" 를 치면 비용이 나와야 합니다. */
  const SYNONYM = {
    'services/sound.html': '스피커 마이크 믹서 앰프 소리 하울링 음향장비 설치',
    'services/homepage.html': '웹사이트 홈피 사이트 도메인 제작 만들기',
    'services/smartchurch.html': '앱 어플 모바일 주보앱 출석',
    'services/shorts.html': '영상 편집 유튜브 릴스 설교영상',
    'services/design.html': '현수막 배너 포스터 명함 로고 인쇄 디자인',
    'services/staffing.html': '전도사 목사 사역자 청빙 채용 구인 교역자',
    'services/realestate.html': '교회 매매 임대 상가 건물 부동산 이전',
    'services/sharing.html': '나눔집 소그룹 교재 순모임 성경공부',
    'services/intooffice.html': '행정 서류 결재 문서 전자결재 사무',
    'services/akc.html': '수련회 집회 컨퍼런스 대회',
    'services/community.html': '커뮤니티 모임 기도요청 중보 광고',
  };
  rows.forEach((r) => { if (SYNONYM[r.url]) r.kw = (r.kw || '') + ' ' + SYNONYM[r.url]; });

  /* 게시판 */
  const BOARD_KW = {
    'listings.html': '교회 매매 임대 상가 건물 부동산 매물 이전 예배당 자리',
    'market.html': '중고 스피커 마이크 믹서 앰프 악기 피아노 의자 강대상 싸게 사기 팔기',
    'guesthouse.html': '사택 선교관 숙소 숙박 방 머물 곳 선교사 유학생 게스트하우스 잠자리',
    'tickets.html': '집회 수련회 세미나 예매 티켓 신청 참가 좌석',
    'jobs.html': '전도사 목사 반주자 찬양인도자 간사 채용 구인 구직 사역지 청빙 사택 사례비',
  };
  T.BOARDS.forEach((b) => add({
    url: b.href, title: b.label, desc: b.sub, cat: '게시판', kw: BOARD_KW[b.href] || '',
  }));
  add({ url: 'listings.html#new', title: '매물 올리기', desc: '교회 부동산을 게시판에 내놓기', cat: '게시판', kw: '등록 매매 임대' });
  add({ url: 'market.html#new', title: '중고 물품 팔기', desc: '쓰던 음향 · 악기 · 집기를 내놓기', cat: '게시판', kw: '등록 판매 중고' });
  add({ url: 'market.html#install', title: '설치 대행 신청', desc: '사 오신 장비를 예배당에 달아 드립니다', cat: '게시판', kw: '음향 설치 시공 견적' });
  add({ url: 'guesthouse.html#new', title: '방 내어 놓기', desc: '비어 있는 사택 · 선교관을 나누기', cat: '게시판', kw: '등록 숙소' });
  add({ url: 'tickets.html#new', title: '집회 등록하기', desc: '집회 · 수련회 신청을 받기', cat: '게시판', kw: '등록 예매 티켓' });
  add({ url: 'jobs.html#new', title: '구인 공고 올리기', desc: '우리 교회에서 함께할 사역자를 찾기', cat: '게시판', kw: '등록 채용 모집 전도사' });
  add({ url: 'jobs.html', title: '사역자 자리 찾기', desc: '교회들이 올린 구인 공고 보기', cat: '게시판', kw: '취업 지원 사역지 청빙' });

  /* 값을 물으시는 분이 많은데 요금제 페이지는 지금 닫혀 있습니다.
     빈손으로 돌려보내지 말고 물어보실 곳으로 안내합니다. */
  add({
    url: 'contact.html',
    title: '비용이 얼마인가요',
    desc: '항목마다 다릅니다. 무엇이 필요하신지 알려 주시면 견적을 내어 드립니다 — 상담은 무료입니다.',
    cat: '자주 찾는 것',
    kw: '요금 가격 비용 값 얼마 견적 금액 무료 돈 월 관리비',
  });
  add({
    url: 'status.html',
    title: '내 신청이 어디까지 갔나요',
    desc: '넣으신 신청의 진행 상황을 확인하실 수 있습니다.',
    cat: '자주 찾는 것',
    kw: '조회 확인 진행 접수 신청현황',
  });

  /* 자주 묻는 질문 — 질문 자체로 찾는 분이 많습니다 */
  site.faqs.forEach((f, i) => add({
    url: `faq.html#faq-common-${i}`, title: f.q, desc: f.a, cat: '질문', kw: '',
  }));
  services.forEach((s) => (s.faqs || []).forEach((f, i) => add({
    url: `faq.html#faq-${s.id}-${i}`, title: f.q, desc: f.a, cat: '질문', kw: s.name,
  })));

  write('assets/js/search-index.js',
    '/* 자동 생성 파일입니다 — build.js 의 buildSearchIndex() 가 만듭니다. */\n'
    + 'window.CAPS_SEARCH = ' + JSON.stringify(rows) + ';\n');
}

function buildDataScript() {
  // 관리자 화면의 항목 편집기와 신청서가 함께 사용합니다.
  const payload = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    no: s.no,
    icon: s.icon,
    name: s.name,
    tagline: s.tagline,
    summary: s.summary,
    duration: s.duration,
    priceNote: s.priceNote,
    externalApply: s.externalApply || '',
    externalApplyLabel: s.externalApplyLabel || '',
    features: s.features,
    deliverables: s.deliverables,
    faqs: s.faqs,
    extraFields: s.extraFields || [],
  }));
  const js = `/* build.js 가 생성한 파일입니다. 직접 수정하지 마세요. */
window.CAPS_SERVICES = ${JSON.stringify(payload, null, 2)};

/* 매물 게시판 운영 기준 (src/data/site.js 의 site.listingBoard).
   계좌는 게시판에 노출하지 않고, 관리자가 승인할 때 카카오톡으로 보냅니다. */
window.CAPS_LISTING_BOARD = ${JSON.stringify(site.listingBoard, null, 2)};

/* 중고 장터 — 센터의 몫은 등록비가 아니라 설치 대행료입니다. */
window.CAPS_MARKET_BOARD = ${JSON.stringify(site.marketBoard, null, 2)};

/* 교회 게스트하우스 운영 기준 */
window.CAPS_GUEST_BOARD = ${JSON.stringify(site.guestHouseBoard, null, 2)};

/* 교역자 구인 공고 운영 기준 */
window.CAPS_JOB_BOARD = ${JSON.stringify(site.jobBoard, null, 2)};

/* 집회 티켓팅 운영 기준 */
window.CAPS_TICKET_BOARD = ${JSON.stringify(site.ticketBoard, null, 2)};

/* 카드 결제 설정. enabled 가 false 면 결제 버튼이 아예 그려지지 않습니다.
   공개해도 되는 값만 들어갑니다 — 비밀키는 Edge Function 환경변수에 있습니다. */
window.CAPS_PAYMENT = ${JSON.stringify(site.payment, null, 2)};
`;
  write('assets/js/data.js', js);
}

/* ========================================================= */
function main() {
  buildIndex();
  buildAbout();
  buildProcess();
  buildFaq();
  buildServicesIndex();
  buildPricing();
  services.forEach(buildServicePage);
  buildApply();
  buildStatus();
  buildContact();
  buildListings();
  Boards.buildMarket(write);
  Boards.buildGuesthouse(write);
  Boards.buildTickets(write);
  Boards.buildJobs(write);
  buildSearchIndex();
  buildDataScript();
  buildRulesScript(buildSupabaseSql());
  console.log(`생성 완료 (${out.length}개)`);
  out.forEach((f) => console.log('  ' + f));
}

main();
