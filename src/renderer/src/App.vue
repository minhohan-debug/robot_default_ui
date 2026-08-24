<template>
  <!-- 라우터에 등록된 페이지가 여기서 전환됩니다. -->
  <RouterView v-slot="{ Component, route }">
    <Transition name="page-fade">
      <component :is="Component" :key="route.matched[0]?.name" />
    </Transition>
  </RouterView>
  <!-- 전역 토스트 메시지 출력 컴포넌트 (화면 하단 중앙) -->
  <PToast position="bottom-center" />
</template>

<script setup lang="ts">
/**
 * 루트 컴포넌트
 *
 * - 라우터가 렌더링하는 실제 화면을 감쌉니다.
 * - 페이지 전환 시 페이드 트랜지션을 적용합니다.
 */
</script>

<style lang="scss">
/* 루트 페이지 기본 스타일 */
html,
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-surface);
  font-family:
    'Pretendard',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

/* 페이지 전환 시 페이드 인/아웃 애니메이션 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
