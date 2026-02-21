# Tasks: 隐匿查询功能完善与联邦学习任务上线

**Input**: Design documents from `/specs/003-pir-fl-enhancement/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 未显式要求测试，但包含E2E测试任务以确保质量。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (类型定义和基础设施)

**Purpose**: 新增类型定义、样式变量、Mock数据结构

- [X] T001 [P] 扩展节点类型定义，添加 RealtimeDataSourceInfo、PIRTaskNodeData、FLTaskNodeData 等类型 in `src/types/nodes.ts`
- [X] T002 [P] 创建联邦学习任务类型定义 (FLTaskCategory, FLMode, FLTaskParameterDef 等) in `src/types/fl-tasks.ts`
- [X] T003 [P] 添加联邦学习任务相关颜色变量 in `src/assets/styles/variables.scss`
- [X] T004 [P] 创建联邦学习任务Mock数据 (已部署模型、参数模板) in `src/utils/mock-fl-data.ts`

---

## Phase 2: Foundational (联邦学习菜单和模板)

**Purpose**: 联邦学习菜单基础结构，所有FL任务依赖此阶段

**⚠️ CRITICAL**: FL任务节点实现依赖此阶段完成

- [X] T005 创建联邦学习任务模板定义 (预处理、特征工程、横向模型、纵向模型) in `src/utils/fl-task-templates.ts`
- [X] T006 重构 FlowSidebar 组件，实现联邦学习训练/推断三级菜单展开 in `src/components/Flow/FlowSidebar.vue`
- [X] T007 在 FlowCanvas 中注册 FL 任务节点类型 in `src/components/Flow/FlowCanvas.vue`

**Checkpoint**: 联邦学习菜单可正常展开，任务可拖拽到画布

---

## Phase 3: User Story 1 - 配置隐匿查询实时数据源 (Priority: P1) 🎯 MVP

**Goal**: 实现PIR任务的实时数据源配置，支持连线导入和手工录入两种方式

**Independent Test**: 拖拽PIR任务节点到画布，配置预加载数据源和实时数据源，验证字段配置流程

### Implementation for User Story 1

- [X] T008 [P] [US1] 创建实时数据源配置弹窗组件 in `src/components/Modals/RealtimeDataSourceConfig.vue`
- [X] T009 [P] [US1] 创建字段编辑器组件（支持手工录入字段名、类型、描述） in `src/components/Modals/FieldEditor.vue`
- [X] T010 [US1] 创建PIR专用任务节点组件，区分预加载数据源和实时数据源输入 in `src/components/Nodes/PIRTaskNode.vue`
- [X] T011 [US1] 修改 FlowCanvas 支持PIR任务节点的实时数据源配置弹窗 in `src/components/Flow/FlowCanvas.vue`
- [X] T012 [US1] 在 FlowDetailPanel 中添加PIR任务详情展示，区分预加载数据源和实时数据源 in `src/components/Flow/FlowDetailPanel.vue`

**Checkpoint**: PIR任务可配置预加载数据源和实时数据源，实时数据源支持手工录入字段

---

## Phase 4: User Story 2 - 隐匿查询输出作为实时数据源链式调用 (Priority: P1)

**Goal**: 实现PIR输出节点以实时数据源样式展示，支持链式PIR调用

**Independent Test**: 创建两个PIR任务，将第一个PIR的输出连接到第二个PIR的实时数据源输入

### Implementation for User Story 2

- [X] T013 [US2] 修改 OutputDataNode 组件，添加实时数据源样式支持 in `src/components/Nodes/OutputDataNode.vue`
- [X] T014 [US2] 扩展 connection-validator 添加PIR输出连接限制（只能连接到PIR任务） in `src/utils/connection-validator.ts`
- [X] T015 [US2] 修改 FlowCanvas 处理PIR输出到PIR的连接，自动识别为实时数据源 in `src/components/Flow/FlowCanvas.vue`
- [X] T016 [US2] 实现PIR输出节点字段信息自动传递到下游PIR任务 in `src/components/Flow/FlowCanvas.vue`

**Checkpoint**: PIR输出以实时数据源样式展示，只能连接到PIR任务，链式调用正常

---

## Phase 5: User Story 3 - 联邦学习训练任务 - 预处理 (Priority: P2)

**Goal**: 实现联邦学习预处理任务节点，支持单数据源输入，无输出节点

**Independent Test**: 拖拽预处理任务到画布，选择一个数据源，配置处理参数

### Implementation for User Story 3

- [X] T017 [P] [US3] 创建预处理任务节点组件 in `src/components/Nodes/FLPreprocessNode.vue` (使用统一的 FLTaskNode)
- [X] T018 [P] [US3] 创建预处理任务参数配置弹窗 in `src/components/Modals/FLPreprocessConfig.vue` (使用统一的 FLTaskConfig)
- [X] T019 [US3] 修改 FlowCanvas 支持预处理任务的单数据源输入限制 in `src/components/Flow/FlowCanvas.vue`
- [X] T020 [US3] 实现预处理任务在 FlowDetailPanel 中的详情展示和重新编辑 in `src/components/Flow/FlowDetailPanel.vue`

**Checkpoint**: 预处理任务只能接入一个数据源，无输出节点生成

---

## Phase 6: User Story 4 - 联邦学习训练任务 - 特征工程 (Priority: P2)

**Goal**: 实现联邦学习特征工程任务节点，支持多方多数据源，生成输出节点

**Independent Test**: 拖拽特征工程任务到画布，连接多个参与方的数据源，配置特征处理参数

### Implementation for User Story 4

- [X] T021 [P] [US4] 创建特征工程任务节点组件 in `src/components/Nodes/FLFeatureNode.vue` (使用统一的 FLTaskNode)
- [X] T022 [P] [US4] 创建特征工程任务参数配置弹窗 in `src/components/Modals/FLFeatureConfig.vue` (使用统一的 FLTaskConfig)
- [X] T023 [US4] 修改 FlowCanvas 支持特征工程任务的多数据源输入和输出节点生成 in `src/components/Flow/FlowCanvas.vue`
- [X] T024 [US4] 实现特征工程任务的参与方数量校验 in `src/utils/connection-validator.ts`

**Checkpoint**: 特征工程任务支持多方多数据源，生成输出节点

---

## Phase 7: User Story 5 - 联邦学习训练任务 - 横向/纵向模型 (Priority: P2)

**Goal**: 实现联邦学习横向/纵向模型任务节点，支持多种模型类型和参数配置

**Independent Test**: 拖拽横向模型或纵向模型任务到画布，选择具体模型类型，配置训练参数

### Implementation for User Story 5

- [X] T025 [P] [US5] 创建模型训练任务节点组件 in `src/components/Nodes/FLModelNode.vue` (使用统一的 FLTaskNode)
- [X] T026 [P] [US5] 创建模型参数配置弹窗，支持动态参数模板 in `src/components/Modals/FLModelConfig.vue` (使用统一的 FLTaskConfig)
- [X] T027 [US5] 创建参数输入组件，支持多种参数类型（select, number, text, boolean, multiselect） in `src/components/Modals/ParameterInput.vue`
- [X] T028 [US5] 实现模型任务输出节点生成 in `src/components/Flow/FlowCanvas.vue`
- [X] T029 [US5] 实现模型任务在 FlowDetailPanel 中的详情展示和重新编辑 in `src/components/Flow/FlowDetailPanel.vue`

**Checkpoint**: 横向/纵向模型任务支持多种模型类型，参数配置正常

---

## Phase 8: User Story 6 - 联邦学习推断任务 (Priority: P3)

**Goal**: 实现联邦学习推断任务节点，支持已部署模型选择

**Independent Test**: 拖拽推断任务到画布，选择已部署模型，配置推断参数

### Implementation for User Story 6

- [X] T030 [P] [US6] 创建推断任务节点组件 in `src/components/Nodes/FLInferenceNode.vue` (使用统一的 FLTaskNode)
- [X] T031 [P] [US6] 创建已部署模型选择器组件 in `src/components/Modals/DeployedModelSelector.vue`
- [X] T032 [US6] 实现已部署模型选择后自动确定推断参与方 in `src/components/Modals/FLInferenceConfig.vue` (使用统一的 FLTaskConfig)
- [X] T033 [US6] 实现已部署模型被删除时的提示和重新选择功能 in `src/components/Modals/DeployedModelSelector.vue`
- [X] T034 [US6] 创建推断任务参数配置弹窗 in `src/components/Modals/FLInferenceConfig.vue` (使用统一的 FLTaskConfig)

**Checkpoint**: 推断任务支持已部署模型选择，选择后参与方自动确定

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 测试、Mock数据完善、JSON导出格式兼容

- [X] T035 [P] 创建PIR实时数据源E2E测试 in `tests/e2e/pir-realtime-datasource.spec.ts`
- [X] T036 [P] 创建联邦学习任务E2E测试 in `tests/e2e/fl-task-workflow.spec.ts`
- [X] T037 扩展JSON导出格式，支持PIR和FL任务节点的导出 in `src/components/Flow/JsonPreviewPanel.vue`
- [X] T038 验证构建通过 `npm run build`
- [X] T039 运行 quickstart.md 中的验证流程

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all FL user stories
- **US1 (Phase 3)**: Depends on Setup (Phase 1) - PIR实时数据源
- **US2 (Phase 4)**: Depends on US1 completion - 需要PIR节点和实时数据源配置
- **US3-US5 (Phase 5-7)**: Depend on Foundational (Phase 2) - FL任务节点
- **US6 (Phase 8)**: Depends on Foundational (Phase 2) - FL推断任务
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - 只需要Setup阶段的类型定义
- **User Story 2 (P1)**: Depends on US1 - 需要PIR节点已实现
- **User Story 3 (P2)**: Independent after Foundational - 预处理任务
- **User Story 4 (P2)**: Independent after Foundational - 特征工程任务
- **User Story 5 (P2)**: Independent after Foundational - 模型训练任务
- **User Story 6 (P3)**: Independent after Foundational - 推断任务

### Parallel Opportunities

- **Phase 1**: All tasks T001-T004 can run in parallel
- **Phase 5-8**: US3, US4, US5, US6 can be worked on in parallel after Phase 2
- **Within each story**: Tasks marked [P] can run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all Setup tasks together:
Task: "扩展展节点类型定义 in src/types/nodes.ts"
Task: "创建联邦学习任务类型定义 in src/types/fl-tasks.ts"
Task: "添加联邦学习任务相关颜色变量 in src/assets/styles/variables.scss"
Task: "创建联邦学习任务Mock数据 in src/utils/mock-fl-data.ts"
```

