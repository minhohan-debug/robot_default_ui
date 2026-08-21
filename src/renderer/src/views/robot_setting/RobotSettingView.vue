<template>
  <div class="robot-setting-view">
    <div>
      <div class="glass-dialog error-code-area">
        <div class="error-code-list">
          <div class="list-title">{{ t('pages.robotSetting.errorCodeListTitle') }}</div>
          <ul class="header-row">
            <li>{{ t('pages.robotSetting.errorCode') }}</li>
            <li>{{ t('pages.robotSetting.errorDescription') }}</li>
            <li></li>
          </ul>
          <ul v-for="code in errorCodes" :key="code.error_code">
            <li>{{ code.error_code }}</li>
            <li>{{ code.description }}</li>
            <li class="action-cell">
              <div class="button accent" @click="openEditPopup(code)">{{ t('common.edit') }}</div>
              <div class="button error" @click="handleDelete(code.error_code)">{{ t('common.delete') }}</div>
            </li>
          </ul>
        </div>
      </div>
      <div class="button-area">
        <div class="button primary" @click="openRegisterPopup">{{ t('pages.robotSetting.registerErrorCode') }}</div>
      </div>
    </div>
    <div>
      <div class="glass-dialog robot-command-area">
        <div class="robot-command-list">
          <div class="list-title">{{ t('pages.robotSetting.commandListTitle') }}</div>
          <ul class="header-row">
            <li>{{ t('pages.robotSetting.command') }}</li>
            <li>{{ t('pages.robotSetting.commandDescription') }}</li>
            <li></li>
          </ul>
          <ul v-for="cmd in robotCommands" :key="cmd.command_id">
            <li>{{ cmd.command }}</li>
            <li>{{ cmd.description }}</li>
            <li class="action-cell">
              <div class="button accent" @click="openCommandEditPopup(cmd)">{{ t('common.edit') }}</div>
              <div class="button error" @click="handleCommandDelete(cmd.command_id)">{{ t('common.delete') }}</div>
            </li>
          </ul>
        </div>
      </div>
      <div class="button-area">
        <div class="button primary" @click="openCommandRegisterPopup">
          {{ t('pages.robotSetting.registerCommand') }}
        </div>
      </div>
    </div>

    <div>
      <div class="glass-dialog robot-info-area">
        <div class="robot-list">
          <div class="list-title">{{ t('pages.robotSetting.robotListTitle') }}</div>
          <ul class="header-row">
            <li>{{ t('pages.robotSetting.robotId') }}</li>
            <li>{{ t('pages.robotSetting.robotDescription') }}</li>
            <li></li>
          </ul>
          <ul v-for="robot in robots" :key="robot.robot_id">
            <li>{{ robot.robot_id }}</li>
            <li>{{ robot.description ?? '-' }}</li>
            <li class="action-cell">
              <div class="button accent" @click="openRobotEditPopup(robot)">{{ t('common.edit') }}</div>
              <div class="button error" @click="handleRobotDelete(robot.robot_id)">{{ t('common.delete') }}</div>
            </li>
          </ul>
        </div>
      </div>
      <div class="button-area">
        <div class="button primary" @click="openRobotRegisterPopup">{{ t('pages.robotSetting.registerRobot') }}</div>
      </div>
    </div>

    <div class="register-popup-overlay" :class="{ active: isRegisterPopupOpen }">
      <div class="register-popup-panel">
        <div class="register-popup-title">{{ popupTitle }}</div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.errorCodeLabel') }}</label>
          <input
            class="p-inputtext"
            type="text"
            :value="registerCode"
            :placeholder="t('pages.robotSetting.errorCodePlaceholder')"
            maxlength="4"
            inputmode="numeric"
            :readonly="isEditMode"
            @input="handleCodeInput"
            @keydown="handleCodeKeydown"
          />
        </div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.errorDescriptionLabel') }}</label>
          <PInputText
            v-model="registerDescription"
            :placeholder="t('pages.robotSetting.errorDescriptionPlaceholder')"
            maxlength="30"
          />
        </div>
        <div class="register-popup-actions">
          <div class="button gray" @click="closeRegisterPopup">{{ t('common.close') }}</div>
          <div class="button primary" @click="handleSave">{{ t('common.save') }}</div>
        </div>
      </div>
    </div>

    <div class="register-popup-overlay" :class="{ active: isRobotPopupOpen }">
      <div class="register-popup-panel">
        <div class="register-popup-title">{{ robotPopupTitle }}</div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.robotIdLabel') }}</label>
          <input
            class="p-inputtext"
            type="text"
            :value="robotId"
            :placeholder="t('pages.robotSetting.robotIdPlaceholder')"
            inputmode="numeric"
            :readonly="isRobotEditMode"
            @input="handleRobotIdInput"
            @keydown="handleRobotIdKeydown"
          />
        </div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.robotDescriptionLabel') }}</label>
          <PInputText
            v-model="robotDescription"
            :placeholder="t('pages.robotSetting.robotDescriptionPlaceholder')"
            maxlength="20"
          />
        </div>
        <div class="register-popup-actions">
          <div class="button gray" @click="closeRobotPopup">{{ t('common.close') }}</div>
          <div class="button primary" @click="handleRobotSave">{{ t('common.save') }}</div>
        </div>
      </div>
    </div>

    <div class="register-popup-overlay" :class="{ active: isCommandPopupOpen }">
      <div class="register-popup-panel">
        <div class="register-popup-title">{{ commandPopupTitle }}</div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.commandLabel') }}</label>
          <PInputText v-model="commandCommand" :placeholder="t('pages.robotSetting.commandPlaceholder')" />
        </div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.commandDescriptionLabel') }}</label>
          <PInputText
            v-model="commandDescription"
            :placeholder="t('pages.robotSetting.commandDescriptionPlaceholder')"
            maxlength="20"
          />
        </div>
        <div class="register-popup-field">
          <label>{{ t('pages.robotSetting.extraUsableLabel') }}</label>
          <div class="app-setting-theme-toggle">
            <div class="app-setting-theme-select">
              <div class="app-setting-theme-button-wrapper">
                <button
                  class="app-setting-theme-button"
                  :class="{ 'app-setting-theme-button-active': !commandExtraUsable }"
                  @click="commandExtraUsable = false"
                >
                  {{ t('pages.robotSetting.extraUsableOff') }}
                </button>
              </div>
              <div class="app-setting-theme-button-wrapper">
                <button
                  class="app-setting-theme-button"
                  :class="{ 'app-setting-theme-button-active': commandExtraUsable }"
                  @click="commandExtraUsable = true"
                >
                  {{ t('pages.robotSetting.extraUsableOn') }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="register-popup-actions">
          <div class="button gray" @click="closeCommandPopup">{{ t('common.close') }}</div>
          <div class="button primary" @click="handleCommandSave">{{ t('common.save') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 로봇 설정 화면 (관리자 전용)
 *
 * - 3개 영역으로 구성: 오류 코드 관리 / 로봇 명령어 관리 / 로봇 정보 관리
 * - 각 영역은 목록 + 등록 버튼 + 등록/수정 팝업으로 구성
 * - useFormValidation으로 등록/수정 폼 검증
 * - axios.isAxiosError로 중복(409)/미등록(404) 오류를 구분해 메시지 표시
 */
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useConfirm } from 'primevue/useconfirm';
import { useErrorToast } from '@renderer/composables/useToast';
import { useFormValidation } from '@renderer/composables/useFormValidation';
import {
  getRobotList,
  createRobot,
  updateRobot,
  deleteRobot,
  getRobotCommands,
  createRobotCommand,
  updateRobotCommand,
  deleteRobotCommand,
  getRobotErrorCodes,
  createRobotErrorCode,
  updateRobotErrorCode,
  deleteRobotErrorCode,
} from '@renderer/services/api/robot';
import { ERROR_CODES } from '@renderer/constants/errorCodes';
import type { Robot, RobotCommand, RobotErrorCode } from '@renderer/types/robot';

const { t } = useI18n();
const confirm = useConfirm();
const { showError } = useErrorToast();
const { errorMessage, validate } = useFormValidation();

const robots = ref<Robot[]>([]); // 로봇 정보 목록
const errorCodes = ref<RobotErrorCode[]>([]); // 오류 코드 목록
const robotCommands = ref<RobotCommand[]>([]); // 로봇 명령어 목록

// 오류 코드 팝업 상태
const isRegisterPopupOpen = ref(false);
const isEditMode = ref(false);
const registerCode = ref('');
const registerDescription = ref('');

/** 오류 코드 팝업 제목 (등록/수정) */
const popupTitle = computed(() =>
  isEditMode.value ? t('pages.robotSetting.editTitle') : t('pages.robotSetting.registerTitle'),
);

// 로봇 정보 팝업 상태
const isRobotPopupOpen = ref(false);
const isRobotEditMode = ref(false);
const robotId = ref('');
const robotDescription = ref('');

/** 로봇 정보 팝업 제목 (등록/수정) */
const robotPopupTitle = computed(() =>
  isRobotEditMode.value ? t('pages.robotSetting.robotEditTitle') : t('pages.robotSetting.robotRegisterTitle'),
);

// 로봇 명령어 팝업 상태
const isCommandPopupOpen = ref(false);
const isCommandEditMode = ref(false);
const commandId = ref(0);
const commandCommand = ref('');
const commandDescription = ref('');
const commandExtraUsable = ref(false);

/** 로봇 명령어 팝업 제목 (등록/수정) */
const commandPopupTitle = computed(() =>
  isCommandEditMode.value ? t('pages.robotSetting.commandEditTitle') : t('pages.robotSetting.commandRegisterTitle'),
);

/**
 * 오류 코드 입력 핸들러
 * - 4자리 숫자만 허용
 * - 입력값에서 숫자 외 문자 제거 후 4자리까지 제한
 */
const handleCodeInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const sanitized = target.value.replace(/\D/g, '').slice(0, 4);
  target.value = sanitized;
  registerCode.value = sanitized;
};

/**
 * 오류 코드 키보드 다운 핸들러
 * - 숫자키와 기본 제어키(Backspace, Arrow, Tab 등)만 허용
 * - 한 글자 입력 시 숫자가 아니면 preventDefault
 */
const handleCodeKeydown = (event: KeyboardEvent): void => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', 'Home', 'End'];
  if (event.ctrlKey || event.metaKey || allowedKeys.includes(event.key)) {
    return;
  }
  if (event.key.length === 1 && !/^\d$/.test(event.key)) {
    event.preventDefault();
  }
};

