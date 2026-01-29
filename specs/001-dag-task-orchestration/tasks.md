# Tasks: DAG隐私计算任务编排系统

**Input**: Design documents from `/specs/001-dag-task-orchestration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project structure: `src/` and `tests/` at repository root

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和Monaco Editor安装

- [ ] T001 安装Monaco Editor依赖 `npm install monaco-editor monaco-editor-vue` per research.md Decision 1
- [ ] T002 [P] 在`src/components/`下创建`Modals/`目录结构
- [ ] T003 [P] 在`src/stores/`下创建状态管理目录

---

## Phase 2: Foundational (阻塞性前置条件)

**Purpose**: 所有用户故事依赖的核心基础设施

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 在`src/types/export.ts`中定义导出JSON类型（ExportJson, Task, ComputeType等）
- [ ] T005 [P] 在`src/types/nodes.ts`中扩展节点类型定义（ComputeTaskNodeData, ModelNodeData等）
- [ ] T006 [P] 在`src/utils/enterprise-sorter.ts`中实现企业加权排序逻辑
- [ ] T007 [P] 在`src/utils/mock-data.ts`中创建Mock数据工厂函数
- [ ] T008 在`src/components/Flow/FlowCanvas.vue`中扩展handleDrop支持新节点类型
- [ ] T009 在`src/components/Flow/FlowCanvas.vue`中实现isValidConnection验证逻辑

**Checkpoint**: 基础设施就绪 - 用户故事实现现在可以并行开始

---

## Phase 3: User Story 1 - 拖拽创建计算任务 (Priority: P1) 🎯 MVP

**Goal**: 用户可以拖拽计算任务到画布，选择技术路径后创建计算任务节点

**Independent Test**: 拖拽PSI计算到画布→弹出技术路径窗口→选择软件密码学→画布上创建computeType为"PSI"的节点，技术路径锁定不可更改

### Implementation for User Story 1

- [ ] T010 [P] [US1] 在`src/components/Flow/FlowSidebar.vue`中添加"计算任务"分类（PSI计算、PIR查询、MPC计算、联邦学习置灰）
- [ ] T011 [P] [US1] 在`src/components/Modals/TechPathSelector.vue`中实现技术路径选择弹窗
- [ ] T012 [US1] 在`src/components/Flow/FlowCanvas.vue`中实现计算任务拖拽释放处理（弹出TechPathSelector）
- [ ] T013 [US1] 在`src/components/Flow/FlowCanvas.vue`中实现计算任务节点创建逻辑（设置computeType和techPath）
- [ ] T014 [P] [US1] 在`src/components/Nodes/ComputeTaskNode.vue`中创建计算任务节点组件（显示任务名称、计算类型、技术路径）
- [ ] T015 [US1] 在`src/utils/node-templates.ts`中添加COMPUTE_TASK_TEMPLATES常量
- [ ] T016 [US1] 在计算任务节点中添加技术路径锁定逻辑（禁用修改）

**Checkpoint**: User Story 1完成 - 可以独立拖拽创建计算任务节点

---

## Phase 4: User Story 2 - 配置输入数据与字段映射 (Priority: P1)

**Goal**: 用户从数据源节点连线到计算任务时弹出字段选择窗口，配置字段映射和join条件

**Independent Test**: 数据源节点A连线到计算任务B→弹出字段选择窗口→选择字段和join条件→保存配置→右侧详情面板显示输入数据section

### Implementation for User Story 2

- [ ] T017 [P] [US2] 在`src/components/Modals/FieldSelector.vue`中实现字段选择弹窗组件
- [ ] T018 [P] [US2] 在字段选择窗口中实现字段列表展示（默认全选）
- [ ] T019 [US2] 在字段选择窗口中实现join字段选择（INNER/CROSS连接类型）
- [ ] T020 [US2] 在字段选择窗口中实现字段别名设置
- [ ] T021 [US2] 在字段选择窗口中实现别名冲突检测（标*提示）
- [ ] T022 [US2] 在`src/components/Flow/FlowCanvas.vue`中实现连线到计算任务时弹出字段选择窗口
- [ ] T023 [US2] 在`src/components/Flow/FlowCanvas.vue`中实现取消字段选择时阻止连线
- [ ] T024 [US2] 在`src/components/Flow/FlowDetailPanel.vue`中添加"输入数据"可折叠section
- [ ] T025 [US2] 在详情面板"输入数据"section中显示已配置的数据源和字段信息

**Checkpoint**: User Story 2完成 - 可以独立配置输入数据与字段映射

---

## Phase 5: User Story 5 - 配置输出数据节点 (Priority: P1)

**Goal**: 用户点击计算任务下方的"添加输出"按钮创建输出数据节点，配置输出参与方和字段

**Independent Test**: 点击"添加输出"按钮→弹出输出配置窗口→选择参与方和字段→创建输出节点→输出节点可连线到其他任务

### Implementation for User Story 5

- [ ] T026 [P] [US5] 在`src/components/Nodes/ComputeTaskNode.vue`中添加"添加输出"按钮（Click-to-Connect）
- [ ] T027 [P] [US5] 在`src/components/Modals/OutputConfig.vue`中实现输出配置弹窗组件
- [ ] T028 [P] [US5] 在输出配置弹窗中实现企业选择（带优先级排序）
- [ ] T029 [P] [US5] 在输出配置弹窗中实现输出字段选择（输入字段/模型输出结果）
- [ ] T030 [P] [US5] 在`src/components/Nodes/OutputDataNode.vue`中创建输出数据节点组件
- [ ] T031 [US5] 在`src/components/Flow/FlowCanvas.vue`中实现点击"添加输出"创建输出节点的逻辑
- [ ] T032 [US5] 在`src/components/Flow/FlowDetailPanel.vue`中添加"输出数据"可折叠section
- [ ] T033 [US5] 在详情面板"输出数据"section中实现所有输出的显示和增删操作
- [ ] T034 [US5] 在`src/components/Flow/FlowCanvas.vue`中实现输出节点作为其他任务输入的连线逻辑
- [ ] T035 [US5] 在`src/components/Flow/FlowCanvas.vue`中实现删除计算任务时自动删除关联输出节点
- [ ] T036 [US5] 在`src/components/Flow/FlowCanvas.vue`中实现删除输出节点连线时自动删除输出节点

**Checkpoint**: User Story 5完成 - 可以独立配置输出数据节点

---

## Phase 6: User Story 7 - 导出标准JSON格式 (Priority: P1)

**Goal**: 用户点击导出按钮将DAG流程图转换为标准JSON格式，符合样例格式规范

**Independent Test**: 编排完整DAG→点击导出按钮→生成JSON文件→验证JSON结构符合样例格式（jobId、taskList、dataProviderList等）

### Implementation for User Story 7

- [X] T037 [P] [US7] 在`src/utils/dag-export.ts`中实现convertDagToJson主转换函数
- [X] T038 [P] [US7] 在`src/utils/dag-export.ts`中实现extractParticipants提取参与方企业
- [X] T039 [P] [US7] 在`src/utils/dag-export.ts`中实现buildTaskList构建任务列表
- [X] T040 [P] [US7] 在`src/utils/dag-export.ts`中实现buildDataProviderList（从inputProviders转换）
- [X] T041 [P] [US7] 在`src/utils/dag-export.ts`中实现buildJoinConditionList（从joinConditions转换）
- [X] T042 [P] [US7] 在`src/utils/dag-export.ts`中实现buildModelProviderList（从models转换）
- [X] T043 [P] [US7] 在`src/utils/dag-export.ts`中实现buildExpressionList（从expression转换）
- [X] T044 [P] [US7] 在`src/utils/dag-export.ts`中实现buildComputeProviderList（从computeProviders转换）
- [X] T045 [P] [US7] 在`src/utils/dag-export.ts`中实现buildResultConsumerList（从outputs转换）
- [X] T046 [P] [US7] 在`src/utils/dag-export.ts`中实现getComputeType映射（taskType+techPath→ComputeType）
- [X] T047 [US7] 在`src/components/Flow/FlowHeader.vue`中添加"导出"按钮
- [X] T048 [US7] 在导出按钮点击时调用convertDagToJson生成JSON文件
- [X] T049 [US7] 在导出前实现配置完整性验证（检查输入、模型、算力必填项）

**Checkpoint**: User Story 7完成 - 可以独立导出标准JSON格式

---

## Phase 7: User Story 8 - 实时预览导出JSON (Priority: P2)

**Goal**: 用户在右侧详情面板可以切换到JSON预览模式，实时查看导出JSON内容

**Independent Test**: 切换到JSON预览模式→显示完整JSON内容→修改DAG编排→JSON预览实时更新

### Implementation for User Story 8

- [X] T050 [P] [US8] 在`src/components/Flow/FlowDetailPanel.vue`中添加"节点详情"/"JSON预览"切换按钮
- [X] T051 [US8] 在`src/components/Flow/FlowDetailPanel.vue`中实现JSON预览模式切换逻辑
- [X] T052 [US8] 在`src/components/Flow/FlowDetailPanel.vue`中实现JSON预览内容展示（格式化显示）
- [X] T053 [US8] 在`src/components/Modals/JsonPreviewModal.vue`中扩展支持ExportJson格式预览
- [X] T054 [US8] 在`src/composables/useGraphState.ts`中实现图状态管理（响应式nodes和edges）
- [X] T055 [P] [US8] 在`src/composables/useGraphState.ts`中实现exportJson方法（实时计算导出JSON）

**Checkpoint**: User Story 8完成 - 可以独立实时预览导出JSON

---

## Phase 8: User Story 3 - 配置计算模型 (Priority: P2) ✅

**Goal**: 用户拖拽计算模型到计算任务节点，在详情面板配置模型参数或编辑表达式

**Independent Test**: 拖拽"MPC模型(表达式)"到计算任务→显示代码编辑器→输入表达式→变量补全→保存配置

### Implementation for User Story 3

- [X] T056 [P] [US3] 在`src/components/Flow/FlowSidebar.vue`中添加"计算模型"分类（5种模型类型）
- [X] T057 [P] [US3] 在`src/components/Modals/ModelSelector.vue`中实现模型选择弹窗
- [X] T058 [P] [US3] 在模型选择弹窗中实现企业选择（带优先级排序）
- [X] T059 [P] [US3] 在模型选择弹窗中显示选定企业的可用模型列表
- [X] T060 [P] [US3] 在`src/components/Nodes/ModelNode.vue`中创建计算模型节点组件
- [X] T061 [US3] 在`src/components/Flow/FlowCanvas.vue`中实现拖拽模型到计算任务释放逻辑
- [X] T062 [US3] 在`src/components/Flow/FlowCanvas.vue`中实现模型连线删除确认提示
- [X] T063 [P] [US3] 在`src/components/Flow/FlowDetailPanel.vue`中添加"计算模型"可折叠section
- [X] T064 [P] [US3] 在详情面板"计算模型"section中实现表达式编辑器（Monaco Editor集成）
- [X] T065 [US3] 在`src/components/Modals/MonacoEditor.vue`中实现Monaco Editor组件封装
- [X] T066 [P] [US3] 在Monaco Editor中实现Python语言注册和变量补全功能
- [X] T067 [P] [US3] 在`src/components/Flow/FlowDetailPanel.vue`中实现非表达式模型参数配置界面

**Checkpoint**: User Story 3完成 - 可以独立配置计算模型 ✅

---

## Phase 9: User Story 4 - 配置算力资源 (Priority: P2) ✅

**Goal**: 用户拖拽算力资源到计算任务节点，在详情面板查看和编辑算力配置

**Independent Test**: 拖拽"TEE板卡算力"到计算任务→弹出企业选择→选择算力→详情面板显示算力信息

### Implementation for User Story 4

- [X] T068 [P] [US4] 在`src/components/Flow/FlowSidebar.vue`中添加"算力资源"分类（TEE板卡算力）- 已通过node-templates.ts添加
- [X] T069 [P] [US4] 在`src/components/Modals/ResourceSelector.vue`中实现算力选择弹窗
- [X] T070 [P] [US4] 在算力选择弹窗中实现企业选择（带优先级排序）
- [X] T071 [P] [US4] 在算力选择弹窗中显示选定企业的可用TEE算力列表
- [X] T072 [P] [US4] 在`src/components/Nodes/ComputeResourceNode.vue`中创建算力资源节点组件
- [X] T073 [US4] 在`src/components/Flow/FlowCanvas.vue`中实现拖拽算力资源到计算任务释放逻辑
- [X] T074 [US4] 在`src/components/Flow/FlowCanvas.vue`中实现算力连线删除确认提示
- [X] T075 [P] [US4] 在`src/components/Flow/FlowDetailPanel.vue`中添加"算力资源"可折叠section
- [X] T076 [US4] 在详情面板"算力资源"section中实现算力信息展示和编辑

**Checkpoint**: User Story 4完成 - 可以独立配置算力资源 ✅

---

## Phase 10: User Story 6 - 本地结果处理任务编排 (Priority: P3) ✅

**Goal**: 用户拖拽"本地结果处理任务"到画布，选择参与方企业，配置输入数据，导出CONCAT类型任务

**Independent Test**: 拖拽本地结果处理任务→选择参与方→配置输入→导出JSON验证computeType为CONCAT

### Implementation for User Story 6

- [X] T077 [P] [US6] 在`src/components/Flow/FlowSidebar.vue`中添加"本地计算任务"分类（本地结果处理任务、本地Query置灰）
- [X] T078 [P] [US6] 企业选择复用现有逻辑（带优先级排序）
- [X] T079 [P] [US6] 在`src/components/Nodes/LocalTaskNode.vue`中创建本地结果处理任务节点组件
- [X] T080 [US6] 在`src/components/Flow/FlowCanvas.vue`中实现拖拽本地任务到画布释放逻辑
- [X] T081 [US6] 在`src/components/Flow/FlowCanvas.vue`中实现本地任务只接收输出节点连线的验证
- [X] T082 [US6] 在`src/utils/dag-export.ts`中扩展buildTaskList支持CONCAT类型任务（computeType="CONCAT", isFinalTask=true）
- [X] T083 [US6] 在`src/components/Flow/FlowDetailPanel.vue`中为本地任务添加详情展示（输入数据section）

**Checkpoint**: User Story 6完成 - 可以独立编排本地结果处理任务 ✅

---

## Phase 11: Polish & Cross-Cutting Concerns ✅

**Purpose**: 跨用户故事的改进和优化

- [X] T084 [P] 在`src/components/Nodes/`目录中实现节点卡片样式统一（颜色区分节点类型）
- [X] T085 [P] 在`src/assets/styles/variables.scss`中添加节点颜色变量（PSI/PIR/MPC不同色系）
- [X] T086 [P] 在`src/composables/useGraphState.ts`中实现循环依赖检测逻辑（DFS算法）
- [X] T087 [P] 在`src/components/Flow/FlowCanvas.vue`中实现页面刷新确认提示（beforeunload事件）
- [X] T088 [P] 在`src/components/Modals/`目录中为所有弹窗组件添加统一的样式和动画
- [X] T089 [P] 在`src/components/Flow/FlowDetailPanel.vue`中优化可折叠section的展开/收起动画
- [X] T090 [P] 在`src/utils/dag-export.ts`中添加导出JSON验证逻辑（结构完整性检查）
- [X] T091 [P] 生成DAG到JSON转换规则spec文档到`specs/DAG_TO_JSON_SPEC.md`
- [X] T092 更新CLAUDE.md添加DAG任务编排相关说明

**Checkpoint**: Phase 11 完成 - 所有优化和文档任务完成 ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - 阻塞所有用户故事
- **User Stories (Phase 3-10)**: 全部依赖Foundational完成
  - 用户故事可并行（如果有人力）
  - 或按优先级顺序（P1 → P2 → P3）

### User Story Dependencies

- **User Story 1 (P1)**: 可在Foundational完成后开始 - 无其他故事依赖
- **User Story 2 (P1)**: 可在Foundational完成后开始 - 可与US1集成但应独立测试
- **User Story 5 (P1)**: 可在Foundational完成后开始 - 依赖US1（输出节点概念独立）
- **User Story 7 (P1)**: 可在Foundational完成后开始 - 依赖US1, US2, US3, US4, US5（需要所有配置数据）
- **User Story 8 (P2)**: 可在Foundational完成后开始 - 依赖导出功能（US7）
- **User Story 3 (P2)**: 可在Foundational完成后开始 - 独立配置
- **User Story 4 (P2)**: 可在Foundational完成后开始 - 独立配置
- **User Story 6 (P3)**: 可在Foundational完成后开始 - 依赖其他任务的输出节点

### Within Each User Story

- Models marked [P] can run in parallel
- Components marked [P] can run in parallel
- 测试未明确要求，按需添加

---

## Parallel Opportunities

### Phase 2 - Foundational Phase（最大化并行）

```bash
# 可并行的Foundational任务：
Task T005: 扩展节点类型定义
Task T006: 企业排序逻辑
Task T007: Mock数据工厂
Task T008: 扩展画布拖拽支持
```

### Phase 3 - User Story 1（可并行）

```bash
# 可并行的US1任务：
Task T010: FlowSidebar添加计算任务分类
Task T011: TechPathSelector弹窗
Task T014: ComputeTaskNode组件
Task T015: 计算任务模板常量
```

### Phase 10 - Polish Phase（最大化并行）

```bash
# 可并行的优化任务：
Task T084: 节点卡片样式统一
Task T085: 颜色变量定义
Task T088: 弹窗组件统一样式
Task T089: 详情面板动画优化
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 5 + 7)

