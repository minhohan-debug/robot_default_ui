<template>
  <!--
    로그인 화면
    - 상단 좌/우에서 테마(라이트/다크)와 언어(한/영) 선택
    - 상단 중앙 숨겨진 터치 영역: 3회 연속 터치로 관리자/일반 모드 전환
    - 하단 카드 영역: 비밀번호 입력 필드, 숫자 패드, 로그인 버튼
  -->
  <div class="login-wrapper">
    <WaveBackground :is-admin="isAdminMode" />
    <div class="theme-toggle">
      <div class="theme-select">
        <div class="theme-button-wrapper" v-for="option in themeOptions" :key="option.value">
          <button
            class="theme-button"
            :class="{ 'theme-button-active': theme === option.value }"
            @click="setTheme(option.value)"
          >
            <i :class="option.icon"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="language-toggle">
      <PSelect v-model="locale" :options="languageOptions" option-value="value">
        <template #value>
          <div class="language-option">
            <span :class="selectedLanguage.flag"></span>
            <span>{{ selectedLanguage.label }}</span>
          </div>
        </template>
        <template #option="{ option }">
          <div class="language-option">
            <span :class="option.flag"></span>
            <span>{{ option.label }}</span>
          </div>
        </template>
      </PSelect>
    </div>
    <div class="type-toggle" @click="onTypeToggleClick"></div>
    <div class="type-field" :class="{ active: isAdminMode }">{{ t('pages.login.adminMode') }}</div>
    <div class="glass-dialog login-card">
      <div class="logo-area">
        <div class="logo-image"></div>
        <div class="logo-text">{{ t('pages.login.companyName') }}</div>
      </div>
      <div class="login-form">
        <div class="password-field">
          <label>{{ t('pages.login.password') }}</label>
          <PPassword v-model="loginForm.pw" :feedback="false" disabled />
        </div>
        <div class="number-pad-field">
          <ul>
            <li @click="appendDigit('1')">1</li>
            <li @click="appendDigit('2')">2</li>
            <li @click="appendDigit('3')">3</li>
          </ul>
          <ul>
            <li @click="appendDigit('4')">4</li>
            <li @click="appendDigit('5')">5</li>
            <li @click="appendDigit('6')">6</li>
          </ul>
          <ul>
            <li @click="appendDigit('7')">7</li>
            <li @click="appendDigit('8')">8</li>
            <li @click="appendDigit('9')">9</li>
          </ul>
          <ul>
            <li @click="clearPassword">C</li>
            <li @click="appendDigit('0')">0</li>
            <li @click="backspacePassword"><i class="pi pi-arrow-left"></i></li>
          </ul>
        </div>
        <div class="button-field">
          <div class="button primary" :class="{ disabled: !passwordValid || isLoading }" @click="handleLogin">
            {{ t('pages.login.title') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 로그인 화면
 *
 * - 사용자/관리자 모드를 선택할 수 있는 숫자 패드 기반 로그인 화면입니다.
 * - WaveBackground 컴포넌트로 관리자 모드 여부에 따른 배경 색상을 변경합니다.
 * - 상단 영역에서는 테마(라이트/다크)와 언어(한국어/영어)를 전환할 수 있습니다.
 * - 상단 중앙의 숨겨진 토글 영역을 3회 연속 터치하면 일반/관리자 모드가 바뀝니다.
 * - 숫자 패드로 4~16자리 비밀번호를 입력한 후 로그인 API를 호출합니다.
 * - 인증 성공 시 setAuthTokens으로 토큰을 저장하고 /main 라우트로 이동합니다.
 */
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import axios from 'axios';
import WaveBackground from '@renderer/components/WaveBackground.vue';
import { useTheme } from '@renderer/composables/useTheme';
import { useErrorToast } from '@renderer/composables/useToast';
import { setAuthTokens } from '@renderer/composables/useAuth';
import { login } from '@renderer/services/api/auth';
import { ERROR_CODES } from '@renderer/constants/errorCodes';
import type { ApiErrorResponse } from '@renderer/types/api';
import type { LoginPayload } from '@renderer/types/auth';

// ==========================================
// 1. 컴포저블 (Composables)
// ==========================================

const { locale, t } = useI18n();
const { theme, themeOptions, setTheme } = useTheme();
const { showError } = useErrorToast();
const router = useRouter();

// ==========================================
// 2. 언어 설정
// ==========================================

const languageOptions = [
  { label: '한국어', value: 'ko' as const, flag: 'fi fi-kr' },
  { label: 'English', value: 'en' as const, flag: 'fi fi-us' },
];

type LanguageOption = (typeof languageOptions)[number];

/** 현재 선택된 언어에 해당하는 label/flag 객체 */
const selectedLanguage = computed<LanguageOption>(
  () => languageOptions.find((option) => option.value === locale.value) ?? languageOptions[0],
);

/** 언어 변경 시 브라우저/로컬 스토리지에 lang 값을 영구 저장 */
watch(locale, (newLocale) => {
  localStorage.setItem('lang', newLocale);
});

// ==========================================
// 3. 로그인 폼 상태 (Reactive State)
// ==========================================

const loginForm = reactive<LoginPayload>({
  type: 1, // 기본값: 사용자
  pw: '',
});

const isAdminMode = computed(() => loginForm.type === 0);

let typeToggleClickCount = 0;
let typeToggleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 상단 중앙 숨겨진 영역 터치 핸들러
 * - 600ms 내 3회 이상 터치 시 사용자(1) ↔ 관리자(0) 모드를 전환합니다.
 * - 모드 전환 시 입력 중이던 비밀번호를 초기화합니다.
 */
const onTypeToggleClick = (): void => {
  typeToggleClickCount++;
  if (typeToggleTimer) clearTimeout(typeToggleTimer);
  typeToggleTimer = setTimeout(() => {
    typeToggleClickCount = 0;
  }, 600);

  if (typeToggleClickCount >= 3) {
    typeToggleClickCount = 0;
    loginForm.type = loginForm.type === 0 ? 1 : 0;
    loginForm.pw = '';
  }
};

const isLoading = ref<boolean>(false); // 로그인 API 호출 중인지 여부

/** 1~16자리 비밀번호가 입력되었는지 (버튼 활성화 조건) */
const passwordValid = computed(() => loginForm.pw.length >= 1 && loginForm.pw.length <= 16);

// ==========================================
// 4. 숫자 패드 입력 처리
// ==========================================

/** 비밀번호에 숫자 한 자리 추가 (최대 16자리) */
const appendDigit = (digit: string): void => {
  if (loginForm.pw.length < 16) {
    loginForm.pw += digit;
  }
};

/** 비밀번호 전체 삭제 (C 버튼) */
const clearPassword = (): void => {
  loginForm.pw = '';
};

/** 비밀번호 마지막 자리 삭제 (백스페이스 버튼) */
const backspacePassword = (): void => {
  loginForm.pw = loginForm.pw.slice(0, -1);
};

// ==========================================
// 5. 로그인 처리
// ==========================================

/**
 * 로그인 시도 핸들러
 * - 4~16자리 비밀번호를 검증합니다.
 * - login API를 호출하고 성공 시 토큰(access/refresh/role)을 저장합니다.
 * - 성공 시 /main 화면으로 push 이동합니다.
 * - 실패 시 axios 에러 응답의 err_code를 분석하여 토스트 메시지를 표시합니다.
 */
const handleLogin = async (): Promise<void> => {
  // 비밀번호 길이 검증 (4자리 이상 16자리 이하)
  if (loginForm.pw.length < 4 || loginForm.pw.length > 16) {
    showError('warn', t('pages.login.error.passwordLength'));
    return;
  }

  isLoading.value = true;

  try {
    const data = await login(loginForm);

    if (data?.data) {
      // 로그인 성공 시 토큰 저장
      const { access_token, refresh_token, role } = data.data;
      setAuthTokens({ access_token, refresh_token, role });
      await router.push('/main');
    }
  } catch (error: unknown) {
    // 서버/네트워크 오류 처리
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as ApiErrorResponse | undefined;

      if (errorData?.detail) {
        const { err_code } = errorData.detail;

        if (err_code === ERROR_CODES.LOGIN_FAILED) {
          showError('warn', t('pages.login.error.passwordMismatch'));
        } else {
          showError('warn', t('pages.login.error.passwordMismatch'));
        }
      } else {
        showError('warn', t('pages.login.error.loginFailed'));
      }
    } else {
      showError('error', t('pages.login.error.networkError'));
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-surface);
  background-size: cover;
  background-position: center;
  padding: 1rem;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.theme-toggle {
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 10;
}

.language-toggle {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 12rem;
  z-index: 10;
}

.type-toggle {
  position: absolute;
  width: 20rem;
  height: 5rem;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: transparent;
  z-index: 10;
}
.type-field {
  display: none;
  pointer-events: none;
}
.type-field.active {
  display: block;
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
  z-index: 11;
}

.login-card {
  position: absolute;
  width: 40rem;
  bottom: 2rem;
  right: 2rem;
  background-color: var(--bg-dialog);
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.logo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.logo-image {
  background-image: url('@renderer/assets/images/logo.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 80px;
  height: 2rem;
}
.logo-text {
  font-size: 32px;
  font-weight: 500;
  color: var(--text-header);
}

.password-field {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.password-field label {
  font-size: 20px;
  color: var(--text-label);
}

.number-pad-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.number-pad-field ul {
  display: flex;
  gap: 1rem;
}

.number-pad-field ul li {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 5rem;
  color: var(--text-button);
  background-color: color-mix(in srgb, var(--bg-input), transparent 65%) !important;
  border-radius: 4px;
  font-size: 24px;
  transition: background-color 0.2s ease;
  &:active {
    background-color: color-mix(in srgb, var(--bg-input), transparent 30%) !important;
  }
}
.number-pad-field ul li i {
  font-size: 20px;
}

.button-field {
  margin-top: 2rem;
}
</style>