/** 오류 코드 신규 등록 팝업 열기 (edit=false, 입력값 초기화) */
const openRegisterPopup = (): void => {
  isEditMode.value = false;
  registerCode.value = '';
  registerDescription.value = '';
  isRegisterPopupOpen.value = true;
};

/** 오류 코드 수정 팝업 열기 (edit=true, 기존 값 채움) */
const openEditPopup = (code: RobotErrorCode): void => {
  isEditMode.value = true;
  registerCode.value = code.error_code;
  registerDescription.value = code.description;
  isRegisterPopupOpen.value = true;
};

/** 오류 코드 등록/수정 팝업 닫기 */
const closeRegisterPopup = (): void => {
  isRegisterPopupOpen.value = false;
};

/**
 * 로봇 ID 입력 핸들러
 * - 숫자 외 문자 제거
 */
const handleRobotIdInput = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const sanitized = target.value.replace(/\D/g, '');
  target.value = sanitized;
  robotId.value = sanitized;
};

/**
 * 로봇 ID 키보드 다운 핸들러
 * - 숫자와 기본 제어키만 허용
 */
const handleRobotIdKeydown = (event: KeyboardEvent): void => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Escape', 'Home', 'End'];
  if (event.ctrlKey || event.metaKey || allowedKeys.includes(event.key)) {
    return;
  }
  if (event.key.length === 1 && !/^\d$/.test(event.key)) {
    event.preventDefault();
  }
};

