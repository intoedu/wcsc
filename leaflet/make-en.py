# -*- coding: utf-8 -*-
"""한글 리플렛에서 영문판 HTML 을 만듭니다.

    python3 leaflet/make-en.py
    npm run leaflet          # 그 다음 PDF 를 뽑습니다

한글판을 고치면 i18n-ko.json 에 없는 새 문장이 생깁니다.
그럴 때는 아래가 알려 줍니다 — i18n-ko.json 과 i18n-en.py 에
같은 자리에 문장을 하나씩 더해 주시면 됩니다.

영문 규칙(leaflet-en.css)은 페이지 안쪽 <style> 보다 뒤에 와야 이깁니다.
그래서 </head> 바로 앞에 붙입니다 — 이 순서를 바꾸면 영문 조판이 먹지 않습니다.
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from i18n_en import EN  # noqa: E402

PAIRS = [('leaflet-3fold.html', 'leaflet-3fold-en.html'),
         ('leaflet-a4.html', 'leaflet-a4-en.html')]


def strings(html):
    """인쇄되는 한글 문장만 뽑습니다 (주석 · style · script 는 뺍니다)."""
    s = re.sub(r'<!--.*?-->|<style.*?</style>|<script.*?</script>', '', html, flags=re.S)
    out, seen = [], set()
    for m in re.finditer(r'>([^<>]+)<', s):
        t = m.group(1).strip()
        if re.search(r'[가-힣]', t) and t not in seen:
            seen.add(t); out.append(t)
    for m in re.finditer(r'(?:alt|title)="([^"]*[가-힣][^"]*)"', s):
        if m.group(1) not in seen:
            seen.add(m.group(1)); out.append(m.group(1))
    return out


def main():
    ko = json.load(io.open(os.path.join(HERE, 'i18n-ko.json'), encoding='utf-8'))
    if len(ko) != len(EN):
        sys.exit('i18n-ko.json(%d) 과 i18n-en.py(%d) 의 개수가 다릅니다.' % (len(ko), len(EN)))
    known = set(ko)

    missing = []
    for src, _ in PAIRS:
        for t in strings(io.open(os.path.join(HERE, src), encoding='utf-8').read()):
            if t not in known:
                missing.append((src, t))
    if missing:
        print('번역이 없는 문장이 있습니다 — i18n-ko.json 과 i18n-en.py 에 더해 주세요:')
        for src, t in missing:
            print('  [%s] %s' % (src, t))
        sys.exit(1)

    pairs = sorted(zip(ko, EN), key=lambda kv: -len(kv[0]))   # 긴 것부터 바꿔야 겹치지 않습니다
    for src, dst in PAIRS:
        s = io.open(os.path.join(HERE, src), encoding='utf-8').read()
        for k, v in pairs:
            s = s.replace(k, v)
        s = s.replace('<html lang="ko">', '<html lang="en">')
        s = s.replace('</head>', '<link rel="stylesheet" href="leaflet-en.css">\n</head>', 1)
        s = s.replace('010-4254-2270', '+82 10-4254-2270')   # 해외에서도 걸 수 있게
        io.open(os.path.join(HERE, dst), 'w', encoding='utf-8').write(s)
        print('만듦:', dst)


if __name__ == '__main__':
    main()
