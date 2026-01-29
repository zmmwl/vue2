# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + TypeScript + Vite 的隐私计算流程编辑器，使用 @vue-flow/core 库实现可视化流程图编辑功能。

## 开发命令

```bash
# 开发服务器（运行在端口 5172）
npm run dev

# 构建项目（包含类型检查）
npm run build

# 预览构建结果
npm run preview
```

## 代码架构

### 核心组件结构

```
src/
├── App.vue                    # 应用入口，渲染 FlowEditor
├── main.ts                    # Vue 应用初始化
├── views/
│   └── FlowEditor.vue         # 主编辑器视图，包含 Header、Sidebar、Canvas
├── components/
│   ├── Flow/
│   │   ├── FlowHeader.vue     # 顶部工具栏
│   │   ├── FlowSidebar.vue    # 左侧节点面板（拖拽源）
│   │   └── FlowCanvas.vue     # 主画布，管理节点和连接线
│   ├── Nodes/
│   │   ├── DataSourceNode.vue # 数据源节点组件
│   │   └── ComputeTaskNode.vue # 计算任务节点组件
│   └── Edges/
│       └── FlowEdge.vue       # 自定义连接线（带流动光点动画）
├── types/
│   ├── nodes.ts               # 节点相关类型定义
│   ├── edges.ts               # 连接线相关类型定义
│   └── graph.ts               # 图数据相关类型定义
├── utils/
│   ├── node-templates.ts      # 节点模板定义（DATA_SOURCE_TEMPLATES、COMPUTE_TASK_TEMPLATES）
│   └── edge-utils.ts          # 连接线工具函数
└── assets/styles/
    ├── global.scss            # 全局样式
    └── variables.scss         # SCSS 变量
```

### 关键设计模式

#### 1. 固定 Handle 系统
项目使用简化的固定 handle 连接系统：
- **数据源节点**：只有底部的输出 handle (`id="output"`)
- **计算任务节点**：顶部输入 handle (`id="input"`) 和底部输出 handle (`id="output"`)
- Handle 仅在悬停或已连接时显示（输入 handle 为长方形，输出 handle 为圆形）

#### 2. 节点拖放流程
1. `FlowSidebar.vue` 中开始拖拽，使用 `setData('application/vueflow', ...)` 传递节点模板数据
2. `FlowCanvas.vue` 监听 `drop` 事件，使用 `project()` 函数将屏幕坐标转换为画布坐标
3. 创建新节点并推入 `nodes` 数组

#### 3. 连接管理
- 连接时统一使用固定 handle ID：`sourceHandle: 'output'`, `targetHandle: 'input'`
- `onNodesChange` 会自动清理被删除节点的相关连接线
- 每条连接线都有唯一 ID（使用时间戳 + 随机字符串）

#### 4. 节点类型系统
- **数据源节点** (`type: 'data_source'`)：MySQL、PostgreSQL、CSV、Excel、REST API、GraphQL
- **计算任务节点** (`type: 'compute_task'`)：PSI、PIR、MPC、联邦学习、同态加密、差分隐私
- **计算模型节点** (`type: 'model'`)：MPC 表达式模型、CodeBin V2/V3、SPDZ
- **算力资源节点** (`type: 'compute_resource'`)：TEE 板卡算力
- **输出数据节点** (`type: 'output_data'`)：任务输出配置
- **本地任务节点** (`type: 'local_task'`)：本地结果处理任务（CONCAT）

#### 5. DAG 任务编排 Handle 系统
DAG 任务编排使用多输入 handle 系统：
- **数据源/输出数据/计算任务节点**：只有输出 handle (`id="output"`)
- **计算任务节点**：
  - 顶部输入 handle (`id="input"`) - 连接数据源
  - 左侧模型输入 handle (`id="model-input"`) - 连接计算模型
  - 右侧算力输入 handle (`id="resource-input"`) - 连接算力资源
  - 底部输出 handle (`id="output"`)
- **本地任务节点**：只有输入 handle (`id="input"`)，可接受多个输入
- **模型节点/算力资源节点**：只有输出 handle (`id="output"`)

## 重要配置

### Vite 配置
- 使用 `@` 别名指向 `src` 目录
- 自动注入 SCSS 变量到所有组件
- 开发服务器端口：5172

