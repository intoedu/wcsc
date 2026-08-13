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

const { esc, icon, layout, pageHero, sectionHead, faqList, serviceCard, ctaBand,
  applyLink, externalNote, site, services } = T;

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
  const body = `
<section class="hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="hero-eyebrow">Church Assist Platform Service</p>
      <h1>교회는 사역에 집중하고,<br><span class="hl">나머지는 CAPS</span>가 맡습니다</h1>
      <p class="hero-lead">
        홈페이지와 주보 제작부터 교역자 청빙, 음향, 부동산, 앱, 행정까지.
        한국 교회에 필요한 8개 지원 항목을 한 창구에서 상담하고 진행합니다.
      </p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="apply.html">지원 신청하기 ${icon('arrow', 'ico ico-sm')}</a>
        <a class="btn btn-outline btn-lg" href="services/index.html">지원 항목 살펴보기</a>
      </div>
      <ul class="hero-trust">
        <li>${icon('check', 'ico ico-sm')} 상담 · 견적 무료</li>
        <li>${icon('check', 'ico ico-sm')} 담당자 1인 전담</li>
        <li>${icon('check', 'ico ico-sm')} 교단 · 규모 제한 없음</li>
      </ul>
    </div>
    <div class="hero-panel">
      <div class="hero-card">
        <p class="hero-card-label">지원 항목</p>
        <ul class="hero-card-list">
          ${services
            .map(
              (s) =>
                `<li><a href="services/${s.slug}.html"><span class="hc-no">${s.no}</span><span class="hc-name">${esc(
                  s.name
                )}</span>${icon('arrow', 'ico ico-sm')}</a></li>`
            )
            .join('\n          ')}
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="stats">
  <div class="wrap stats-in">
    <div class="stat"><strong>8</strong><span>지원 항목</span></div>
    <div class="stat"><strong>1</strong><span>전담 창구</span></div>
    <div class="stat"><strong>1~2일</strong><span>상담 연락</span></div>
    <div class="stat"><strong>전국</strong><span>지원 지역</span></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${sectionHead(
      '지원 항목',
      '교회에 필요한 일, 여기서 함께 정리합니다',
      '어느 항목이 필요한지 확실하지 않아도 괜찮습니다. 상황을 알려주시면 담당자가 함께 정리해 드립니다.'
    )}
    <div class="svc-grid">
      ${services.map((s) => serviceCard(s, '')).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('CAPS가 일하는 방식', '업체가 아니라, 교회를 아는 담당자와 일합니다')}
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
    ${sectionHead('이용 절차', '신청부터 사후 지원까지 5단계')}
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
    <p class="center"><a class="btn btn-outline" href="process.html">이용 절차 자세히 보기 ${icon('arrow', 'ico ico-sm')}</a></p>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap narrow">
    ${sectionHead('자주 묻는 질문', '신청 전에 많이 묻는 것들')}
    ${faqList(site.faqs.slice(0, 4), 'home-faq')}
    <p class="center"><a class="btn btn-outline" href="faq.html">전체 질문 보기 ${icon('arrow', 'ico ico-sm')}</a></p>
  </div>
</section>

${ctaBand('')}
`;

  write(
    'index.html',
    layout({
      title: 'CAPS 교회지원센터 | 한국 교회를 위한 통합 지원',
      description: site.description,
      base: '',
      active: 'index.html',
      body,
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
  lead: 'CAPS(Church Assist Platform Service) 교회지원센터는 교회가 사역 외의 일로 소모하는 시간과 비용을 줄이기 위해 만들어졌습니다.',
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
      CAPS는 그 자리를 대신 맡기 위해 만들어진 기관입니다.
    </p>

    <h2>어떻게 일하나</h2>
    <p>
      CAPS는 항목별로 다른 담당자에게 넘기지 않습니다. 교회 한 곳에 담당자 한 명이 배정되어, 여러 항목을 진행하더라도
      같은 사람과 이야기하게 됩니다. 교회의 규모와 예산, 의사결정 구조를 이미 알고 있는 사람과 일한다는 뜻입니다.
    </p>
    <p>
      또한 모든 제안은 문서로 드립니다. 당회와 제직회에 그대로 올릴 수 있도록 항목별 범위와 일정, 비용을 정리해 드리며,
      구두로만 진행되는 부분을 남기지 않습니다.
    </p>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('원칙', '이 네 가지는 지킵니다')}
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
    ${sectionHead('지원 범위', '8개 항목, 한 창구')}
    <div class="svc-grid">
      ${services.map((s) => serviceCard(s, '')).join('\n      ')}
    </div>
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
      title: '센터 소개 | CAPS 교회지원센터',
      description: 'CAPS 교회지원센터가 만들어진 이유와 일하는 방식, 그리고 지키는 원칙을 소개합니다.',
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
      title: '이용 절차 | CAPS 교회지원센터',
      description: '신청 접수, 담당자 배정, 제안·견적, 진행, 사후 지원까지 CAPS 교회지원센터의 5단계 이용 절차를 안내합니다.',
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
      title: '자주 묻는 질문 | CAPS 교회지원센터',
      description: 'CAPS 교회지원센터 이용과 8개 지원 항목에 대해 자주 묻는 질문을 모았습니다.',
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
  title: '8개 항목,<br>한 창구에서 진행합니다',
  lead: '항목을 여러 개 선택해 한 번에 신청하실 수 있습니다. 담당자 한 명이 전체 일정을 조율합니다.',
})}

