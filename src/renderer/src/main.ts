/**
 * Vue 렌더러 프로세스 진입점
 *
 * - Vue 앱 인스턴스를 생성
 * - PrimeVue UI 컴포넌트, i18n, 라우터 연결
 * - dark/light 테마 초기화
 */
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import i18n from './locales';

// 공용 테마 변수 로드
import './assets/styles/main.scss';
import './assets/styles/primevue.scss';
import './assets/styles/_variables.scss';
import 'pretendard/dist/web/static/pretendard.css';
import 'flag-icons/css/flag-icons.min.css';

// PrimeVue 플러그인 및 테마 로드
import PrimeVue from 'primevue/config';
import 'primeicons/primeicons.css';
import Aura from '@primevue/themes/aura';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Password from 'primevue/password';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Dialog from 'primevue/dialog';
import ConfirmDialog from 'primevue/confirmdialog';
import ConfirmationService from 'primevue/confirmationservice';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup'; // optional
import Row from 'primevue/row';
import Popover from 'primevue/popover';
import Skeleton from 'primevue/skeleton';

// 사용자가 저장한 테마가 없으면 시스템 다크 모드를 따르고, document 속성에 적용합니다
const savedTheme = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = savedTheme ?? (systemDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', theme);

// Vue 앱 인스턴스를 생성합니다
const app = createApp(App);

// 1. PrimeVue 플러그인과 전역 컴포넌트를 설정합니다
// PrimeVue 테마(Aura) 및 다크 모드 선택자를 설정합니다
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '[data-theme="dark"]',
    },
  },
});
// 전역 PrimeVue 컴포넌트 등록 (템플릿에서 P 접두사로 사용)
// 패스워드 입력 필드
app.component('PPassword', Password);
// 토스트 알림
app.component('PToast', Toast);
// 셀렉트 박스
app.component('PSelect', Select);
// 일반 텍스트 입력 필드
app.component('PInputText', InputText);
// 버튼
app.component('PButton', Button);
// 대화상자
app.component('PDialog', Dialog);
// 확인 대화상자
app.component('PConfirmDialog', ConfirmDialog);
// 데이터 테이블
app.component('PDataTable', DataTable);
// 데이터 테이블 컬럼
app.component('PColumn', Column);
// 데이터 테이블 컬럼 그룹 (선택사항)
app.component('PColumnGroup', ColumnGroup);
// 데이터 테이블 행
app.component('PRow', Row);
// 팝오버
app.component('PPopover', Popover);
// 스켈레톤
app.component('PSkeleton', Skeleton);

// Toast 및 Confirm 서비스를 전역으로 등록합니다
app.use(ToastService);
app.use(ConfirmationService);

// 2. 다국어(i18n) 플러그인 연결
app.use(i18n);

// 3. Vue 라우터 연결
app.use(router);

// 4. '#app' 엘리먼트에 마운트
app.mount('#app');
