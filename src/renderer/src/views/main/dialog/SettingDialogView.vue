<template>
  <!--
    앱 설정 다이얼로그
    - 표시/숨김은 v-model:visible로 제어됨
    - 상단: 테마(라이트/다크) 및 언어(한국어/영어) 선택
    - 하단: 로그아웃/닫기 버튼
    - PConfirmDialog 슬롯을 커스텀하여 확인 팝업 UI도 함께 구성
  -->
  <div v-if="visible" class="setting-overlay" @click="emit('update:visible', false)" />
  <PDialog
    :visible="visible"
    :modal="false"
    @update:visible="emit('update:visible', $event)"
    position="topright"
    class="app-setting-dialog glass-dialog"
    :draggable="true"
  >
    <template #container="{ closeCallback }">
      <div class="setting-field">
        <ul>
          <li>
            <label>{{ t('pages.main.setting.displayMode') }}</label>
          </li>
          <li>
            <div class="app-setting-theme-toggle">
              <div class="app-setting-theme-select">
                <div class="app-setting-theme-button-wrapper" v-for="option in themeOptions" :key="option.value">
                  <button
                    class="app-setting-theme-button"
                    :class="{ 'app-setting-theme-button-active': theme === option.value }"
                    @click="setTheme(option.value)"
                  >
                    <i :class="option.icon"></i>
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <ul>
          <li>
            <label>{{ t('pages.main.setting.language') }}</label>
          </li>
          <li>
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
          </li>
        </ul>
      </div>
      <div class="dialog-close-field">
        <div>
          <div class="button error" @click="handleLogout">{{ t('pages.main.logout') }}</div>
        </div>
        <div>
          <div class="button gray" @click="closeCallback">{{ t('pages.main.setting.close') }}</div>
        </div>
      </div>
    </template>
  </PDialog>
  <PConfirmDialog class="logout-dialog">
    <template #container="{ message, acceptCallback, closeCallback }">
      <div class="logout-content">
        <div>{{ message.message }}</div>
      </div>
      <div class="dialog-close-field">
        <div>
          <div :class="['button', (message as ConfirmMessage).acceptClass ?? 'primary']" @click="acceptCallback">
            {{ (message as ConfirmMessage).acceptLabel ?? t('common.confirm') }}
          </div>
        </div>
        <div>
          <div class="button gray" @click="closeCallback">{{ t('common.cancel') }}</div>
        </div>
      </div>
    </template>
  </PConfirmDialog>
</template>

<script setup lang="ts">
/**
 * 앱 설정 다이얼로그
 *
 * - 우측 상단에서 열리는 설정 팝업입니다.
 * - useTheme으로 테마(라이트/다크)를 전환합니다.
 * - useI18n locale을 변경하면 localStorage에 lang을 저장합니다.
 * - 로그아웃 시 PConfirmDialog(PrimeVue)로 한 번 더 확인을 거칩니다.
 * - visible prop을 v-model:visible로 양방향 바인딩하여 외부에서 열림/닫힘을 제어합니다.
 */
import { watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from 'primevue/useconfirm';
import { useTheme } from '@renderer/composables/useTheme';
import { useAuth } from '@renderer/composables/useAuth';

const { locale, t } = useI18n();
const { logout } = useAuth();
const confirm = useConfirm();
const { theme, themeOptions, setTheme } = useTheme();

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();

/** 로그인 화면과 동일한 언어 옵션 */
const languageOptions = [
  { label: '한국어', value: 'ko' as const, flag: 'fi fi-kr' },
  { label: 'English', value: 'en' as const, flag: 'fi fi-us' },
];

type LanguageOption = (typeof languageOptions)[number];

/** PConfirmDialog의 #container 슬롯에서 전달되는 메시지 객체 */
interface ConfirmMessage {
  message: string;
  acceptClass?: string;
  acceptLabel?: string;
}

/** 언어 변경 시 localStorage에 lang 값을 영구 저장 (앱 재시작 시 유지) */
watch(locale, (newLocale) => {
  localStorage.setItem('lang', newLocale);
});

/** 현재 i18n locale과 매칭되는 언어 옵션 */
const selectedLanguage = computed<LanguageOption>(
  () => languageOptions.find((option) => option.value === locale.value) ?? languageOptions[0],
);

/**
 * 로그아웃 버튼 클릭 핸들러
 * - confirm.require로 확인 팝업을 띄우고 사용자가 확인하면 logout()을 실행합니다.
 */
const handleLogout = (): void => {
  confirm.require({
    message: t('pages.main.setting.logoutConfirmMessage'),
    acceptClass: 'error',
    acceptLabel: t('pages.main.logout'),
    accept: () => {
      void logout();
    },
  });
};
</script>

<style scoped lang="scss">
.setting-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
}

.app-setting-dialog .setting-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.setting-field ul {
  display: flex;
  justify-content: space-between;
  color: var(--text-button);
  font-size: 24px;
  font-weight: 500;
}

.setting-field ul li {
  display: flex;
  flex: 1;
  align-items: center;
  padding: 0.5rem 0;
}
</style>
