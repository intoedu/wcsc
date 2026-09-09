/**
 * 리플렛 HTML → 인쇄용 PDF + 미리보기 PNG.
 *
 *   node leaflet/render.js
 *
 * Chromium(Playwright)으로 뽑습니다. 한글 글꼴이 시스템에 있어야 합니다
 * (Noto Sans CJK KR · NanumSquare — Ubuntu 기준 fonts-noto-cjk · fonts-nanum).
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const HERE = __dirname;
const DIST = path.join(HERE, 'dist');

/* 뽑을 목록 — [소스, 결과 이름, 페이지 크기(mm), 도련(mm)] */
const JOBS = [
  { src: 'leaflet-3fold.html', out: 'wcsc-리플렛-3단접지-A4가로',          w: 297, h: 210, bleed: 0 },
  { src: 'leaflet-3fold.html', out: 'wcsc-리플렛-3단접지-도련3mm-인쇄소용', w: 297, h: 210, bleed: 3 },
  { src: 'leaflet-a4.html',    out: 'wcsc-리플렛-A4낱장-양면',             w: 210, h: 297, bleed: 0 },
  { src: 'leaflet-a4.html',    out: 'wcsc-리플렛-A4낱장-도련3mm-인쇄소용',  w: 210, h: 297, bleed: 3 },
];

(async () => {
  fs.mkdirSync(DIST, { recursive: true });
  const browser = await chromium.launch();

  for (const job of JOBS) {
    const file = path.join(HERE, job.src);
    if (!fs.existsSync(file)) { console.log('건너뜀 (없는 파일):', job.src); continue; }

    const page = await browser.newPage();
    /* ?bleed 를 붙이면 HTML 쪽이 도련 3mm 배치로 스스로 바뀝니다 —
       바깥으로 향한 가장자리에만 3mm 를 더해, 재단선 밖까지 배경이 나갑니다. */
    await page.goto('file://' + file + (job.bleed ? '?bleed' : ''), { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    const w = job.w + job.bleed * 2;
    const h = job.h + job.bleed * 2;

    const pdf = path.join(DIST, job.out + '.pdf');
    await page.pdf({
      path: pdf,
      width: `${w}mm`,
      height: `${h}mm`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    console.log('PDF  ', path.relative(HERE, pdf));

    /* 넘침 검사 — 글이 종이 끝에 너무 붙거나 잘리면 알려 줍니다.
       (flex 로 짜여 있어, 넘쳐도 화면상으로는 조용히 눌려 사라질 수 있습니다.) */
    if (!job.bleed) {
      const warn = await page.evaluate(() => {
        const MM = 3.7795, bad = [];
        document.querySelectorAll('.sheet').forEach((sh, i) => {
          const sr = sh.getBoundingClientRect();
          let worst = Infinity, who = '';
          sh.querySelectorAll('*').forEach((el) => {
            const leaf = el.tagName === 'IMG' || ![...el.children].some((c) => c.nodeType === 1);
            if (!leaf) return;
            const r = el.getBoundingClientRect();
            if (r.height < 1) return;
            if (el.tagName !== 'IMG' && !el.textContent.trim()) return;
            const gap = (sr.bottom - r.bottom) / MM;
            if (gap < worst) { worst = gap; who = el.textContent.trim().slice(0, 24) || el.tagName; }
          });
          if (worst < 5) bad.push(`      ${i + 1}면: 아래 여백 ${worst.toFixed(1)}mm — “${who}”`);
        });
        return bad;
      });
      if (warn.length) console.log('   ⚠ 종이 끝에 너무 붙었습니다 (5mm 미만)\n' + warn.join('\n'));
    }

    /* 미리보기 PNG — 화면에서 바로 확인하실 수 있게 면마다 한 장씩. */
    const sheets = await page.$$('.sheet');
    for (let i = 0; i < sheets.length; i++) {
      const png = path.join(DIST, `${job.out}-${i + 1}면.png`);
      if (job.bleed) break;                       // 도련판은 미리보기를 따로 만들지 않습니다
      await sheets[i].screenshot({ path: png, scale: 'css' });
      console.log('PNG  ', path.relative(HERE, png));
    }
    await page.close();
  }

  await browser.close();
  console.log('\n완료 — leaflet/dist/ 를 보세요.');
})();
