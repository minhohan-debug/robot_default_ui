src/
├── assets/
│   ├── images/                      # 로봇 아이콘 및 그래픽 에셋
│   └── styles/
│       ├── themes/                  # [새로 추가] 다크 / 라이트 테마 변수 관리
│       │   ├── _light.scss          # 라이트 테마 전용 CSS 변수 (배경색, 텍스트색 등)
│       │   └── _dark.scss           # 다크 테마 전용 CSS 변수 (야간/공장 모드)
│       ├── _variables.scss          # 테마 공통 Sass 변수 (폰트 크기, 간격 등)
│       └── main.scss                # 스타일 진입점 (테마 변수 및 글로벌 스타일 통합)
│
├── components/                      # [컴포넌트 - UI 부품 (lang="ts" 적용)]
│   ├── common/                      # 도메인 독립적 순수 공통 UI
│   │   ├── BaseButton.vue
│   │   ├── BaseModal.vue
│   │   └── BaseTable.vue            # 내역 조회용 타입 안정성이 확보된 테이블
│   ├── layout/                      # 웹 프레임 구조
│   │   ├── Header.vue               # 상단 바 (언어 선택 및 테마 토글 스위치 포함)
│   │   └── Sidebar.vue              # 좌측 네비게이션
│   │
│   # --- 도메인별 세분화 컴포넌트 ---
│   ├── dashboard/                   # 대시보드 화면용 부품
│   ├── control/                     # 로봇 제어 및 명령어 관리 부품
│   ├── error/                       # 오류 내역 및 코드 관리 부품
│   ├── task/                        # 작업 내역 및 실시간 모니터링 부품
│   └── sorting/                     # 선별기 특화 부품
│
├── locales/                         # [새로 추가] 다국어(vue-i18n) 설정 및 번역 파일
│   ├── index.ts                     # vue-i18n 초기화 및 플러그인 설정 스크립트
│   ├── ko.json                      # 한국어 번역 데이터 (대시보드, 제어 메뉴명 등)
│   └── en.json                      # 영어 번역 데이터 (전송용 레이블 등)
│
├── services/                        # [네트워크 통신 레이어 (Strict Type 적용)]
│   ├── api/                         # HTTP REST API (Axios 인터셉터 기반)
│   │   ├── index.ts                 # Axios 인스턴스 (Base URL 및 에러 인터셉터)
│   │   ├── auth.ts                  # 로그인, 토큰 재발급 (RA-001 ~ RA-004)
│   │   ├── robot.ts                 # 로봇 CRUD 및 설정 (RA-005 ~ RA-008, RA-011 ~ RA-012)
│   │   ├── command.ts               # 로봇 명령어 CRUD (RA-014 ~ RA-017)
│   │   ├── control.ts               # 원격 제어 요청/취소/응답 수신 (RA-019 ~ RA-021)
│   │   ├── error.ts                 # 로봇 오류 코드 CRUD (RA-025 ~ RA-028)
│   │   ├── task.ts                  # 로봇 작업 내역 상세 조회 (RA-033)
│   │   └── sorting.js               # 선별기 정보 조회/설정 (RA-036 ~ RA-037)
│   │
│   └── websocket/                   # 실시간 Websocket (인터페이스 기반 구현)
│       ├── baseSocket.ts            # 웹소켓 공통 추상 클래스
│       ├── socketManager.ts         # 채널 통합 라이프사이클 관리자
│       ├── robotStatus.ts           # 전체/특정 로봇 상태 정보 (RA-009, RA-010)
│       ├── robotJointTcp.ts         # 특정 로봇 각도 및 TCP 정보 (RA-013)
│       ├── robotControl.ts          # 특정 로봇 원격 제어 내역 실시간 (RA-018)
│       ├── statistics.ts            # 전체 로봇 통계 조회 (RA-022)
│       ├── errorHistory.ts          # 전체/특정 로봇 오류 내역 (RA-029, RA-030)
│       ├── taskHistory.ts           # 작업 내역 (RA-023, RA-024, RA-031, RA-032)
│       ├── taskStatus.ts            # 작업 진행 정보 채널 (RA-034)
│       └── safety.ts                # 안전 컨트롤러 알림 조회 (RA-035)
│
├── stores/                          # [상태 관리 저장소 - Pinia]
│   ├── index.ts                     # Pinia 루트 인스턴스 설정
│   └── modules/                     # 외부 데이터를 가공하여 보관하는 타입화된 스토어
│       ├── auth.ts
│       ├── robotStatus.ts
│       ├── robotControl.ts
│       ├── error.ts
│       ├── task.ts
│       └── sorting.ts
│
├── types/                           # [새로 추가] 전역 TypeScript 타입/인터페이스 정의 정의 폴더
│   ├── api.ts                       # 공통 응답 포맷(err_code, message, data, count) 데이터 모델 타입
│   ├── robot.ts                     # 관절 정보(joint_1~6) 및 TCP(x,y,z,rx,ry,rz) 등의 명세서 기반 타입 정의
│   ├── task.ts                      # 작업 정보(task_id, sector_info 등) 스펙 전용 인터페이스
│   └── theme.ts                     # 'light' | 'dark' 테마 리터럴 타입 정의
│
├── composables/                     # [비즈니스 로직 훅]
│   ├── useTheme.ts                  # [새로 추가] 다크/라이트 테마 상태 스위칭 훅
│   ├── useAuthInterceptor.ts        # 토큰 재발급 자동 인터셉트 로직
│   └── useErrorToast.ts             # 실시간 오류 수신 시 팝업 연동 로직
│
├── utils/                           # [순수 유틸리티 함수]
│   ├── formatters.ts                # 날짜 및 좌표 데이터 포맷터
│   └── validators.ts                # 암호 검증 및 데이터 유효성 검사 헬퍼
│
├── views/                           # [화면 구조 생략]
├── App.vue                          # 최상위 컴포넌트 (테마 클래스 바인딩 주입)
└── main.ts                          # 엔트리 파일 (TS 기반 컴파일러 진입점)