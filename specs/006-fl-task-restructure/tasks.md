# Tasks: 联邦学习任务重构

**Branch**: `006-fl-task-restructure`
**Generated**: 2026-03-27
**Total Tasks**: 38
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

---

## Task Overview

| ID | Task | Priority | Phase | Dependencies |
|----|------|----------|-------|--------------|
| T001 | 扩展 FLTaskExecutionType 枚举 | P0 | Setup | - |
| T002 | 添加 FLTaskSubType 接口 | P0 | Setup | T001 |
| T003 | 扩展 FLTaskParameterTemplate 接口 | P0 | Setup | T001 |
| T004 | 添加 FL_EXECUTION_TYPE_CONSTRAINTS 常量 | P0 | Setup | T001 |
| T005 | 类型系统构建验证 | P0 | Setup | T002-T004 |
| T006 | [US1] 数据清洗任务模板 | P1 | US1 | T005 |
| T007 | [US1] 特征编码任务模板 | P1 | US1 | T005 |
| T008 | [US1] 特征变换任务模板 | P1 | US1 | T005 |
| T009 | [US1] 特征缩放任务模板 | P1 | US1 | T005 |
| T010 | [US2] 特征分箱任务模板 | P1 | US2 | T005 |
| T011 | [US2] 特征选择任务模板 | P1 | US2 | T005 |
| T012 | [US2] 特征相关性分析模板 | P1 | US2 | T005 |
| T013 | [US5] 数据采样任务模板 | P1 | US5 | T005 |
| T014 | [US3] 横向逻辑回归模板 | P1 | US3 | T005 |
| T015 | [US3] 横向神经网络模板 | P1 | US3 | T005 |
| T016 | [US3] 横向XGBoost模板 | P1 | US3 | T005 |
| T017 | [US3] 横向KMeans模板 | P1 | US3 | T005 |
| T018 | [US3] 横向KNN模板 | P1 | US3 | T005 |
| T019 | [US4] 纵向逻辑回归(SS-LR)模板 | P2 | US4 | T005 |
| T020 | [US4] 纵向线性回归模板 | P2 | US4 | T005 |
| T021 | [US4] 纵向神经网络模板 | P2 | US4 | T005 |
| T022 | [US4] 纵向XGBoost(SecureBoost)模板 | P2 | US4 | T005 |
| T023 | [US4] 纵向DeepFM模板 | P2 | US4 | T005 |
| T024 | [US4] 纵向KMeans模板 | P2 | US4 | T005 |
| T025 | [US4] 纵向朴素贝叶斯模板 | P2 | US4 | T005 |
| T026 | 重构菜单配置文件 | P1 | UI | T006-T025 |
| T027 | [US1-US4] 子类型选择器组件 | P1 | UI | T026 |
| T028 | [US1-US4] 参数动态更新逻辑 | P1 | UI | T027 |
| T029 | [US1-US4] 输出按钮显示控制 | P1 | UI | T027 |
| T030 | [US5] 动态任务类型判定函数 | P2 | US5 | T029 |
| T031 | [US5] 连接约束验证逻辑 | P2 | US5 | T030 |
| T032 | [US5] Toast提示组件集成 | P2 | US5 | T031 |
| T033 | [US5] 连接数量变化监听 | P2 | US5 | T031 |
| T034 | [US1-US5] E2E菜单结构测试 | P2 | E2E | T033 |
| T035 | [US1-US5] E2E子类型选择测试 | P2 | E2E | T034 |
| T036 | [US1-US5] E2E连接约束测试 | P2 | E2E | T035 |
| T037 | [US1-US5] E2E动态任务测试 | P2 | E2E | T036 |
| T038 | [US1-US5] E2E输出按钮测试 | P2 | E2E | T037 |

---

## Phase 1: Setup (类型系统扩展)

**Purpose**: 扩展 TypeScript 类型定义，为所有用户故事提供基础设施

**⚠️ CRITICAL**: 此阶段必须完成，否则所有后续任务无法开始

**Duration**: ~2h

### Tasks