### 样式规范
- 使用 n8n 风格的设计语言
- 数据源节点颜色：`#52C41A`（绿色）
- 选中颜色：`#1890ff`（蓝色）
- 连接线默认灰色：`#999999`

## 修改节点或添加新节点类型

1. 在 `src/utils/node-templates.ts` 中添加节点模板到 `DATA_SOURCE_TEMPLATES` 或 `COMPUTE_TASK_TEMPLATES`
2. 如需新类型枚举，在 `src/types/nodes.ts` 中添加对应的 `Enum`

## DAG 任务编排系统

### 概述
DAG 任务编排系统允许用户通过可视化方式创建隐私计算任务流程，支持 PSI、PIR、MPC 等多种计算类型，并可将流程导出为标准 JSON 格式提交到后端服务。

### 核心功能
1. **拖拽创建节点** - 从侧边栏拖拽数据源、计算任务、模型、算力等到画布
2. **连接配置** - 连接数据源到计算任务时弹出字段选择器
3. **模型配置** - 拖拽模型到计算任务节点，配置表达式或选择模型
4. **算力配置** - 拖拽算力资源到计算任务节点
5. **输出配置** - 点击"添加输出"按钮配置输出参与方和字段
6. **JSON 导出** - 导出标准 JSON 格式（参见 `specs/DAG_TO_JSON_SPEC.md`）

### 组件结构
```
src/
├── components/
│   ├── Flow/
│   │   ├── FlowDetailPanel.vue  # 右侧详情面板（支持可折叠 sections）
│   │   └── FlowCanvas.vue        # 主画布（包含拖放、连接逻辑）
│   ├── Modals/
│   │   ├── TechPathSelector.vue  # 技术路径选择器
│   │   ├── FieldSelector.vue     # 字段选择器
│   │   ├── OutputConfigSelector.vue # 输出配置
│   │   ├── ModelSelector.vue     # 模型配置（含 Monaco Editor）
│   │   ├── ResourceSelector.vue  # 算力资源配置
│   │   └── MonacoEditor.vue      # Monaco Editor 封装
│   └── Nodes/
│       ├── ModelNode.vue         # 模型节点
│       ├── ComputeResourceNode.vue # 算力资源节点
│       ├── OutputDataNode.vue    # 输出数据节点
│       └── LocalTaskNode.vue     # 本地任务节点
├── utils/
│   └── dag-export.ts             # DAG 到 JSON 转换
└── types/
    └── contracts.ts              # DAG 任务相关接口定义
```

### 导出 JSON 格式
导出的 JSON 包含以下部分：
- `jobId` - 任务唯一 ID
- `taskList` - 任务列表（计算类型、输入配置）
- `dataProviderList` - 数据提供方配置
- `joinConditionList` - Join 条件（INNER/CROSS）
- `modelProviderList` - 模型提供方配置
- `expressionList` - 表达式列表（用于表达式模型）
- `computeProviderList` - 算力提供方配置
- `resultConsumerList` - 结果消费方配置

详细转换规则参见 `specs/DAG_TO_JSON_SPEC.md`。

### 页面刷新保护
FlowCanvas 实现了 beforeunload 事件监听，当有未保存的更改时，刷新或关闭页面会弹出确认提示。

## Active Technologies
- TypeScript 5.9.3, Vue 3.5.24 + @vue-flow/core 1.48.1, Vite 7.2.4, Sass 1.97.2, Playwright 1.57.0 (001-data-asset-select)
- 内存存储（Map 缓存） + JSON 文件导入导出 (001-data-asset-select)
- TypeScript 5.9.3 + Vue 3.5.24 + @vue-flow/core 1.48.1, Vite 7.2.4, Monaco Editor (001-dag-task-orchestration)
- 内存存储（刷新后数据丢失）+ 手动JSON导出 (001-dag-task-orchestration)

## Recent Changes
- 001-data-asset-select: Added TypeScript 5.9.3, Vue 3.5.24 + @vue-flow/core 1.48.1, Vite 7.2.4, Sass 1.97.2, Playwright 1.57.0

## 重要准则
- coding、building完成后，不要主动启动服务
- 如果启动服务，使用原来的端口，不要随意修改端口，如果旧的服务仍在运行，就停掉
