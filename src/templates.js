'use strict';

const { site, services } = require('./data/site');

/** HTML 특수문자 이스케이프 */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 24x24 line icon set (stroke 기반) */
const icons = {
  monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  palette:
    '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.6-1.9-.2-1 .5-1.9 1.6-1.9h1.6A4.2 4.2 0 0 0 21 13C21 7.5 16.9 3 12 3Z"/><circle cx="7.8" cy="11.5" r="1.1"/><circle cx="11" cy="7.6" r="1.1"/><circle cx="15.6" cy="9.2" r="1.1"/>',
  users:
    '<path d="M15.5 20v-1.6a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.4V20"/><circle cx="9.2" cy="7.6" r="3.3"/><path d="M21 20v-1.6a3.6 3.6 0 0 0-2.7-3.5M15.8 4.5a3.6 3.6 0 0 1 0 6.9"/>',
  speaker:
    '<rect x="5" y="2.5" width="14" height="19" rx="2.4"/><circle cx="12" cy="14.6" r="3.6"/><circle cx="12" cy="6.6" r="1.4"/>',
  building:
    '<path d="M3 21h18M5 21V5.6c0-.9.6-1.6 1.5-1.6h5c.9 0 1.5.7 1.5 1.6V21M13 21V10.4h4.5c.9 0 1.5.7 1.5 1.6V21"/><path d="M8 8h2M8 12h2M8 16h2M16 14h1"/>',
  network:
    '<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="18" r="2.4"/><circle cx="19" cy="18" r="2.4"/><path d="M10.4 7 6.6 15.8M13.6 7l3.8 8.8M7.4 18h9.2"/>',
  phone:
    '<rect x="6" y="2.5" width="12" height="19" rx="2.4"/><path d="M10.6 5.6h2.8"/><path d="M10.4 18.4h3.2"/>',
  briefcase:
    '<rect x="2.5" y="7.2" width="19" height="12.6" rx="2"/><path d="M8.6 7.2V5.4c0-.9.7-1.6 1.6-1.6h3.6c.9 0 1.6.7 1.6 1.6v1.8"/><path d="M2.5 12.4h19"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  phoneCall:
    '<path d="M21 16.5v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.8-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3 4.9 1.8 1.8 0 0 1 4.8 3h2.6a1.8 1.8 0 0 1 1.8 1.6c.1 1 .4 1.9.7 2.8a1.8 1.8 0 0 1-.4 1.9l-1.1 1.1a14.4 14.4 0 0 0 5.4 5.4l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.9.3 1.8.6 2.8.7A1.8 1.8 0 0 1 21 16.5Z"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6.5 9 6.4 9-6.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2"/>',
  pin: '<path d="M20 10.3c0 5.4-8 12-8 12s-8-6.6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10.1" r="2.8"/>',
  doc: '<path d="M14 3H7.4A1.4 1.4 0 0 0 6 4.4v15.2A1.4 1.4 0 0 0 7.4 21h9.2a1.4 1.4 0 0 0 1.4-1.4V7l-4-4Z"/><path d="M14 3v4h4M9.2 12.5h5.6M9.2 16h5.6"/>',
};