## Parallel Example: User Stories 3-6 (After Foundational)

```bash
# These can all start in parallel after Phase 2:
Task: "创建预处理任务节点组件 in src/components/Nodes/FLPreprocessNode.vue"
Task: "创建特征工程任务节点组件 in src/components/Nodes/FLFeatureNode.vue"
Task: "创建模型训练任务节点组件 in src/components/Nodes/FLModelNode.vue"
Task: "创建推断任务节点组件 in src/components/Nodes/FLInferenceNode.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (类型定义)
2. Complete Phase 3: User Story 1 (PIR实时数据源配置)
3. Complete Phase 4: User Story 2 (PIR链式调用)
4. **STOP and VALIDATE**: PIR功能完整可用
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup → 类型定义就绪
2. Add US1 → PIR实时数据源配置可用
3. Add US2 → PIR链式调用可用 (MVP!)
4. Complete Phase 2: Foundational → FL菜单就绪
5. Add US3 → 预处理任务可用
6. Add US4 → 特征工程任务可用
7. Add US5 → 模型训练任务可用
8. Add US6 → 推断任务可用

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together
2. Developer A: US1 + US2 (PIR功能)
3. Team completes Foundational together
4. Once Foundational done:
   - Developer B: US3 (预处理)
   - Developer C: US4 (特征工程)
   - Developer D: US5 (模型训练)
   - Developer E: US6 (推断)
5. Complete Polish phase together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- PIR功能 (US1, US2) 与 FL功能 (US3-US6) 可并行开发
- FL任务节点 (US3-US6) 依赖 Foundational 阶段的菜单和模板
- 每个用户故事应该独立可完成和测试
- 在每个检查点停止验证故事独立性
