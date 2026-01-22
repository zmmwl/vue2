# Tasks: 数据资产选择与展示

**Input**: Design documents from `/specs/001-data-asset-select/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: 本功能使用 Playwright 进行 E2E 测试。测试任务已包含在每个用户故事中。

**Organization**: 任务按用户故事分组，以实现每个故事的独立实施和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属的用户故事（US1, US2, US3, US4, US5）
- 描述中包含精确的文件路径

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和基础结构

此功能基于现有 Vue 3 项目，项目结构已存在。本阶段主要添加必要的目录结构。

- [ ] T001 [P] 创建 Dialogs 组件目录 src/components/Dialogs/
- [ ] T002 [P] 创建 Common 组件目录 src/components/Common/
- [ ] T003 [P] 创建 services 目录 src/services/
- [ ] T004 [P] 创建测试 mocks 目录 src/tests/mocks/
- [ ] T005 [P] 创建 E2E 测试目录 tests/e2e/

**Checkpoint**: 目录结构就绪，可以开始基础实施

---

## Phase 2: Foundational (阻塞性先决条件)

**Purpose**: 所有用户故事依赖的核心基础设施

**⚠️ CRITICAL**: 在此阶段完成之前，无法开始任何用户故事的实施

- [ ] T006 扩展类型定义 src/types/nodes.ts 添加 AssetInfo、Enterprise、AssetSummary、AssetListItem、FieldInfo、DataInfo、SelectedField 接口
- [ ] T007 [P] 创建 API 响应类型定义 src/types/api.ts 包含 ApiResponse、GetEnterpriseListResponse、GetAssetListResponse、GetAssetResponse、ErrorResponse
- [ ] T008 [P] 扩展 NodeData 接口在 src/types/nodes.ts 中添加 assetInfo 和 selectedFields 可选字段
- [ ] T009 [P] 创建 SCSS 样式变量在 src/assets/styles/variables.scss 添加对话框、详情面板、节点状态相关变量
- [ ] T010 [P] 创建日志工具 src/utils/logger.ts 提供 error、warn、info 方法
- [ ] T011 [P] 创建数据资产缓存服务 src/services/assetCache.ts 实现 Map 缓存和 rebuildFromNodes 方法
- [ ] T012 创建数据资产 API 服务 src/services/assetApi.ts 实现 getEnterpriseList、getAssetList、getAsset 方法，包含错误分类和重试逻辑（使用 POST 请求，参数格式参考 .myprompt/specs/interfaces）
- [ ] T012-A [P] 集成日志到 API 服务在 src/services/assetApi.ts 中为所有 API 调用添加 logger 记录（请求、响应、错误）（依赖 T010, T012）
- [ ] T012-B [P] 集成日志到缓存服务在 src/services/assetCache.ts 中为缓存操作添加 logger 记录（命中、未命中、重建）（依赖 T010, T011）
- [ ] T013 [P] 创建 API Mock 实现 src/tests/mocks/assetApiMock.ts 实现 mockGetEnterpriseList、mockGetAssetList、mockGetAsset
- [ ] T014 [P] 创建测试数据 src/tests/mocks/assetTestData.ts 包含 mockEnterpriseList、mockAssetInfoMap、generateMockFields 函数

**Checkpoint**: 基础设施就绪 - 用户故事实施现在可以并行开始

---

## Phase 3: User Story 1 - 拖放节点后选择数据资产 (Priority: P1) 🎯 MVP

**Goal**: 实现拖拽数据源节点到画布后，通过多步骤向导选择数据资产的核心功能

**Independent Test**: 拖放节点 → 对话框弹出 → 完成三步骤选择 → 节点状态更新 → 查看详情面板的完整流程

### Tests for User Story 1

> **NOTE: 先编写这些测试，确保在实施前失败**

- [ ] T015 [P] [US1] 创建 E2E 测试框架 tests/e2e/asset-selection.spec.ts 包含基础测试配置
- [ ] T016 [US1] 编写 E2E 测试用例在 tests/e2e/asset-selection.spec.ts 测试完整选择流程（拖放→选择企业→选择资产→选择字段→确认）

### Implementation for User Story 1

- [ ] T017 [P] [US1] 创建虚拟滚动列表组件 src/components/Common/VirtualScrollList.vue 支持动态渲染、搜索、缓冲区，确保可流畅处理 500 个字段的列表（滚动帧率 > 30fps）
- [ ] T018 [US1] 创建数据资产选择对话框组件 src/components/Dialogs/AssetSelectorDialog.vue 实现完整三步骤向导（企业选择 → 资产选择 → 字段选择），集成 VirtualScrollList，包含导航逻辑、步骤进度、验证和搜索功能（依赖 T017）
- [ ] T019 [US1] 修改 FlowCanvas.vue 在 src/components/Flow/FlowCanvas.vue 的 onDrop 事件中触发对话框弹出
- [ ] T020 [US1] 实现取消配置删除节点逻辑在 src/components/Flow/FlowCanvas.vue 中处理对话框取消/关闭事件，立即删除节点无需确认（符合 spec.md 澄清会话结论）
- [ ] T021 [US1] 修改 DataSourceNode.vue 在 src/components/Nodes/DataSourceNode.vue 中显示已配置状态（资产名称或"未配置"标签）
- [ ] T022 [US1] 实现数据保存逻辑在 src/components/Dialogs/AssetSelectorDialog.vue 将 assetInfo 和 selectedFields 保存到节点 data

**Checkpoint**: 此时 User Story 1 应该完全可用且可独立测试

---

## Phase 4: User Story 2 - 查看已配置数据源的详情 (Priority: P1)

**Goal**: 点击已配置的数据源节点时，右侧面板显示数据资产详情

**Independent Test**: 点击已配置节点 → 右侧显示详情面板 → 验证信息完整性

### Tests for User Story 2

- [ ] T026 [P] [US2] 编写 E2E 测试用例在 tests/e2e/asset-selection.spec.ts 测试查看详情流程（点击节点→验证详情面板）

### Implementation for User Story 2

- [ ] T027 [P] [US2] 创建详情面板组件 src/components/Flow/FlowDetailPanel.vue 实现基本信息展示区域
- [ ] T028 [US2] 实现字段列表展示在 src/components/Flow/FlowDetailPanel.vue 显示已选字段列表（依赖 T027）
- [ ] T029 [US2] 添加空状态提示在 src/components/Flow/FlowDetailPanel.vue 处理未配置节点的情况（依赖 T027）
- [ ] T030 [US2] 集成详情面板到编辑器在 src/views/FlowEditor.vue 中添加 FlowDetailPanel 组件并处理节点选中事件

**Checkpoint**: 此时 User Stories 1 和 2 都应该独立可用

---

## Phase 5: User Story 3 - 编辑已配置的数据资产 (Priority: P2)

**Goal**: 允许用户重新配置已选择的数据资产

**Independent Test**: 点击编辑按钮 → 对话框弹出并回显 → 修改选择 → 验证更新

### Tests for User Story 3

- [ ] T031 [P] [US3] 编写 E2E 测试用例在 tests/e2e/asset-selection.spec.ts 测试编辑配置流程

### Implementation for User Story 3

- [ ] T032 [US3] 添加编辑模式支持在 src/components/Dialogs/AssetSelectorDialog.vue 支持 nodeId 参数和回显逻辑
- [ ] T033 [US3] 添加"重新配置"按钮在 src/components/Flow/FlowDetailPanel.vue 触发编辑模式
- [ ] T034 [US3] 实现编辑取消逻辑在 src/components/Dialogs/AssetSelectorDialog.vue 保持原有配置不变

**Checkpoint**: 所有用户故事应该独立可用

---

## Phase 6: User Story 4 - 导出包含数据资产信息的任务图 (Priority: P1)

**Goal**: 导出的 JSON 包含完整数据资产信息，支持导入恢复

**Independent Test**: 配置多个数据源 → 导出 JSON → 验证导出文件包含完整信息

### Tests for User Story 4

- [ ] T035 [P] [US4] 编写 E2E 测试用例在 tests/e2e/asset-selection.spec.ts 测试导出流程（配置→导出→验证 JSON 结构）
- [ ] T036 [P] [US4] 编写 E2E 测试用例在 tests/e2e/asset-selection.spec.ts 测试导入流程（导入 JSON → 验证状态恢复）

### Implementation for User Story 4

- [ ] T037 [P] [US4] 创建导出工具函数 src/utils/exportUtils.ts 实现 exportGraph 函数，包含验证逻辑
- [ ] T037-B [P] 集成日志到导出工具在 src/utils/exportUtils.ts 中为导出/导入操作添加 logger 记录（依赖 T010, T037）
- [ ] T038 [US4] 完善缓存重建逻辑在 src/services/assetCache.ts 的 rebuildFromNodes 方法中添加从节点数据恢复缓存的完整实现（依赖 T011）
- [ ] T039 [US4] 添加导出按钮在 src/components/Flow/FlowHeader.vue 调用 exportGraph 并下载 JSON
- [ ] T040 [US4] 添加导入按钮在 src/components/Flow/FlowHeader.vue 读取 JSON 文件并恢复状态
- [ ] T041 [US4] 实现未配置节点警告在 src/utils/exportUtils.ts 中检测并提示未配置节点

**Checkpoint**: 此时所有 P1 用户故事应该完全可用

---

## Phase 7: User Story 5 - 搜索与过滤数据资产 (Priority: P2)

**Goal**: 在对话框中提供搜索和过滤功能，快速定位目标

**Independent Test**: 输入搜索关键词 → 验证过滤结果 → 清空搜索 → 验证完整列表

### Tests for User Story 5

- [ ] T042 [P] [US5] 编写 E2E 测试用例在 tests/e2e/asset-selection.spec.ts 测试搜索功能（企业、资产、字段搜索）

### Implementation for User Story 5

- [ ] T043 [P] [US5] 实现企业搜索在 src/components/Dialogs/AssetSelectorDialog.vue 步骤 1 添加搜索框和过滤逻辑
- [ ] T044 [US5] 实现资产搜索在 src/components/Dialogs/AssetSelectorDialog.vue 步骤 2 添加搜索框和过滤逻辑
- [ ] T045 [US5] 实现字段搜索在 src/components/Dialogs/AssetSelectorDialog.vue 步骤 3 集成 VirtualScrollList 搜索功能
- [ ] T046 [US5] 添加防抖优化在 src/components/Dialogs/AssetSelectorDialog.vue 对搜索输入添加 300ms 防抖

**Checkpoint**: 所有用户故事应该独立可用

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 影响多个用户故事的改进

- [ ] T047 [P] 添加类型检查验证在 package.json 中修改 build 脚本为 "vue-tsc -b && vite build" 确保类型检查在构建前执行
- [ ] T048 运行 E2E 测试套件使用 npm run test 验证所有测试通过
- [ ] T049 [P] 添加键盘快捷键支持在 src/components/Dialogs/AssetSelectorDialog.vue 实现 ESC 关闭、Enter 确认
- [ ] T050 优化错误提示 UX 在 src/components/Dialogs/AssetSelectorDialog.vue 添加友好的错误消息和重试按钮
- [ ] T051 添加加载状态指示在 src/components/Dialogs/AssetSelectorDialog.vue 各步骤添加骨架屏或加载动画
- [ ] T052 [P] 添加配置流程性能测试在 tests/e2e/asset-selection.spec.ts 中验证从拖放到完成选择在网络条件良好的情况下 30 秒内完成（依赖 T016）
- [ ] T053 [P] 添加搜索性能测试在 tests/e2e/asset-selection.spec.ts 中验证搜索功能在 >20 项时 1 秒内返回结果（依赖 T042）
- [ ] T054 运行 quickstart.md 验证按照 quickstart.md 测试所有功能流程

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
    ├─→ Phase 3 (US1 - P1) 🎯 MVP
    ├─→ Phase 4 (US2 - P1)
    ├─→ Phase 5 (US3 - P2)
    ├─→ Phase 6 (US4 - P1)
    └─→ Phase 7 (US5 - P2)
    ↓
Phase 8 (Polish)
```