1. ✅ 完成 Phase 1: Setup
2. ✅ 完成 Phase 2: Foundational
3. ✅ 完成 Phase 3: User Story 1 - 拖拽创建计算任务
4. ✅ 完成 Phase 4: User Story 2 - 配置输入数据与字段映射
5. ✅ 完成 Phase 5: User Story 5 - 配置输出数据节点
6. ✅ 完成 Phase 6: User Story 7 - 导出标准JSON格式
7. **STOP and VALIDATE**: 测试核心流程（拖拽任务→配置输入→配置输出→导出JSON）
8. Deploy/demo if ready

### Incremental Delivery

1. ✅ Setup + Foundational → 基础就绪
2. ✅ Add US1 → 拖拽创建任务 → 测试独立
3. ✅ Add US2 → 配置输入数据 → 测试独立
4. ✅ Add US5 → 配置输出数据 → 测试独立
5. ✅ Add US7 → 导出JSON → 测试独立
6. ✅ Add US8 → 实时预览 → 测试独立
7. ✅ Add US3 → 配置计算模型 → 测试独立
8. ✅ Add US4 → 配置算力资源 → 测试独立
9. ✅ Add US6 → 本地结果处理 → 测试独立

每个故事增加价值而不破坏已有功能。

---

## Notes

- [P] 任务 = 不同文件，无依赖
- [Story] 标签将任务映射到特定用户故事以便追踪
- 每个用户故事应独立完成和测试
- 每个任务或逻辑组后提交
- 可在任何检查点停下来独立验证故事
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖

---

## Task Statistics

- **Total Tasks**: 92
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3-10 (User Stories)**: 83 tasks
  - US1 (P1): 7 tasks
  - US2 (P1): 9 tasks
  - US5 (P1): 11 tasks
  - US7 (P1): 13 tasks
  - US8 (P2): 6 tasks
  - US3 (P2): 12 tasks
  - US4 (P2): 9 tasks
  - US6 (P3): 7 tasks
- **Phase 11 (Polish)**: 9 tasks
- **Parallel Opportunities**: 已在多个Phase中标识

## Format Validation

✅ **ALL tasks follow checklist format**: `- [ ] [ID] [P?] [Story] Description with file path`

✅ **ALL tasks have Story labels** (Setup/Foundational/Polish无标签，US1-US8正确标记)

✅ **ALL tasks include exact file paths**

✅ **Independent test criteria defined** for each user story

**建议 MVP 范围**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2) + Phase 5 (US5) + Phase 6 (US7)

**下一步**: 执行 `/speckit.implement` 或按tasks.md开始开发