- [x] T001 [P] 添加 `FLTaskExecutionType` 枚举 (LOCAL/DYNAMIC/MULTI_PARTY) 到 `src/types/fl-tasks.ts`
- [x] T002 [P] 添加 `FLTaskSubType` 接口 (value, label, description, parameters) 到 `src/types/fl-tasks.ts`
- [x] T003 [P] 扩展 `FLTaskParameterTemplate` 接口添加 executionType 和 subTypes 字段到 `src/types/fl-tasks.ts`
- [x] T004 [P] 添加 `FL_EXECUTION_TYPE_CONSTRAINTS` 常量定义各执行类型的连接约束到 `src/types/fl-tasks.ts`
- [x] T005 运行 `npm run build` 验证类型系统扩展无错误

**Checkpoint**: 类型检查通过，可开始模板实现

---

## Phase 2: User Story 1 - 数据清洗任务配置 (Priority: P1) 🎯 MVP

**Goal**: 用户可配置数据清洗任务处理缺失值、异常值等问题

**Independent Test**:
1. 拖拽数据清洗任务到画布
2. 选择"缺失值处理"子类型
3. 配置参数
4. 验证只能连接1个数据源

**Execution Type**: LOCAL (单方本地任务)

**Duration**: ~1.5h

### Tasks

- [x] T006 [P] [US1] 创建数据清洗任务模板 (5种子类型) 到 `src/utils/mock-fl-data.ts`
  - 缺失值处理: strategy, fillValue, columns
  - 异常值处理: method, action, threshold, columns
  - 样本去重: subset, keep
  - 类型转换: column, targetType, format
  - 格式标准化: columns, trimWhitespace, lowercase, uppercase
  - executionType = LOCAL

- [x] T007 [P] [US1] 创建特征编码任务模板 (2种子类型) 到 `src/utils/mock-fl-data.ts`
  - 独热编码: columns, dropFirst, handleUnknown
  - 标签编码: columns, handleUnknown
  - executionType = LOCAL

- [x] T008 [P] [US1] 创建特征变换任务模板 (2种子类型) 到 `src/utils/mock-fl-data.ts`
  - 对数变换: columns, base, offset
  - 幂变换: columns, exponent, boxCox
  - executionType = LOCAL

- [x] T009 [P] [US1] 创建特征缩放任务模板 (2种子类型) 到 `src/utils/mock-fl-data.ts`
  - 归一化(MinMax): columns, minRange, maxRange
  - 标准化(Z-Score): columns, withMean, withStd
  - executionType = LOCAL

**Checkpoint**: US1 的 4 种 LOCAL 任务模板可独立测试

---

## Phase 3: User Story 2 - 特征分箱任务配置 (Priority: P1)

**Goal**: 用户可配置特征分箱任务，支持 WOE/IV 输出

**Independent Test**:
1. 拖拽特征分箱任务
2. 选择"等频分箱(输出WOE/IV)"子类型
3. 配置分箱数量
4. 验证单连接=LOCAL，多连接=MULTI_PARTY

**Execution Type**: DYNAMIC (动态任务)

**Duration**: ~1h

### Tasks

- [x] T010 [P] [US2] 创建特征分箱任务模板 (2种子类型) 到 `src/utils/mock-fl-data.ts`
  - 等频分箱(输出WOE/IV): nBins, columns, outputWOE, outputIV, labelColumn
  - 等宽分箱(输出WOE/IV): nBins, columns, outputWOE, outputIV, labelColumn
  - executionType = DYNAMIC

- [x] T011 [P] [US2] 创建特征选择任务模板 (3种子类型) 到 `src/utils/mock-fl-data.ts`
  - 基于阈值(iv): threshold, labelColumn
  - topK(iv): k, labelColumn
  - topPercentile(iv): percentile, labelColumn
  - executionType = DYNAMIC

- [x] T012 [P] [US2] 创建特征相关性分析模板 (2种子类型) 到 `src/utils/mock-fl-data.ts`
  - 皮尔逊相关系数: columns, threshold
  - 方差膨胀因子(VIF): columns, threshold
  - executionType = DYNAMIC

**Checkpoint**: US2 的 3 种 DYNAMIC 任务模板可独立测试

---

## Phase 4: User Story 5 - 动态任务类型切换 (Priority: P1)

**Goal**: 动态任务根据连接数量自动切换为单方本地或多方隐私模式