/** 로봇 정보 신규 등록 팝업 열기 */
const openRobotRegisterPopup = (): void => {
  isRobotEditMode.value = false;
  robotId.value = '';
  robotDescription.value = '';
  isRobotPopupOpen.value = true;
};

/** 로봇 정보 수정 팝업 열기 (기존 id/description 채움) */
const openRobotEditPopup = (robot: Robot): void => {
  isRobotEditMode.value = true;
  robotId.value = String(robot.robot_id);
  robotDescription.value = robot.description ?? '';
  isRobotPopupOpen.value = true;
};

/** 로봇 정보 등록/수정 팝업 닫기 */
const closeRobotPopup = (): void => {
  isRobotPopupOpen.value = false;
};

/**
 * 로봇 정보 등록/수정 저장
 * - robotId가 숫자이고 description 20자 이하인지 검증
 * - isRobotEditMode에 따라 create/update API 호출
 * - 409(중복), 404(미등록) 에러별 메시지 처리
 */
const handleRobotSave = async (): Promise<void> => {
  if (
    !validate([
      { test: () => /^\d+$/.test(robotId.value), message: t('pages.robotSetting.validation.robotId') },
      { test: () => robotDescription.value.length <= 20, message: t('pages.robotSetting.validation.robotDescription') },
    ])
  ) {
    showError('warn', errorMessage.value ?? '');
    return;
  }
  try {
    const payload: Robot = {
      robot_id: Number(robotId.value),
      description: robotDescription.value,
    };
    if (isRobotEditMode.value) {
      await updateRobot(payload);
      showError('success', t('pages.robotSetting.robotUpdateSuccess'));
    } else {
      await createRobot(payload);
      showError('success', t('pages.robotSetting.robotRegisterSuccess'));
    }
    await loadRobots();
    closeRobotPopup();
  } catch (error: unknown) {
    if (!isRobotEditMode.value && axios.isAxiosError(error) && error.response?.status === 409) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.ROBOT_ID_ALREADY_REGISTERED) {
        showError('warn', t('pages.robotSetting.robotIdAlreadyRegistered'));
        return;
      }
    }
    if (isRobotEditMode.value && axios.isAxiosError(error) && error.response?.status === 404) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.ROBOT_NOT_REGISTERED) {
        showError('warn', t('pages.robotSetting.robotNotRegistered'));
        return;
      }
    }
    showError('warn',
      isRobotEditMode.value ? t('pages.robotSetting.robotUpdateFailed') : t('pages.robotSetting.robotRegisterFailed'),
    );
  }
};

