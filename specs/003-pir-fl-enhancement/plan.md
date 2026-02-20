# Implementation Plan: 隐匿查询功能完善与联邦学习任务上线

**Branch**: `003-pir-fl-enhancement` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-pir-fl-enhancement/spec.md`

## Summary

本功能包含两大模块：
1. **隐匿查询(PIR)功能完善**：支持实时数据源配置，PIR输出可作为下游PIR的输入实现链式调用
2. **联邦学习任务上线**：实现联邦学习训练/推断任务的完整编排能力，包括预处理、特征工程、横向/纵向模型

技术方案基于现有Vue 3 + TypeScript + @vue-flow/core架构，复用现有的节点类型系统、拖拽交互和参数配置模式。

## Technical Context

**Language/Version**: TypeScript 5.9.3 + Vue 3.5.24
**Primary Dependencies**: @vue-flow/core 1.48.1, Vite 7.2.4, SCSS 1.97.2
**Storage**: 内存存储（Map缓存）+ JSON文件导入导出
**Testing**: Playwright 1.57.0
**Target Platform**: Web (Chrome/Firefox/Safari)
**Project Type**: Single web application
**Performance Goals**: 菜单响应<100ms, 参数弹窗<200ms, 列表加载<2s
**Constraints**: 前端自治（Mock优先），类型安全（无any）
**Scale/Scope**: 新增1个数据源类型，2个菜单分区，约15个联邦学习任务节点

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Visual-First Design** | ✅ PASS | 所有新功能均为可视化交互（拖拽、连线、弹窗配置） |
| **II. 前端自治原则** | ✅ PASS | 已部署模型列表、参数模板API均有Mock实现计划 |
| **III. 标准化输出** | ✅ PASS | DAG输出JSON格式保持兼容，新增字段有类型定义 |
| **IV. 组件化架构** | ✅ PASS | 复用现有节点组件模式，新建FL任务专用组件 |
| **V. 类型安全** | ✅ PASS | 所有新类型已在spec.md定义TypeScript接口 |

**Gate Result**: ✅ ALL PASS - 可以继续Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-pir-fl-enhancement/
├── spec.md              # 功能规格说明
├── plan.md              # 本文件
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
├── contracts/           # Phase 1 输出 (API契约)
└── tasks.md             # Phase 2 输出
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Flow/
│   │   └── FlowSidebar.vue          # 修改: 添加联邦学习训练/推断菜单
│   ├── Nodes/
│   │   ├── DataSourceNode.vue       # 修改: 区分实时数据源展示
│   │   ├── PIRTaskNode.vue          # 新建: PIR专用节点组件
│   │   ├── FLPreprocessNode.vue     # 新建: 联邦学习预处理节点
│   │   ├── FLFeatureNode.vue        # 新建: 联邦学习特征工程节点
│   │   ├── FLModelNode.vue          # 新建: 联邦学习模型训练节点
│   │   └── FLInferenceNode.vue      # 新建: 联邦学习推断节点
│   └── Modals/
│       ├── FLTaskConfig.vue         # 新建: 联邦学习任务参数配置弹窗
│       ├── RealtimeDataSourceConfig.vue  # 新建: 实时数据源配置弹窗
│       └── DeployedModelSelector.vue     # 新建: 已部署模型选择器
├── types/
│   ├── nodes.ts                     # 修改: 添加新类型定义
│   └── fl-tasks.ts                  # 新建: 联邦学习任务类型
├── utils/
│   ├── node-templates.ts            # 修改: 添加FL任务模板
│   ├── fl-task-templates.ts         # 新建: FL任务详细模板
│   ├── connection-validator.ts      # 修改: PIR连接限制
│   └── mock-data.ts                 # 修改: 添加Mock数据
└── assets/styles/
    └── variables.scss               # 修改: 添加FL任务颜色变量

tests/
├── e2e/
│   ├── pir-realtime-datasource.spec.ts  # 新建: PIR实时数据源测试
│   └── fl-task-workflow.spec.ts         # 新建: 联邦学习任务测试
└── mocks/
    └── fl-mock-data.ts              # 新建: 联邦学习Mock数据
```