<section class="section">
  <div class="wrap">
    <div class="svc-grid">
      ${services.map((s) => serviceCard(s, '../')).join('\n      ')}
    </div>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    ${sectionHead('한눈에 비교', '항목별 소요 기간과 진행 방식')}
    <div class="table-scroll">
      <table class="cmp-table">
        <thead>
          <tr><th scope="col">항목</th><th scope="col">이런 경우에</th><th scope="col">소요 기간</th><th scope="col">진행 방식</th></tr>
        </thead>
        <tbody>
          ${services
            .map(
              (s) => `<tr>
            <th scope="row"><a href="../services/${s.slug}.html">${esc(s.name)}</a></th>
            <td>${esc(s.problems[0].title)}</td>
            <td>${esc(s.duration)}</td>
            <td>${esc(s.priceNote.split('.')[0])}.</td>
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
      title: '지원 항목 | CAPS 교회지원센터',
      description:
        '홈페이지 제작, 디자인, 교역자 구인, 음향 세팅, 부동산, AKC, 스마트처치 앱, 인투오피스 등 CAPS 교회지원센터의 8개 지원 항목을 안내합니다.',
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
        <dl class="svc-meta">
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

<section class="section section-alt">
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

<section class="section section-alt">
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
      title: `${s.name} | CAPS 교회지원센터`,
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
        <p class="fs-help">필요한 항목을 모두 선택하세요. 여러 개를 선택하면 담당자 한 명이 묶어서 진행합니다.</p>
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
          <span>CAPS 소식과 교회 실무 자료를 받아보겠습니다. <span class="opt">선택</span></span>
        </label>
      </fieldset>

      <div class="form-submit">
        <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitBtn">신청서 제출하기</button>
        <p class="form-note">제출 후 접수번호가 발급됩니다. 문의: <a href="${site.contact.phoneHref}">${esc(site.contact.phone)}</a></p>
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
      title: '지원 신청 | CAPS 교회지원센터',
      description: 'CAPS 교회지원센터 지원 신청서. 필요한 항목을 선택해 신청하시면 담당자가 1~2일 내 연락드립니다.',
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
        접수번호를 잊으셨다면 <a href="${site.contact.phoneHref}">${esc(site.contact.phone)}</a> 로 전화 주시거나
        <a href="mailto:${esc(site.contact.email)}">${esc(site.contact.email)}</a> 로 교회명과 담당자 성함을 보내주세요. 확인해 안내드립니다.
      </p>
    </div>
  </div>
</section>
`;

  write(
    'status.html',
    layout({
      title: '신청 조회 | CAPS 교회지원센터',
      description: '접수번호로 CAPS 교회지원센터 지원 신청 내역을 조회합니다.',
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
        <strong>${esc(site.contact.phone)}</strong>
        <p>${esc(site.contact.hours)}</p>
      </a>
      <a class="contact-card" href="mailto:${esc(site.contact.email)}">
        <span class="contact-ico">${icon('mail')}</span>
        <h2>이메일</h2>
        <strong>${esc(site.contact.email)}</strong>
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
        <li>${icon('pin', 'ico ico-sm')} <span>${esc(site.contact.address)}</span></li>
        <li>${icon('clock', 'ico ico-sm')} <span>${esc(site.contact.hours)}</span></li>
        <li>${icon('phoneCall', 'ico ico-sm')} <span>방문 전 <a href="${site.contact.phoneHref}">${esc(site.contact.phone)}</a> 로 예약해 주세요.</span></li>
      </ul>
    </div>
  </div>
</section>

${ctaBand('')}
`;

  write(
    'contact.html',
    layout({
      title: '문의 | CAPS 교회지원센터',
      description: 'CAPS 교회지원센터 전화·이메일 문의 및 방문 안내.',
      base: '',
      active: 'contact.html',
      body,
    })
  );
}

/* =========================================================
   브라우저용 데이터 파일
   ========================================================= */
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
  services.forEach(buildServicePage);
  buildApply();
  buildStatus();
  buildContact();
  buildDataScript();
  console.log(`생성 완료 (${out.length}개)`);
  out.forEach((f) => console.log('  ' + f));
}

main();