/**
 * 지정 로봇 ID 삭제 API 호출
 * - 404(미등록) 에러별 메시지 처리
 */
const deleteRobotById = async (robotIdValue: number): Promise<void> => {
  try {
    await deleteRobot(robotIdValue);
    await loadRobots();
    showError('success', t('pages.robotSetting.deleteRobotSuccess'));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.ROBOT_NOT_REGISTERED) {
        showError('warn', t('pages.robotSetting.robotNotRegistered'));
        return;
      }
    }
    showError('warn', t('pages.robotSetting.deleteRobotFailed'));
  }
};

/** 로봇 삭제 확인 팝업 */
const handleRobotDelete = (robotIdValue: number): void => {
  confirm.require({
    message: t('pages.robotSetting.deleteRobotConfirm'),
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'error',
    accept: () => {
      void deleteRobotById(robotIdValue);
    },
  });
};

/** 로봇 목록 API 조회 (robot_id 오름차순 정렬) */
const loadRobots = async (): Promise<void> => {
  try {
    const response = await getRobotList();
    robots.value = (response.data ?? []).sort((a, b) => a.robot_id - b.robot_id);
  } catch {
    showError('error', t('pages.robotSetting.robotListLoadFailed'));
  }
};

/** 오류 코드 목록 API 조회 */
const loadErrorCodes = async (): Promise<void> => {
  try {
    const response = await getRobotErrorCodes();
    errorCodes.value = response.data ?? [];
  } catch {
    showError('error', t('pages.robotSetting.errorCodeLoadFailed'));
  }
};

/** 로봇 명령어 목록 API 조회 */
const loadCommands = async (): Promise<void> => {
  try {
    const response = await getRobotCommands();
    robotCommands.value = response.data ?? [];
  } catch {
    showError('error', t('pages.robotSetting.commandLoadFailed'));
  }
};

