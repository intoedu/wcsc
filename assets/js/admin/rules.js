/* 보안 규칙 — 전체를 한 번에 복사해서 Firebase 콘솔에 붙여넣습니다.
 *
 * 규칙 원본은 저장소의 firestore.rules 이고,
 * build.js 가 그 내용을 assets/js/rules-text.js 로 내보냅니다.
 * 따라서 이 화면에는 항상 최신 규칙이 표시됩니다.
 */
(function () {
  'use strict';

  var A = window.CAPSAdmin;
  var db = A.db;
  var h = A.h;

  var PROJECT_ID = (window.FIREBASE_CONFIG || {}).projectId || '';
  var RULES_URL = PROJECT_ID
    ? 'https://console.firebase.google.com/project/' + PROJECT_ID + '/firestore/rules'
    : 'https://console.firebase.google.com';

  function rulesText() {
    return window.CAPS_FIRESTORE_RULES || '';
  }

  A.register('rules', {
    title: '보안 규칙',
    nav: '보안 규칙',
    desc: 'Firebase 콘솔에 붙여넣을 규칙 전체입니다. 아래 버튼으로 한 번에 복사하세요.',
    icon: 'rules',
    perm: 'settings',
    live: false, // 데이터가 바뀔 때마다 다시 그리지 않습니다 (복사 중 화면이 튀지 않도록)

    render: function (root) {
      var text = rulesText();
      var version = window.CAPS_FIRESTORE_RULES_VERSION || '(미표기)';

      if (!text) {
        root.innerHTML =
          '<div class="adm-card"><h2>규칙 내용을 불러올 수 없습니다</h2>' +
          '<p class="adm-card-lead"><code>assets/js/rules-text.js</code> 가 없습니다. ' +
          '저장소에서 <code>npm run build</code> 를 실행하면 <code>firestore.rules</code> 에서 생성됩니다.</p></div>';
        return;
      }

      root.innerHTML =
        '<div class="adm-card">' +
          '<h2>붙여넣는 순서</h2>' +
          '<p class="adm-card-lead">규칙은 <strong>일부만 고치는 것이 아니라 전체를 덮어쓰는</strong> 방식입니다. ' +
            '아래 순서대로 하시면 됩니다.</p>' +
          '<ol class="rules-steps">' +
            '<li><strong>[규칙 전체 복사]</strong> 를 누릅니다.</li>' +
            '<li><strong>[Firebase 규칙 화면 열기]</strong> 로 콘솔을 새 창에 엽니다.</li>' +
            '<li>편집창을 클릭하고 <code>Ctrl+A</code> → <code>Delete</code> 로 <strong>기존 내용을 모두 지웁니다.</strong></li>' +
            '<li><code>Ctrl+V</code> 로 붙여넣고 <strong>[게시]</strong> 를 누릅니다.</li>' +
            '<li>"규칙이 게시되었습니다" 가 나오면 끝입니다. 반영에 1분쯤 걸릴 수 있습니다.</li>' +
          '</ol>' +

          '<div class="rules-actions">' +
            '<button type="button" class="btn btn-primary" id="rulesCopy">규칙 전체 복사</button>' +
            '<a class="btn btn-outline" href="' + RULES_URL + '" target="_blank" rel="noopener">' +
              'Firebase 규칙 화면 열기</a>' +
            '<button type="button" class="btn btn-outline" id="rulesDownload">파일로 내려받기</button>' +
          '</div>' +

          '<dl class="dl-flat" style="margin-top:22px">' +
            '<div><dt>규칙 판</dt><dd>' + h(version) + '</dd></div>' +
            '<div><dt>줄 수</dt><dd>' + text.split('\n').length + '줄 · ' + text.length + '자</dd></div>' +
            '<div><dt>대상 프로젝트</dt><dd>' + h(PROJECT_ID || '(설정 없음)') + '</dd></div>' +
          '</dl>' +
        '</div>' +

        '<div class="adm-card">' +
          '<div class="adm-card-head">' +
            '<h2>규칙 전체</h2>' +
            '<button type="button" class="btn btn-outline btn-sm" id="rulesCopy2">전체 복사</button>' +
          '</div>' +
          '<textarea class="rules-text" id="rulesBox" readonly spellcheck="false" ' +
            'aria-label="Firestore 보안 규칙 전체">' + h(text) + '</textarea>' +
          '<p class="field-hint">복사가 안 되면 이 칸을 클릭하고 <code>Ctrl+A</code> → <code>Ctrl+C</code> 로 직접 복사하세요.</p>' +
        '</div>' +

        '<div class="adm-card">' +
          '<h2>규칙을 다시 게시해야 하는 때</h2>' +
          '<ul class="rules-when">' +
            '<li>저장소를 새로 배포한 뒤 <strong>규칙 판 번호가 달라졌을 때</strong></li>' +
            '<li>화면에서 <code>Missing or insufficient permissions</code> 오류가 날 때</li>' +
            '<li>직원이 자기 작업을 저장하지 못할 때</li>' +
            '<li>고객 목록·정산 화면이 비어 보일 때</li>' +
          '</ul>' +
          '<div class="guide-box" style="margin-top:18px"><strong>규칙 내용을 바꾸고 싶으시면</strong><br>' +
            '이 화면에서는 수정할 수 없습니다. 저장소의 <code>firestore.rules</code> 를 고치고 ' +
            '<code>npm run build</code> 를 실행하면 이 화면에도 반영됩니다. ' +
            '(잘못 고치면 사이트 전체가 막힐 수 있어 읽기 전용으로 두었습니다.)</div>' +
        '</div>';

      function copyAll(btn) {
        var original = btn.textContent;
        var write = navigator.clipboard
          ? navigator.clipboard.writeText(text)
          : Promise.reject();

        write.then(function () {
          btn.textContent = '복사됨 ✓';
          A.toast('규칙 전체를 복사했습니다. 콘솔 편집창에 붙여넣으세요.', 'ok');
          window.setTimeout(function () { btn.textContent = original; }, 2200);
        }).catch(function () {
          // 클립보드 권한이 없을 때는 직접 선택하도록 돕습니다.
          var box = document.getElementById('rulesBox');
          box.focus();
          box.select();
          A.toast('Ctrl+C 를 눌러 복사해 주세요.', 'err');
        });
      }

      root.querySelector('#rulesCopy').addEventListener('click', function () { copyAll(this); });
      root.querySelector('#rulesCopy2').addEventListener('click', function () { copyAll(this); });

      root.querySelector('#rulesDownload').addEventListener('click', function () {
        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'firestore.rules';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        A.toast('firestore.rules 파일을 내려받았습니다.', 'ok');
      });
    },
  });
})();