### User Story Dependencies

| User Story | Priority | Dependencies | Can Start After |
|-----------|----------|--------------|-----------------|
| US1 | P1 | None (except Foundational) | Phase 2 |
| US2 | P1 | US1 (节点需要有 assetInfo) | Phase 3 |
| US3 | P2 | US1, US2 (需要节点和详情面板) | Phase 4 |
| US4 | P1 | US1 (需要节点有完整数据) | Phase 3 |
| US5 | P2 | US1 (需要对话框组件) | Phase 3 |

### Within Each User Story

- 测试任务标记 [T0xx] 必须在实施任务 [T0yy] 之前编写并确保失败
- 组件创建按依赖顺序进行
- 核心实施在集成之前

### Parallel Opportunities

**Setup Phase (Phase 1)**:
```bash
# 所有任务可并行（不同目录）
T001: src/components/Dialogs/
T002: src/components/Common/
T003: src/services/
T004: src/tests/mocks/
T005: tests/e2e/
```

**Foundational Phase (Phase 2)**:
```bash
# 可并行的任务
T007: src/types/api.ts
T009: src/utils/logger.ts
T011: src/services/assetCache.ts
T012-A: 集成日志到 API 服务
T012-B: 集成日志到缓存服务
T013: src/tests/mocks/assetApiMock.ts
T014: src/tests/mocks/assetTestData.ts

# 依赖其他任务
T008 (依赖 T006)
T010 (依赖 T006)
T012 (依赖 T007)
T037-B (依赖 T010, T037)
```

