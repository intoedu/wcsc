/* =========================================================
   Supabase 설정
   =========================================================

   이 값이 채워져 있으면 Supabase(Postgres + Auth + Storage)로 동작합니다.
   비워두면 브라우저 저장소를 쓰는 "로컬 데모 모드"로 동작합니다.
   (로컬 모드에서도 모든 화면과 기능을 그대로 사용해 볼 수 있습니다.)

   ---------------------------------------------------------
   여기 적힌 키는 공개해도 되는 값입니다
   ---------------------------------------------------------
   publishable(anon) 키는 브라우저에 그대로 나가는 것을 전제로 만들어진 키입니다.
   실제 접근 제어는 데이터베이스의 RLS 정책이 합니다 — supabase.sql 참고.
   반대로 service_role 키는 RLS 를 통째로 무시하므로 절대 이 파일에 넣지 마세요.

   ---------------------------------------------------------
   설정 방법
   ---------------------------------------------------------
   1) https://supabase.com/dashboard 에서 프로젝트 생성
   2) SQL Editor 에 저장소의 supabase.sql 내용을 붙여넣고 실행
        · 표 · 접근 규칙(RLS) · 저장소 버킷이 한 번에 만들어집니다
   3) Project Settings → API 에서 아래 두 값을 복사해 넣기
        · Project URL
        · publishable key (sb_publishable_... 또는 anon key)
   4) Authentication → Providers
        · Email 사용 설정, "Confirm email" 은 끄기
          (가입하자마자 신청서를 이어서 제출하는 흐름이라 확인 메일을 기다리면 끊깁니다)
        · (선택) Google 사용 설정
   5) Authentication → URL Configuration
        · Site URL 과 Redirect URLs 에 배포 주소를 넣기 (구글 로그인에 필요)
   6) 첫 최고관리자 지정 — 가입한 뒤 SQL Editor 에서 한 줄:
        update public.users set role = 'owner', approved = true
        where email = '본인이메일@example.com';
   ========================================================= */

/* ---------------------------------------------------------
   DB 통합 — 「옮기는 날」에 아래 TARGET 한 줄만 'esc' 로 바꿉니다
   ---------------------------------------------------------
   old : 지금의 교회 DB (wcsc 프로젝트, 도쿄)
   esc : 인투마케팅 DB (ESC 프로젝트, 서울) 안의 wcsc 스키마
         · 표 · 함수는 schema 'wcsc' 에서 찾습니다
         · 로그인 저장 이름을 따로 둬서, 같은 주소의 인투마케팅 사이트와 로그인이 섞이지 않습니다
         · 서버 함수는 wcsc- 가 붙은 이름을 부릅니다 (wcsc-payment-confirm)
         · 로그인한 뒤 wcsc.ensure_user() 로 교회 회원 정보를 먼저 만듭니다
         · 로그아웃은 이 브라우저에서만 (같은 계정의 인투마케팅 로그인은 유지)
   ESC 쪽 준비(스키마 노출 · 권한 · 함수 · 구글 로그인 · 주소 허용 목록)가 끝나기 전에
   esc 로 바꾸면 사이트가 동작하지 않습니다. */
// 이 사이트는 Supabase 를 씁니다 — 아래 값이 비면(TARGET 오타 등) 옛 Firebase 로 넘어가지 않고 연결 실패로 보입니다.
window.SUPABASE_CONFIG_EXPECTED = true;

window.SUPABASE_CONFIG = (function () {
  var TARGET = 'old';   // ← 옮기는 날 'esc' 로

  var TARGETS = {
    old: {
      url: 'https://tbxosynzszcgtieonsui.supabase.co',
      anonKey: 'sb_publishable_cdMCKXcHMpIaHqLT5uvs0w_5SwIRGgt',
    },
    esc: {
      url: 'https://qkvebwxewttqtcryfycy.supabase.co',
      anonKey: 'sb_publishable_Me_R6M540Fg60nmEVqByTg_p-zD8pxa',
      schema: 'wcsc',
      storageKey: 'wcsc-auth',
      fnPrefix: 'wcsc-',
      ensureUser: true,
      signOutScope: 'local',   // 교회에서 나가도 인투마케팅 쪽 로그인은 그대로
    },
  };
  var picked = TARGETS[TARGET] || {};
  // 옮기는 날 데이터를 뜨는 동안: true 로 바꾸면 읽기 · 로그인만 되고 저장은 잠시 막힙니다.
  picked.readOnly = false;
  return picked;
})();
