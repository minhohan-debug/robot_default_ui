/**
 * 폼 입력값 유효성 검사 컴포저블
 *
 * 조건 리스트를 순회하면서 첫 번째 실패 항목의 메시지를 저장합니다.
 */
import { ref, type Ref } from 'vue';

/**
 * 단일 유효성 검사 규칙
 */
export interface FormRule {
  test: () => boolean; // 검사 조건
  message: string; // 실패 시 표시할 메시지
}

/**
 * 폼 유효성 검사 훅
 * @returns {object} errorMessage, validate
 */
export function useFormValidation(): {
  errorMessage: Ref<string | null>;
  validate: (rules: FormRule[]) => boolean;
} {
  // 마지막 검사 실패 메시지
  const errorMessage = ref<string | null>(null);

  /**
   * 규칙 배열을 검사합니다.
   * @param rules - FormRule 배열
   * @returns boolean - 전체 통과 여부
   */
  const validate = (rules: FormRule[]): boolean => {
    for (const rule of rules) {
      if (!rule.test()) {
        errorMessage.value = rule.message;
        return false;
      }
    }
    errorMessage.value = null;
    return true;
  };

  return { errorMessage, validate };
}