**Structure Decision**: 采用单项目结构，复用现有组件架构模式。新增节点组件遵循现有DataSourceNode/ComputeTaskNode的设计模式。

## Complexity Tracking

> 无宪章违规需要记录

## Implementation Phases

### Phase 1: PIR实时数据源支持

**目标**: 实现PIR任务的实时数据源配置和链式调用

**关键文件**:
- `src/types/nodes.ts`: 添加 `RealtimeDataSourceInfo` 类型
- `src/components/Modals/RealtimeDataSourceConfig.vue`: 实时数据源配置弹窗
- `src/components/Nodes/PIRTaskNode.vue`: PIR专用节点
- `src/utils/connection-validator.ts`: 添加PIR输出连接限制

**验收标准**:
- [ ] PIR任务可配置预加载数据源和实时数据源
- [ ] 实时数据源支持连线导入和手工录入两种方式
- [ ] PIR输出节点以实时数据源样式展示
- [ ] PIR输出只能连接到PIR任务

### Phase 2: 联邦学习菜单改造

**目标**: 实现联邦学习训练/推断的三级菜单展开

**关键文件**:
- `src/components/Flow/FlowSidebar.vue`: 重构菜单组件
- `src/utils/fl-task-templates.ts`: FL任务模板定义
- `src/assets/styles/variables.scss`: FL任务颜色

**验收标准**:
- [ ] "联邦学习"改名为"联邦学习训练"
- [ ] 悬停展开四个任务类型
- [ ] 悬停类型展开具体任务列表
- [ ] 拖拽具体任务到画布触发配置弹窗

### Phase 3: 联邦学习任务节点

**目标**: 实现四类联邦学习任务节点

**关键文件**:
- `src/components/Nodes/FLPreprocessNode.vue`: 预处理节点
- `src/components/Nodes/FLFeatureNode.vue`: 特征工程节点
- `src/components/Nodes/FLModelNode.vue`: 模型训练节点
- `src/components/Nodes/FLInferenceNode.vue`: 推断节点
- `src/components/Modals/FLTaskConfig.vue`: 参数配置弹窗

**验收标准**:
- [ ] 预处理节点只能接入一个数据源，无输出节点
- [ ] 特征工程节点支持多方多数据源，有输出节点
- [ ] 模型节点显示训练参数配置
- [ ] 推断节点支持已部署模型选择

### Phase 4: Mock数据和测试

**目标**: 确保前端自治和测试覆盖

**关键文件**:
- `src/utils/mock-data.ts`: 添加已部署模型Mock
- `tests/e2e/pir-realtime-datasource.spec.ts`
- `tests/e2e/fl-task-workflow.spec.ts`

**验收标准**:
- [ ] 已部署模型列表有Mock数据
- [ ] FL任务参数模板有Mock数据
- [ ] E2E测试覆盖主要用户流程

## Verification

### 开发验证
```bash
# 1. 启动开发服务器
npm run dev

# 2. 验证PIR实时数据源
# - 拖拽PIR任务到画布
# - 配置实时数据源（手工录入字段）
# - 创建第二个PIR任务，连接第一个PIR的输出

# 3. 验证联邦学习菜单
# - 悬停"联邦学习训练"
# - 悬停"横向模型"
# - 拖拽"逻辑回归"到画布
# - 填写参数配置弹窗
```

### 测试验证
```bash
# 运行E2E测试
npx playwright test

# 类型检查
npm run build
```

### 功能验收
| 需求ID | 验收场景 | 验证方法 |
|--------|---------|---------|
| FR-001~007 | PIR实时数据源 | 手动测试 + E2E |
| FR-008~012 | 联邦学习菜单 | 手动测试 |
| FR-013~016 | 预处理任务 | 手动测试 + E2E |
| FR-017~020 | 特征工程任务 | 手动测试 |
| FR-021~025 | 模型任务 | 手动测试 |
| FR-026~029 | 推断任务 | 手动测试 |
