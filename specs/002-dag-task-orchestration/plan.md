# Implementation Plan: DAG隐私计算任务编排系统

**Branch**: `002-dag-task-orchestration` | **Date**: 2026-01-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-dag-task-orchestration/spec.md`

## Summary

实现DAG隐私计算任务编排系统，支持拖拽创建计算任务节点（PSI/PIR/MPC），配置输入数据、计算模型、算力资源和输出数据。系统需要将编排结果导出为标准JSON格式，支持实时预览。核心挑战包括节点间连线配置、字段映射、模型参数编排、以及DAG到JSON的转换逻辑。

## Technical Context

**Language/Version**: TypeScript 5.9.3 + Vue 3.5.24
**Primary Dependencies**: @vue-flow/core 1.48.1, Vite 7.2.4, Monaco Editor
**Storage**: 内存存储（刷新后数据丢失）+ 手动JSON导出
**Testing**: Playwright 1.57.0 + vue-tsc
**Target Platform**: 现代浏览器（Chrome、Firefox、Edge）
**Project Type**: 单页Web应用（Vue 3前端）
**Performance Goals**: 30秒完成配置、500ms JSON预览响应、支持20个节点
**Constraints**: 不超过50个节点、Mock数据与真实接口一致、无后端依赖
**Scale/Scope**: 3种计算任务类型、5种计算模型、3种资源分类、8个用户故事

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Visual-First Design ✅ PASS

- **所见即所得**: 画布操作实时反映（FR-056: 实时更新JSON预览）
- **交互反馈**: 每个操作都有视觉反馈（User Stories 1-8详细描述）
- **减少认知负担**: 颜色区分节点类型、动画显示流向

### II. 前端自治原则 ✅ PASS

- **Mock优先**: FR-057~FR-061明确Mock接口需求
- **离线开发**: 规格明确"不依赖后端服务"
- **数据隔离**: FR-049要求导出逻辑独立、与UI解耦

### III. 标准化输出 ✅ PASS

- **Schema定义**: 需要生成TypeScript interfaces（Phase 1输出）
- **向后兼容**: 遵循现有样例格式（.myprompt/specs/models/）
- **验证机制**: FR-053要求生成转换规则spec文档

### IV. 组件化架构 ✅ PASS

- **节点组件**: ComputeTaskNode、ModelNode、OutputDataNode独立封装
- **可组合性**: Header、Sidebar、Canvas、DetailPanel区域组件
- **Props契约**: 需要在data-model.md中定义

### V. 类型安全 ✅ PASS

- **无Any类型**: 需要在contracts/中明确所有类型
- **严格模式**: vue-tsc类型检查集成在构建流程
- **类型导出**: types/目录统一管理

**Gate Result**: ✅ ALL PASS - 可以进入Phase 0研究

## Project Structure

### Documentation (this feature)

```text
specs/002-dag-task-orchestration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── nodes.ts         # 节点类型定义
│   ├── edges.ts         # 连接线类型定义
│   └── export.ts        # 导出JSON Schema
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Flow/                    # 画布相关组件
│   │   ├── FlowHeader.vue       # 顶部工具栏（导出按钮）
│   │   ├── FlowSidebar.vue      # 左侧资源面板（扩展：+计算模型+算力+本地任务）
│   │   ├── FlowCanvas.vue       # 主画布（支持新节点类型）
│   │   └── FlowDetailPanel.vue  # 右侧详情面板（JSON预览切换）
│   ├── Nodes/                   # 节点组件
│   │   ├── DataSourceNode.vue   # 数据源节点（已存在）
│   │   ├── ComputeTaskNode.vue  # 计算任务节点（新增）
│   │   ├── ModelNode.vue        # 计算模型节点（新增）
│   │   ├── ComputeResourceNode.vue  # 算力资源节点（新增）
│   │   └── OutputDataNode.vue   # 输出数据节点（新增）
│   ├── Edges/                   # 连接线组件
│   │   └── FlowEdge.vue         # 自定义连接线（已存在）
│   └── Modals/                  # 弹窗组件（新增）
│       ├── TechPathSelector.vue      # 技术路径选择
│       ├── FieldSelector.vue          # 字段选择窗口
│       ├── EnterpriseSelector.vue     # 企业选择窗口
│       ├── ModelSelector.vue          # 模型选择窗口
│       ├── ComputeSelector.vue        # 算力选择窗口
│       └── OutputConfig.vue           # 输出配置窗口
├── views/
│   └── FlowEditor.vue           # 主编辑器视图（已存在，需扩展）
├── types/                       # TypeScript类型定义
│   ├── nodes.ts                 # 节点类型（扩展）
│   ├── edges.ts                 # 连接线类型（已存在）
│   ├── graph.ts                 # 图数据类型（已存在）
│   └── export.ts                # 导出JSON类型（新增）
├── utils/
│   ├── node-templates.ts        # 节点模板（扩展：+计算任务+模型+算力）
│   ├── edge-utils.ts            # 连接线工具（已存在）
│   ├── dag-export.ts            # DAG导出转换逻辑（新增）
│   ├── enterprise-sorter.ts     # 企业排序逻辑（新增）
│   └── mock-data.ts             # Mock数据（新增）
├── stores/                      # 状态管理（新增）
│   └── graph-store.ts           # 图状态管理
└── assets/styles/
    ├── global.scss              # 全局样式
    └── variables.scss           # SCSS变量

tests/
├── e2e/                         # Playwright E2E测试
│   ├── compute-task.spec.ts     # 计算任务编排测试
│   ├── model-config.spec.ts     # 模型配置测试
│   ├── export.spec.ts           # 导出功能测试
│   └── edge-cases.spec.ts       # 边缘情况测试
└── mocks/                       # Mock数据
    ├── enterprises.ts           # 企业Mock数据
    ├── models.ts                # 计算模型Mock数据
    ├── computes.ts              # 算力资源Mock数据
    └── fields.ts                # 数据字段Mock数据
```

**Structure Decision**: 采用Option 1单项目结构（Vue 3单页应用）。这是前端项目，所有代码在`src/`目录，测试在`tests/`目录，符合宪章前端自治原则。

## Complexity Tracking

> **无需填写** - Constitution Check全部通过，无违规需要说明。

