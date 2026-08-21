/**
 * PrimeVue 플러그인 설정
 *
 * - Aura 테마를 기반으로 다크 모드 연동
 * - 자주 사용하는 컴포넌트를 전역 등록
 */
import { App } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';

// 사용할 핵심 컴포넌트들 수동 Import (Vite가 트리쉐이킹하여 최적화하도록)
import Button from 'primevue/button'; // 버튼
import DataTable from 'primevue/datatable'; // 데이터 테이블
import Column from 'primevue/column'; // 데이터 테이블 컬럼

/**
 * 앱에 PrimeVue 테마와 글로벌 컴포넌트를 설정합니다.
 * @param app - Vue 앱 인스턴스
 */
export function setupPrimeVue(app: App): void {
  app.use(PrimeVue, {
    theme: {
      preset: Aura, // Aura 아키텍처 기본 테마
      options: {
        darkModeSelector: '[data-theme="dark"]', // data-theme="dark" 인 요소에서 다크 모드 적용
      },
    },
  });

  // 글로벌 컴포넌트 등록
  app.component('PButton', Button);
  app.component('PDataTable', DataTable);
  app.component('PColumn', Column);
}
