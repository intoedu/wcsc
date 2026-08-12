/* 신청 데이터 저장소.
 *
 * 기본 동작은 브라우저 localStorage 저장(데모)입니다.
 * 실제 운영에서는 아래 CAPS_CONFIG.endpoint 에 접수 API 주소를 넣으면
 * 같은 형식(JSON)으로 POST 하고, 실패 시 localStorage 로 자동 대체합니다.
 */
window.CAPS_CONFIG = window.CAPS_CONFIG || {
  // 예: 'https://example.com/api/applications' (Supabase Edge Function, Formspree 등)
  endpoint: '',
  // endpoint 사용 시에도 브라우저에 사본을 남길지 여부 (신청 조회 기능에 필요)
  keepLocalCopy: true,
};

window.CAPS = (function () {
  'use strict';

  var KEY = 'caps.applications.v1';
  var STATUS = {
    received: { label: '접수 완료', cls: 'badge-received' },
    progress: { label: '상담 진행 중', cls: 'badge-progress' },
    done: { label: '처리 완료', cls: 'badge-done' },
  };

  function available() {
    try {
      var t = '__caps_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  function all() {
    if (!available()) return [];
    try {
      var raw = window.localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function persist(list) {
    if (!available()) return false;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** CAPS-YYMMDD-XXXX 형식 접수번호 */
  function makeCode() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    var ymd = String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
    var rand = String(Math.floor(1000 + Math.random() * 9000));
    var code = 'CAPS-' + ymd + '-' + rand;
    // 같은 기기 내 중복 방지
    return all().some(function (r) { return r.code === code; }) ? makeCode() : code;
  }

  function serviceName(id) {
    var list = window.CAPS_SERVICES || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].name;
    return id;
  }

  function serviceNames(ids) {
    return (ids || []).map(serviceName);
  }

  /** 신청 저장. 원격 endpoint 가 설정되어 있으면 먼저 전송을 시도합니다. */
  function save(data) {
    var record = Object.assign({}, data, {
      code: makeCode(),
      createdAt: new Date().toISOString(),
      status: 'received',
      delivery: 'local',
    });

    var cfg = window.CAPS_CONFIG || {};
    var chain = Promise.resolve();

    if (cfg.endpoint) {
      chain = fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          record.delivery = 'remote';
        })
        .catch(function () {
          // 전송 실패 시에도 접수 내용은 로컬에 남겨 유실을 막습니다.
          record.delivery = 'local-fallback';
        });
    }

    return chain.then(function () {
      var keepLocal = !cfg.endpoint || cfg.keepLocalCopy !== false || record.delivery !== 'remote';
      if (keepLocal) {
        var list = all();
        list.unshift(record);
        persist(list);
      }
      return record;
    });
  }

  function find(code) {
    var needle = String(code || '').trim().toUpperCase();
    if (!needle) return null;
    var hit = all().filter(function (r) { return r.code.toUpperCase() === needle; });
    return hit.length ? hit[0] : null;
  }

  function update(code, patch) {
    var list = all();
    var changed = false;
    list = list.map(function (r) {
      if (r.code !== code) return r;
      changed = true;
      return Object.assign({}, r, patch);
    });
    if (changed) persist(list);
    return changed;
  }

  function remove(code) {
    var list = all().filter(function (r) { return r.code !== code; });
    return persist(list);
  }

  function formatDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  return {
    STATUS: STATUS,
    all: all,
    save: save,
    find: find,
    update: update,
    remove: remove,
    serviceName: serviceName,
    serviceNames: serviceNames,
    formatDate: formatDate,
    storageAvailable: available,
  };
})();
