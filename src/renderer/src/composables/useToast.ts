/**
 * PrimeVue Toast 컴포저블
 *
 * 애플리케이션 전역에서 토스트 알림을 표시할 때 사용합니다.
 */
import { useToast } from 'primevue/usetoast';
import type { ToastMessageOptions } from 'primevue/toast';

/**
 * useErrorToast 반환 타입
 */
interface UseErrorToastReturn {
  // type: success / warn / error, detail: 내용, life: 노출 시간(ms)
  showError: (type: string, detail: string, life?: number) => void;
}

/**
 * 토스트 노출 훅
 * @returns {UseErrorToastReturn} 토스트 표시 함수
 */
export const useErrorToast = (): UseErrorToastReturn => {
  // PrimeVue의 useToast 인스턴스
  const toast = useToast();

  /**
   * 지정한 심각도의 토스트 메시지를 표시합니다.
   * @param type - success / warn / error
   * @param detail - 토스트 상세 내용
   * @param life - 화면에 표시될 시간(밀리초), 기본 6000ms
   */
  const showError = (type: string, detail: string, life = 6000): void => {
    toast.add({ severity: type, detail, life } as ToastMessageOptions);
  };

  return { showError };
};