function icon(name, cls) {
  const body = icons[name] || icons.check;
  return `<svg class="${cls || 'ico'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** 브랜드 로고 마크 */
function logoMark() {
  return `<svg class="logo-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="var(--brand-800)"/>
    <path d="M20 9.5v21M13 16.5h14" stroke="var(--gold-400)" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M27.5 25.4a8.4 8.4 0 0 1-15 0" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

const NAV = [
  { href: 'about.html', label: '센터 소개' },
  { href: 'services/index.html', label: '지원 항목', key: 'services' },
  { href: 'process.html', label: '이용 절차' },
  { href: 'faq.html', label: '자주 묻는 질문' },
  { href: 'contact.html', label: '문의' },
];

function header(base, active) {
  const links = NAV.map((n) => {
    const isOn = active === n.href || (n.key && active && active.startsWith('services/'));
    return `<a class="nav-link${isOn ? ' is-active' : ''}" href="${base}${n.href}">${n.label}</a>`;
  }).join('');

  const serviceMenu = services
    .map(
      (s) =>
        `<a class="mega-item" href="${base}services/${s.slug}.html">
          <span class="mega-ico">${icon(s.icon)}</span>
          <span class="mega-text"><strong>${esc(s.name)}</strong><small>${esc(s.tagline)}</small></span>
        </a>`
    )
    .join('');

  return `<a class="skip-link" href="#main">본문으로 건너뛰기</a>
<header class="site-header" id="siteHeader">
  <div class="topbar">
    <div class="wrap topbar-in">
      <span class="topbar-item">${icon('clock', 'ico ico-xs')} <span data-live="site.hours">${esc(site.contact.hours)}</span></span>
      <span class="topbar-links">
        <a href="${site.contact.phoneHref}">${icon('phoneCall', 'ico ico-xs')} <span data-live="site.phone">${esc(site.contact.phone)}</span></a>
        <a href="mailto:${esc(site.contact.email)}">${icon('mail', 'ico ico-xs')} <span data-live="site.email">${esc(site.contact.email)}</span></a>
      </span>
    </div>
  </div>
  <div class="wrap header-in">
    <a class="brand" href="${base}index.html">
      ${logoMark()}
      <span class="brand-text">
        <strong>우리교회지원센터</strong>
        <small>Wori Church Support Center</small>
      </span>
    </a>
    <nav class="nav" id="nav" aria-label="주 메뉴">
      ${links}
      <span id="authSlot"></span>
      <a class="btn btn-primary btn-sm nav-cta" href="${base}apply.html">지원 신청</a>
    </nav>
    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="nav" aria-label="메뉴 열기">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="mega" id="mega" hidden>
    <div class="wrap mega-in">${serviceMenu}</div>
  </div>
</header>`;
}

function footer(base) {
  const serviceLinks = services
    .map((s) => `<li><a href="${base}services/${s.slug}.html">${esc(s.name)}</a></li>`)
    .join('');

  return `<footer class="site-footer">
  <div class="wrap footer-top">
    <div class="footer-brand">
      <a class="brand brand-light" href="${base}index.html">
        ${logoMark()}
        <span class="brand-text">
          <strong>우리교회지원센터</strong>
          <small>Wori Church Support Center</small>
        </span>
      </a>
      <p class="footer-desc">${esc(site.description)}</p>
      <a class="btn btn-gold" href="${base}apply.html">지원 신청하기 ${icon('arrow', 'ico ico-sm')}</a>
    </div>
    <div class="footer-col">
      <h3>지원 항목</h3>
      <ul>${serviceLinks}</ul>
    </div>
    <div class="footer-col">
      <h3>센터 안내</h3>
      <ul>
        <li><a href="${base}about.html">센터 소개</a></li>
        <li><a href="${base}process.html">이용 절차</a></li>
        <li><a href="${base}faq.html">자주 묻는 질문</a></li>
        <li><a href="${base}contact.html">문의하기</a></li>
        <li><a href="${base}status.html">신청 조회</a></li>
        <li><a href="${base}staff.html" class="footer-staff">직원 로그인</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h3>문의</h3>
      <ul class="footer-contact">
        <li>${icon('phoneCall', 'ico ico-sm')} <a href="${site.contact.phoneHref}" data-live="site.phone">${esc(site.contact.phone)}</a></li>
        <li>${icon('mail', 'ico ico-sm')} <a href="mailto:${esc(site.contact.email)}" data-live="site.email">${esc(site.contact.email)}</a></li>
        <li>${icon('clock', 'ico ico-sm')} <span data-live="site.hours">${esc(site.contact.hours)}</span></li>
        <li>${icon('pin', 'ico ico-sm')} <span data-live="site.address">${esc(site.contact.address)}</span></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>© <span id="year">2026</span> 우리교회지원센터. All rights reserved.</p>
    <p class="footer-note">한국 교회를 위한 통합 지원 기관</p>
  </div>
</footer>`;
}

/**
 * 페이지 레이아웃
 * @param {{title:string, description:string, base:string, active:string, body:string, scripts?:string[], bodyClass?:string}} o
 */
function layout(o) {
  const base = o.base || '';
  const scripts = (o.scripts || []).map((s) => `<script src="${base}assets/js/${s}" defer></script>`).join('\n  ');
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(o.title)}</title>
  <meta name="description" content="${esc(o.description)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(o.title)}">
  <meta property="og:description" content="${esc(o.description)}">
  <meta property="og:site_name" content="우리교회지원센터">
  <meta name="theme-color" content="#1F7A44">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%231F7A44'/%3E%3Cpath d='M20 9.5v21M13 16.5h14' stroke='%23F2C82F' stroke-width='2.6' stroke-linecap='round'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
  <link rel="stylesheet" href="${base}assets/css/style.css">
  <link rel="stylesheet" href="${base}assets/css/auth.css">
</head>
<body${o.bodyClass ? ` class="${o.bodyClass}"` : ''}${o.serviceId ? ` data-service="${o.serviceId}"` : ''}>
  ${header(base, o.active)}
  <main id="main">
${o.body}
  </main>
  ${footer(base)}
  <a class="float-cta" href="${base}apply.html">지원 신청</a>
  <script src="${base}assets/js/firebase-config.js" defer></script>
  <script src="${base}assets/js/data.js" defer></script>
  <script src="${base}assets/js/db.js" defer></script>
  <script src="${base}assets/js/profile.js" defer></script>
  <script src="${base}assets/js/account.js" defer></script>
  <script src="${base}assets/js/auth-ui.js" defer></script>
  <script src="${base}assets/js/consent-ui.js" defer></script>
  <script src="${base}assets/js/live-content.js" defer></script>
  <script src="${base}assets/js/app.js" defer></script>
  ${scripts}
</body>
</html>
`;
}

/* ---------- 공통 섹션 컴포넌트 ---------- */

function pageHero(o) {
  return `<section class="page-hero">
  <div class="wrap">
    ${o.eyebrow ? `<p class="eyebrow">${esc(o.eyebrow)}</p>` : ''}
    <h1>${o.title}</h1>
    ${o.lead ? `<p class="lead">${esc(o.lead)}</p>` : ''}
    ${o.extra || ''}
  </div>
</section>`;
}

function sectionHead(eyebrow, title, lead, align) {
  return `<div class="sec-head${align === 'left' ? ' is-left' : ''}">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h2>${title}</h2>
    ${lead ? `<p class="sec-lead">${esc(lead)}</p>` : ''}
  </div>`;
}

function faqList(items, idPrefix, attrs) {
  return `<div class="faq"${attrs ? ' ' + attrs : ''}>
    ${items
      .map(
        (f, i) => `<details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary id="${idPrefix}-${i}"><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary>
      <div class="faq-body"><p>${esc(f.a)}</p></div>
    </details>`
      )
      .join('\n    ')}
  </div>`;
}

/**
 * 항목 신청 버튼.
 * externalApply 가 있으면 외부 접수 사이트로, 없으면 내부 신청서로 연결합니다.
 * data-apply 표시는 live-content.js 가 관리자 수정본을 반영할 때 사용합니다.
 */
function applyLink(s, base, o) {
  const opt = o || {};
  const cls = 'btn ' + (opt.cls || 'btn-primary btn-lg');
  const arrow = opt.arrow === false ? '' : ' ' + icon('arrow', 'ico ico-sm');

  if (s.externalApply) {
    const who = s.externalApplyLabel || '외부 사이트';
    return `<a class="${cls}" href="${s.externalApply}" target="_blank" rel="noopener"
      data-apply="${s.id}">${esc(who)}에서 신청하기${arrow}</a>`;
  }
  return `<a class="${cls}" href="${base}apply.html?service=${s.id}"
      data-apply="${s.id}">${esc(opt.label || '이 항목 신청하기')}${arrow}</a>`;
}

/** 외부 접수 항목임을 알리는 안내 문구 */
function externalNote(s) {
  if (!s.externalApply) return '';
  const who = s.externalApplyLabel || '외부 사이트';
  return `<p class="apply-external-note" data-apply-note="${s.id}">
    이 항목의 신청은 <strong>${esc(who)}</strong> 접수 페이지에서 진행됩니다.
    버튼을 누르면 새 창으로 열립니다.
  </p>`;
}

function serviceCard(s, base) {
  return `<a class="svc-card" href="${base}services/${s.slug}.html">
    <span class="svc-no">${s.no}</span>
    <span class="svc-ico">${icon(s.icon)}</span>
    <h3 data-live="svc.${s.id}.name">${esc(s.name)}</h3>
    <p class="svc-tag" data-live="svc.${s.id}.tagline">${esc(s.tagline)}</p>
    <p class="svc-sum" data-live="svc.${s.id}.summary">${esc(s.summary)}</p>
    <span class="svc-price">${esc(s.price || '상담 후 결정')}<em>${esc(s.billing || '건별 견적')}</em></span>
    <span class="svc-more">자세히 보기 ${icon('arrow', 'ico ico-sm')}</span>
  </a>`;
}

function ctaBand(base, opts) {
  const o = opts || {};
  return `<section class="cta-band">
  <div class="wrap cta-in">
    <div>
      <h2>${esc(o.title || '어떤 항목이 필요한지 아직 모르셔도 괜찮습니다')}</h2>
      <p>${esc(o.lead || '교회 상황을 알려주시면 담당자가 필요한 항목을 함께 정리해 드립니다. 상담과 견적은 무료입니다.')}</p>
    </div>
    <div class="cta-actions">
      <a class="btn btn-gold btn-lg" href="${base}apply.html">지원 신청하기</a>
      <a class="btn btn-ghost-light btn-lg" href="${site.contact.phoneHref}">전화 상담 ${esc(site.contact.phone)}</a>
    </div>
  </div>
</section>`;
}

module.exports = {
  esc,
  icon,
  applyLink,
  externalNote,
  logoMark,
  layout,
  pageHero,
  sectionHead,
  faqList,
  serviceCard,
  ctaBand,
  site,
  services,
};
