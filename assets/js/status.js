/* 신청 조회 페이지 */
(function () {
  'use strict';

  var form = document.getElementById('lookupForm');
  if (!form) return;

  var input = document.getElementById('code');
  var errBox = document.getElementById('lookupErr');
  var resultBox = document.getElementById('lookupResult');
  var recentBox = document.getElementById('recentBox');
  var recentList = document.getElementById('recentList');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function row(dt, dd) {
    if (!dd) return '';
    return '<div><dt>' + esc(dt) + '</dt><dd>' + esc(dd) + '</dd></div>';
  }

  function render(record) {
    var status = window.CAPS.STATUS[record.status] || window.CAPS.STATUS.received;
    var extraRows = Object.keys(record.extra || {})
      .map(function (key) {
        var parts = key.split('__');
        return row(window.CAPS.serviceName(parts[0]) + ' · ' + parts[1], record.extra[key]);
      })
      .join('');

    resultBox.innerHTML =
      '<div class="result-card">' +
        '<div class="result-head">' +
          '<strong>' + esc(record.code) + '</strong>' +
          '<span class="badge ' + status.cls + '">' + status.label + '</span>' +
        '</div>' +
        '<dl class="result-dl">' +
          row('접수 일시', window.CAPS.formatDate(record.createdAt)) +
          row('신청 항목', window.CAPS.serviceNames(record.services).join(', ')) +
          row('교회명', record.church_name + (record.denomination ? ' (' + record.denomination + ')' : '')) +
          row('담당자', record.contact_name + (record.contact_role ? ' ' + record.contact_role : '')) +
          row('연락처', record.phone) +
          row('이메일', record.email) +
          row('소재지', record.location) +
          row('교인 수', record.size) +
          row('예산 범위', record.budget) +
          row('희망 시기', record.timeline) +
          row('연락 방법', record.prefer) +
          extraRows +
          row('요청 내용', record.message) +
        '</dl>' +
      '</div>';
    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function lookup(code) {
    var record = window.CAPS.find(code);
    if (!record) {
      resultBox.hidden = true;
      errBox.textContent = '해당 접수번호를 찾을 수 없습니다. 번호를 다시 확인해 주세요. (신청한 기기와 브라우저에서 조회하실 수 있습니다.)';
      errBox.hidden = false;
      return;
    }
    errBox.hidden = true;
    render(record);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = input.value.trim();
    if (!value) {
      resultBox.hidden = true;
      errBox.textContent = '접수번호를 입력해 주세요.';
      errBox.hidden = false;
      return;
    }
    lookup(value);
  });

  /* 최근 신청 내역 (같은 기기) */
  var list = window.CAPS.all();
  if (list.length) {
    recentList.innerHTML = list
      .slice(0, 5)
      .map(function (r) {
        return (
          '<li><a href="#" data-code="' + esc(r.code) + '">' +
            '<strong>' + esc(r.code) + '</strong>' +
            '<span>' + esc(r.church_name) + ' · ' + esc(window.CAPS.formatDate(r.createdAt)) + '</span>' +
          '</a></li>'
        );
      })
      .join('');
    recentBox.hidden = false;

    recentList.addEventListener('click', function (e) {
      var link = e.target.closest('a[data-code]');
      if (!link) return;
      e.preventDefault();
      input.value = link.dataset.code;
      lookup(link.dataset.code);
    });
  }

  /* ?code= 파라미터로 바로 조회 */
  var preset = new URLSearchParams(window.location.search).get('code');
  if (preset) {
    input.value = preset;
    lookup(preset);
  }
})();