**Independent Test**:
1. 拖拽数据采样任务
2. 连接1个数据源 → 验证无"添加输出"按钮
3. 连接2个数据源 → 验证显示"添加输出"按钮

**Execution Type**: DYNAMIC (动态任务)

**Duration**: ~1h

### Tasks

- [x] T013 [P] [US5] 创建数据采样任务模板 (5种子类型) 到 `src/utils/mock-fl-data.ts`
  - 随机采样: ratio, randomState
  - 分层采样: stratifyColumn, ratio, randomState
  - 按比例采样: ratio
  - 按数量采样: count, randomState
  - 上采样: targetColumn, method, ratio
  - executionType = DYNAMIC, joinTypesAllowed = ['INNER']

**Checkpoint**: US5 的数据采样模板可独立测试

---

## Phase 5: User Story 3 - 横向逻辑回归模型训练 (Priority: P1)

**Goal**: 用户可配置横向联邦逻辑回归模型进行联合训练

**Independent Test**:
1. 拖拽横向逻辑回归任务
2. 配置学习率和迭代次数
3. 验证必须连接2+数据源
4. 点击"添加输出"选择模型输出方

**Execution Type**: MULTI_PARTY (多方隐私任务)

**Duration**: ~2h

### Tasks

- [x] T014 [P] [US3] 创建横向逻辑回归模板 (7个参数) 到 `src/utils/mock-fl-data.ts`
  - learningRate, iterations, batchSize, regularization, regParam, earlyStop, tolerance
  - executionType = MULTI_PARTY

- [x] T015 [P] [US3] 创建横向神经网络模板 (7个参数) 到 `src/utils/mock-fl-data.ts`
  - hiddenLayers, activation, learningRate, epochs, batchSize, optimizer, dropout
  - executionType = MULTI_PARTY

- [x] T016 [P] [US3] 创建横向XGBoost模板 (8个参数) 到 `src/utils/mock-fl-data.ts`
  - numTrees, maxDepth, learningRate, minChildWeight, subsample, colSampleByTree, lambda, alpha
  - executionType = MULTI_PARTY

- [x] T017 [P] [US3] 创建横向KMeans模板 (5个参数) 到 `src/utils/mock-fl-data.ts`
  - nClusters, maxIterations, tol, initMethod, nInit
  - executionType = MULTI_PARTY

- [x] T018 [P] [US3] 创建横向KNN模板 (5个参数) 到 `src/utils/mock-fl-data.ts`
  - nNeighbors, weights, algorithm, metric, p
  - executionType = MULTI_PARTY

**Checkpoint**: US3 的 5 种横向模型模板可独立测试

---

## Phase 6: User Story 4 - 纵向SecureBoost模型训练 (Priority: P2)

**Goal**: 用户可配置纵向联邦模型进行联合训练

**Independent Test**:
1. 拖拽纵向XGBoost任务
2. 配置树数量、最大深度、安全方法
3. 验证必须连接2+数据源
4. 点击"添加输出"选择模型输出方

**Execution Type**: MULTI_PARTY (多方隐私任务)

**Duration**: ~2h

### Tasks

- [x] T019 [P] [US4] 创建纵向逻辑回归(SS-LR)模板 (5个参数) 到 `src/utils/mock-fl-data.ts`
  - learningRate, iterations, batchSize, encryptionMethod, earlyStop
  - executionType = MULTI_PARTY

- [x] T020 [P] [US4] 创建纵向线性回归模板 (5个参数) 到 `src/utils/mock-fl-data.ts`
  - learningRate, iterations, batchSize, regularization, regParam
  - executionType = MULTI_PARTY

- [x] T021 [P] [US4] 创建纵向神经网络模板 (6个参数) 到 `src/utils/mock-fl-data.ts`
  - splitPoint, hiddenLayers, learningRate, epochs, batchSize, gradientCompression
  - executionType = MULTI_PARTY

- [x] T022 [P] [US4] 创建纵向XGBoost(SecureBoost)模板 (6个参数) 到 `src/utils/mock-fl-data.ts`
  - numTrees, maxDepth, learningRate, secureMethod, minSampleSplit, subsample
  - executionType = MULTI_PARTY

