# Tasks: DAG隐私计算任务编排系统

**Input**: Design documents from `/specs/002-dag-task-orchestration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 本规格说明未明确要求测试任务，因此不包含测试相关任务。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3...）
- 包含精确文件路径

## Path Conventions

本项目为单页Vue 3应用：
- 源码: `src/` (repository root)
- 类型: `src/types/`
- 组件: `src/components/`
- 工具: `src/utils/`

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和基础结构

- [x] T001 安装Monaco Editor依赖到package.json (monaco-editor, monaco-editor-vue)
- [x] T002 [P] 创建types目录和导出类型文件 src/types/export.ts (定义ExportJson、Task等运行时类型，contracts/仅作为规格文档参考)
- [x] T003 [P] 创建composables目录结构 src/composables/ (存放useGraphState等composables)
- [x] T004 创建Modals组件目录 src/components/Modals/

---

## Phase 2: Foundational (阻塞前提条件)

**Purpose**: 所有用户故事依赖的核心基础设施

**⚠️ CRITICAL**: 此阶段完成前无法开始任何用户故事工作

- [x] T005 实现企业排序工具函数 src/utils/enterprise-sorter.ts (按ResourceTypePriority排序)
- [x] T006 [P] 创建Mock数据工厂 src/utils/mock-data.ts (enterprises/models/computes/fields，确保与后端接口数据结构一致对应FR-057~FR-061)
- [x] T007 [P] 扩展节点模板 src/utils/node-templates.ts (添加COMPUTE_TASK_TEMPLATES, MODEL_TEMPLATES, RESOURCE_TEMPLATES)
- [x] T008 扩展节点类型定义 src/types/nodes.ts (添加ComputeTaskNodeData, ModelNodeData, ComputeResourceNodeData, OutputDataNodeData, LocalTaskNodeData)
- [x] T009 实现图状态管理composable src/composables/useGraphState.ts (使用Vue 3 Composition API ref/reactive管理nodes, edges, selectedNodeId, detailViewMode状态)
- [x] T010 实现DAG导出转换逻辑 src/utils/dag-export.ts (convertDagToJson主函数和子转换器)
- [x] T011 实现连线验证函数 src/utils/connection-validator.ts (isValidConnection, hasCycle检测)
- [x] T012 实现配置验证函数 src/utils/config-validator.ts (validateTaskConfig, validateJoinConditions)

**Checkpoint**: 基础设施就绪 - 用户故事实现现在可以并行开始

---

## Phase 3: User Story 1 - 拖拽创建计算任务 (Priority: P1) 🎯 MVP

**Goal**: 用户可以通过拖拽方式创建计算任务节点，选择技术路径

**Independent Test**: 用户拖拽计算任务到画布、弹出技术路径选择窗口、成功创建计算任务节点并显示基础信息

### Implementation for User Story 1

- [x] T013 [P] [US1] 实现TechPathSelector弹窗组件 src/components/Modals/TechPathSelector.vue (软件密码学/硬件TEE选择)
- [x] T014 [P] [US1] 创建ComputeTaskNode组件 src/components/Nodes/ComputeTaskNode.vue (基础节点UI，左右handle)
- [x] T015 [P] [US1] 扩展FlowSidebar添加"计算任务"分类 src/components/Flow/FlowSidebar.vue (PSI/PIR/MPC可拖拽，联邦学习置灰)
- [x] T016 [US1] 实现计算任务拖拽释放处理 src/components/Flow/FlowCanvas.vue (onDrop弹出TechPathSelector)
- [x] T017 [US1] 实现技术路径选择后节点创建逻辑 src/components/Flow/FlowCanvas.vue (addNodes with computeType和techPath)
- [x] T018 [US1] 实现ComputeTaskNode基础信息显示 src/components/Nodes/ComputeTaskNode.vue (未选中时显示关键信息)
- [x] T019 [US1] 实现计算任务节点选中状态 src/components/Nodes/ComputeTaskNode.vue (选中时高亮样式)
- [x] T020 [US1] 实现computeType与techPath组合映射 src/utils/dag-export.ts (PSI+tee → TEE_PSI)

**Checkpoint**: User Story 1完成 - 可独立测试拖拽创建计算任务

---

## Phase 4: User Story 2 - 配置输入数据与字段映射 (Priority: P1)

**Goal**: 用户通过连线配置输入数据、字段选择、join条件和别名

**Independent Test**: 用户从数据源节点连线到计算任务、弹出字段选择窗口、选择字段和join条件、成功保存输入配置

### Implementation for User Story 2

- [x] T021 [P] [US2] 实现FieldSelector弹窗组件 src/components/Modals/FieldSelector.vue (字段列表、join字段选择、别名设置)
- [x] T022 [P] [US2] 实现字段别名冲突检测 src/components/Modals/FieldSelector.vue (别名重复标*提示)
- [x] T023 [P] [US2] 实现join条件构建逻辑 src/utils/join-builder.ts (从FieldMapping构建JoinCondition结构)
- [x] T024 [US2] 实现数据源连线到计算任务处理 src/components/Flow/FlowCanvas.vue (onConnect弹出FieldSelector)
- [x] T025 [US2] 实现字段选择窗口取消逻辑 src/components/Flow/FlowCanvas.vue (取消则不创建连线)
- [x] T026 [US2] 实现输入数据配置保存到节点 src/components/Flow/FlowCanvas.vue (保存inputProviders和joinConditions)
- [x] T027 [US2] 实现FlowDetailPanel输入数据section src/components/Flow/FlowDetailPanel.vue (可折叠展示已配置数据源)
- [x] T028 [US2] 实现输入数据字段信息展示 src/components/Flow/FlowDetailPanel.vue (显示数据源、字段、join条件)
- [x] T029 [US2] 实现join字段验证 src/utils/config-validator.ts (至少一个join字段)

**Checkpoint**: User Story 2完成 - 可独立测试输入数据配置

---

## Phase 5: User Story 5 - 配置输出数据节点 (Priority: P1)

**Goal**: 用户为计算任务添加输出数据节点，配置输出参与方和字段

**Independent Test**: 用户点击计算任务下方的"添加输出"按钮、配置输出参与方和字段、输出节点作为其他任务输入

### Implementation for User Story 5

- [x] T030 [P] [US5] 创建OutputDataNode组件 src/components/Nodes/OutputDataNode.vue (输出节点UI，顶部handle)
- [x] T031 [P] [US5] 实现EnterpriseSelector弹窗组件 src/components/Modals/EnterpriseSelector.vue (企业列表按优先级排序)
- [x] T032 [P] [US5] 实现OutputConfig弹窗组件 src/components/Modals/OutputConfig.vue (参与方选择、输出字段选择)
- [x] T033 [P] [US5] 实现ComputeTaskNode的"添加输出"按钮 src/components/Nodes/ComputeTaskNode.vue (Click-to-Connect按钮)
- [x] T034 [US5] 实现输出节点创建逻辑 src/components/Flow/FlowCanvas.vue (在计算任务下方创建OutputDataNode)
- [x] T035 [US5] 实现输出节点与父任务关联 src/components/Flow/FlowCanvas.vue (设置parentTaskId，添加到outputs数组)
- [x] T036 [US5] 实现企业优先级排序显示 src/components/Modals/EnterpriseSelector.vue (调用enterprise-sorter)
- [x] T037 [US5] 实现输出字段选择逻辑 src/components/Modals/OutputConfig.vue (输入字段+模型输出字段)
- [x] T038 [US5] 实现FlowDetailPanel输出数据section src/components/Flow/FlowDetailPanel.vue (显示所有输出，支持增删)
- [x] T039 [US5] 实现计算任务删除时级联删除输出节点 src/components/Flow/FlowCanvas.vue (removeNode清理关联outputs)
- [x] T040 [US5] 实现输出节点连线删除时自动删除 src/components/Flow/FlowCanvas.vue (onEdgeDelete清理OutputDataNode)
- [x] T041 [US5] 实现输出节点作为其他任务输入 src/components/Flow/FlowCanvas.vue (outputData → computeTask连线验证)

**Checkpoint**: User Story 5完成 - 可独立测试输出数据配置

---

## Phase 6: User Story 7 - 导出标准JSON格式 (Priority: P1)

**Goal**: 用户将编排完成的DAG流程图导出为标准JSON格式

**Independent Test**: 用户点击导出按钮、系统转换DAG为JSON、JSON格式符合规范样例

### Implementation for User Story 7

  - [x] T042 [P] [US7] 实现拓扑排序函数 src/utils/dag-export.ts (topologicalSort确定任务执行顺序)
  - [x] T043 [P] [US7] 实现参与方提取函数 src/utils/dag-export.ts (extractParticipants从节点提取企业)
  - [x] T044 [P] [US7] 实现任务依赖构建 src/utils/dag-export.ts (getDependencyIds从edges提取taskSrcIdList)
  - [x] T045 [P] [US7] 实现DataProviderList转换 src/utils/dag-export.ts (buildDataProviderList从inputProviders转换)
  - [x] T046 [P] [US7] 实现JoinConditionList转换 src/utils/dag-export.ts (buildJoinConditions从joinConditions转换，注意字段名映射)
  - [x] T047 [P] [US7] 实现ResultConsumerList转换 src/utils/dag-export.ts (buildResultConsumerList从outputs转换)
  - [x] T048 [US7] 实现完整任务构建函数 src/utils/dag-export.ts (buildTask组合所有子转换器)
  - [x] T049 [US7] 实现jobId生成函数 src/utils/dag-export.ts (generateJobId生成唯一ID)
  - [x] T050 [US7] 实现FlowHeader导出按钮 src/components/Flow/FlowHeader.vue (添加"导出"按钮)
  - [x] T051 [US7] 实现导出按钮点击处理 src/components/Flow/FlowHeader.vue (调用convertDagToJson并下载JSON文件)
  - [x] T052 [US7] 实现JSON文件下载功能 src/utils/file-downloader.ts (将ExportJson转换为Blob并下载)
  - [x] T053 [US7] 验证导出JSON格式符合样例 src/utils/dag-export.ts (确保字段名与样例一致)

**Checkpoint**: User Story 7完成 - 可独立测试DAG导出功能

---

## Phase 7: User Story 3 - 配置计算模型 (Priority: P2)

**Goal**: 用户通过拖拽方式为计算任务添加计算模型，配置模型参数或表达式

**Independent Test**: 用户拖拽计算模型到计算任务节点、在详情面板配置模型参数、保存模型配置

### Implementation for User Story 3

- [x] T054 [P] [US3] 创建ModelNode组件 src/components/Nodes/ModelNode.vue (模型子节点UI，右侧handle)
- [x] T055 [P] [US3] 实现ModelSelector弹窗组件 src/components/Modals/ModelSelector.vue (企业选择后显示模型列表)
- [x] T056 [P] [US3] 实现Monaco Editor表达式编辑器组件 src/components/Modals/ExpressionEditor.vue (配置Python语言，主题vs-dark，字体14px)
- [x] T057 [P] [US3] 实现变量自动补全provider src/composables/useCodeCompletion.ts (输入`.`时触发补全participantId.assetName.columnName格式的变量引用)
- [x] T058 [US3] 扩展FlowSidebar添加"计算模型"分类 src/components/Flow/FlowSidebar.vue (5种模型可拖拽)
- [x] T059 [US3] 实现模型拖拽到计算任务释放 src/components/Flow/FlowCanvas.vue (验证target为computeTask)
- [x] T060 [US3] 实现表达式模型特殊处理 src/components/Flow/FlowCanvas.vue (expression类型直接添加，不弹企业选择)
- [x] T061 [US3] 实现非表达式模型企业选择 src/components/Flow/FlowCanvas.vue (弹出EnterpriseSelector后弹出ModelSelector)
- [x] T062 [US3] 实现模型节点创建和连线 src/components/Flow/FlowCanvas.vue (在计算任务左侧创建ModelNode并连线)
- [x] T063 [US3] 实现模型连线删除确认 src/components/Flow/FlowCanvas.vue (弹出确认提示后删除模型配置)
- [x] T064 [US3] 实现FlowDetailPanel计算模型section src/components/Flow/FlowDetailPanel.vue (显示模型列表和参数配置)
- [x] T065 [US3] 实现表达式模型编辑界面 src/components/Flow/FlowDetailPanel.vue (Monaco Editor编辑器嵌入)
- [x] T066 [US3] 实现非表达式模型参数配置 src/components/Flow/FlowDetailPanel.vue (参数绑定到字段或固定值)
- [x] T067 [US3] 实现ModelProviderList转换 src/utils/dag-export.ts (buildModelProviderList从models转换，expression类型除外)
- [x] T068 [US3] 实现ExpressionList转换 src/utils/dag-export.ts (buildExpressionList从expression字段转换)

**Checkpoint**: User Story 3完成 - 可独立测试计算模型配置

---

## Phase 8: User Story 4 - 配置算力资源 (Priority: P2)

**Goal**: 用户为计算任务配置算力资源（TEE板卡算力）

**Independent Test**: 用户拖拽算力资源到计算任务节点、在详情面板查看算力配置、删除算力资源

### Implementation for User Story 4

- [x] T069 [P] [US4] 创建ComputeResourceNode组件 src/components/Nodes/ComputeResourceNode.vue (算力子节点UI，左侧handle)
- [x] T070 [P] [US4] 实现ComputeSelector弹窗组件 src/components/Modals/ComputeSelector.vue (企业选择后显示算力列表)
- [x] T071 [US4] 扩展FlowSidebar添加"算力资源"分类 src/components/Flow/FlowSidebar.vue (TEE板卡算力可拖拽)
- [x] T072 [US4] 实现算力拖拽到计算任务释放 src/components/Flow/FlowCanvas.vue (验证target为computeTask)
- [x] T073 [US4] 实现算力企业选择和列表 src/components/Flow/FlowCanvas.vue (弹出EnterpriseSelector后弹出ComputeSelector)
- [x] T074 [US4] 实现算力节点创建和连线 src/components/Flow/FlowCanvas.vue (在计算任务右侧创建ComputeResourceNode并连线)
- [x] T075 [US4] 实现算力连线删除确认 src/components/Flow/FlowCanvas.vue (弹出确认提示后删除算力配置)
- [x] T076 [US4] 实现FlowDetailPanel算力资源section src/components/Flow/FlowDetailPanel.vue (显示已配置算力信息)
- [x] T077 [US4] 实现算力节点选中高亮详情 src/components/Flow/FlowDetailPanel.vue (选中算力节点时高亮对应section)
- [x] T078 [US4] 实现ComputeProviderList转换 src/utils/dag-export.ts (buildComputeProviderList从computeProviders转换)

**Checkpoint**: User Story 4完成 - 可独立测试算力资源配置

---

## Phase 9: User Story 8 - 实时预览导出JSON (Priority: P2)

**Goal**: 用户在右侧详情面板实时预览导出的JSON内容

**Independent Test**: 用户切换到JSON预览模式、修改DAG编排、JSON预览实时更新

### Implementation for User Story 8

- [x] T079 [P] [US8] 实现FlowDetailPanel视图模式切换 src/components/Flow/FlowDetailPanel.vue ("节点详情"和"JSON预览"切换按钮)
- [x] T080 [P] [US8] 实现JSON预览面板组件 src/components/Flow/JsonPreviewPanel.vue (格式化显示JSON内容)
- [x] T081 [US8] 实现导出JSON响应式计算 src/composables/useGraphState.ts (computed exportJson实时更新)
- [x] T082 [US8] 实现JSON预览实时更新 src/components/Flow/JsonPreviewPanel.vue (监听exportJson变化)
- [x] T083 [US8] 实现JSON语法高亮显示 src/components/Flow/JsonPreviewPanel.vue (格式化展示JSON)
- [x] T084 [US8] 实现视图切换状态管理 src/composables/useGraphState.ts (detailViewMode: 'detail' | 'preview')

**Checkpoint**: User Story 8完成 - 可独立测试JSON预览功能

---

## Phase 10: User Story 6 - 本地结果处理任务编排 (Priority: P3)

**Goal**: 用户创建本地计算任务（CONCAT类型），拼接多个计算任务的输出结果

**Independent Test**: 用户拖拽"本地结果处理任务"到画布、选择参与方企业、配置输入数据、导出CONCAT类型任务

### Implementation for User Story 6

- [x] T085 [P] [US6] 创建LocalTaskNode组件 src/components/Nodes/LocalTaskNode.vue (本地任务节点，computeType=CONCAT)
- [x] T086 [US6] 扩展FlowSidebar添加"本地计算任务"分类 src/components/Flow/FlowSidebar.vue (本地结果处理任务可拖拽，本地Query置灰)
- [x] T087 [US6] 实现本地任务企业选择弹窗 src/components/Modals/LocalTaskEnterpriseSelector.vue (参与方企业选择窗口)
- [x] T088 [US6] 实现本地任务拖拽释放处理 src/components/Flow/FlowCanvas.vue (弹出企业选择后创建LocalTaskNode)
- [x] T089 [US6] 实现本地任务输入配置 src/components/Flow/FlowCanvas.vue (支持从输出节点连线作为输入)
- [x] T090 [US6] 实现CONCAT类型导出逻辑 src/utils/dag-export.ts (computeType固定为CONCAT，isFinalTask为true)
- [x] T091 [US6] 实现本地任务详情面板 src/components/Flow/FlowDetailPanel.vue (显示参与方企业和输入配置)

**Checkpoint**: User Story 6完成 - 可独立测试本地结果处理任务

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: 影响多个用户故事的改进和完善

- [x] T092 [P] 实现删除节点时清理所有关联连线 src/components/Flow/FlowCanvas.vue (removeNode级联删除edges)
- [x] T093 [P] 实现循环依赖检测和阻止 src/utils/connection-validator.ts (hasCycle函数阻止循环连线)
- [x] T094 [P] 实现页面刷新前确认提示 src/components/Flow/FlowCanvas.vue (beforeunload事件提示数据丢失)
- [x] T095 [P] 实现连线到不支持类型的阻止 src/components/Flow/FlowCanvas.vue (isValidConnection阻止连线到联邦学习)
- [x] T096 [P] 实现字段别名冲突实时提示 src/components/Modals/FieldSelector.vue (重复别名标*)
- [x] T097 [P] 实现无可用资源提示 src/components/Modals/ModelSelector.vue (企业无模型/算力时提示)
- [x] T098 [P] 实现表达式语法错误提示 src/components/Modals/ExpressionEditor.vue (Monaco语法错误显示)
- [x] T099 [P] 实现配置完整性检查提示 src/utils/config-validator.ts (导出前检查必填项)
  - [x] T100 添加DAG到JSON转换规则文档 specs/002-dag-task-orchestration/DAG_TO_JSON_SPEC.md
- [x] T101 运行完整类型检查 npm run build (vue-tsc类型检查)
  - [x] T102 验证quickstart.md开发指南完整性
  - [x] T103 代码清理和refactor (移除调试代码，优化命名)
  - [x] T104 性能优化 (大DAG图加载和渲染优化)

---

## Phase 12: E2E 测试 (Priority: P1)

**Purpose**: 端到端测试验证所有用户故事的完整流程

- [x] T105 [P] 创建计算任务编排 E2E 测试 e2e/task-orchestration.spec.ts (覆盖 US1, US2, US5, US7 核心流程)
- [x] T106 [P] 创建节点操作 E2E 测试 e2e/node-operations.spec.ts (验证节点选中、删除、拖拽)
- [x] T107 [P] 创建连接规则 E2E 测试 e2e/connections.spec.ts (验证连线阻止规则、循环依赖检测)
- [x] T108 [P] 创建拖拽操作 E2E 测试 e2e/drag-drop.spec.ts (验证所有节点类型拖拽)
- [x] T109 创建边缘情况 E2E 测试 e2e/edge-cases.spec.ts (验证字段别名冲突、无资源提示等)
- [x] T110 运行全部 E2E 测试并确保 100% 通过率 npm run test:e2e

**Checkpoint**: E2E 测试完成 - 所有用户故事可通过自动化测试验证

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 立即开始
- **Foundational (Phase 2)**: 依赖Setup完成 - 阻塞所有用户故事
- **User Stories (Phase 3-10)**: 全部依赖Foundational完成
  - 用户故事可并行进行（如果有足够人力）
  - 或按优先级顺序执行（P1 → P2 → P3）
- **Polish (Phase 11)**: 依赖所有需要的用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完成后可开始 - 无其他用户故事依赖
- **User Story 2 (P1)**: Foundational完成后可开始 - 依赖US1的ComputeTaskNode存在
- **User Story 5 (P1)**: Foundational完成后可开始 - 依赖US1的ComputeTaskNode存在
- **User Story 7 (P1)**: Foundational完成后可开始 - 依赖US1(节点), US2(inputProviders), US5(outputs)
- **User Story 3 (P2)**: Foundational完成后可开始 - 依赖US1的ComputeTaskNode存在
- **User Story 4 (P2)**: Foundational完成后可开始 - 依赖US1的ComputeTaskNode存在
- **User Story 8 (P2)**: Foundational完成后可开始 - 依赖US7的导出逻辑
- **User Story 6 (P3)**: Foundational完成后可开始 - 依赖US5的输出节点

### Within Each User Story

- 并行任务标记[P]可以同时进行
- 组件创建后才能进行连线/交互逻辑
- 转换逻辑依赖对应的数据结构

### Parallel Opportunities

- Setup阶段所有[P]任务可并行 (T002, T003, T004)
- Foundational阶段所有[P]任务可并行 (T007, T007)
- 用户故事阶段的[P]任务可并行（同一故事内）
- 不同用户故事可由不同开发人员并行工作

---

## Parallel Example: User Story 1

```bash
# 可同时启动的组件创建任务：
Task T013: "实现TechPathSelector弹窗组件"
Task T014: "创建ComputeTaskNode组件"
Task T015: "扩展FlowSidebar添加计算任务分类"

