# CAPS 교회지원센터 홈페이지

**CAPS** (Church Assist Platform Service) — 한국 교회를 위한 통합 지원 기관 홈페이지.
8개 지원 항목의 설명 페이지와 온라인 신청 시스템을 포함합니다.

빌드 도구·프레임워크 없이 동작하는 정적 사이트입니다. 생성된 HTML을 그대로 웹 서버에 올리면 됩니다.

---

## 지원 항목 (8개)

요청 목록에서 **교역자 구인이 3번·6번으로 중복**되어 있어 하나로 정리했습니다.

| # | 항목 | 페이지 |
|---|------|--------|
| 01 | 홈페이지 제작 | `services/homepage.html` |
| 02 | 디자인 제작 (배너·포스터·현수막·주보) | `services/design.html` |
| 03 | 교역자 구인 | `services/staffing.html` |
| 04 | 음향 세팅 | `services/sound.html` |
| 05 | 부동산 | `services/realestate.html` |
| 06 | AKC | `services/akc.html` |
| 07 | 스마트처치 앱 | `services/smartchurch.html` |
| 08 | 인투오피스 | `services/intooffice.html` |

각 항목 페이지는 같은 구조로 되어 있습니다:
필요한 상황 → 지원 내용 → 진행 순서 → 제공 내역·비용 → FAQ → 신청 CTA.

## 페이지 구성

| 파일 | 내용 |
|------|------|
| `index.html` | 홈 (히어로, 8개 항목, 일하는 방식, 절차, FAQ) |
| `about.html` | 센터 소개 |
| `services/index.html` | 지원 항목 목록 + 비교표 |
| `services/*.html` | 항목별 상세 (8개) |
| `process.html` | 이용 절차 5단계 |
| `faq.html` | 자주 묻는 질문 (공통 + 항목별) |
| `contact.html` | 전화·이메일·방문 안내 |
| `apply.html` | **지원 신청서** |
| `status.html` | **접수번호로 신청 조회** |
| `admin.html` | **접수 현황** (검색·필터·상태 변경·CSV 내려받기) |

## 신청 시스템

1. `apply.html` 에서 필요한 항목을 **복수 선택** → 선택한 항목에 맞는 추가 질문이 자동으로 나타남
2. 필수값 검증 (교회명 / 담당자 / 연락처 / 소재지 / 요청 내용 / 개인정보 동의) + 전화번호 자동 하이픈
3. 제출 시 `CAPS-YYMMDD-XXXX` 형식 **접수번호** 발급
4. `status.html` 에서 접수번호로 조회
5. `admin.html` 에서 전체 접수 확인, 상태 변경(접수 완료 / 상담 진행 중 / 처리 완료), CSV 내려받기

항목 상세 페이지의 신청 버튼은 `apply.html?service=homepage` 처럼 해당 항목이 미리 선택된 상태로 연결됩니다.

### 저장 방식 — 서버 연동 방법

기본값은 **브라우저 localStorage 저장(데모)** 입니다. 실제 접수를 받으려면 서버 엔드포인트를 지정하세요.
`assets/js/store.js` 상단:

```js
window.CAPS_CONFIG = {
  endpoint: 'https://example.com/api/applications', // 접수 API 주소
  keepLocalCopy: true,   // 브라우저에도 사본 저장 (신청 조회 기능에 필요)
};
```

지정하면 신청 데이터를 해당 주소로 JSON `POST` 합니다.
**전송에 실패해도 접수 내용은 localStorage에 남겨 유실을 막습니다.**
Supabase Edge Function, Formspree, 자체 API 등 JSON을 받는 곳이면 무엇이든 연결할 수 있습니다.

전송되는 JSON 형식:

```json
{
  "code": "CAPS-260812-4821",
  "createdAt": "2026-08-12T05:56:00.000Z",
  "status": "received",
  "services": ["homepage", "design"],
  "church_name": "은혜로교회",
  "denomination": "예장합동",
  "contact_name": "홍길동",
  "contact_role": "담임목사",
  "phone": "010-1234-5678",
  "email": "church@example.com",
  "location": "서울 강남구",
  "size": "150~500명",
  "budget": "300~1,000만원",
  "timeline": "3개월 이내",
  "message": "요청 내용",
  "prefer": "전화",
  "marketing": false,
  "extra": { "homepage__page_scope": "게시판 포함 (10페이지 내외)" }
}
```

> `admin.html` 은 브라우저 저장소를 읽는 **데모용 화면**이며 접근 제한이 없습니다.
> 실제 운영에서는 서버 인증이 있는 관리자 페이지로 대체하고, 이 파일은 배포에서 제외하세요.

## 콘텐츠 수정 방법

문구·항목·FAQ는 모두 **`src/data/site.js` 한 곳**에 있습니다. HTML을 직접 고치지 마세요.

```bash
# 1. src/data/site.js 수정
# 2. 다시 생성
node build.js        # 또는 npm run build
```

`build.js` 가 `src/templates.js` 의 레이아웃을 사용해 모든 HTML과 `assets/js/data.js` 를 다시 만듭니다.

### 로컬 확인

```bash
npm start            # http://localhost:8123
```

## 배포 전 확인 목록

콘텐츠에 자리표시자가 남아 있습니다. **공개 전에 반드시 교체하세요.**

- [ ] **연락처** — `src/data/site.js` 의 `site.contact` (전화 `02-0000-0000`, 이메일, 주소가 모두 임시값)
- [ ] **AKC** — 정식 명칭과 실제 프로그램 구성 확인 필요 (`services[5]`, 코드에 `needsReview: true` 표시)
- [ ] **인투오피스** — 실제 서비스 범위와 요금 체계 확인 필요 (`services[7]`, `needsReview: true`)
- [ ] **비용 안내** — 모든 항목이 "상담 후 견적"으로만 되어 있습니다. 공개 가능한 금액이 있으면 `priceNote` 수정
- [ ] **소요 기간** — 각 항목 `duration` 이 실제 운영 기준과 맞는지 확인
- [ ] **개인정보 처리방침** — `apply.html` 의 동의 문구는 기본 양식입니다. 실제 방침에 맞게 검토 필요
- [ ] `admin.html` 을 공개 배포에 포함할지 결정 (기본은 인증 없음)

## 기술 사항

- 의존성 없음 — 순수 HTML / CSS / 바닐라 JS (빌드 스크립트만 Node 사용)
- 폰트: Pretendard (CDN), 실패 시 시스템 한글 폰트로 대체
- 반응형: 1080 / 900 / 820 / 680px 구간, 모바일 하단 고정 신청 버튼
- 접근성: 본문 바로가기, 키보드 조작, `aria-*` 속성, `prefers-reduced-motion` 대응
- 인쇄 스타일 포함 (제안서·견적 요청 화면 출력용)
- 아이콘은 인라인 SVG — 외부 아이콘 라이브러리 없음

브라우저 검증(Chromium)으로 11개 페이지의 내부 링크, 신청→조회→관리자 전체 흐름,
모바일 레이아웃을 확인했습니다.
