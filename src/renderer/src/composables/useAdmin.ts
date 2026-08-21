/**
 * 관리자 권한 확인 컴포저블
 *
 * `useAuth`의 전역 인증 상태에서 사용자 역할을 확인합니다.
 */
import { computed, type ComputedRef } from 'vue';
import { authState } from './useAuth';

export function useAdmin(): { isAdmin: ComputedRef<boolean> } {
  // userRole이 '0'이면 관리자로 판단합니다
  const isAdmin = computed<boolean>(() => authState.userRole === '0');
  return { isAdmin };
}