/** 지정 오류 코드 삭제 API 호출 */
const deleteErrorCode = async (errorCode: string): Promise<void> => {
  try {
    await deleteRobotErrorCode(errorCode);
    await loadErrorCodes();
    showError('success', t('pages.robotSetting.deleteErrorCodeSuccess'));
  } catch {
    showError('warn', t('pages.robotSetting.deleteErrorCodeFailed'));
  }
};

/**
 * 오류 코드 등록/수정 저장
 * - 4자리 숫자 + 1~30자 설명 검증
 * - isEditMode에 따라 create/update API 호출
 * - 409(중복) 에러 메시지 처리
 */
const handleSave = async (): Promise<void> => {
  if (
    !validate([
      { test: () => /^\d{4}$/.test(registerCode.value), message: t('pages.robotSetting.validation.errorCode') },
      {
        test: () => registerDescription.value.length > 0 && registerDescription.value.length <= 30,
        message: t('pages.robotSetting.validation.errorDescription'),
      },
    ])
  ) {
    showError('warn', errorMessage.value ?? '');
    return;
  }
  try {
    if (isEditMode.value) {
      await updateRobotErrorCode({
        error_code: registerCode.value,
        description: registerDescription.value,
      });
      showError('success', t('pages.robotSetting.updateSuccess'));
    } else {
      await createRobotErrorCode({
        error_code: registerCode.value,
        description: registerDescription.value,
      });
      showError('success', t('pages.robotSetting.registerSuccess'));
    }
    await loadErrorCodes();
    closeRegisterPopup();
  } catch (error: unknown) {
    if (!isEditMode.value && axios.isAxiosError(error) && error.response?.status === 409) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.ERROR_CODE_ALREADY_REGISTERED) {
        showError('warn', t('pages.robotSetting.errorCodeAlreadyRegistered'));
        return;
      }
    }
    showError('warn',
      isEditMode.value ? t('pages.robotSetting.updateFailed') : t('pages.robotSetting.registerFailed'),
    );
  }
};

/** 오류 코드 삭제 확인 팝업 */
const handleDelete = (errorCode: string): void => {
  confirm.require({
    message: t('pages.robotSetting.deleteErrorCodeConfirm'),
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'error',
    accept: () => {
      void deleteErrorCode(errorCode);
    },
  });
};

/** 로봇 명령어 신규 등록 팝업 열기 */
const openCommandRegisterPopup = (): void => {
  isCommandEditMode.value = false;
  commandId.value = 0;
  commandCommand.value = '';
  commandDescription.value = '';
  commandExtraUsable.value = false;
  isCommandPopupOpen.value = true;
};

/** 로봇 명령어 수정 팝업 열기 */
const openCommandEditPopup = (cmd: RobotCommand): void => {
  isCommandEditMode.value = true;
  commandId.value = cmd.command_id;
  commandCommand.value = cmd.command;
  commandDescription.value = cmd.description;
  commandExtraUsable.value = cmd.extra_usable;
  isCommandPopupOpen.value = true;
};

/** 로봇 명령어 등록/수정 팝업 닫기 */
const closeCommandPopup = (): void => {
  isCommandPopupOpen.value = false;
};

/**
 * 로봇 명령어 등록/수정 저장
 * - command, description 20자 이하, extra_usable 검증
 * - isCommandEditMode에 따라 create/update API 호출
 * - 409(중복), 404(미등록) 에러별 메시지 처리
 */
