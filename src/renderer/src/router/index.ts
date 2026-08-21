/**
 * Vue Router 설정
 *
 * - 애플리케이션의 모든 화면 경로를 정의합니다.
 * - 로그인 상태를 확인하여 인증이 필요한 페이지를 보호합니다.
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { getAccessToken } from '@renderer/composables/useAuth';
import LoginView from '@renderer/views/login/LoginView.vue';
import MainView from '@renderer/views/main/MainView.vue';
import TaskStatusView from '@renderer/views/task_status/TaskStatusView.vue';
import StatisticsView from '@renderer/views/statistics/StatisticsView.vue';
import TaskStatisticsView from '@renderer/views/statistics/tabs/TaskStatisticsView.vue';
import TaskHistoriesView from '@renderer/views/statistics/tabs/TaskHistoriesView.vue';
import RobotTaskHistoriesView from '@renderer/views/statistics/tabs/RobotTaskHistoriesView.vue';
import RobotErrorHistoriesView from '@renderer/views/statistics/tabs/RobotErrorHistoriesView.vue';
import RobotSettingView from '@renderer/views/robot_setting/RobotSettingView.vue';
import SortingSettingView from '@renderer/views/sorting_setting/SortingSettingView.vue';
import RobotDetailView from '@renderer/views/robot_detail/RobotDetailView.vue';

// 메뉴/화면 경로 정의
const routes: RouteRecordRaw[] = [
  {
    path: '/login', // 로그인 화면
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/main', // 메인 화면
    name: 'Main',
    component: MainView,
    meta: { requiresAuth: true }, // 로그인 필요
    redirect: '/main/task-status', // 진입 시 작업 현황으로 리다이렉트
    children: [
      {
        path: 'task-status',
        name: 'TaskStatus',
        component: TaskStatusView,
      },
      {
        path: 'statistics', // 통계 화면
        name: 'Statistics',
        component: StatisticsView,
        redirect: '/main/statistics/task-status',
        children: [
          {
            path: 'task-status',
            name: 'TaskStatistics',
            component: TaskStatisticsView,
          },
          {
            path: 'task-histories',
            name: 'TaskHistories',
            component: TaskHistoriesView,
          },
          {
            path: 'robot-task-histories',
            name: 'RobotTaskHistories',
            component: RobotTaskHistoriesView,
          },
          {
            path: 'robot-error-histories',
            name: 'RobotErrorHistories',
            component: RobotErrorHistoriesView,
          },
        ],
      },
      {
        path: 'robot-setting',
        name: 'RobotSetting',
        component: RobotSettingView,
      },
      {
        path: 'sorting-setting',
        name: 'SortingSetting',
        component: SortingSettingView,
      },
    ],
  },
  {
    path: '/robot-detail', // 로봇 상세 화면
    name: 'RobotDetail',
    component: RobotDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/', // 루트 접근 시 로그인으로
    redirect: '/login',
  },
  {
    path: '/:pathMatch(.*)*', // 잘못된 경로도 로그인으로
    redirect: '/login',
  },
];

// history 모드 라우터 생성
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * 라우터 이동 전 인증 체크
 * - 인증 필요 페이지에 비로그인 상태면 로그인으로
 * - 로그인 상태에서 /login 접근 시 /main으로
 */
router.beforeEach((to) => {
  const isAuthenticated = !!getAccessToken();

  if (to.meta.requiresAuth && !isAuthenticated) return '/login';
  if (to.name === 'Login' && isAuthenticated) return '/main';
  return true;
});

export default router;
