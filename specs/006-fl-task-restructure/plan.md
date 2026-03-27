# Implementation Plan: 联邦学习任务重构

**Branch**: `006-fl-task-restructure` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-fl-task-restructure/spec.md`

## Summary

重构联邦学习任务的菜单结构和任务配置系统，支持 4 类二级菜单（预处理、特征工程、横向模型、纵向模型）和 20+ 种具体任务，引入三种任务执行类型（单方本地、动态、多方隐私）的差异化输入输出逻辑。技术方案基于 Vue 3 + TypeScript + @vue-flow/core，复用现有组件架构。

## Technical Context

**Language/Version**: TypeScript 5.9.3
**Primary Dependencies**: Vue 3.5.24, @vue-flow/core 1.48.1, Vite 7.2.4, SCSS 1.97.2
**Storage**: 内存存储（Map 缓存）+ JSON 文件导入导出
**Testing**: Playwright 1.57.0, vue-tsc 类型检查
**Target Platform**: Web 浏览器（现代浏览器）
**Project Type**: web-app（前端可视化编辑器）
**Performance Goals**: 30秒内找到任务，2分钟内完成配置
**Constraints**: 前端自治（Mock 优先），类型安全（无 any）
**Scale/Scope**: 20+ 任务类型，4 类菜单，3 种执行类型

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. Visual-First Design | ✅ Pass | 子类型选择在配置弹窗中完成，参数配置提供可视化界面 |
| II. 前端自治原则 | ✅ Pass | 所有任务模板数据使用 Mock，无需后端依赖 |
| III. 标准化输出 | ✅ Pass | DAG 输出符合现有 JSON Schema，扩展类型定义 |
| IV. 组件化架构 | ✅ Pass | 复用 FLTaskConfig.vue, ParameterInput.vue 等组件 |
| V. 类型安全 | ✅ Pass | 新增 FLTaskExecutionType 枚举，扩展接口定义 |

**Gate Result**: ✅ PASS - 所有原则满足，可继续进行

## Project Structure

### Documentation (this feature)

```text
specs/006-fl-task-restructure/
├── spec.md              # 功能规格文件
├── plan.md              # 本文件
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
├── contracts/           # Phase 1 输出
│   └── fl-task-api.md   # 任务模板 API 约束
└── checklists/
    └── requirements.md  # 规格质量检查清单
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── fl-tasks.ts           # FL 任务类型定义（扩展）
│   └── nodes.ts              # 节点类型定义（扩展）
├── utils/
│   ├── mock-fl-data.ts       # 任务模板 Mock 数据（重构）
│   ├── fl-task-templates.ts  # 菜单配置（重构）
│   └── fl-task-utils.ts      # 任务工具函数（新增）
├── components/
│   ├── Modals/
│   │   ├── FLTaskConfig.vue  # 任务配置弹窗（修改）
│   │   └── ParameterInput.vue # 参数输入组件（复用）
│   ├── Nodes/
│   │   └── FLTaskNode.vue    # FL 任务节点（修改）
│   └── Flow/
│       └── FlowCanvas.vue    # 画布逻辑（修改）
└── views/
    └── FlowEditor.vue        # 编辑器入口（复用）

tests/
├── e2e/
│   └── fl-task-config.spec.ts # E2E 测试（新增）
└── mocks/
    └── fl-task-mocks.ts       # Mock 数据（扩展）
```

**Structure Decision**: 采用单项目结构（Option 1），符合现有代码组织方式

## Complexity Tracking

> 无宪法违规，此部分为空

## Implementation Phases

### Phase 1: 执行类型系统扩展 (Est. 2h)

**文件**: `src/types/fl-tasks.ts`

1. 添加 `FLTaskExecutionType` 枚举：
```typescript
export enum FLTaskExecutionType {
  LOCAL = 'local',           // 单方本地任务
  DYNAMIC = 'dynamic',       // 动态任务
  MULTI_PARTY = 'multi_party' // 多方隐私任务
}
```

2. 扩展 `FLTaskParameterTemplate` 接口：
```typescript
export interface FLTaskParameterTemplate {
  taskName: string
  displayName: string
  category: FLTaskCategory
  mode: FLMode
  icon: string
  description?: string
  executionType: FLTaskExecutionType  // 新增
  subTypes?: FLTaskSubType[]          // 新增
  parameters: FLTaskParameterDef[]
}

export interface FLTaskSubType {
  value: string
  label: string
  parameters: FLTaskParameterDef[]
}
```

3. 更新 `FL_TASK_CONSTRAINTS` 支持动态任务

### Phase 2: 任务模板重构 (Est. 4h)

**文件**: `src/utils/mock-fl-data.ts`

1. 重写 `PREPROCESS_TEMPLATES`:
   - `data_cleaning`: 5 种子类型
   - `data_sampling`: 5 种子类型

2. 重写 `FEATURE_ENGINEERING_TEMPLATES`:
   - `feature_binning`: 2 种子类型
   - `feature_encoding`: 2 种子类型
   - `feature_transform`: 2 种子类型
   - `feature_selection`: 3 种子类型
   - `feature_scaling`: 2 种子类型
   - `feature_correlation`: 2 种子类型

3. 重写 `HORIZONTAL_MODEL_TEMPLATES`: 5 个模型

4. 重写 `VERTICAL_MODEL_TEMPLATES`: 7 个模型

### Phase 3: UI 组件更新 (Est. 4h)

**文件**: `src/components/Modals/FLTaskConfig.vue`

1. 添加子类型选择 UI
2. 子类型切换时动态更新参数列表
3. 根据 executionType 显示/隐藏"添加输出"按钮

**文件**: `src/components/Nodes/FLTaskNode.vue`

1. 根据 executionType 控制"添加输出"按钮显示
2. 动态任务根据连接数量更新按钮状态

**文件**: `src/components/Flow/FlowCanvas.vue`

1. 实现连接约束验证（阻止非法连接）
2. 动态任务类型判断逻辑
3. 连接数量变化时更新任务状态

### Phase 4: 连接约束实现 (Est. 2h)

1. 单方本地任务：限制只能连接 1 个数据源
2. 动态任务：根据连接数量动态调整约束
3. 多方隐私任务：必须连接 2+ 数据源

### Phase 5: 测试覆盖 (Est. 2h)

**文件**: `tests/e2e/fl-task-config.spec.ts`

1. 菜单结构测试
2. 子类型选择测试
3. 参数配置测试
4. 连接约束测试
5. 动态任务类型切换测试

## Verification

### 功能测试

1. 验证菜单结构正确显示 4 类二级菜单
2. 验证各任务子类型选择和参数配置
3. 验证连接约束（单方/多方）
4. 验证"添加输出"按钮显示/隐藏逻辑
5. 验证动态任务类型自动切换

### E2E 测试

```bash
npx playwright test tests/e2e/fl-task-config.spec.ts
```

### 类型检查

```bash
npm run build
```

## Dependencies

| 依赖 | 用途 | 状态 |
|------|------|------|
| FLTaskConfig.vue | 任务配置弹窗框架 | 现有 |
| ParameterInput.vue | 参数输入组件 | 现有 |
| FlowCanvas.vue | 连接验证逻辑 | 现有 |
| @vue-flow/core | 节点拖拽和连接 | 现有 |

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 参数定义遗漏 | 中 | 基于业界标准框架（FATE、PySyft）完善参数 |
| 动态任务边界情况 | 中 | 详细测试用例覆盖各种连接场景 |
| 向后兼容性 | 低 | 保留旧模板结构，新字段可选 |
