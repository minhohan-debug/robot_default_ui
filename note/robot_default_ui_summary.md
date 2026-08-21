# robot_default_ui Project Summary

## Overview
- **Name:** robot_ui
- **Description:** Electron + Vue 3 + TypeScript robot management UI
- **Local workspace:** /Users/hanminho/Desktop/Code/uon/robot_default_ui
- **Backend:** http://127.0.0.1:8000 / ws://127.0.0.1:8000

## Tech Stack
- **Framework:** Electron 39, Vue 3.5, Vite 7.2, TypeScript 5.9
- **UI Library:** PrimeVue 4.5, PrimeIcons, Pretendard, SCSS
- **State & Network:** Pinia 3, Axios 1.18, WebSocket (`ws` 8.21)
- **3D Rendering:** three 0.185, urdf-loader 0.13
- **Charts:** echarts 6.1
- **i18n:** vue-i18n 9.14

## Source Layout
- `src/main/index.ts` - Electron main process, WebSocket IPC, window management
- `src/renderer/src/views/` - Pages
- `src/renderer/src/services/api/` - HTTP API functions
- `src/renderer/src/services/websocket/` - WebSocket wrapper classes
- `src/renderer/src/components/` - Reusable components
- `src/renderer/src/router/index.ts` - Routing
- `src/renderer/src/locales/` - Korean/English i18n
- `doc.md` - API documentation
- `note/robot-arm-3d-analysis.md` - HCR-14 URDF/joint analysis

## Routes
- `/login`
- `/main` (redirects to `/main/task-status`)
- `/main/task-status`
- `/main/statistics/task-status`
- `/main/statistics/task-histories`
- `/main/statistics/robot-task-histories`
- `/main/robot-setting`
- `/main/sorting-setting`
- `/robot-detail`

## Main API Endpoints
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/robot` - robot list
- `POST /api/v1/robot` - create robot
- `PUT /api/v1/robot` - update robot
- `DELETE /api/v1/robot/{robot_id}` - delete robot
- `GET /api/v1/robot/error/code` - error codes
- `GET /api/v1/robot/setting/{robot_id}` - robot setting
- `GET /api/v1/task/history` - task history
- `GET /api/v1/task/detail/{task_id}` - task detail
- `GET /api/v1/sorter` - sorter status

## WebSocket Endpoints
- `WS /api/v1/robot/status`
- `WS /api/v1/robot/joint-tcp/{robot_id}`
- `WS /api/v1/robot/task/recent/{robot_id}`
- `WS /api/v1/robot/task/history/{robot_id}`
- `WS /api/v1/task/status`
- `WS /api/v1/sorter`

## Recent Milestones
- Robot list display with full CRUD (register, edit, delete) and API error handling
- Robot error code CRUD (RA-024 ~ RA-028)
- Robot detail view with 3D arm viewer (HCR-14 URDF), status, recent task history, task history search
- Fixed `PDataTable` internal scrolling in `RobotDetailView`
- Refactored `RobotTaskHistorySocket` to send search params as WebSocket messages (fixed 403)
- Added WebSocket-specific access-token refresh before `robotTaskHistory` connects

## Build & Dev Commands
- `npm run dev` - start dev
- `npm run build` - typecheck + build
- `npm run lint` - ESLint