- [x] T023 [P] [US4] 创建纵向DeepFM模板 (6个参数) 到 `src/utils/mock-fl-data.ts`
  - embeddingSize, hiddenLayers, learningRate, epochs, batchSize, dropout
  - executionType = MULTI_PARTY

- [x] T024 [P] [US4] 创建纵向KMeans模板 (4个参数) 到 `src/utils/mock-fl-data.ts`
  - nClusters, maxIterations, tol, secureMethod
  - executionType = MULTI_PARTY

- [x] T025 [P] [US4] 创建纵向朴素贝叶斯模板 (3个参数) 到 `src/utils/mock-fl-data.ts`
  - alpha, fitPrior, classPrior
  - executionType = MULTI_PARTY

**Checkpoint**: US4 的 7 种纵向模型模板可独立测试

---

## Phase 7: UI 组件更新

**Purpose**: 更新 UI 组件支持子类型选择、动态参数和连接约束

**Duration**: ~4h

### Tasks

- [x] T026 重构菜单配置 `src/utils/fl-task-templates.ts` 支持 4 类二级菜单 (预处理、特征工程、横向模型、纵向模型) 和 20+ 任务

- [x] T027 [US1-US4] 添加子类型选择器到 `src/components/Modals/FLTaskConfig.vue`
  - 子类型下拉选择器
  - 子类型选择后锁定不可切换
  - 无子类型任务直接显示参数

- [x] T028 [US1-US4] 实现参数动态更新逻辑到 `src/components/Modals/FLTaskConfig.vue`
  - 子类型切换时参数列表动态更新
  - 参数验证错误实时内联显示
  - 必填验证和范围验证

- [x] T029 [US1-US4] 实现输出按钮显示控制到 `src/components/Nodes/FLTaskNode.vue`
  - LOCAL: 隐藏"添加输出"按钮
  - MULTI_PARTY: 显示"添加输出"按钮
  - DYNAMIC: 根据连接数量动态显示

**Checkpoint**: UI 组件支持所有用户故事

---

## Phase 8: User Story 5 实现 - 动态任务类型切换

**Purpose**: 实现动态任务的连接约束和类型切换逻辑

**Duration**: ~2h

### Tasks

- [x] T030 [US5] 创建 `determineDynamicExecutionType()` 函数到 `src/utils/fl-task-utils.ts`
  - 输入: node, connections
  - 逻辑: 1连接=LOCAL, 2+连接=MULTI_PARTY
  - 返回: FLTaskExecutionType

- [x] T031 [US5] 实现连接约束验证逻辑到 `src/components/Flow/FlowCanvas.vue`
  - LOCAL: 限制只能连接1个数据源，超出时阻止并提示
  - MULTI_PARTY: 必须连接2+数据源
  - DYNAMIC: 根据连接数量动态调整约束
  - 连接从多变少时自动清除输出配置

- [x] T032 [US5] 集成 Toast 提示到 `src/components/Flow/FlowCanvas.vue`
  - 连接约束违反时显示 Toast
  - 提示内容: "该任务只能连接X个数据源"
  - 输出配置清除时提示: "连接数减少，已清除输出配置"

- [x] T033 [US5] 实现连接数量变化监听到 `src/components/Flow/FlowCanvas.vue`
  - 监听 onConnect 和 onEdgesChange 事件
  - 动态任务类型变化时更新节点状态
  - 触发 UI 重渲染

**Checkpoint**: US5 动态任务类型切换完整实现

---

## Phase 9: E2E 测试

**Purpose**: Playwright E2E 测试覆盖关键用户流程

**Duration**: ~2h

### Tasks

- [x] T034 [US1-US5] 创建 E2E 测试文件并实现菜单结构测试到 `e2e/14-fl-task-restructure.spec.ts`
  - 验证 4 类二级菜单显示正确
  - 验证训练/推断 Tab 页切换

- [x] T035 [US1-US5] 实现子类型选择测试到 `e2e/14-fl-task-restructure.spec.ts`
  - 子类型选择和参数动态更新
  - 子类型选择后锁定验证
  - 参数验证错误提示

