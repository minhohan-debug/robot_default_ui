/**
 * Vue I18n 설정
 *
 * - 한국어(ko)와 영어(en) 메시지 JSON을 로드합니다.
 * - localStorage에 저장된 언어가 있으면 우선 적용하고, 없으면 한국어를 사용합니다.
 */
import { createI18n } from 'vue-i18n';

// JSON 파일로 분리된 번역 데이터
import ko from './ko.json';
import en from './en.json';

const messages = {
  ko,
  en,
};

const i18n = createI18n({
  legacy: false, // Composition API 스펙 사용
  locale: localStorage.getItem('lang') || 'ko', // 로컬스토리지 저장 값 우선
  fallbackLocale: 'en', // 번역 키가 없으면 영어로 폴백
  messages,
});

// i18n 인스턴스를 외부에서 import하여 사용
export default i18n;
