// 새 지원 신청이 들어오면 담당자에게 메일을 보냅니다. — DB 통합 뒤 ESC 프로젝트용
//
// 운영 중인 notify-request(교회 DB, 도쿄)와 내용이 같고, 바뀐 것은 두 가지뿐입니다.
//   1) 함수 이름: wcsc-notify-request
//   2) 비밀값 이름 앞에 WCSC_ — ESC 프로젝트의 Secrets 는 모든 함수가 함께 쓰므로,
//      인투마케팅 쪽 알림 설정(받는 사람 등)과 섞이지 않게 따로 둡니다.
//
// wcsc.requests 에 줄이 하나 생기면 데이터베이스 트리거(wcsc.notify_new_request)가 이 함수를 부릅니다.
// 부를 때 x-hook-secret 을 함께 보내며, 그 값이 맞지 않으면 아무것도 하지 않습니다.
// (JWT 검사를 끄는 대신 이 열쇠로 막습니다 — 배포할 때 verify_jwt = false)
//
// 필요한 값 — ESC 대시보드의 Edge Functions > Secrets
//   WCSC_HOOK_SECRET     Vault 의 wcsc 알림 비밀값과 같은 값
//   WCSC_RESEND_API_KEY  메일을 보내 주는 곳(resend.com)의 열쇠
//   WCSC_NOTIFY_TO       알림을 받을 주소 (쉼표로 여러 개)
//   WCSC_NOTIFY_FROM     보내는 주소 — 도메인 인증 전에는 비워 둡니다

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const row = (label: string, value: unknown) =>
  value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#5B6B60;white-space:nowrap">${label}</td>` +
      `<td style="padding:6px 0;color:#12271B"><strong>${esc(value)}</strong></td></tr>`
    : '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const want = Deno.env.get('WCSC_HOOK_SECRET');
  if (!want || req.headers.get('x-hook-secret') !== want) {
    return new Response('forbidden', { status: 403 });
  }

  const key = Deno.env.get('WCSC_RESEND_API_KEY');
  const to = (Deno.env.get('WCSC_NOTIFY_TO') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!key || !to.length) {
    // 아직 열쇠나 받는 주소가 없으면 조용히 지나갑니다. 신청 자체는 이미 저장되었습니다.
    return new Response(JSON.stringify({ skipped: 'not configured' }), { status: 200 });
  }

  const d = await req.json().catch(() => ({}));

  let services = String(d.services ?? '');
  try {
    const parsed = JSON.parse(services);
    if (Array.isArray(parsed)) services = parsed.join(' · ');
  } catch { /* 문자열 그대로 씁니다 */ }

  const phone = String(d.phone ?? '');
  const html = `
<div style="font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:560px">
  <p style="margin:0 0 4px;color:#1F8046;font-weight:700;font-size:13px">새 지원 신청</p>
  <h1 style="margin:0 0 18px;font-size:21px;color:#12271B">${esc(d.church) || '(교회명 없음)'}</h1>
  <table style="border-collapse:collapse;font-size:14.5px;line-height:1.6">
    ${row('접수번호', d.code)}
    ${row('신청 항목', services)}
    ${row('연락받으실 분', d.name)}
    ${row('연락처', phone)}
    ${row('이메일', d.email)}
  </table>
  ${d.message ? `<div style="margin-top:18px;padding:14px 16px;background:#F4F8F5;border-radius:12px;font-size:14.5px;line-height:1.75;color:#22352B;white-space:pre-wrap">${esc(d.message)}</div>` : ''}
  ${phone ? `<p style="margin:20px 0 0"><a href="tel:${esc(phone.replace(/[^0-9+]/g, ''))}" style="display:inline-block;padding:11px 18px;background:#1F8046;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">전화 걸기</a></p>` : ''}
  <p style="margin:22px 0 0;font-size:12.5px;color:#7A8A80">우리교회지원센터 · 신청이 접수되면 자동으로 보내지는 메일입니다.</p>
</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('WCSC_NOTIFY_FROM') || 'onboarding@resend.dev',
      to,
      subject: `[신청] ${d.church || '교회'} — ${services || '지원 신청'}`,
      html,
    }),
  });

  if (!res.ok) {
    return new Response(JSON.stringify({ error: await res.text() }), { status: 502 });
  }
  return new Response(JSON.stringify({ sent: to.length }), { status: 200 });
});
