/**
 * 애플리케이션 테마(dark/light) 상태 관리 컴포저블
 */
import { ref, watch, type Ref } from 'vue';
import type { Theme } from '@renderer/types/theme';

interface UseThemeReturn {
  theme: Ref<Theme>;
  themeOptions: { icon: string; value: Theme }[];
  setTheme: (value: Theme) => void;
}

/**
 * 테마 훅
 * @returns {UseThemeReturn} 현재 테마, 옵션 목록, 테마 설정 함수
 */
export const useTheme = (): UseThemeReturn => {
  // HTML data-theme 속성에서 초기값을 읽고, 없으면 라이트 모드
  const theme = ref<Theme>((document.documentElement.getAttribute('data-theme') as Theme) || 'light');

  // 사용자가 선택할 수 있는 테마 옵션
  const themeOptions = [
    { icon: 'pi pi-sun', value: 'light' as const },
    { icon: 'pi pi-moon', value: 'dark' as const },
  ];

  /**
   * 테마 값을 변경합니다.
   * @param value - 'light' | 'dark'
   */
  const setTheme = (value: Theme): void => {
    theme.value = value;
  };

  // 테마 변경 시 HTML 속성과 localStorage에 저장
  watch(theme, (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  return { theme, themeOptions, setTheme };
};