# 组件创建完成后，串行执行交互逻辑：
Task T016: "实现计算任务拖拽释放处理" (依赖T014, T015)
Task T017: "实现技术路径选择后节点创建逻辑" (依赖T016)
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 5, 7 - All P1)

1. 完成 Phase 1: Setup (T001-T005)
2. 完成 Phase 2: Foundational (T006-T013) - 关键阻塞点
3. 完成 Phase 3: User Story 1 (T014-T021)
4. 完成 Phase 4: User Story 2 (T022-T030)
5. 完成 Phase 5: User Story 5 (T031-T042)
6. 完成 Phase 6: User Story 7 (T043-T054)
7. **停止并验证**: MVP完整流程可测试
8. 如准备好则部署/演示

### Incremental Delivery

1. Setup + Foundational → 基础设施就绪
2. + User Story 1 → 可创建计算任务 → 测试独立部署 (MVP核心!)
3. + User Story 2 → 可配置输入数据 → 测试独立部署
4. + User Story 5 → 可配置输出数据 → 测试独立部署
5. + User Story 7 → 可导出JSON → 完整MVP! 部署/演示
6. + User Story 3 → 可配置计算模型 → 增量部署
7. + User Story 4 → 可配置算力资源 → 增量部署
8. + User Story 8 → 可实时预览JSON → 增量部署
9. + User Story 6 → 可编排本地任务 → 增量部署
10. + Polish → 生产就绪

