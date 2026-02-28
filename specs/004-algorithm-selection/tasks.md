# Tasks: 隐私计算任务算法选择

**Branch**: `004-algorithm-selection`
**Created**: 2026-02-28
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

本文档按用户故事组织实现任务，每个用户故事可独立实现和测试。

**Total Tasks**: 44
**User Stories**: 6 (P1: 2, P2: 3, P3: 1)

---

## Phase 1: Setup (项目初始化)

**Goal**: 创建基础类型定义、Mock服务和状态管理

- [ ] T001 [P] Create algorithm type definitions in `src/types/algorithm.ts`
- [ ] T002 [P] Create algorithm mock data with 10-15 preset algorithms in `src/utils/algorithm-mock-data.ts`
- [ ] T003 [P] Create AlgorithmService class with CRUD methods in `src/services/algorithmService.ts`
- [ ] T004 Create useAlgorithmState composable in `src/composables/useAlgorithmState.ts`
- [ ] T005 Extend ComputeTaskNodeData interface to include algorithmConfig in `src/types/nodes.ts`

---

## Phase 2: Foundational (基础设施)

**Goal**: 实现导航入口和路由配置，为用户故事提供基础

- [ ] T006 Add Vue Router configuration for algorithm management page in `src/router/index.ts`
- [ ] T007 Modify FlowHeader to add dropdown menu on "设置" button in `src/components/Flow/FlowHeader.vue`
- [ ] T008 Add "算法管理" menu item to settings dropdown in `src/components/Flow/FlowHeader.vue`
- [ ] T009 Create AlgorithmManager page shell in `src/views/AlgorithmManager.vue`

---

## Phase 3: User Story 1 - 任务节点自动匹配默认算法 (P1)

**Goal**: 拖拽计算任务节点时自动选择创建时间最新的匹配算法

**Independent Test**: 拖拽MPC任务节点到画布，验证系统自动选择创建时间最新的MPC类型算法

### Tasks

- [ ] T010 [US1] Create AlgorithmSelector component for task detail panel in `src/components/Algorithm/AlgorithmSelector.vue`
- [ ] T011 [US1] Implement auto-match algorithm logic on task node creation in `src/composables/useNodeEvents.ts`
- [ ] T012 [US1] Add algorithm display section to FlowDetailPanel in `src/components/Flow/FlowDetailPanel.vue`
- [ ] T013 [US1] Display selected algorithm name and version in ComputeTaskNode in `src/components/Nodes/ComputeTaskNode.vue`
- [ ] T014 [US1] Handle "no available algorithm" case with empty state in `src/components/Algorithm/AlgorithmSelector.vue`

---

## Phase 4: User Story 2 - 手动选择和更换算法 (P1)

**Goal**: 用户可在任务节点详情面板中手动选择其他可用算法

**Independent Test**: 点击任务节点算法选择下拉框，验证显示该任务类型的所有可用算法，选择后参数表单正确更新

**Dependencies**: Phase 3 (US1) must complete first

### Tasks

- [ ] T015 [US2] Add dropdown list to AlgorithmSelector showing available algorithms in `src/components/Algorithm/AlgorithmSelector.vue`
- [ ] T016 [US2] Implement algorithm filtering by computeType in `src/services/algorithmService.ts`
- [ ] T017 [US2] Add algorithm change handler to clear params and update form in `src/composables/useAlgorithmState.ts`
- [ ] T018 [US2] Update FlowDetailPanel to respond to algorithm selection changes in `src/components/Flow/FlowDetailPanel.vue`

---

## Phase 5: User Story 3 - 录入和保存附加参数 (P2)

**Goal**: 根据算法参数模板动态生成参数输入表单，支持导出JSON

**Independent Test**: 选择带有附加参数的算法，填写参数值，导出JSON验证参数正确保存

**Dependencies**: Phase 4 (US2) must complete first

### Tasks

- [ ] T019 [P] [US3] Create DynamicParamForm component in `src/components/Algorithm/DynamicParamForm.vue`
- [ ] T020 [P] [US3] Implement input controls for 8 param types (string, integer, float, boolean, enum, date, json, array) in `src/components/Algorithm/DynamicParamForm.vue`
- [ ] T021 [US3] Implement validation rules (required, min/max length, min/max value, pattern, enum) in `src/components/Algorithm/DynamicParamForm.vue`
- [ ] T022 [US3] Add DynamicParamForm to FlowDetailPanel when algorithm has params in `src/components/Flow/FlowDetailPanel.vue`
- [ ] T023 [US3] Extend dag-export to include algorithmConfig in task export in `src/utils/dag-export.ts`
- [ ] T024 [US3] Store user-filled params in task node's algorithmConfig in `src/composables/useGraphState.ts`

---

## Phase 6: User Story 4 - 查看和管理算法列表 (P2)

**Goal**: 提供算法管理界面，支持查看、筛选和删除算法

**Independent Test**: 进入算法管理界面，验证列表正确显示，筛选和删除功能正常工作

**Dependencies**: Phase 2 (Foundational) must complete first

### Tasks

