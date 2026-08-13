/* 신청서 페이지: 항목 선택, 동적 추가 필드, 검증, 제출 */
(function () {
  'use strict';

  var form = document.getElementById('applyForm');
  if (!form) return;

  var SERVICES = window.CAPS_SERVICES || [];
  var extraFieldset = document.getElementById('extraFieldset');
  var extraWrap = document.getElementById('extraFields');
  var progress = document.getElementById('formProgress');
  var formError = document.getElementById('formError');
  var submitBtn = document.getElementById('submitBtn');

  function svc(id) {
    for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i];
    return null;
  }

  function checkedServices() {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="services"]:checked'))
      .map(function (el) { return el.value; });
  }

  /* ---------- URL 파라미터로 항목 미리 선택 ---------- */
  (function preselect() {
    var params = new URLSearchParams(window.location.search);
    var wanted = params.getAll('service').concat((params.get('services') || '').split(',')).filter(Boolean);
    if (!wanted.length) return;
    wanted.forEach(function (id) {
      var box = form.querySelector('input[name="services"][value="' + CSS.escape(id) + '"]');
      if (box) box.checked = true;
    });
  })();

  /* ---------- 선택 항목에 따른 추가 필드 ---------- */
  function buildExtraFields() {
    var ids = checkedServices();
    var kept = {};
    // 이미 입력한 값은 유지
    Array.prototype.slice.call(extraWrap.querySelectorAll('[name]')).forEach(function (el) {
      kept[el.name] = el.value;
    });

    var html = '';
    ids.forEach(function (id) {
      var s = svc(id);
      if (!s || !s.extraFields || !s.extraFields.length) return;
      html += '<div class="extra-group"><h4 class="extra-title">' + esc(s.name) + '</h4><div class="grid-2">';
      s.extraFields.forEach(function (f) {
        var name = s.id + '__' + f.name;
        var val = kept[name] || '';
        html += '<div class="field"><label for="' + name + '">' + esc(f.label) + ' <span class="opt">선택</span></label>';
        if (f.type === 'select') {
          html += '<select id="' + name + '" name="' + name + '"><option value="">선택해 주세요</option>';
          f.options.forEach(function (o) {
            html += '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>';
          });
          html += '</select>';
        } else {
          html +=
            '<input type="' + (f.type || 'text') + '" id="' + name + '" name="' + name + '"' +
            (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
            ' value="' + esc(val) + '">';
        }
        html += '</div>';
      });
      html += '</div></div>';
    });

    extraWrap.innerHTML = html;
    extraFieldset.hidden = html === '';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 진행 표시 ---------- */
  function updateProgress() {
    if (!progress) return;
    var items = progress.children;
    var s1 = checkedServices().length > 0;
    var s2 = ['church_name', 'contact_name', 'phone', 'location'].every(function (n) {
      var el = form.elements[n];
      return el && el.value.trim() !== '';
    });
    var s3 = form.elements.message.value.trim() !== '' && form.elements.consent.checked;
    var states = [s1, s2, s3];
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-done', states[i]);
      items[i].classList.toggle('is-on', !states[i] && states.slice(0, i).every(Boolean));
    }
  }

  /* ---------- 검증 ---------- */
  var RULES = {
    church_name: { msg: '교회명을 입력해 주세요.' },
    contact_name: { msg: '담당자 성함을 입력해 주세요.' },
    location: { msg: '교회 소재지를 입력해 주세요.' },
    message: { msg: '요청 내용을 입력해 주세요.' },
    phone: {
      msg: '연락처를 정확히 입력해 주세요.',
      test: function (v) { return /^[0-9][0-9\-\s()]{7,19}$/.test(v.trim()); },
    },
    email: {
      msg: '이메일 형식을 확인해 주세요.',
      optional: true,
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    },
  };

  function setFieldError(name, message) {
    var input = form.elements[name];
    if (!input) return;
    var field = input.closest('.field');
    var err = form.querySelector('.err[data-for="' + name + '"]');
    if (field) field.classList.toggle('is-invalid', !!message);
    if (input.setAttribute) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) {
      err.textContent = message || '';
      err.hidden = !message;
    }
  }

  function validateField(name) {
    var rule = RULES[name];
    var input = form.elements[name];
    if (!rule || !input) return true;
    var value = input.value.trim();
    if (!value) {
      if (rule.optional) { setFieldError(name, ''); return true; }
      setFieldError(name, rule.msg);
      return false;
    }
    if (rule.test && !rule.test(value)) {
      setFieldError(name, rule.msg);
      return false;
    }
    setFieldError(name, '');
    return true;
  }

  function validateAll() {
    var problems = [];

    var errServices = document.getElementById('err-services');
    var hasService = checkedServices().length > 0;
    errServices.hidden = hasService;
    if (!hasService) problems.push(document.querySelector('.pick input'));

    Object.keys(RULES).forEach(function (name) {
      if (!validateField(name)) problems.push(form.elements[name]);
    });

    var errConsent = document.getElementById('err-consent');
    var consent = form.elements.consent.checked;
    errConsent.hidden = consent;
    if (!consent) problems.push(form.elements.consent);

    return problems;
  }

  /* ---------- 이벤트 ---------- */
  form.addEventListener('change', function (e) {
    if (e.target.name === 'services') {
      buildExtraFields();
      if (checkedServices().length) document.getElementById('err-services').hidden = true;
    }
    if (e.target.name === 'consent' && e.target.checked) {
      document.getElementById('err-consent').hidden = true;
    }
    updateProgress();
  });

  form.addEventListener('input', function (e) {
    if (RULES[e.target.name]) {
      var field = e.target.closest('.field');
      // 이미 오류 표시된 항목만 실시간으로 다시 검사
      if (field && field.classList.contains('is-invalid')) validateField(e.target.name);
    }
    updateProgress();
  });

  form.addEventListener('blur', function (e) {
    if (RULES[e.target.name]) validateField(e.target.name);
  }, true);

  /* 전화번호 자동 하이픈 */
  var phone = form.elements.phone;
  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) { phone.value = d; return; }
    if (d.startsWith('02')) {
      phone.value = d.length <= 5 ? d.replace(/(\d{2})(\d+)/, '$1-$2')
        : d.length <= 9 ? d.replace(/(\d{2})(\d{3})(\d+)/, '$1-$2-$3')
        : d.replace(/(\d{2})(\d{4})(\d{1,4})/, '$1-$2-$3');
    } else {
      phone.value = d.length <= 7 ? d.replace(/(\d{3})(\d+)/, '$1-$2')
        : d.length <= 10 ? d.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3')
        : d.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }
  });

  /* ---------- 제출 ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    formError.hidden = true;

    var problems = validateAll();
    if (problems.length) {
      formError.textContent = '입력하지 않은 필수 항목이 ' + problems.length + '개 있습니다. 표시된 부분을 확인해 주세요.';
      formError.hidden = false;
      var first = problems[0];
      if (first) {
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); }
      }
      return;
    }

    // 신청 내역을 계정에 남기기 위해 제출 시점에 로그인을 요청합니다.
    window.CAPSAuthUI
      .require('신청 내역을 확인하고 진행 상황을 안내드리기 위해 로그인이 필요합니다. 처음이시면 회원가입을 해주세요.')
      .then(function () { send(); })
      .catch(function () { /* 로그인 창을 닫은 경우 — 입력 내용은 그대로 남습니다 */ });
  });

  function send() {
    submitBtn.disabled = true;
    submitBtn.textContent = '제출 중…';

    var fd = new FormData(form);
    var extra = {};
    fd.forEach(function (value, key) {
      if (key.indexOf('__') > -1 && String(value).trim() !== '') extra[key] = value;
    });

    var payload = {
      services: checkedServices(),
      church_name: fd.get('church_name').trim(),
      denomination: (fd.get('denomination') || '').trim(),
      contact_name: fd.get('contact_name').trim(),
      contact_role: fd.get('contact_role') || '',
      phone: fd.get('phone').trim(),
      email: (fd.get('email') || '').trim(),
      location: fd.get('location').trim(),
      size: fd.get('size') || '',
      budget: fd.get('budget') || '',
      timeline: fd.get('timeline') || '',
      message: fd.get('message').trim(),
      prefer: fd.get('prefer') || '전화',
      marketing: fd.get('marketing') === 'on',
      extra: extra,
    };

    window.CAPSDB.submitRequest(payload)
      .then(function (record) { showDone(record); })
      .catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = '신청서 제출하기';
        formError.textContent = (err && err.message)
          ? '접수 처리 중 문제가 발생했습니다: ' + err.message
          : '접수 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.';
        formError.hidden = false;
      });
  }

  /* ---------- 완료 화면 ---------- */
  function showDone(record) {
    var done = document.getElementById('applyDone');
    document.getElementById('doneCode').textContent = record.code;

    var rows = [
      ['신청 항목', record.services.map(window.CAPSDB.serviceName).join(', ')],
      ['교회명', record.church_name],
      ['담당자', record.contact_name + (record.contact_role ? ' ' + record.contact_role : '')],
      ['연락처', record.phone],
      ['접수 일시', window.CAPSDB.formatDate(record.createdAt)],
    ];
    document.getElementById('doneSummary').innerHTML = rows
      .map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; })
      .join('');

    form.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.title = '신청 완료 (' + record.code + ') | CAPS 교회지원센터';

    var copy = document.getElementById('copyCode');
    copy.addEventListener('click', function () {
      var write = navigator.clipboard
        ? navigator.clipboard.writeText(record.code)
        : Promise.reject();
      write
        .then(function () {
          copy.textContent = '복사됨';
          window.setTimeout(function () { copy.textContent = '번호 복사'; }, 1800);
        })
        .catch(function () {
          window.prompt('접수번호를 복사하세요', record.code);
        });
    });
  }

  /* 로그인 상태라면 담당자 정보를 미리 채웁니다. */
  window.CAPSDB.auth.onChange(function (user) {
    if (!user) return;
    var pairs = [['contact_name', user.name], ['email', user.email], ['phone', user.phone], ['church_name', user.church]];
    pairs.forEach(function (pair) {
      var input = form.elements[pair[0]];
      if (input && !input.value && pair[1]) input.value = pair[1];
    });
    updateProgress();
  });

  buildExtraFields();
  updateProgress();
})();
