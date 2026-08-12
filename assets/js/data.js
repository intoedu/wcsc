/* build.js 가 생성한 파일입니다. 직접 수정하지 마세요. */
window.CAPS_SERVICES = [
  {
    "id": "homepage",
    "slug": "homepage",
    "no": "01",
    "name": "홈페이지 제작",
    "tagline": "처음 찾아오는 사람이 가장 먼저 보는 교회의 얼굴",
    "extraFields": [
      {
        "name": "current_site",
        "label": "현재 홈페이지 주소",
        "type": "text",
        "placeholder": "없으면 비워두세요"
      },
      {
        "name": "page_scope",
        "label": "희망 규모",
        "type": "select",
        "options": [
          "소개 중심 (5페이지 내외)",
          "게시판 포함 (10페이지 내외)",
          "영상·자료실 포함 (대형)",
          "아직 모르겠습니다"
        ]
      }
    ]
  },
  {
    "id": "design",
    "slug": "design",
    "no": "02",
    "name": "디자인 제작",
    "tagline": "배너 · 포스터 · 현수막 · 주보를 한 곳에서",
    "extraFields": [
      {
        "name": "design_items",
        "label": "필요한 항목",
        "type": "text",
        "placeholder": "예: 부활절 현수막 2장, 주보 매주 300부"
      },
      {
        "name": "due_date",
        "label": "사용 예정일",
        "type": "date"
      }
    ]
  },
  {
    "id": "staffing",
    "slug": "staffing",
    "no": "03",
    "name": "교역자 구인",
    "tagline": "부교역자 · 전도사 · 사역자 청빙을 돕습니다",
    "extraFields": [
      {
        "name": "position",
        "label": "모집 직분",
        "type": "select",
        "options": [
          "부목사",
          "전도사",
          "교육 전도사",
          "찬양 사역자",
          "행정 간사",
          "기타",
          "사역지를 찾는 교역자입니다"
        ]
      },
      {
        "name": "employment_type",
        "label": "근무 형태",
        "type": "select",
        "options": [
          "전임",
          "파트타임",
          "협의"
        ]
      }
    ]
  },
  {
    "id": "sound",
    "slug": "sound",
    "no": "04",
    "name": "음향 세팅",
    "tagline": "설교가 또렷하게 들리는 예배당",
    "extraFields": [
      {
        "name": "sanctuary_size",
        "label": "예배당 규모",
        "type": "select",
        "options": [
          "100석 미만",
          "100~300석",
          "300~800석",
          "800석 이상",
          "잘 모르겠습니다"
        ]
      },
      {
        "name": "sound_issue",
        "label": "현재 겪는 문제",
        "type": "text",
        "placeholder": "예: 뒷자리 전달력 부족, 찬양 시 하울링"
      }
    ]
  },
  {
    "id": "realestate",
    "slug": "realestate",
    "no": "05",
    "name": "부동산",
    "tagline": "예배 공간을 구하고, 옮기고, 정리하는 일",
    "extraFields": [
      {
        "name": "realestate_type",
        "label": "필요한 지원",
        "type": "select",
        "options": [
          "임대 (예배 공간 구함)",
          "매입",
          "이전 (처분 + 입주)",
          "처분 (매각)",
          "자문만 필요"
        ]
      },
      {
        "name": "region",
        "label": "희망 지역",
        "type": "text",
        "placeholder": "예: 경기 남부, 서울 서북권"
      }
    ]
  },
  {
    "id": "akc",
    "slug": "akc",
    "no": "06",
    "name": "AKC",
    "tagline": "교회와 교회를 잇는 협력 네트워크",
    "extraFields": [
      {
        "name": "akc_interest",
        "label": "관심 분야",
        "type": "text",
        "placeholder": "예: 연합 수련회, 교사 교육, 미디어 장비 공유"
      }
    ]
  },
  {
    "id": "smartchurch",
    "slug": "smartchurch",
    "no": "07",
    "name": "스마트처치 앱",
    "tagline": "성도의 휴대폰 안에 들어가는 교회",
    "extraFields": [
      {
        "name": "member_count",
        "label": "출석 교인 수",
        "type": "select",
        "options": [
          "50명 미만",
          "50~150명",
          "150~500명",
          "500~1,000명",
          "1,000명 이상"
        ]
      },
      {
        "name": "existing_system",
        "label": "현재 사용 중인 시스템",
        "type": "text",
        "placeholder": "예: 엑셀 교적부, 타사 교회 앱"
      }
    ]
  },
  {
    "id": "intooffice",
    "slug": "intooffice",
    "no": "08",
    "name": "인투오피스",
    "tagline": "교회 행정과 사무를 대신 맡습니다",
    "extraFields": [
      {
        "name": "office_scope",
        "label": "필요한 대행 범위",
        "type": "text",
        "placeholder": "예: 월 회계 정리, 급여·4대보험, 공문 작성"
      },
      {
        "name": "staff_status",
        "label": "현재 행정 담당",
        "type": "select",
        "options": [
          "담당자 없음 (목회자가 처리)",
          "봉사자가 겸임",
          "전담 간사 있음",
          "기타"
        ]
      }
    ]
  }
];