- [x] T036 [US1-US5] 实现连接约束测试到 `e2e/14-fl-task-restructure.spec.ts`
  - 单方任务连接约束 (只能连接1个数据源)
  - 多方任务连接约束 (必须连接2+数据源)
  - 连接约束违反 Toast 提示

- [x] T037 [US1-US5] 实现动态任务测试到 `e2e/14-fl-task-restructure.spec.ts`
  - 连接数量变化时类型自动切换
  - 推断任务模型选择
  - 连接从多变少时输出配置清除

- [x] T038 [US1-US5] 实现输出按钮测试到 `e2e/14-fl-task-restructure.spec.ts`
  - 根据 executionType 正确显示/隐藏
  - 动态任务输出按钮动态显示

**Checkpoint**: 所有 E2E 测试通过 (18/18)

---

## Dependencies & Execution Order

### Phase Dependencies Graph

```
Phase 1 (Setup: T001-T005)
    │
    ▼
┌───┴───────────────────────────────────────────────────────────────┐
│  Phase 2-6 (Templates: T006-T025) - ALL PARALLEL                  │
│  ├── Phase 2 [US1]: T006-T009 (LOCAL tasks)                       │
│  ├── Phase 3 [US2]: T010-T012 (DYNAMIC tasks)                     │
│  ├── Phase 4 [US5]: T013 (DYNAMIC tasks)                          │
│  ├── Phase 5 [US3]: T014-T018 (MULTI_PARTY horizontal models)     │
│  └── Phase 6 [US4]: T019-T025 (MULTI_PARTY vertical models)       │
└───────────────────────────────────────────────────────────────────┘
    │
    ▼
Phase 7 (UI: T026-T029)
    │
    ▼
Phase 8 (US5 Logic: T030-T033)
    │
    ▼
Phase 9 (E2E: T034-T038)
```

### Critical Path

```
T001-T005 → T006-T025 → T026-T029 → T030-T033 → T034-T038
   Setup      Templates      UI         US5         E2E
```

**Estimated Total Time**: ~14h

---

## Parallel Opportunities

### Phase 1 并行 (4 tasks)

```bash
T001: FLTaskExecutionType 枚举
T002: FLTaskSubType 接口
T003: FLTaskParameterTemplate 扩展
T004: FL_EXECUTION_TYPE_CONSTRAINTS 常量
# → 然后 T005 构建验证
```

### Phase 2-6 模板并行 (20 tasks)

```bash
# 所有任务模板可同时开发（同一文件不同区域）
T006-T009:   [US1] LOCAL 任务 (4个)
T010-T012:   [US2] DYNAMIC 特征任务 (3个)
T013:        [US5] DYNAMIC 采样任务 (1个)
T014-T018:   [US3] 横向模型 (5个)
T019-T025:   [US4] 纵向模型 (7个)
```

### Phase 9 测试并行 (5 tasks)

```bash
# 不同测试用例可并行编写
T034-T038: 5 个测试场景
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

```
1. Phase 1: Setup (T001-T005)           → 类型系统就绪
2. Phase 2: US1 模板 (T006-T009)        → 数据清洗可用
3. Phase 7: UI 部分 (T026-T029)         → 子类型选择可用
4. STOP & VALIDATE: 测试数据清洗完整流程
```

**MVP Scope**: T001-T009 + T026-T029 = **13 tasks**

### Incremental Delivery

```
Sprint 1: Setup + US1 → 数据清洗任务可用
Sprint 2: US2 + US5 → 特征工程和动态任务可用
Sprint 3: US3 + US4 → 所有模型可用
Sprint 4: E2E → 质量保证完成
```

### Team Parallel Strategy

```
After Phase 1 (Setup):
├── Developer A: US1 模板 (T006-T009)
├── Developer B: US2+US5 模板 (T010-T013)
├── Developer C: US3 模板 (T014-T018)
└── Developer D: US4 模板 (T019-T025)
```

---

## Notes

- **[P]** 标记的任务可并行执行（不同文件或不同代码区域）
- **[US#]** 标记任务所属用户故事，便于追踪和独立测试
- 每个用户故事应可独立完成和测试
- 每完成一个阶段后验证类型检查 (`npm run build`)
- 停在任何检查点验证当前功能
- 模板任务参数定义参考 `spec.md` Appendix A-D