**User Story 1 Tests**:
```bash
T015: E2E 测试框架
T016: 完整流程测试（依赖 T015）
```

**User Story 1 Implementation**:
```bash
# 可并行的任务
T017: VirtualScrollList.vue
T018: AssetSelectorDialog.vue (完整向导)

# T019, T020, T021, T022 可在 T018 完成后并行执行
```

**跨用户故事并行**:
- US2 和 US4 可以在 US1 完成后并行开始
- US3 和 US5 可以在 US1/US2 完成后并行开始

---

## Parallel Example: User Story 1

```bash
# 同时启动所有测试任务：
Task T015: "创建 E2E 测试框架 tests/e2e/asset-selection.spec.ts"
Task T016: "编写完整流程测试用例"

# 同时启动独立组件：
Task T017: "创建虚拟滚动列表组件"
Task T018: "创建完整对话框组件"

# 然后并行执行集成任务：
Task T019: "修改 FlowCanvas.vue 触发对话框"
Task T020: "实现取消删除逻辑"
Task T021: "修改节点显示状态"
Task T022: "实现数据保存逻辑"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（关键 - 阻塞所有故事）
3. 完成 Phase 3: User Story 1
4. **停止并验证**: 独立测试 User Story 1
5. 完成 Phase 4: User Story 2
6. **停止并验证**: 独立测试 User Story 2
7. 完成 Phase 6: User Story 4
8. **停止并验证**: 测试导出/导入流程
9. 如果就绪，部署/演示 MVP

### Incremental Delivery

1. 完成 Setup + Foundational → 基础就绪
2. 添加 US1 → 独立测试 → 核心配置功能可用
3. 添加 US2 → 独立测试 → 详情查看可用
4. 添加 US4 → 独立测试 → 导出/导入可用（MVP 完成！）
5. 添加 US3 → 独立测试 → 编辑功能可用
6. 添加 US5 → 独立测试 → 搜索功能可用
7. 添加 Polish → 最终完善

### Parallel Team Strategy

多个开发者并行工作：

1. 团队一起完成 Setup + Foundational
2. Foundational 完成后：
   - 开发者 A: User Story 1 (T015-T022)
   - 开发者 B: User Story 2 (T023-T027)
   - 开发者 C: User Story 4 (T035-T041)
3. 故事独立完成和集成
4. 第二轮：
   - 开发者 A: User Story 3 (T028-T031)
   - 开发者 B: User Story 5 (T039-T043)
5. 全员参与 Polish

---

## Task Summary

| Phase | Description | Task Count | Parallel Opportunities |
|-------|-------------|------------|------------------------|
| Phase 1 | Setup | 5 | 5 个任务全部可并行 |
| Phase 2 | Foundational | 11 | 7 个任务可并行 |
| Phase 3 | User Story 1 (P1) | 8 | 4 个任务可并行 |
| Phase 4 | User Story 2 (P1) | 5 | 2 个任务可并行 |
| Phase 5 | User Story 3 (P2) | 4 | 2 个任务可并行 |
| Phase 6 | User Story 4 (P1) | 7 | 4 个任务可并行 |
| Phase 7 | User Story 5 (P2) | 5 | 3 个任务可并行 |
| Phase 8 | Polish | 8 | 4 个任务可并行 |
| **Total** | **All Phases** | **53** | **31 个可并行任务** |

### User Story Task Distribution

| User Story | Priority | Task Count | Test Tasks | Implementation Tasks |
|-----------|----------|------------|------------|---------------------|
| US1 | P1 | 8 | 2 | 6 |
| US2 | P1 | 5 | 1 | 4 |
| US3 | P2 | 4 | 1 | 3 |
| US4 | P1 | 7 | 2 | 5 |
| US5 | P2 | 5 | 1 | 4 |

### Independent Test Criteria per Story

| User Story | Independent Test | Success Criteria |
|-----------|-----------------|------------------|
| US1 | 拖放→选择→查看→详情 | 在网络条件良好的情况下，30 秒内完成配置，节点显示资产名称 |
| US2 | 点击节点→查看详情 | 详情面板显示完整资产信息和字段列表 |
| US3 | 编辑→修改→验证 | 15 秒内完成重新配置，状态正确更新 |
| US4 | 导出→验证 JSON | JSON 包含完整 assetInfo，可导入恢复 |
| US5 | 搜索→验证过滤 | 1 秒内返回过滤结果（>20 项时） |

---

## Suggested MVP Scope

**Minimum Viable Product**: User Stories 1, 2, 4

- **US1**: 拖放节点后选择数据资产（核心配置功能）
- **US2**: 查看已配置数据源的详情（信息展示）
- **US4**: 导出包含数据资产信息的任务图（持久化）

**Total MVP Tasks**: 25 tasks (Phase 1: 5, Phase 2: 11, US1: 8, US2: 5, US4: 7, 基础 Polish: 选择性)

**Estimated MVP Workflow**:
1. Setup (T001-T005) → 30 分钟
2. Foundational (T006-T014) → 3-4 小时
3. US1 (T015-T022) → 5-6 小时
4. US2 (T023-T027) → 2-3 小时
5. US4 (T035-T041) → 3-4 小时
6. 基础 Polish (T047, T048) → 1-2 小时

**Post-MVP Enhancements**:
- US3: 编辑功能（提升用户体验）
- US5: 搜索过滤（提升大规模场景效率）

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应独立可完成和测试
- 在实施前验证测试失败
- 每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免：模糊任务、同一文件冲突、破坏独立性的跨故事依赖

---

## Format Validation

✅ **ALL tasks follow the checklist format**:
- ✅ Checkbox: `- [ ]`
- ✅ Task ID: Sequential (T001-T054)
- ✅ [P] marker: Included where applicable
- ✅ [Story] label: Included for user story phases (US1-US5)
- ✅ Description: Clear action with exact file path
- ✅ No story labels for Setup, Foundational, Polish phases

---

## 修复摘要

| 修复项 | 变更说明 |
|-------|---------|
| **任务总数** | 52 → 54 |
| **对话框任务** | T018-T021 合并为 T018（单一组件创建） |
| **日志集成** | 添加 T012-A/B（API/缓存日志）和 T037-B（导出日志） |
| **性能测试** | 添加 T052（配置流程）和 T053（搜索性能） |
| **API 接口** | 修正为 getAssetList（非 getAssetListByEnterprise），使用 POST 请求 |
| **类型名称** | GetAssetListByEnterpriseResponse → GetAssetListResponse |
| **数据结构** | 与外部 API 保持一致（itemList 字段名、isPrimaryKey 值类型） |
| **描述优化** | T017 添加性能指标，T020 明确删除逻辑，T047 明确脚本内容 |
| **需求合并** | FR-016/FR-016-1 合并，SC-007/SC-007-1 合并 |
| **性能条件** | SC-001 添加网络条件说明 |