### Parallel Team Strategy

多人协作时：

1. 团队共同完成 Setup + Foundational
2. Foundational完成后：
   - Developer A: User Story 1 (计算任务创建)
   - Developer B: User Story 2 (输入数据配置)
   - Developer C: User Story 5 (输出数据配置)
3. P1完成后：
   - Developer A: User Story 7 (导出功能)
   - Developer B: User Story 3 (计算模型配置)
   - Developer C: User Story 4 (算力资源配置)
4. P2完成后：
   - Developer A: User Story 8 (JSON预览)
   - Developer B: User Story 6 (本地任务)
   - Developer C: Polish任务

---

## Summary

| 指标 | 数量 |
|------|------|
| **总任务数** | 110 |
| **Setup任务** | 4 |
| **Foundational任务** | 8 |
| **US1任务** | 8 |
| **US2任务** | 9 |
| **US5任务** | 12 |
| **US7任务** | 12 |
| **US3任务** | 15 |
| **US4任务** | 10 |
| **US8任务** | 6 |
| **US6任务** | 7 |
| **Polish任务** | 13 |
| **E2E测试任务** | 6 |
| **并行机会** | 约40%任务标记[P] |

### MVP Scope (P1 Stories)

**推荐MVP范围**: User Stories 1, 2, 5, 7 (共40个任务)

- US1: 拖拽创建计算任务 (8任务)
- US2: 配置输入数据 (9任务)
- US5: 配置输出数据 (12任务)
- US7: 导出JSON (12任务)

**MVP完成时间估算**:
- Setup + Foundational: 12任务
- MVP用户故事: 28任务
- 总计: 40核心任务

### Format Validation

✅ **所有任务遵循checklist格式**:
- 复选框 `- [ ]` 开头
- 任务ID (T001-T104)
- [P]标记用于并行任务
- [Story]标签用于用户故事任务 (US1-US8)
- 描述包含精确文件路径
- 每个用户故事可独立测试
- 依赖关系清晰明确

---

## Notes

- [P]任务 = 不同文件，无依赖，可并行执行
- [Story]标签将任务映射到具体用户故事以保持可追溯性
- 每个用户故事应可独立完成和测试
- 每个任务或逻辑组后提交
- 在任何checkpoint停止以独立验证故事
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
