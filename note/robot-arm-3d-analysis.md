# HCR-14 로봇팔 3D 구현 분석

## 1. 파일 구조

```
src/renderer/src/assets/3d-model/HCR-14/
├── urdf/
│   ├── HCR-14.urdf       # 로봇 구조 정의 (링크, 조인트, 메시 경로)
│   └── HCR-14.csv        # URDF 데이터 CSV 형식 (urdf-loader 불필요 시 직접 파싱 가능)
├── meshes/
│   ├── base_link.STL     # 베이스
│   ├── link_1.STL        # 1번 링크
│   ├── link_2.STL        # 2번 링크
│   ├── link_3.STL        # 3번 링크
│   ├── link_4.STL        # 4번 링크
│   ├── link_5.STL        # 5번 링크
│   └── link_6.STL        # 6번 링크 (엔드이펙터 쪽)
├── meshes/textures/      # 비어있음 (텍스처 없음, 색상은 URDF에 rgba로 정의)
└── config/, launch/      # ROS 관련 설정 (three.js 구현 시 불필요)
```

## 2. URDF 링크/조인트 구조

### 연결 체인
```
base_link
  └─[joint_1]─ link_1
                 └─[joint_2]─ link_2
                               └─[joint_3]─ link_3
                                             └─[joint_4]─ link_4
                                                           └─[joint_5]─ link_5
                                                                         └─[joint_6]─ link_6
```

### 조인트 상세 (type: 모두 continuous, 각도 제한 없음)

| Joint   | Parent    | Child  | Origin XYZ                  | Origin RPY (rad)          | Axis       |
|---------|-----------|--------|-----------------------------|---------------------------|------------|
| joint_1 | base_link | link_1 | (0, 0, 0.0936)              | (-π, 0, -2.9138)          | Z (0,0,1)  |
| joint_2 | link_1    | link_2 | (0, -0.038576, -0.1134)     | (-π/2, 0, -2.9138)        | (0.226,0,0.974) |
| joint_3 | link_2    | link_3 | (-0.088169, 0.72437, 0.020439) | (1.1216, -1.343, 0)    | X (1,0,0)  |
| joint_4 | link_3    | link_4 | (-0.0020713, 0.5388, 0)     | (-π/2, -0.70214, -π/2)    | Z (0,0,1)  |
| joint_5 | link_4    | link_5 | (0, -0.013176, 0.1482)      | (-π/2, 0.54461, -π)       | Z (0,0,1)  |
| joint_6 | link_5    | link_6 | (0, -0.013519, 0.13802)     | (-π/2, 1.4907, π)         | Z (0,0,1)  |

**단위**: XYZ = 미터(m), RPY = 라디안(rad)

### 메시 색상
- 모든 링크: `rgba(0.753, 0.753, 0.753, 1)` → 회색 (알루미늄 느낌)

## 3. WebSocket API (RA-011) - 각도 및 TCP 정보

- **URL**: `ws://.../v1/robot/joint-tcp/{robot_id}`
- **인증**: Authorization 헤더 (Bearer 토큰)
- **연결 없을 경우**: null 전송

### Response 데이터 구조
```json
{
  "data": {
    "joint": {
      "joint_1": 0.0,
      "joint_2": 0.0,
      "joint_3": 0.0,
      "joint_4": 0.0,
      "joint_5": 0.0,
      "joint_6": 0.0,
      "updated_at": "2026-06-10 08:33:00"
    },
    "tcp": {
      "x": 0.5,
      "y": 0.0,
      "z": 0.3,
      "rx": 0.0,
      "ry": 0.0,
      "rz": 0.0,
      "updated_at": "2026-06-10 08:33:00"
    }
  },
  "count": 1
}
```

- **joint_1~6**: 단위 **degree** → three.js 적용 시 `THREE.MathUtils.degToRad()` 변환 필요
- **tcp x/y/z**: 단위 m (엔드이펙터 위치)
- **tcp rx/ry/rz**: 단위 표기는 m이지만 실제로는 회전값(rad 또는 deg)으로 추정

## 4. Three.js 구현 전략

### 사용 라이브러리
- `three` - 3D 렌더러
- `urdf-loader` - URDF 파싱 및 three.js Object3D 변환
- `three/examples/jsm/loaders/STLLoader` - STL 메시 로드 (urdf-loader 내부 사용)

### 핵심 구현 흐름

```
1. URDFLoader로 HCR-14.urdf 파싱
   └─ STLLoader로 meshes/*.STL 자동 로드
   └─ joint_1~6 Object3D 계층 구조 생성

2. WebSocket 연결 (RA-011): /v1/robot/joint-tcp/{robot_id}
   └─ 실시간 joint 각도 수신

3. 수신된 joint 값 적용
   └─ robot.joints['joint_1'].setJointValue(deg2rad(joint_1))
   └─ ... ~ joint_6 반복
   └─ requestAnimationFrame 루프로 렌더링
```

### URDF 파일 경로 처리 (중요)
URDF 내 메시 경로가 `package://HCR-14/meshes/xxx.STL` 형식으로 되어 있음.
`URDFLoader`의 `loadMeshCb` 또는 `packages` 옵션으로 경로를 앱 내 실제 경로로 매핑해야 함.

```js
loader.packages = {
  'HCR-14': '/assets/3d-model/HCR-14'
};
```

또는 Vite의 asset 번들링 방식에 맞게 `import.meta.url` 기반으로 경로 변환 필요.

### 카메라/씬 권장 설정
- 로봇 크기 기준 (joint offset 합산): 약 0.09 + 0.72 + 0.54 + 0.15 + 0.14 ≈ **1.6m 높이**
- 카메라 position: `(2, 1.5, 2)` 정도, lookAt: `(0, 0.8, 0)`
- OrbitControls 사용 권장

## 5. Vue 컴포넌트 설계 (예상)

```
RobotArmViewer.vue
├── props: robotId (number)
├── canvas ref → Three.js Scene
├── WebSocket 연결 (RA-011)
├── onMessage: joint 값 → robot.joints 업데이트
└── onUnmounted: WS disconnect, Three.js dispose
```

## 6. 주의사항

- `continuous` 타입 조인트: 각도 제한 없음. 서버에서 오는 값 그대로 사용.
- joint 단위는 **degree**이므로 반드시 `* Math.PI / 180` 변환 후 적용.
- joint_2의 회전축이 `(0.226, 0, 0.974)`로 기울어져 있음 → urdf-loader가 자동 처리하므로 별도 처리 불필요.
- STL 파일은 바이너리 STL 형식 (용량 큰 편, link_2.STL이 약 2MB).
- Electron 환경이므로 로컬 파일 접근 가능. `file://` 프로토콜 또는 Vite dev server 경유.