const handleCommandSave = async (): Promise<void> => {
  if (
    !validate([
      { test: () => commandCommand.value.length > 0, message: t('pages.robotSetting.validation.command') },
      {
        test: () => commandDescription.value.length > 0 && commandDescription.value.length <= 20,
        message: t('pages.robotSetting.validation.commandDescription'),
      },
    ])
  ) {
    showError('warn', errorMessage.value ?? '');
    return;
  }
  try {
    const payload = {
      command: commandCommand.value,
      description: commandDescription.value,
      extra_usable: commandExtraUsable.value,
    };
    if (isCommandEditMode.value) {
      await updateRobotCommand({
        command_id: commandId.value,
        ...payload,
      });
      showError('success', t('pages.robotSetting.commandUpdateSuccess'));
    } else {
      await createRobotCommand(payload);
      showError('success', t('pages.robotSetting.commandRegisterSuccess'));
    }
    await loadCommands();
    closeCommandPopup();
  } catch (error: unknown) {
    if (!isCommandEditMode.value && axios.isAxiosError(error) && error.response?.status === 409) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.COMMAND_ALREADY_REGISTERED) {
        showError('warn', t('pages.robotSetting.commandAlreadyRegistered'));
        return;
      }
    }
    if (isCommandEditMode.value && axios.isAxiosError(error) && error.response?.status === 404) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.COMMAND_NOT_REGISTERED) {
        showError('warn', t('pages.robotSetting.commandNotRegistered'));
        return;
      }
    }
    showError('warn',
      isCommandEditMode.value
        ? t('pages.robotSetting.commandUpdateFailed')
        : t('pages.robotSetting.commandRegisterFailed'),
    );
  }
};

/** 지정 명령어 ID 삭제 API 호출 */
const deleteCommandById = async (commandIdValue: number): Promise<void> => {
  try {
    await deleteRobotCommand(commandIdValue);
    await loadCommands();
    showError('success', t('pages.robotSetting.deleteCommandSuccess'));
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const responseData = error.response.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      if (errCode === ERROR_CODES.COMMAND_NOT_REGISTERED) {
        showError('warn', t('pages.robotSetting.commandNotRegistered'));
        return;
      }
    }
    showError('warn', t('pages.robotSetting.deleteCommandFailed'));
  }
};

/** 로봇 명령어 삭제 확인 팝업 */
const handleCommandDelete = (commandIdValue: number): void => {
  confirm.require({
    message: t('pages.robotSetting.deleteCommandConfirm'),
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    acceptClass: 'error',
    accept: () => {
      void deleteCommandById(commandIdValue);
    },
  });
};

/** 마운트 시 로봇, 오류 코드, 명령어 목록 초기 로드 */
onMounted(() => {
  void loadRobots();
  void loadErrorCodes();
  void loadCommands();
});
</script>

<style scoped lang="scss">
.robot-setting-view {
  padding: 10rem 2rem 2rem 2rem;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  font-size: 18px;
}
.robot-setting-view > div {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.error-code-area {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}
.robot-info-area {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}
.robot-command-area {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}
.list-title {
  color: var(--text-title);
  font-size: 18px;
  margin-bottom: 0.75rem;
}
.button-area {
  display: flex;
  align-items: center;
  justify-content: end;
  height: 150px;
}
.button-area .button {
  width: 200px;
}
.error-code-list,
.robot-list,
.robot-command-list {
  width: 100%;
  ul {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-gray-200);
    &:last-child {
      border-bottom: none;
    }
    li {
      flex: 1;
      text-align: center;
    }
    li:first-child {
      flex: 0 0 10rem;
    }
  }
  .header-row {
    font-weight: 500;
    border-bottom: 2px solid var(--color-gray-300);
  }
}
.error-code-list,
.robot-list,
.robot-command-list {
  .action-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  ul li:last-child {
    flex: 0 0 12rem;
  }
}
.robot-command-list ul li:first-child {
  flex: 1;
}

.register-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    opacity 0.25s ease,
    visibility 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.register-popup-overlay.active {
  opacity: 1;
  pointer-events: none;
  visibility: visible;
}
.register-popup-panel {
  pointer-events: auto;
  width: 36rem;
  max-width: calc(100% - 4rem);
  max-height: calc(100% - 4rem);
  background: var(--bg-dialog);
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.25s ease;
  box-shadow: 0 4px 34px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(24px) saturate(160%);
}
.register-popup-field :deep(.p-inputtext) {
  text-align: left !important;
}
.register-popup-overlay.active .register-popup-panel {
  transform: scale(1);
}
.register-popup-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  text-align: center;
}
.register-popup-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.register-popup-field label {
  font-size: 18px;
  color: var(--text-label);
}
.command-checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}
.app-setting-theme-button {
  font-size: 20px;
}
.register-popup-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