- [ ] T025 [P] [US4] Create AlgorithmList component in `src/components/Algorithm/AlgorithmList.vue`
- [ ] T026 [P] [US4] Add type filter dropdown to AlgorithmList in `src/components/Algorithm/AlgorithmList.vue`
- [ ] T027 [P] [US4] Add keyword search input to AlgorithmList in `src/components/Algorithm/AlgorithmList.vue`
- [ ] T028 [US4] Implement delete algorithm with usage check in `src/services/algorithmService.ts`
- [ ] T029 [US4] Add delete confirmation dialog with usage warning in `src/components/Algorithm/AlgorithmList.vue`
- [ ] T030 [US4] Integrate AlgorithmList into AlgorithmManager page in `src/views/AlgorithmManager.vue`
- [ ] T031 [US4] Add return button to navigate back to FlowEditor in `src/views/AlgorithmManager.vue`

---

## Phase 7: User Story 5 - 注册新算法 (P2)

**Goal**: 提供算法注册表单，支持填写基本信息和参数模板

**Independent Test**: 点击"注册新算法"按钮，填写表单并提交，验证新算法成功添加到列表

**Dependencies**: Phase 6 (US4) must complete first

### Tasks

- [ ] T032 [P] [US5] Create AlgorithmForm component in `src/components/Algorithm/AlgorithmForm.vue`
- [ ] T033 [US5] Add form validation for name, nameEn, version, type fields in `src/components/Algorithm/AlgorithmForm.vue`
- [ ] T034 [US5] Add file upload button (placeholder, mock mode) in `src/components/Algorithm/AlgorithmForm.vue`
- [ ] T035 [US5] Integrate AlgorithmForm into AlgorithmManager page in `src/views/AlgorithmManager.vue`
- [ ] T036 [US5] Implement create algorithm API call with auto-generated ID and createdAt timestamp in `src/services/algorithmService.ts`

---

## Phase 8: User Story 6 - 定义算法参数模板 (P3)

**Goal**: 提供可视化参数模板编辑器，支持添加、编辑、删除、排序参数字段

**Independent Test**: 在算法注册表单中添加参数字段，配置类型和约束，验证模板正确保存

**Dependencies**: Phase 7 (US5) must complete first

### Tasks

- [ ] T037 [P] [US6] Create ParamTemplateEditor component in `src/components/Algorithm/ParamTemplateEditor.vue`
- [ ] T038 [P] [US6] Add param type selector with validation options in `src/components/Algorithm/ParamTemplateEditor.vue`
- [ ] T039 [US6] Implement drag-to-reorder for param list in `src/components/Algorithm/ParamTemplateEditor.vue`
- [ ] T040 [US6] Integrate ParamTemplateEditor into AlgorithmForm in `src/components/Algorithm/AlgorithmForm.vue`
- [ ] T041 [US6] Convert param template to structured format on save in `src/services/algorithmService.ts`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Goal**: 完善用户体验，处理边缘情况

- [ ] T042 Add error handling for algorithm service unavailability in `src/composables/useAlgorithmState.ts`
- [ ] T043 Add loading states for algorithm list and selector in `src/components/Algorithm/AlgorithmList.vue`
- [ ] T044 Handle import JSON with missing algorithms (show warning) in `src/utils/dag-export.ts`

---

## Dependency Graph

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3: US1      Phase 6: US4
(P1 Auto-match)   (P2 Algorithm List)
    │                  │
    ▼                  ▼
Phase 4: US2      Phase 7: US5
(P1 Manual Select)(P2 Register Algorithm)
    │                  │
    ▼                  ▼
Phase 5: US3      Phase 8: US6
(P2 Param Form)   (P3 Param Template)
    │                  │
    └────────┬─────────┘
             ▼
      Phase 9: Polish
```

---

## Parallel Execution Examples

### Phase 1 (Setup) - All tasks can run in parallel
```bash
# T001, T002, T003 can run simultaneously
T001: Create types/algorithm.ts
T002: Create utils/algorithm-mock-data.ts
T003: Create services/algorithmService.ts
```

### Phase 5 (US3) - DynamicParamForm can start early
```bash
# T019 and T020 can start before US3 dependencies complete
T019 [P]: Create DynamicParamForm.vue
T020 [P]: Implement input controls
# Then wait for US2 to complete before T022-T024
```

### Phase 6 (US4) - List components can be built in parallel
```bash
# T025, T026, T027 can run simultaneously
T025 [P]: Create AlgorithmList.vue
T026 [P]: Add type filter
T027 [P]: Add keyword search
```

---

## MVP Scope Recommendation

**Minimum Viable Product**: Phase 1-4 (US1 + US2)

This delivers the core value:
- Auto-match algorithm when dragging task node
- Manual algorithm selection
- Basic algorithm info display

**Estimated MVP Tasks**: 18 tasks (T001-T018)

---

## Implementation Strategy

1. **Incremental Delivery**: Complete phases in order, each phase is independently testable
2. **Parallel Where Possible**: Tasks marked [P] can run in parallel within their phase
3. **Story Independence**: US1-US3 (task orchestration) can be developed separately from US4-US6 (algorithm management)
4. **Early Testing**: Each user story has independent test criteria for early validation

---

## Notes

- All file paths are relative to `src/` directory
- Tasks marked [P] affect different files and have no dependencies on incomplete tasks
- User story labels [US1]-[US6] map directly to spec.md user stories
- Task IDs are sequential in suggested execution order
